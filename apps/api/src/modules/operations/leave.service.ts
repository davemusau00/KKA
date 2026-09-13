import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@kka/database';
import { CalculatedLeaveRequestSchema, LeavePreviewSchema, type CalculatedLeaveRequest, type LeavePreviewInput } from '@kka/contracts';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { AuditService } from '../../platform/audit/audit.service';
import type { RequestUser } from '../../platform/auth/auth.types';
import { leaveDates, leavePosition } from './leave-calculation';

const included = { requester: { select: { id: true, fullName: true, email: true, jobTitle: true } }, approver: { select: { id: true, fullName: true } } } as const;

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private async transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try { return await this.prisma.client.$transaction(work, { isolationLevel: 'Serializable' }); }
      catch (error) {
        const code = (error as { code?: string }).code;
        if ((code === 'P2034' || code === 'P2002') && attempt < 2) continue;
        if (code === 'P2034' || code === 'P2002') throw new ConflictException('Leave changed concurrently. Reload and retry.');
        throw error;
      }
    }
  }

  private async actor(tx: Prisma.TransactionClient, user: RequestUser) {
    if (!await tx.user.findFirst({ where: { id: user.id, firmId: user.firmId, status: 'ACTIVE' }, select: { id: true } })) throw new ForbiddenException('Active firm membership required');
  }

  private async position(tx: Prisma.TransactionClient, firmId: string, userId: string, policyKey: string, year: number) {
    const policy = await tx.leavePolicy.findFirst({ where: { firmId, key: policyKey, active: true } });
    if (!policy) throw new BadRequestException('Choose an active leave policy');
    if (!await tx.user.findFirst({ where: { id: userId, firmId }, select: { id: true } })) throw new NotFoundException('Employee not found');
    const profile = await tx.employeeProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('HR must record an employment start date before leave can be calculated');
    if (profile.leavePolicyKey !== policyKey) throw new BadRequestException('This policy is not assigned to the employee');
    const [balance, requests] = await Promise.all([
      tx.leaveBalance.findUnique({ where: { firmId_userId_policyKey_year: { firmId, userId, policyKey, year } } }),
      tx.leaveRequest.findMany({ where: { userId, requester: { firmId }, status: { in: ['APPROVED', 'SUBMITTED'] }, startsOn: { lt: new Date(Date.UTC(year + 1, 0, 1)) }, endsOn: { gte: new Date(Date.UTC(year, 0, 1)) } } }),
    ]);
    const asOf = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return { policy, profile, position: leavePosition({ policy, year, employmentStart: profile.startDate.toISOString().slice(0, 10), asOf, balance, requests }) };
  }

  async policies(user: RequestUser) {
    return this.transaction(async tx => {
      await this.actor(tx, user);
      const profile = await tx.employeeProfile.findUnique({ where: { userId: user.id } });
      if (!profile?.leavePolicyKey) return [];
      return tx.leavePolicy.findMany({ where: { firmId: user.firmId, key: profile.leavePolicyKey, active: true }, orderBy: { name: 'asc' } });
    });
  }

  async reconcileHistorical(user: RequestUser, id: string, input: { policyKey: string; revision: number; reason: string }) {
    if (!user.permissions.includes('hr.manage')) throw new ForbiddenException('HR permission required');
    return this.transaction(async tx => {
      await this.actor(tx, user);
      const request = await tx.leaveRequest.findFirst({ where: { id, requester: { firmId: user.firmId } } });
      if (!request) throw new NotFoundException('Leave request not found');
      if (request.policyKey || request.revision !== input.revision) throw new ConflictException('Leave changed. Reload before reviewing.');
      if (request.startsOn.getUTCFullYear() !== request.endsOn.getUTCFullYear()) throw new ConflictException('A cross-year historical request requires a reviewed data migration');
      const policy = await tx.leavePolicy.findFirst({ where: { firmId: user.firmId, key: input.policyKey, active: true } });
      if (!policy) throw new BadRequestException('Choose an active leave policy');
      const changed = await tx.leaveRequest.updateMany({ where: { id, policyKey: null, revision: input.revision }, data: {
        policyKey: policy.key, revision: { increment: 1 }, calculation: { source: 'HISTORICAL_REVIEW', preservedDays: String(request.days), reviewedById: user.id, reason: input.reason },
      } });
      if (changed.count !== 1) throw new ConflictException('Leave changed. Reload before reviewing.');
      const saved = await tx.leaveRequest.findUniqueOrThrow({ where: { id }, include: included });
      const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'hr.leave_historical_reviewed', entityType: 'leave_request', entityId: id, metadata: { policyKey: policy.key, preservedDays: String(request.days), reason: input.reason } }, tx);
      return { ...saved, auditRef: audit.id };
    });
  }

  async preview(user: RequestUser, raw: LeavePreviewInput) {
    const input = LeavePreviewSchema.parse(raw);
    return this.transaction(async tx => { await this.actor(tx, user); return this.calculate(tx, user.firmId, user.id, input); });
  }

  private async calculate(tx: Prisma.TransactionClient, firmId: string, userId: string, input: LeavePreviewInput) {
    const { policy, profile, position } = await this.position(tx, firmId, userId, input.policyKey, Number(input.startsOn.slice(0, 4)));
    if (input.startsOn < profile.startDate.toISOString().slice(0, 10) || profile.offboardedAt || (profile.endDate && input.endsOn > profile.endDate.toISOString().slice(0, 10))) throw new BadRequestException('Leave dates must be within the employment period');
    const chargeableDates = leaveDates(input.startsOn, input.endsOn, policy);
    if (!chargeableDates.length) throw new BadRequestException('The selected dates contain no chargeable days under this policy');
    return { days: chargeableDates.length, chargeableDates, position, sufficient: !position.unclassifiedRequestIds.length && position.projectedAvailableDays - chargeableDates.length >= position.minimumBalance };
  }

  async request(user: RequestUser, raw: CalculatedLeaveRequest) {
    const input = CalculatedLeaveRequestSchema.parse(raw);
    return this.transaction(async tx => {
      await this.actor(tx, user);
      const existing = await tx.leaveRequest.findUnique({ where: { userId_idempotencyKey: { userId: user.id, idempotencyKey: input.idempotencyKey } }, include: included });
      if (existing) {
        if (existing.policyKey !== input.policyKey || existing.startsOn.toISOString().slice(0, 10) !== input.startsOn || existing.endsOn.toISOString().slice(0, 10) !== input.endsOn || (existing.reason ?? '') !== (input.reason ?? '')) throw new ConflictException('Request key was already used with different leave details');
        const audit = await tx.auditEvent.findFirst({ where: { firmId: user.firmId, entityId: existing.id, action: 'hr.leave_submitted' }, orderBy: { occurredAt: 'asc' } });
        if (!audit) throw new ConflictException('Existing leave request has no submission audit reference');
        return { ...existing, auditRef: audit.id };
      }
      const preview = await this.calculate(tx, user.firmId, user.id, input);
      if (preview.position.unclassifiedRequestIds.length) throw new ConflictException('HR must reconcile historical leave requests before new leave can be charged');
      if (!preview.sufficient) throw new BadRequestException('Insufficient projected leave balance');
      const startsOn = new Date(`${input.startsOn}T00:00:00Z`), endsOn = new Date(`${input.endsOn}T00:00:00Z`);
      if (await tx.leaveRequest.findFirst({ where: { userId: user.id, status: { in: ['APPROVED', 'SUBMITTED'] }, startsOn: { lte: endsOn }, endsOn: { gte: startsOn } } })) throw new ConflictException('These dates overlap an active leave request');
      const policy = await tx.leavePolicy.findFirstOrThrow({ where: { firmId: user.firmId, key: input.policyKey } });
      const request = await tx.leaveRequest.create({ data: { userId: user.id, policyKey: input.policyKey, type: policy.name, startsOn, endsOn, days: preview.days, chargeableDates: preview.chargeableDates, calculation: { workingDays: policy.workingDays, excludedDates: policy.excludedDates, policyUpdatedAt: policy.updatedAt.toISOString() }, reason: input.reason, status: 'SUBMITTED', idempotencyKey: input.idempotencyKey }, include: included });
      const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'hr.leave_submitted', entityType: 'leave_request', entityId: request.id, metadata: { policyKey: input.policyKey, days: preview.days, chargeableDates: preview.chargeableDates } }, tx);
      return { ...request, auditRef: audit.id };
    });
  }

  async transition(user: RequestUser, id: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED', revision: number, reason?: string) {
    return this.transaction(async tx => {
      await this.actor(tx, user);
      const request = await tx.leaveRequest.findFirst({ where: { id, requester: { firmId: user.firmId } } });
      if (!request) throw new NotFoundException('Leave request not found');
      if (status === 'CANCELLED') {
        if (request.userId !== user.id && !user.permissions.includes('hr.manage')) throw new ForbiddenException('You cannot cancel this leave request');
      } else if (!user.permissions.includes('hr.manage') || request.userId === user.id) throw new ForbiddenException('A different HR approver is required');
      if (request.revision !== revision) throw new ConflictException('Leave changed. Reload before making a decision.');
      if (!(status === 'CANCELLED' ? ['DRAFT', 'SUBMITTED', 'APPROVED'] : ['SUBMITTED']).includes(request.status)) throw new ConflictException('This leave request has already been resolved');
      if (status === 'APPROVED') {
        if (!request.policyKey) throw new ConflictException('Historical leave requires policy reconciliation before approval');
        const { position } = await this.position(tx, user.firmId, request.userId, request.policyKey, request.startsOn.getUTCFullYear());
        if (position.unclassifiedRequestIds.length) throw new ConflictException('Historical leave requires reconciliation');
        if (position.projectedAvailableDays < position.minimumBalance) throw new BadRequestException('Insufficient projected leave balance');
      }
      const changed = await tx.leaveRequest.updateMany({ where: { id, revision, status: request.status }, data: { status, revision: { increment: 1 }, ...(status === 'CANCELLED' ? {} : { approverId: user.id, approvedAt: status === 'APPROVED' ? new Date() : null }) } });
      if (changed.count !== 1) throw new ConflictException('Leave changed. Reload before making a decision.');
      const saved = await tx.leaveRequest.findUniqueOrThrow({ where: { id }, include: included });
      const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: `hr.leave_${status.toLowerCase()}`, entityType: 'leave_request', entityId: id, metadata: { from: request.status, to: status, revision: saved.revision, reason: reason ?? null } }, tx);
      return { ...saved, auditRef: audit.id };
    });
  }
}
