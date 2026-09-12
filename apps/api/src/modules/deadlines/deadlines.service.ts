import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import type { RequestUser } from "../../platform/auth/auth.types";

type CalculationMethod = "MANUAL" | "CALENDAR_DAYS" | "BUSINESS_DAYS";

@Injectable()
export class DeadlinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RecordAccessService
  ) {}

  private async assertActiveFirmUser(firmId: string, userId?: string) {
    if (!userId) return;
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, firmId, status: "ACTIVE" }, select: { id: true } });
    if (!user) throw new BadRequestException("Deadline responsible or escalation user is not active in this firm");
  }

  private async deadlineFor(user: RequestUser, id: string) {
    const deadline = await this.prisma.client.deadline.findFirst({
      where: { id, matter: await this.access.matterWhere(user) },
      include: { revisions: { orderBy: { revisionNumber: "desc" } } }
    });
    if (!deadline) throw new NotFoundException("Deadline not found");
    return deadline;
  }

  private calendarDate(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private calculateDueAt(input: { method: CalculationMethod; anchorAt?: Date | null; days?: number | null; excludedDates?: string[] | null; manualDueAt?: Date | null }) {
    if (input.method === "MANUAL") {
      if (!input.manualDueAt) throw new BadRequestException("Manual deadlines require an official due date");
      return input.manualDueAt;
    }
    if (!input.anchorAt || input.days === undefined || input.days === null || input.days < 0) {
      throw new BadRequestException("Calculated deadlines require a non-negative day count and anchor date");
    }
    const due = new Date(input.anchorAt);
    const excluded = new Set((input.excludedDates ?? []).map((value) => value.slice(0, 10)));
    let remaining = input.days;
    while (remaining > 0) {
      due.setUTCDate(due.getUTCDate() + 1);
      const weekday = due.getUTCDay();
      const isBusinessDay = weekday !== 0 && weekday !== 6 && !excluded.has(this.calendarDate(due));
      if (input.method === "CALENDAR_DAYS" || isBusinessDay) remaining -= 1;
    }
    return due;
  }

  private snapshot(values: { calculationMethod: string; calculationAnchorAt?: Date | null; calculationDays?: number | null; excludedDates?: unknown; stayPeriods?: unknown; legalRuleCode?: string | null }) {
    return {
      calculationMethod: values.calculationMethod,
      calculationAnchorAt: values.calculationAnchorAt?.toISOString() ?? null,
      calculationDays: values.calculationDays ?? null,
      excludedDates: values.excludedDates ?? null,
      stayPeriods: values.stayPeriods ?? null,
      legalRuleCode: values.legalRuleCode ?? null
    };
  }

  async list(user: RequestUser, matterId?: string) {
    const matterScope = await this.access.matterWhere(user);
    return this.prisma.client.deadline.findMany({
      where: { matter: matterId ? { id: matterId, ...matterScope } : matterScope },
      include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } },
      orderBy: [{ officialDueAt: "asc" }, { createdAt: "asc" }]
    });
  }

  async get(user: RequestUser, id: string) {
    return this.deadlineFor(user, id);
  }

  async create(user: RequestUser, input: any) {
    if (!(await this.access.canViewMatter(user, input.matterId))) throw new NotFoundException("Matter not found");
    await this.assertActiveFirmUser(user.firmId, input.responsibleUserId);
    await this.assertActiveFirmUser(user.firmId, input.escalationUserId);
    const method = (input.calculationMethod ?? "MANUAL") as CalculationMethod;
    if (!Object.hasOwn({ MANUAL: true, CALENDAR_DAYS: true, BUSINESS_DAYS: true }, method)) throw new BadRequestException("Unknown deadline calculation method");
    if (method !== "MANUAL" && !input.legalRuleCode?.trim()) throw new BadRequestException("Calculated deadlines require a legal rule code");
    const officialDueAt = this.calculateDueAt({
      method,
      anchorAt: input.calculationAnchorAt ? new Date(input.calculationAnchorAt) : undefined,
      days: input.calculationDays,
      excludedDates: input.excludedDates,
      manualDueAt: input.officialDueAt ? new Date(input.officialDueAt) : undefined
    });
    const internalTargetAt = input.internalTargetAt ? new Date(input.internalTargetAt) : undefined;
    const row = await this.prisma.client.$transaction(async (tx) => {
      const deadline = await tx.deadline.create({
        data: {
          matterId: input.matterId, title: input.title, deadlineType: input.deadlineType,
          officialDueAt, internalTargetAt, source: input.source,
          sourceEventId: input.sourceEventId, sourceDocumentId: input.sourceDocumentId,
          legalRuleCode: input.legalRuleCode, calculationMethod: method,
          calculationAnchorAt: input.calculationAnchorAt ? new Date(input.calculationAnchorAt) : undefined,
          calculationDays: input.calculationDays, excludedDates: input.excludedDates,
          courtOrderOverride: Boolean(input.courtOrderOverride), courtOrderDocumentId: input.courtOrderDocumentId,
          reminderSchedule: input.reminderSchedule, responsibleUserId: input.responsibleUserId,
          escalationUserId: input.escalationUserId, stayPeriods: input.stayPeriods,
          riskLevel: input.riskLevel, immutable: input.immutable ?? true, notes: input.notes
        }
      });
      await tx.deadlineRevision.create({
        data: {
          deadlineId: deadline.id, revisionNumber: 1, action: "CREATED", nextOfficialDueAt: deadline.officialDueAt,
          nextInternalTargetAt: deadline.internalTargetAt, source: input.source, legalRuleCode: deadline.legalRuleCode,
          courtOrderDocumentId: deadline.courtOrderDocumentId, changedById: user.id,
          calculationSnapshot: this.snapshot(deadline)
        }
      });
      await this.audit.record({
        firmId: user.firmId, actorUserId: user.id, action: "deadline.created", entityType: "deadline", entityId: deadline.id, matterId: deadline.matterId,
        metadata: { version: deadline.version, calculationMethod: deadline.calculationMethod, legalRuleCode: deadline.legalRuleCode }
      }, tx);
      return deadline;
    });
    return row;
  }

  async revise(user: RequestUser, id: string, input: any) {
    const current = await this.deadlineFor(user, id);
    if (current.version !== input.expectedVersion) throw new ConflictException("Deadline changed by another user; reload before revising");
    if (current.immutable && input.action !== "COURT_ORDER_OVERRIDE") {
      throw new BadRequestException("This deadline is immutable; record a court-order override with supporting evidence");
    }
    if (input.action === "COURT_ORDER_OVERRIDE" && !input.courtOrderDocumentId) {
      throw new BadRequestException("Court-order overrides require a supporting court-order document ID");
    }
    await this.assertActiveFirmUser(user.firmId, input.responsibleUserId ?? current.responsibleUserId);
    await this.assertActiveFirmUser(user.firmId, input.escalationUserId ?? current.escalationUserId);
    const method = (input.calculationMethod ?? current.calculationMethod) as CalculationMethod;
    const anchorAt = input.calculationAnchorAt !== undefined ? (input.calculationAnchorAt ? new Date(input.calculationAnchorAt) : null) : current.calculationAnchorAt;
    const calculationDays = input.calculationDays ?? current.calculationDays;
    const excludedDates = input.excludedDates ?? current.excludedDates as string[] | null;
    const officialDueAt = input.officialDueAt
      ? new Date(input.officialDueAt)
      : (input.calculationMethod !== undefined || input.calculationAnchorAt !== undefined || input.calculationDays !== undefined || input.excludedDates !== undefined)
        ? this.calculateDueAt({ method, anchorAt, days: calculationDays, excludedDates, manualDueAt: current.officialDueAt })
        : current.officialDueAt;
    const internalTargetAt = input.internalTargetAt !== undefined ? (input.internalTargetAt ? new Date(input.internalTargetAt) : null) : current.internalTargetAt;
    const legalRuleCode = input.legalRuleCode ?? current.legalRuleCode;
    if (method !== "MANUAL" && !legalRuleCode?.trim()) throw new BadRequestException("Calculated deadlines require a legal rule code");

    return this.prisma.client.$transaction(async (tx) => {
      const update = await tx.deadline.updateMany({
        where: { id, version: input.expectedVersion },
        data: {
          officialDueAt, internalTargetAt, legalRuleCode, calculationMethod: method,
          calculationAnchorAt: anchorAt, calculationDays, excludedDates,
          courtOrderOverride: input.action === "COURT_ORDER_OVERRIDE" ? true : current.courtOrderOverride,
          courtOrderDocumentId: input.courtOrderDocumentId ?? current.courtOrderDocumentId,
          reminderSchedule: input.reminderSchedule ?? current.reminderSchedule,
          responsibleUserId: input.responsibleUserId ?? current.responsibleUserId,
          escalationUserId: input.escalationUserId ?? current.escalationUserId,
          stayPeriods: input.stayPeriods ?? current.stayPeriods,
          notes: input.notes ?? current.notes,
          version: { increment: 1 }, lastRecalculatedAt: new Date()
        }
      });
      if (update.count !== 1) throw new ConflictException("Deadline changed by another user; reload before revising");
      const revised = await tx.deadline.findUniqueOrThrow({ where: { id } });
      await tx.deadlineRevision.create({
        data: {
          deadlineId: id, revisionNumber: revised.version, action: input.action,
          priorOfficialDueAt: current.officialDueAt, nextOfficialDueAt: revised.officialDueAt,
          priorInternalTargetAt: current.internalTargetAt, nextInternalTargetAt: revised.internalTargetAt,
          source: input.source, reason: input.reason, legalRuleCode: revised.legalRuleCode,
          courtOrderDocumentId: input.courtOrderDocumentId ?? undefined, changedById: user.id,
          calculationSnapshot: this.snapshot(revised)
        }
      });
      await this.audit.record({
        firmId: user.firmId, actorUserId: user.id, action: "deadline.revised", entityType: "deadline", entityId: id, matterId: revised.matterId,
        metadata: { action: input.action, version: revised.version, priorOfficialDueAt: current.officialDueAt, nextOfficialDueAt: revised.officialDueAt, source: input.source }
      }, tx);
      return revised;
    });
  }

  async complete(user: RequestUser, id: string, input: { expectedVersion: number; note?: string }) {
    const current = await this.deadlineFor(user, id);
    if (current.version !== input.expectedVersion) throw new ConflictException("Deadline changed by another user; reload before completing");
    return this.prisma.client.$transaction(async (tx) => {
      const update = await tx.deadline.updateMany({
        where: { id, version: input.expectedVersion, completedAt: null },
        data: { status: "COMPLETED", completedAt: new Date(), completedById: user.id, version: { increment: 1 } }
      });
      if (update.count !== 1) throw new ConflictException("Deadline changed or is already complete; reload before completing");
      const completed = await tx.deadline.findUniqueOrThrow({ where: { id } });
      await tx.deadlineRevision.create({
        data: {
          deadlineId: id, revisionNumber: completed.version, action: "COMPLETED", source: "Completion",
          reason: input.note, priorOfficialDueAt: current.officialDueAt, nextOfficialDueAt: completed.officialDueAt,
          priorInternalTargetAt: current.internalTargetAt, nextInternalTargetAt: completed.internalTargetAt,
          legalRuleCode: completed.legalRuleCode, changedById: user.id, calculationSnapshot: this.snapshot(completed)
        }
      });
      await this.audit.record({
        firmId: user.firmId, actorUserId: user.id, action: "deadline.completed", entityType: "deadline", entityId: id, matterId: completed.matterId,
        metadata: { version: completed.version }
      }, tx);
      return completed;
    });
  }
}
