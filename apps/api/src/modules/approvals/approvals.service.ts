import { DocumentWorkflowService } from '../marks/document-workflow.service';
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly workflow: DocumentWorkflowService
  ) {}

  list(firmId: string, status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING") {
    return this.prisma.client.approvalRequest.findMany({
      where: { firmId, status },
      include: { decisions: true },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 1000
    });
  }

  async decide(
    firmId: string,
    actorId: string,
    actorRoleKeys: string[],
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    comment?: string
  ) {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, firmId },
      include: { decisions: true }
    });
    if (!request) throw new NotFoundException("Approval request not found");
    if (request.status !== "PENDING") throw new BadRequestException("Approval request is already resolved");
    if (request.requiredRoleKeys.length &&
        !actorRoleKeys.some((role) => request.requiredRoleKeys.includes(role)) &&
        !request.assignedUserIds.includes(actorId)) {
      throw new BadRequestException("User is not an eligible approver");
    }
    if (request.requestedById === actorId && request.type !== "LOW_RISK_SELF_APPROVAL") {
      throw new BadRequestException("Requester cannot approve their own request");
    }

    if (request.type === 'DOCUMENT_MARK') {
      const operation = await this.prisma.client.documentOperation.findUnique({ where: { approvalRequestId: request.id } });
      if (!operation) throw new BadRequestException('Legacy approval must be resubmitted with pinned document assets');
      await this.prisma.client.$transaction(async tx => {
        const changed = await tx.approvalRequest.updateMany({ where: { id: request.id, status: 'PENDING' }, data: { status: decision, resolvedAt: new Date() } });
        if (!changed.count) throw new BadRequestException('Approval already resolved');
        await tx.approvalDecision.create({ data: { approvalRequestId: request.id, decidedById: actorId, decision, comment } });
        await tx.documentOperation.update({ where: { id: operation.id }, data: { status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED' } });
        await this.audit.record({ firmId, actorUserId: actorId, action: 'document.application_decision', entityType: 'approval_request', entityId: request.id, metadata: { decision } }, tx);
      });
      const application = decision === 'APPROVED' ? await this.workflow.execute(operation.id) : null;
      return { ...request, status: decision, application };
    }

    await this.prisma.client.$transaction([
      this.prisma.client.approvalDecision.create({
        data: { approvalRequestId: request.id, decidedById: actorId, decision, comment }
      }),
      this.prisma.client.approvalRequest.update({
        where: { id: request.id },
        data: { status: decision, resolvedAt: new Date() }
      })
    ]);

    if (decision === "APPROVED") {
      await this.applyApprovedAction(firmId, actorId, request);
    }

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: decision === "APPROVED" ? "approval.approved" : "approval.rejected",
      entityType: "approval_request",
      entityId: request.id,
      metadata: { type: request.type, entityType: request.entityType, entityId: request.entityId, comment }
    });

    return this.prisma.client.approvalRequest.findUnique({
      where: { id: request.id },
      include: { decisions: true }
    });
  }

  private async applyApprovedAction(firmId: string, actorId: string, request: any) {
    const payload = (request.payload ?? {}) as any;

    if (request.type === "CALENDAR_RESCHEDULE") {
      const event = await this.prisma.client.calendarEvent.findUnique({ where: { id: request.entityId } });
      if (!event) throw new NotFoundException("Calendar event no longer exists");
      const newStartAt = new Date(payload.newStartAt);
      const newEndAt = new Date(payload.newEndAt);
      await this.prisma.client.$transaction([
        this.prisma.client.calendarRevision.create({
          data: {
            eventId: event.id,
            oldStartAt: event.startAt,
            oldEndAt: event.endAt,
            newStartAt,
            newEndAt,
            reason: payload.reason,
            source: payload.source,
            supportingDocumentId: payload.supportingDocumentId,
            changedById: request.requestedById,
            approvalRequestId: request.id
          }
        }),
        this.prisma.client.calendarEvent.update({
          where: { id: event.id },
          data: { startAt: newStartAt, endAt: newEndAt, syncState: "PENDING" }
        })
      ]);
      return;
    }

    if (request.type === "SETTING_CHANGE") {
      const value = await this.prisma.client.settingValue.findUnique({
        where: { id: request.entityId },
        include: { definition: true }
      });
      if (!value) throw new NotFoundException("Pending setting value no longer exists");
      const previous = await this.prisma.client.settingValue.findFirst({
        where: {
          definitionId: value.definitionId,
          scopeType: value.scopeType,
          scopeId: value.scopeId,
          lifecycle: "ACTIVE"
        },
        orderBy: { version: "desc" }
      });
      await this.prisma.client.$transaction([
        ...(previous ? [this.prisma.client.settingValue.update({
          where: { id: previous.id },
          data: { lifecycle: "SUPERSEDED" }
        })] : []),
        this.prisma.client.settingValue.update({
          where: { id: value.id },
          data: { lifecycle: "ACTIVE", approvedById: actorId, approvedAt: new Date() }
        })
      ]);
      return;
    }

    if (request.type === "EXPENSE") {
      await this.prisma.client.expenseRequest.update({
        where: { id: request.entityId },
        data: { status: "APPROVED", approvedById: actorId, approvedAt: new Date() }
      });
      return;
    }

    if (request.type === "STAGE_GATE") {
      return;
    }
  }
}
