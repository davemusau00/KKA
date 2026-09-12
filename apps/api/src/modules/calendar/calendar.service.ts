import { BadRequestException, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { Prisma } from "@kka/database";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { QueueService, QUEUES } from "../../platform/queue/queue.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import { roleContext } from "../../platform/auth/role-context";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly queues: QueueService,
    @Optional() private readonly access?: RecordAccessService
  ) {}

  private async actor(firmId: string, actorId: string): Promise<RequestUser> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: actorId, firmId, status: "ACTIVE" },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!user) throw new NotFoundException("Calendar actor not found");
    return {
      id: user.id, firmId: user.firmId, email: user.email, fullName: user.fullName,
      homeBranchId: user.homeBranchId, ...roleContext(user.firmId, user.roles)
    };
  }

  private async assertMatterAccess(firmId: string, actorId: string, matterId?: string | null) {
    if (!matterId) return;
    if (!this.access) throw new BadRequestException("Calendar access policy is unavailable");
    const user = await this.actor(firmId, actorId);
    if (!(await this.access.canViewMatter(user, matterId))) throw new NotFoundException("Calendar event not found");
  }

  async list(firmId: string, from?: Date, to?: Date, userId?: string, matterId?: string, actor?: RequestUser) {
    const events = await this.prisma.client.calendarEvent.findMany({
      where: {
        firmId,
        ...(from || to ? {
          startAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
        } : {}),
        ...(userId ? { assignedUserId: userId } : {}),
        ...(matterId ? { matterId } : {})
      },
      include: {
        matter: { select: { id: true, internalReference: true, title: true } },
        participants: true,
        outcomeRecord: true,
        documents: { include: { document: { select: { id: true, title: true, documentType: true } } } }
      },
      orderBy: { startAt: "asc" },
      take: 5000
    });
    if (!actor || !this.access) return events;
    const visible = await Promise.all(events.map(async (event) => !event.matterId || await this.access!.canViewMatter(actor, event.matterId) ? event : null));
    return visible.filter((event): event is NonNullable<typeof event> => event !== null);
  }

  async create(firmId: string, actorId: string, input: any, transaction?: import("@kka/database").Prisma.TransactionClient) {
    const client=transaction ?? this.prisma.client;
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (endAt <= startAt) throw new BadRequestException("endAt must be after startAt");
    await this.assertMatterAccess(firmId, actorId, input.matterId);

    const event = await client.calendarEvent.create({
      data: {
        firmId,
        matterId: input.matterId,
        courtProceedingId: input.courtProceedingId,
        taskId: input.taskId,
        deadlineId: input.deadlineId,
        title: input.title,
        eventType: input.eventType,
        startAt,
        endAt,
        timezone: input.timezone,
        allDay: input.allDay,
        location: input.location,
        virtualMeetingUrl: input.virtualMeetingUrl,
        organizerId: actorId,
        assignedUserId: input.assignedUserId,
        sourceType: input.sourceType,
        editPolicy: input.editPolicy,
        notes: input.notes,
        participants: input.participantUserIds?.length ? {
          create: input.participantUserIds.map((userId: string) => ({ userId }))
        } : undefined
      },
      include: { participants: true }
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "calendar.event_created",
      entityType: "calendar_event", entityId: event.id, matterId: event.matterId ?? undefined,
      metadata: { eventType: event.eventType, startAt: event.startAt, editPolicy: event.editPolicy }
    }, transaction);
    if(!transaction)await this.queues.add(QUEUES.calendar, "calendar.sync", { eventId: event.id, action: "create" });
    return event;
  }

  async reschedule(firmId: string, actorId: string, eventId: string, input: any) {
    const event = await this.prisma.client.calendarEvent.findFirst({ where: { id: eventId, firmId } });
    if (!event) throw new NotFoundException("Calendar event not found");
    await this.assertMatterAccess(firmId, actorId, event.matterId);
    if (event.editPolicy === "LOCKED") {
      throw new BadRequestException("This event is locked. Record an amended legal/court source instead.");
    }
    if (event.editPolicy === "REASON_REQUIRED" && !input.reason?.trim()) {
      throw new BadRequestException("A reschedule reason is required");
    }
    const newStartAt = new Date(input.startAt);
    const newEndAt = new Date(input.endAt);
    if (newEndAt <= newStartAt) throw new BadRequestException("endAt must be after startAt");

    if (event.editPolicy === "APPROVAL_REQUIRED") {
      const approval = await this.prisma.client.approvalRequest.create({
        data: {
          firmId,
          type: "CALENDAR_RESCHEDULE",
          entityType: "CalendarEvent",
          entityId: eventId,
          requestedById: actorId,
          requiredRoleKeys: ["senior_partner", "managing_partner"],
          assignedUserIds: [],
          payload: {
            oldStartAt: event.startAt.toISOString(),
            oldEndAt: event.endAt.toISOString(),
            newStartAt: newStartAt.toISOString(),
            newEndAt: newEndAt.toISOString(),
            reason: input.reason,
            source: input.source,
            supportingDocumentId: input.supportingDocumentId
          },
          reason: input.reason
        }
      });
      return { status: "PENDING_APPROVAL", approvalRequestId: approval.id, event };
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      await tx.calendarRevision.create({
        data: {
          eventId,
          oldStartAt: event.startAt,
          oldEndAt: event.endAt,
          newStartAt,
          newEndAt,
          reason: input.reason,
          source: input.source,
          supportingDocumentId: input.supportingDocumentId,
          changedById: actorId
        }
      });
      return tx.calendarEvent.update({
        where: { id: eventId },
        data: { startAt: newStartAt, endAt: newEndAt, syncState: "PENDING" }
      });
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "calendar.event_rescheduled",
      entityType: "calendar_event", entityId: eventId, matterId: event.matterId ?? undefined,
      metadata: {
        oldStartAt: event.startAt,
        oldEndAt: event.endAt,
        newStartAt,
        newEndAt,
        reason: input.reason,
        source: input.source
      }
    });
    await this.queues.add(QUEUES.calendar, "calendar.sync", { eventId, action: "update" });
    return { status: "UPDATED", event: updated };
  }

  async linkDocument(firmId: string, actorId: string, eventId: string, documentId: string, requirementKey?: string) {
    const event = await this.prisma.client.calendarEvent.findFirst({ where: { id: eventId, firmId } });
    const document = await this.prisma.client.document.findFirst({ where: { id: documentId, matter: { firmId } } });
    if (!event || !document) throw new NotFoundException("Event or document not found");
    await this.assertMatterAccess(firmId, actorId, event.matterId);
    await this.assertMatterAccess(firmId, actorId, document.matterId);
    if (event.matterId && document.matterId !== event.matterId) {
      throw new BadRequestException("Document belongs to a different matter");
    }
    const link = await this.prisma.client.calendarEventDocument.upsert({
      where: { eventId_documentId: { eventId, documentId } },
      create: { eventId, documentId, requirementKey, satisfiesRequirement: Boolean(requirementKey) },
      update: { requirementKey, satisfiesRequirement: Boolean(requirementKey) }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "calendar.document_linked",
      entityType: "calendar_event", entityId: eventId, matterId: event.matterId ?? undefined,
      metadata: { documentId, requirementKey }
    });
    return link;
  }

  async completeFromCourtOutcome(
    firmId: string,
    actorId: string,
    eventId: string,
    input: {
      outcome: string;
      status: string;
      nextDate?: string;
      directions?: string;
      courtOrderDocumentId?: string;
      deadline?: { officialDueAt: string; title: string; taskTitle?: string; assignedToId?: string };
    }
  ) {
    const event = await this.prisma.client.calendarEvent.findFirst({ where: { id: eventId, firmId } });
    if (!event) throw new NotFoundException("Event not found");
    await this.assertMatterAccess(firmId, actorId, event.matterId);
    if (event.eventType !== "COURT") throw new BadRequestException("Court outcome applies only to court events");

    const prior = await this.prisma.client.courtOutcomeRecord.findUnique({ where: { eventId } });
    if (prior) return { outcome: prior, replayed: true };

    if (input.deadline && !event.matterId) {
      throw new BadRequestException("A court-directed deadline requires a matter-linked court event");
    }

    try {
      const result = await this.prisma.client.$transaction(async (tx) => {
        const updated = await tx.calendarEvent.update({
          where: { id: eventId },
          data: {
            status: input.status,
            notes: [event.notes, input.outcome, input.directions].filter(Boolean).join("\n\n"),
            syncState: "PENDING"
          }
        });

        let nextEvent = null;
        if (input.nextDate) {
          const start = new Date(input.nextDate);
          nextEvent = await tx.calendarEvent.create({
            data: {
              firmId,
              matterId: event.matterId,
              courtProceedingId: event.courtProceedingId,
              title: event.title,
              eventType: "COURT",
              startAt: start,
              endAt: new Date(start.getTime() + 2 * 3600_000),
              timezone: event.timezone,
              allDay: false,
              location: event.location,
              organizerId: actorId,
              assignedUserId: event.assignedUserId,
              sourceType: "COURT_OUTCOME",
              editPolicy: "REASON_REQUIRED",
              notes: input.directions,
              syncState: "PENDING"
            }
          });
        }

        let deadline = null;
        let deadlineEvent = null;
        let task = null;
        if (input.deadline && event.matterId) {
          const officialDueAt = new Date(input.deadline.officialDueAt);
          const internalTargetAt = new Date(officialDueAt.getTime() - 3 * 24 * 3600_000);
          const assignedToId = input.deadline.assignedToId ?? event.assignedUserId;
          const assignee = await tx.user.findFirst({
            where: { id: assignedToId, firmId, status: "ACTIVE" },
            select: { id: true }
          });
          if (!assignee) throw new BadRequestException("Court-direction task assignee is not active in this firm");

          deadline = await tx.deadline.create({
            data: {
              matterId: event.matterId,
              title: input.deadline.title,
              deadlineType: "COURT_DIRECTION",
              officialDueAt,
              internalTargetAt,
              source: `Court outcome ${eventId}`,
              sourceEventId: eventId,
              calculationMethod: "MANUAL",
              courtOrderOverride: true,
              responsibleUserId: assignee.id,
              riskLevel: "CRITICAL",
              immutable: true,
              notes: input.directions || input.outcome
            }
          });
          await tx.deadlineRevision.create({
            data: {
              deadlineId: deadline.id,
              revisionNumber: 1,
              action: "CREATED",
              nextOfficialDueAt: deadline.officialDueAt,
              nextInternalTargetAt: deadline.internalTargetAt,
              source: `Court outcome ${eventId}`,
              changedById: actorId,
              calculationSnapshot: { calculationMethod: "MANUAL", sourceEventId: eventId }
            }
          });
          deadlineEvent = await tx.calendarEvent.create({
            data: {
              firmId,
              matterId: event.matterId,
              deadlineId: deadline.id,
              title: `FILING DEADLINE: ${deadline.title}`,
              eventType: "DEADLINE",
              startAt: officialDueAt,
              endAt: new Date(officialDueAt.getTime() + 3600_000),
              timezone: event.timezone,
              location: event.location,
              organizerId: actorId,
              assignedUserId: assignee.id,
              sourceType: "COURT_OUTCOME",
              editPolicy: "LOCKED",
              notes: `Court-directed deadline recorded from ${event.title}`,
              syncState: "PENDING"
            }
          });
          task = await tx.task.create({
            data: {
              matterId: event.matterId,
              calendarEventId: deadlineEvent.id,
              title: input.deadline.taskTitle || `Prepare court-directed filing: ${deadline.title}`,
              description: `Prepare the filing required by the recorded court outcome. Official deadline: ${officialDueAt.toISOString()}.`,
              assignedToId: assignee.id,
              createdById: actorId,
              priority: "CRITICAL",
              status: "TODO",
              dueAt: internalTargetAt,
              officialDeadlineAt: officialDueAt
            }
          });
          await tx.matter.update({
            where: { id: event.matterId },
            data: { nextAction: task.title, lastActivityAt: new Date() }
          });
        } else if (event.matterId) {
          await tx.matter.update({ where: { id: event.matterId }, data: { lastActivityAt: new Date() } });
        }

        const outcome = await tx.courtOutcomeRecord.create({
          data: {
            eventId,
            status: input.status,
            outcome: input.outcome,
            directions: input.directions,
            courtOrderDocumentId: input.courtOrderDocumentId,
            nextEventId: nextEvent?.id,
            deadlineId: deadline?.id,
            deadlineEventId: deadlineEvent?.id,
            taskId: task?.id,
            recordedById: actorId
          }
        });
        await this.audit.record({
          firmId, actorUserId: actorId, action: "court.outcome_recorded",
          entityType: "calendar_event", entityId: eventId, matterId: event.matterId ?? undefined,
          metadata: {
            courtOutcomeRecordId: outcome.id,
            status: input.status,
            nextEventId: nextEvent?.id,
            deadlineId: deadline?.id,
            deadlineEventId: deadlineEvent?.id,
            taskId: task?.id,
            courtOrderDocumentId: input.courtOrderDocumentId
          }
        }, tx);
        return { outcome, event: updated, nextEvent, deadline, deadlineEvent, task, replayed: false };
      });
      await this.queues.add(QUEUES.calendar, "calendar.sync", { eventId, action: "update" });
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const canonical = await this.prisma.client.courtOutcomeRecord.findUnique({ where: { eventId } });
        if (canonical) return { outcome: canonical, replayed: true };
      }
      throw error;
    }
  }
}
