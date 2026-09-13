import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import type { RequestUser } from "../../platform/auth/auth.types";
import { NumberingService } from "../numbering/numbering.service";
import { TasksService } from "../tasks/tasks.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import { FinanceService } from "../finance/finance.service";

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly tasks: TasksService,
    @Optional() private readonly access?: RecordAccessService,
    @Optional() private readonly finance?: FinanceService
  ) {}

  private async assertFirmUsers(firmId: string, userIds: string[]) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (!unique.length) return;
    const count = await this.prisma.client.user.count({
      where: { id: { in: unique }, firmId, status: { in: ["ACTIVE", "INVITED"] } }
    });
    if (count !== unique.length) throw new BadRequestException("One or more users are invalid for this firm");
  }

  // ---------------------------------------------------------------------------
  // Projects and meetings
  // ---------------------------------------------------------------------------

  async listProjects(user: RequestUser) {
    const matterScope = this.access ? await this.access.matterWhere(user) : { id: "__no_project_links_without_access_service__" };
    return this.prisma.client.internalProject.findMany({
      where: { firmId: user.firmId },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } }
        },
        milestones: { orderBy: { dueAt: "asc" } },
        spend: { orderBy: { occurredAt: "desc" } },
        matterLinks: { where: { matter: matterScope }, include: { matter: { select: { id: true, internalReference: true, title: true } } } },
        documentLinks: { where: { document: { matter: matterScope } }, include: { document: { select: { id: true, title: true, matterId: true } } } }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  async linkProjectMatter(user: RequestUser, actorId: string, projectId: string, matterId: string) {
    const project = await this.prisma.client.internalProject.findFirst({ where: { id: projectId, firmId: user.firmId } });
    if (!project) throw new NotFoundException("Project not found");
    if (!this.access) throw new ForbiddenException("Record access policy is unavailable");
    const matter = await this.prisma.client.matter.findFirst({ where: { id: matterId, ...(await this.access.matterWhere(user)) } });
    if (!matter) throw new NotFoundException("Matter not found");
    const link = await this.prisma.client.projectMatterLink.upsert({ where: { projectId_matterId: { projectId, matterId } }, create: { projectId, matterId, linkedById: actorId }, update: {} });
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: actorId, action: "operations.project_matter_linked", entityType: "internal_project", entityId: projectId, matterId, metadata: { linkCreatedAt: link.createdAt.toISOString() } });
    return { link, auditRef: audit.id };
  }

  async linkProjectDocument(user: RequestUser, actorId: string, projectId: string, documentId: string) {
    const project = await this.prisma.client.internalProject.findFirst({ where: { id: projectId, firmId: user.firmId } });
    if (!project) throw new NotFoundException("Project not found");
    if (!this.access) throw new ForbiddenException("Record access policy is unavailable");
    const document = await this.prisma.client.document.findFirst({ where: { id: documentId, matter: await this.access.matterWhere(user) } });
    if (!document) throw new NotFoundException("Document not found");
    const link = await this.prisma.client.projectDocumentLink.upsert({ where: { projectId_documentId: { projectId, documentId } }, create: { projectId, documentId, linkedById: actorId }, update: {} });
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: actorId, action: "operations.project_document_linked", entityType: "internal_project", entityId: projectId, matterId: document.matterId, metadata: { documentId } });
    return { link, auditRef: audit.id };
  }

  async createProject(firmId: string, actorId: string, input: any) {
    const ownerUserId = input.ownerUserId ?? actorId;
    await this.assertFirmUsers(firmId, [ownerUserId, ...(input.memberUserIds ?? [])]);
    if (input.branchId) {
      const branch = await this.prisma.client.branch.findFirst({ where: { id: input.branchId, firmId, active: true } });
      if (!branch) throw new BadRequestException("Branch is invalid or inactive");
    }

    const project = await this.prisma.client.internalProject.create({
      data: {
        firmId,
        branchId: input.branchId,
        name: input.name,
        description: input.description,
        ownerUserId,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        budget: input.budget,
        members: input.memberUserIds?.length ? {
          create: [...new Set(input.memberUserIds as string[])].map((userId: string) => ({ userId }))
        } : undefined
      },
      include: { members: true }
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "operations.project_created",
      entityType: "internal_project",
      entityId: project.id,
      metadata: { name: project.name }
    });
    return project;
  }

  async addProjectMilestone(firmId: string, actorId: string, projectId: string, input: any) {
    const project = await this.prisma.client.internalProject.findFirst({ where: { id: projectId, firmId } });
    if (!project) throw new NotFoundException("Project not found");
    if (input.ownerUserId) await this.assertFirmUsers(firmId, [input.ownerUserId]);
    const milestone = await this.prisma.client.projectMilestone.create({ data: { projectId, title: input.title, description: input.description, dueAt: input.dueAt ? new Date(input.dueAt) : undefined, ownerUserId: input.ownerUserId } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "operations.project_milestone_created", entityType: "project_milestone", entityId: milestone.id, metadata: { projectId, title: milestone.title } });
    return { milestone, auditRef: audit.id };
  }

  async completeProjectMilestone(firmId: string, actorId: string, id: string) {
    const milestone = await this.prisma.client.projectMilestone.findFirst({ where: { id, project: { firmId } } });
    if (!milestone) throw new NotFoundException("Project milestone not found");
    if (milestone.status === "COMPLETED") return { milestone, auditRef: milestone.id };
    const updated = await this.prisma.client.projectMilestone.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "operations.project_milestone_completed", entityType: "project_milestone", entityId: id, metadata: { projectId: updated.projectId } });
    return { milestone: updated, auditRef: audit.id };
  }

  async recordProjectSpend(firmId: string, actorId: string, projectId: string, input: any) {
    const project = await this.prisma.client.internalProject.findFirst({ where: { id: projectId, firmId } });
    if (!project) throw new NotFoundException("Project not found");
    const spend = await this.prisma.client.projectSpend.create({ data: { projectId, description: input.description, amount: input.amount, occurredAt: new Date(input.occurredAt), source: "MANUAL", financeReference: input.financeReference, recordedById: actorId } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "operations.project_spend_recorded", entityType: "project_spend", entityId: spend.id, metadata: { projectId, amount: String(spend.amount), source: spend.source } });
    return { spend, auditRef: audit.id };
  }

  listMeetings(
    firmId: string,
    filters: { from?: string; to?: string; projectId?: string; matterId?: string }
  ) {
    const startsAt = filters.from || filters.to ? {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {})
    } : undefined;

    return this.prisma.client.meeting.findMany({
      where: {
        firmId,
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.matterId ? { matterId: filters.matterId } : {}),
        ...(startsAt ? { startsAt } : {})
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } }
        },
        decisions: true,
        actions: true
      },
      orderBy: { startsAt: "asc" }
    });
  }

  async createMeeting(firmId: string, actorId: string, input: any) {
    await this.assertFirmUsers(firmId, [actorId, ...(input.participantUserIds ?? [])]);

    if (input.projectId) {
      const project = await this.prisma.client.internalProject.findFirst({ where: { id: input.projectId, firmId } });
      if (!project) throw new BadRequestException("Project is not available in this firm");
    }
    if (input.matterId) {
      const matter = await this.prisma.client.matter.findFirst({ where: { id: input.matterId, firmId } });
      if (!matter) throw new BadRequestException("Matter is not available in this firm");
    }

    const meeting = await this.prisma.client.meeting.create({
      data: {
        firmId,
        projectId: input.projectId,
        matterId: input.matterId,
        title: input.title,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        location: input.location,
        agenda: input.agenda,
        organizerId: actorId,
        recurrenceRule: input.recurrenceRule,
        recurrenceUntil: input.recurrenceUntil ? new Date(input.recurrenceUntil) : undefined,
        participants: input.participantUserIds?.length ? {
          create: [...new Set(input.participantUserIds as string[])].map((userId: string) => ({ userId }))
        } : undefined
      },
      include: { participants: true, decisions: true, actions: true }
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "meeting.created",
      entityType: "meeting",
      entityId: meeting.id,
      matterId: meeting.matterId ?? undefined,
      metadata: { title: meeting.title }
    });
    return meeting;
  }

  async updateMeeting(firmId: string, actorId: string, meetingId: string, input: any) {
    const existing = await this.prisma.client.meeting.findFirst({ where: { id: meetingId, firmId } });
    if (!existing) throw new NotFoundException("Meeting not found");

    if (input.participantUserIds) await this.assertFirmUsers(firmId, input.participantUserIds);

    await this.prisma.client.$transaction(async (tx) => {
      const data: any = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.startsAt !== undefined) data.startsAt = new Date(input.startsAt);
      if (input.endsAt !== undefined) data.endsAt = input.endsAt ? new Date(input.endsAt) : null;
      if (input.location !== undefined) data.location = input.location;
      if (input.agenda !== undefined) data.agenda = input.agenda;
      if (input.minutes !== undefined) data.minutes = input.minutes;
      if (input.status !== undefined) data.status = input.status;
      if (input.recurrenceRule !== undefined) data.recurrenceRule = input.recurrenceRule;
      if (input.recurrenceUntil !== undefined) data.recurrenceUntil = input.recurrenceUntil ? new Date(input.recurrenceUntil) : null;
      await tx.meeting.update({ where: { id: meetingId }, data });

      if (input.participantUserIds) {
        await tx.meetingParticipant.deleteMany({ where: { meetingId } });
        if (input.participantUserIds.length) {
          await tx.meetingParticipant.createMany({
            data: [...new Set(input.participantUserIds as string[])].map((userId: string) => ({ meetingId, userId }))
          });
        }
      }

      await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: "meeting.updated",
        entityType: "meeting",
        entityId: meetingId,
        matterId: existing.matterId ?? undefined,
        metadata: { changed: Object.keys(input) }
      }, tx);
    });

    return this.prisma.client.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } } },
        decisions: true,
        actions: true
      }
    });
  }

  async setMeetingAttendance(firmId: string, actorId: string, meetingId: string, userId: string, attendanceStatus: string) {
    const meeting = await this.prisma.client.meeting.findFirst({ where: { id: meetingId, firmId } });
    if (!meeting) throw new NotFoundException("Meeting not found");
    await this.assertFirmUsers(firmId, [userId]);
    const participant = await this.prisma.client.meetingParticipant.findUnique({ where: { meetingId_userId: { meetingId, userId } } });
    if (!participant) throw new BadRequestException("User is not a meeting participant");
    const updated = await this.prisma.client.meetingParticipant.update({ where: { meetingId_userId: { meetingId, userId } }, data: { attendanceStatus } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "meeting.attendance_recorded", entityType: "meeting", entityId: meetingId, matterId: meeting.matterId ?? undefined, metadata: { userId, attendanceStatus } });
    return { participant: updated, auditRef: audit.id };
  }

  async addMeetingDecision(
    firmId: string,
    actorId: string,
    meetingId: string,
    input: { text: string; ownerUserId?: string }
  ) {
    const meeting = await this.prisma.client.meeting.findFirst({ where: { id: meetingId, firmId } });
    if (!meeting) throw new NotFoundException("Meeting not found");
    if (input.ownerUserId) await this.assertFirmUsers(firmId, [input.ownerUserId]);

    const decision = await this.prisma.client.meetingDecision.create({
      data: { meetingId, text: input.text, ownerUserId: input.ownerUserId }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "meeting.decision_recorded",
      entityType: "meeting",
      entityId: meetingId,
      matterId: meeting.matterId ?? undefined,
      metadata: { decisionId: decision.id }
    });
    return decision;
  }

  async addMeetingAction(
    firmId: string,
    actorId: string,
    meetingId: string,
    input: { text: string; assigneeId?: string; dueAt?: string; createTask?: boolean }
  ) {
    const meeting = await this.prisma.client.meeting.findFirst({ where: { id: meetingId, firmId } });
    if (!meeting) throw new NotFoundException("Meeting not found");
    if (input.assigneeId) await this.assertFirmUsers(firmId, [input.assigneeId]);

    let taskId: string | undefined;
    if (input.createTask) {
      if (!input.assigneeId || !input.dueAt) {
        throw new BadRequestException("Creating a task requires an assignee and due date");
      }
      const task = await this.tasks.create(firmId, actorId, {
        matterId: meeting.matterId ?? undefined,
        title: input.text,
        assignedToId: input.assigneeId,
        priority: "MEDIUM",
        dueAt: input.dueAt,
        dependencyIds: []
      });
      taskId = task.id;
    }

    const action = await this.prisma.client.meetingAction.create({
      data: {
        meetingId,
        taskId,
        text: input.text,
        assigneeId: input.assigneeId,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "meeting.action_recorded",
      entityType: "meeting",
      entityId: meetingId,
      matterId: meeting.matterId ?? undefined,
      metadata: { actionId: action.id, taskId: taskId ?? null }
    });
    return action;
  }

  async completeMeetingAction(firmId: string, actorId: string, id: string) {
    const action = await this.prisma.client.meetingAction.findFirst({ where: { id, meeting: { firmId } } });
    if (!action) throw new NotFoundException("Meeting action not found");
    if (action.status === "COMPLETED") return { action, auditRef: action.id };
    const updated = await this.prisma.client.meetingAction.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date(), completedById: actorId } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "meeting.action_completed", entityType: "meeting_action", entityId: id, metadata: { meetingId: updated.meetingId, taskId: updated.taskId ?? null } });
    return { action: updated, auditRef: audit.id };
  }

  // ---------------------------------------------------------------------------
  // People operations
  // ---------------------------------------------------------------------------

  async listEmployeeProfiles(firmId: string) {
    const users = await this.prisma.client.user.findMany({
      where: { firmId },
      select: { id: true, fullName: true, email: true, jobTitle: true, status: true, homeBranchId: true },
      orderBy: { fullName: "asc" }
    });
    const profiles = await this.prisma.client.employeeProfile.findMany({
      where: { userId: { in: users.map((user) => user.id) } }
    });
    const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));
    return users.map((user) => ({ ...user, employeeProfile: profileByUser.get(user.id) ?? null }));
  }

  async upsertEmployeeProfile(firmId: string, actorId: string, userId: string, input: any) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, firmId } });
    if (!user) throw new NotFoundException("User not found");
    if (input.managerUserId) await this.assertFirmUsers(firmId, [input.managerUserId]);

    const existing = await this.prisma.client.employeeProfile.findUnique({ where: { userId } });
    const employeeNumber = input.employeeNumber ?? existing?.employeeNumber ?? await this.numbering.next({
      firmId,
      branchId: user.homeBranchId ?? undefined,
      entityType: "EMPLOYEE",
      year: new Date().getFullYear(),
      pattern: "KKA/EMP/{year}/{seq:4}"
    });

    const profile = await this.prisma.client.employeeProfile.upsert({
      where: { userId },
      create: {
        userId,
        employeeNumber,
        employmentType: input.employmentType,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        employmentStatus: input.employmentStatus,
        probationEndsAt: input.probationEndsAt ? new Date(input.probationEndsAt) : undefined,
        managerUserId: input.managerUserId,
        leavePolicyKey: input.leavePolicyKey,
        cpdsRequiredAnnual: input.cpdsRequiredAnnual,
        notes: input.notes
      },
      update: {
        employeeNumber,
        employmentType: input.employmentType,
        startDate: new Date(input.startDate),
        endDate: input.endDate === undefined ? undefined : input.endDate ? new Date(input.endDate) : null,
        employmentStatus: input.employmentStatus,
        probationEndsAt: input.probationEndsAt === undefined ? undefined : input.probationEndsAt ? new Date(input.probationEndsAt) : null,
        managerUserId: input.managerUserId,
        leavePolicyKey: input.leavePolicyKey,
        cpdsRequiredAnnual: input.cpdsRequiredAnnual,
        notes: input.notes
      }
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: existing ? "hr.employee_profile_updated" : "hr.employee_profile_created",
      entityType: "user",
      entityId: userId,
      metadata: { employeeNumber }
    });
    return { ...user, employeeProfile: profile };
  }

  async listLeave(user: RequestUser, scope: "self" | "all") {
    const canManage = user.permissions.includes("hr.manage");
    if (scope === "all" && !canManage) throw new ForbiddenException("HR permission is required to view firm leave requests");

    return this.prisma.client.leaveRequest.findMany({
      where: scope === "all" ? { requester: { firmId: user.firmId } } : { userId: user.id },
      include: {
        requester: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        approver: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async requestLeave(firmId: string, actorId: string, input: any) {
    const user = await this.prisma.client.user.findFirst({ where: { id: actorId, firmId, status: "ACTIVE" } });
    if (!user) throw new NotFoundException("Active user not found");
    const startsOn = new Date(input.startsOn);
    const endsOn = new Date(input.endsOn);
    if (endsOn < startsOn) throw new BadRequestException("Leave end date cannot be before the start date");

    const overlap = await this.prisma.client.leaveRequest.findFirst({
      where: {
        userId: actorId,
        status: { in: ["SUBMITTED", "APPROVED"] },
        startsOn: { lte: endsOn },
        endsOn: { gte: startsOn }
      }
    });
    if (overlap) throw new BadRequestException("The requested dates overlap another active leave request");

    const request = await this.prisma.client.leaveRequest.create({
      data: {
        userId: actorId,
        type: input.type,
        startsOn,
        endsOn,
        days: input.days,
        reason: input.reason,
        status: "SUBMITTED"
      },
      include: { requester: { select: { id: true, fullName: true, email: true, jobTitle: true } } }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "hr.leave_submitted",
      entityType: "leave_request",
      entityId: request.id,
      metadata: { type: request.type, startsOn: request.startsOn.toISOString(), endsOn: request.endsOn.toISOString(), days: String(request.days) }
    });
    return request;
  }

  async decideLeave(
    firmId: string,
    actorId: string,
    id: string,
    input: { decision: "APPROVED" | "REJECTED"; reason?: string }
  ) {
    const request = await this.prisma.client.leaveRequest.findFirst({
      where: { id, requester: { firmId } },
      include: { requester: { select: { id: true, fullName: true, email: true, jobTitle: true } } }
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.status !== "SUBMITTED") throw new BadRequestException("Only submitted leave requests can be decided");
    if (request.userId === actorId) throw new BadRequestException("A user cannot approve or reject their own leave request");

    const updated = await this.prisma.client.leaveRequest.update({
      where: { id },
      data: {
        status: input.decision,
        approverId: actorId,
        approvedAt: input.decision === "APPROVED" ? new Date() : null
      },
      include: {
        requester: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        approver: { select: { id: true, fullName: true } }
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: input.decision === "APPROVED" ? "hr.leave_approved" : "hr.leave_rejected",
      entityType: "leave_request",
      entityId: id,
      metadata: { requesterId: request.userId, reason: input.reason ?? null }
    });
    return updated;
  }

  async cancelLeave(firmId: string, actorId: string, id: string, canManage: boolean) {
    const request = await this.prisma.client.leaveRequest.findFirst({
      where: { id, requester: { firmId } }
    });
    if (!request) throw new NotFoundException("Leave request not found");
    if (request.userId !== actorId && !canManage) throw new ForbiddenException("You cannot cancel this leave request");
    if (!["DRAFT", "SUBMITTED", "APPROVED"].includes(request.status)) {
      throw new BadRequestException("This leave request can no longer be cancelled");
    }

    const updated = await this.prisma.client.leaveRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        requester: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        approver: { select: { id: true, fullName: true } }
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "hr.leave_cancelled",
      entityType: "leave_request",
      entityId: id,
      metadata: { requesterId: request.userId }
    });
    return updated;
  }

  async hrRecords(firmId: string, userId: string) {
    await this.assertFirmUsers(firmId, [userId]);
    const year = new Date().getUTCFullYear();
    const [profile, lifecycle, appraisals, cpd, credentials, balances, notes, documents] = await Promise.all([
      this.prisma.client.employeeProfile.findUnique({ where: { userId } }),
      this.prisma.client.hrLifecycleChecklistItem.findMany({ where: { firmId, userId }, orderBy: [{ lifecycle: "asc" }, { dueAt: "asc" }] }),
      this.prisma.client.employeeAppraisal.findMany({ where: { firmId, userId }, orderBy: { periodEndsAt: "desc" } }),
      this.prisma.client.cpdRecord.findMany({ where: { userId }, orderBy: { occurredOn: "desc" } }),
      this.prisma.client.advocateCredential.findMany({ where: { firmId, userId }, orderBy: { certificateExpiresAt: "asc" } }),
      this.prisma.client.leaveBalance.findMany({ where: { firmId, userId, year }, orderBy: { policyKey: "asc" } }),
      this.prisma.client.hrRestrictedNote.findMany({ where: { firmId, userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.client.staffDocument.findMany({ where: { firmId, userId }, orderBy: { createdAt: "desc" } })
    ]);
    return { profile, lifecycle, appraisals, cpd, credentials, balances, notes, documents };
  }

  listLeavePolicies(firmId: string) {
    return this.prisma.client.leavePolicy.findMany({ where: { firmId }, orderBy: [{ active: "desc" }, { name: "asc" }] });
  }

  async upsertLifecycleItem(firmId: string, actorId: string, userId: string, input: any) {
    await this.assertFirmUsers(firmId, [userId]);
    const item = await this.prisma.client.hrLifecycleChecklistItem.upsert({
      where: { firmId_userId_lifecycle_key: { firmId, userId, lifecycle: input.lifecycle, key: input.key } },
      create: { firmId, userId, lifecycle: input.lifecycle, key: input.key, title: input.title, dueAt: input.dueAt ? new Date(input.dueAt) : undefined, notes: input.notes },
      update: { title: input.title, dueAt: input.dueAt === undefined ? undefined : input.dueAt ? new Date(input.dueAt) : null, notes: input.notes }
    });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.lifecycle_item_saved", entityType: "hr_lifecycle_item", entityId: item.id, metadata: { userId, lifecycle: item.lifecycle, key: item.key } });
    return { item, auditRef: audit.id };
  }

  async completeLifecycleItem(firmId: string, actorId: string, id: string, completed: boolean) {
    const existing = await this.prisma.client.hrLifecycleChecklistItem.findFirst({ where: { id, firmId } });
    if (!existing) throw new NotFoundException("HR lifecycle item not found");
    const item = await this.prisma.client.hrLifecycleChecklistItem.update({ where: { id }, data: { status: completed ? "COMPLETED" : "PENDING", completedAt: completed ? new Date() : null, completedById: completed ? actorId : null } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: completed ? "hr.lifecycle_item_completed" : "hr.lifecycle_item_reopened", entityType: "hr_lifecycle_item", entityId: id, metadata: { userId: item.userId } });
    return { item, auditRef: audit.id };
  }

  async recordAppraisal(firmId: string, actorId: string, userId: string, input: any) {
    await this.assertFirmUsers(firmId, [userId, input.reviewerUserId ?? actorId]);
    const row = await this.prisma.client.employeeAppraisal.create({ data: { firmId, userId, reviewerUserId: input.reviewerUserId ?? actorId, periodStartsAt: new Date(input.periodStartsAt), periodEndsAt: new Date(input.periodEndsAt), status: input.status ?? "DRAFT", rating: input.rating, summary: input.summary, developmentPlan: input.developmentPlan } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.appraisal_recorded", entityType: "employee_appraisal", entityId: row.id, metadata: { userId, status: row.status } });
    return { appraisal: row, auditRef: audit.id };
  }

  async recordCpd(firmId: string, actorId: string, userId: string, input: any) {
    await this.assertFirmUsers(firmId, [userId]);
    const row = await this.prisma.client.cpdRecord.create({ data: { userId, title: input.title, provider: input.provider, occurredOn: new Date(input.occurredOn), hours: input.hours, notes: input.notes } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.cpd_recorded", entityType: "cpd_record", entityId: row.id, metadata: { userId, hours: String(row.hours) } });
    return { cpd: row, auditRef: audit.id };
  }

  async upsertAdvocateCredential(firmId: string, actorId: string, userId: string, input: any) {
    await this.assertFirmUsers(firmId, [userId]);
    const row = await this.prisma.client.advocateCredential.upsert({
      where: { firmId_admissionNumber: { firmId, admissionNumber: input.admissionNumber } },
      create: { firmId, userId, admissionNumber: input.admissionNumber, admissionDate: input.admissionDate ? new Date(input.admissionDate) : undefined, practicingCertificateNo: input.practicingCertificateNo, certificateExpiresAt: input.certificateExpiresAt ? new Date(input.certificateExpiresAt) : undefined, status: input.status ?? "ACTIVE", notes: input.notes },
      update: { userId, admissionDate: input.admissionDate === undefined ? undefined : input.admissionDate ? new Date(input.admissionDate) : null, practicingCertificateNo: input.practicingCertificateNo, certificateExpiresAt: input.certificateExpiresAt === undefined ? undefined : input.certificateExpiresAt ? new Date(input.certificateExpiresAt) : null, status: input.status, notes: input.notes }
    });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.advocate_credential_saved", entityType: "advocate_credential", entityId: row.id, metadata: { userId, admissionNumber: row.admissionNumber, status: row.status } });
    return { credential: row, auditRef: audit.id };
  }

  async upsertLeavePolicy(firmId: string, actorId: string, input: any) {
    const row = await this.prisma.client.leavePolicy.upsert({ where: { firmId_key: { firmId, key: input.key } }, create: { firmId, key: input.key, name: input.name, annualEntitlementDays: input.annualEntitlementDays, carryoverLimitDays: input.carryoverLimitDays, active: input.active ?? true }, update: { name: input.name, annualEntitlementDays: input.annualEntitlementDays, carryoverLimitDays: input.carryoverLimitDays, active: input.active } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.leave_policy_saved", entityType: "leave_policy", entityId: row.id, metadata: { key: row.key, active: row.active } });
    return { policy: row, auditRef: audit.id };
  }

  async upsertLeaveBalance(firmId: string, actorId: string, userId: string, input: any) {
    await this.assertFirmUsers(firmId, [userId]);
    const policy = await this.prisma.client.leavePolicy.findFirst({ where: { firmId, key: input.policyKey, active: true } });
    if (!policy) throw new BadRequestException("Leave policy is not active in this firm");
    const row = await this.prisma.client.leaveBalance.upsert({ where: { firmId_userId_policyKey_year: { firmId, userId, policyKey: input.policyKey, year: input.year } }, create: { firmId, userId, policyKey: input.policyKey, year: input.year, openingDays: input.openingDays ?? 0, accruedDays: input.accruedDays ?? 0, usedDays: input.usedDays ?? 0, adjustmentDays: input.adjustmentDays ?? 0, notes: input.notes, updatedById: actorId }, update: { openingDays: input.openingDays, accruedDays: input.accruedDays, usedDays: input.usedDays, adjustmentDays: input.adjustmentDays, notes: input.notes, updatedById: actorId } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.leave_balance_saved", entityType: "leave_balance", entityId: row.id, metadata: { userId, policyKey: row.policyKey, year: row.year } });
    return { balance: row, auditRef: audit.id };
  }

  async addHrNote(firmId: string, actorId: string, userId: string, input: any) {
    await this.assertFirmUsers(firmId, [userId, ...(input.visibleToUserIds ?? [])]);
    const row = await this.prisma.client.hrRestrictedNote.create({ data: { firmId, userId, authorUserId: actorId, category: input.category, body: input.body, visibleToUserIds: input.visibleToUserIds ?? [] } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.restricted_note_recorded", entityType: "hr_restricted_note", entityId: row.id, metadata: { userId, category: row.category } });
    return { note: row, auditRef: audit.id };
  }

  async recordStaffDocument(firmId: string, actorId: string, userId: string, input: any) {
    await this.assertFirmUsers(firmId, [userId]);
    const row = await this.prisma.client.staffDocument.create({ data: { firmId, userId, category: input.category, title: input.title, storageState: "MANUAL", externalReference: input.externalReference, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined, recordedById: actorId, notes: input.notes } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.staff_document_recorded", entityType: "staff_document", entityId: row.id, metadata: { userId, category: row.category, storageState: row.storageState } });
    return { document: row, auditRef: audit.id };
  }

  async offboardEmployee(firmId: string, actorId: string, userId: string, input: { offboardedAt: string; reason?: string }) {
    await this.assertFirmUsers(firmId, [userId]);
    const profile = await this.prisma.client.employeeProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Employee profile not found");
    const updated = await this.prisma.client.employeeProfile.update({ where: { userId }, data: { employmentStatus: "OFFBOARDED", endDate: new Date(input.offboardedAt), offboardedAt: new Date(input.offboardedAt), offboardingReason: input.reason } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "hr.employee_offboarded", entityType: "employee_profile", entityId: updated.id, metadata: { userId, offboardedAt: updated.offboardedAt?.toISOString() } });
    return { profile: updated, auditRef: audit.id };
  }

  // ---------------------------------------------------------------------------
  // Procurement
  // ---------------------------------------------------------------------------

  vendors(firmId: string) {
    return this.prisma.client.vendor.findMany({ where: { firmId }, orderBy: { name: "asc" } });
  }

  async createVendor(firmId: string, actorId: string, input: any) {
    const vendor = await this.prisma.client.vendor.create({ data: { firmId, ...input } });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "procurement.vendor_created",
      entityType: "vendor",
      entityId: vendor.id,
      metadata: { name: vendor.name }
    });
    return vendor;
  }

  purchaseCategories(firmId: string) {
    return this.prisma.client.purchaseCategory.findMany({ where: { firmId }, orderBy: [{ active: "desc" }, { name: "asc" }] });
  }

  async savePurchaseCategory(firmId: string, actorId: string, input: any) {
    const category = await this.prisma.client.purchaseCategory.upsert({
      where: { firmId_key: { firmId, key: input.key } },
      create: { firmId, key: input.key, name: input.name, approvalThreshold: input.approvalThreshold, financeAccountCode: input.financeAccountCode, active: input.active ?? true },
      update: { name: input.name, approvalThreshold: input.approvalThreshold, financeAccountCode: input.financeAccountCode, active: input.active }
    });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "procurement.category_saved", entityType: "purchase_category", entityId: category.id, metadata: { key: category.key, active: category.active } });
    return { category, auditRef: audit.id };
  }

  async recordVendorDocument(firmId: string, actorId: string, vendorId: string, input: any) {
    const vendor = await this.prisma.client.vendor.findFirst({ where: { id: vendorId, firmId } });
    if (!vendor) throw new NotFoundException("Vendor not found");
    const document = await this.prisma.client.vendorDocument.create({ data: { vendorId, category: input.category, title: input.title, storageState: "MANUAL", externalReference: input.externalReference, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined, recordedById: actorId } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "procurement.vendor_document_recorded", entityType: "vendor_document", entityId: document.id, metadata: { vendorId, category: document.category, storageState: "MANUAL" } });
    return { document, auditRef: audit.id };
  }

  listPurchaseRequisitions(firmId: string) {
    return this.prisma.client.purchaseRequisition.findMany({
      where: { firmId },
      include: { vendor: true, category: true, quotes: { include: { vendor: true }, orderBy: { amount: "asc" } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async recordVendorQuote(firmId: string, actorId: string, requisitionId: string, input: any) {
    const requisition = await this.prisma.client.purchaseRequisition.findFirst({ where: { id: requisitionId, firmId } });
    if (!requisition) throw new NotFoundException("Purchase requisition not found");
    if (["ORDERED", "RECEIVED", "CANCELLED"].includes(requisition.status)) throw new BadRequestException("Quotes cannot be recorded for this requisition status");
    const vendor = await this.prisma.client.vendor.findFirst({ where: { id: input.vendorId, firmId, active: true } });
    if (!vendor) throw new BadRequestException("Vendor is invalid or inactive");
    const quote = await this.prisma.client.vendorQuote.upsert({
      where: { requisitionId_vendorId_reference: { requisitionId, vendorId: input.vendorId, reference: input.reference } },
      create: { requisitionId, vendorId: input.vendorId, reference: input.reference, amount: input.amount, currency: input.currency ?? "KES", validUntil: input.validUntil ? new Date(input.validUntil) : undefined, notes: input.notes, recordedById: actorId },
      update: { amount: input.amount, currency: input.currency, validUntil: input.validUntil === undefined ? undefined : input.validUntil ? new Date(input.validUntil) : null, notes: input.notes }
    });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "procurement.vendor_quote_saved", entityType: "vendor_quote", entityId: quote.id, metadata: { requisitionId, vendorId: quote.vendorId, amount: String(quote.amount) } });
    return { quote, auditRef: audit.id };
  }

  async createPurchaseRequisition(firmId: string, actorId: string, input: any) {
    if (input.idempotencyKey) {
      const existing = await this.prisma.client.purchaseRequisition.findFirst({
        where: { firmId, idempotencyKey: input.idempotencyKey }, include: { vendor: true }
      });
      if (existing) return existing;
    }
    const branch = await this.prisma.client.branch.findFirst({ where: { id: input.branchId, firmId, active: true } });
    if (!branch) throw new BadRequestException("Branch is invalid or inactive");
    if (input.vendorId) {
      const vendor = await this.prisma.client.vendor.findFirst({ where: { id: input.vendorId, firmId, active: true } });
      if (!vendor) throw new BadRequestException("Vendor is invalid or inactive");
    }
    if (input.categoryId) {
      const category = await this.prisma.client.purchaseCategory.findFirst({ where: { id: input.categoryId, firmId, active: true } });
      if (!category) throw new BadRequestException("Purchase category is invalid or inactive");
    }

    const requisitionNo = await this.numbering.next({
      firmId,
      branchId: input.branchId,
      entityType: "PURCHASE_REQUISITION",
      year: new Date().getFullYear(),
      pattern: "KKA/PR/{year}/{seq:5}"
    });

    try {
      return await this.prisma.client.$transaction(async (tx) => {
      const requisition = await tx.purchaseRequisition.create({
        data: {
          firmId,
          branchId: input.branchId,
          vendorId: input.vendorId,
          categoryId: input.categoryId,
          requisitionNo,
          requestedById: actorId,
          description: input.description,
          amount: input.amount,
          idempotencyKey: input.idempotencyKey,
          status: "SUBMITTED"
        },
        include: { vendor: true }
      });
      const category = input.categoryId ? await tx.purchaseCategory.findUnique({ where: { id: input.categoryId } }) : null;
      const requiresThresholdApprover = Boolean(category?.approvalThreshold && Number(input.amount) > Number(category.approvalThreshold));
      await tx.approvalRequest.create({
        data: {
          firmId,
          type: "PURCHASE_REQUISITION",
          entityType: "PurchaseRequisition",
          entityId: requisition.id,
          requestedById: actorId,
          requiredRoleKeys: requiresThresholdApprover ? ["managing_partner"] : ["administrator", "managing_partner"],
          assignedUserIds: [],
          payload: { requisitionNo, amount: input.amount, categoryId: input.categoryId ?? null, approvalThreshold: category?.approvalThreshold ? String(category.approvalThreshold) : null, requiresThresholdApprover }
        }
      });
      await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: "procurement.requisition_submitted",
        entityType: "purchase_requisition",
        entityId: requisition.id,
        metadata: { requisitionNo, amount: input.amount }
      }, tx);
      return requisition;
      });
    } catch (error: any) {
      if (error?.code !== "P2002") throw error;
      const existing = await this.prisma.client.purchaseRequisition.findFirst({
        where: { firmId, idempotencyKey: input.idempotencyKey }, include: { vendor: true }
      });
      if (existing) return existing;
      throw error;
    }
  }

  async decidePurchaseRequisition(
    firmId: string,
    actorId: string,
    id: string,
    decision: "APPROVED" | "REJECTED"
  ) {
    const requisition = await this.prisma.client.purchaseRequisition.findFirst({ where: { id, firmId } });
    if (!requisition) throw new NotFoundException("Purchase requisition not found");
    if (requisition.status !== "SUBMITTED") throw new BadRequestException("Only submitted requisitions can be decided");
    if (requisition.requestedById === actorId) throw new BadRequestException("A requester cannot approve their own requisition");

    const updated = await this.prisma.client.purchaseRequisition.update({
      where: { id },
      data: {
        status: decision,
        approvedById: actorId,
        approvedAt: decision === "APPROVED" ? new Date() : null
      },
      include: { vendor: true }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: decision === "APPROVED" ? "procurement.requisition_approved" : "procurement.requisition_rejected",
      entityType: "purchase_requisition",
      entityId: id,
      metadata: { requisitionNo: requisition.requisitionNo }
    });
    return updated;
  }

  listPurchaseOrders(firmId: string) {
    return this.prisma.client.purchaseOrder.findMany({
      where: { firmId },
      include: { vendor: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async listPurchaseReceipts(firmId: string) {
    const receipts = await this.prisma.client.purchaseReceipt.findMany({
      where: { firmId }, include: { purchaseOrder: { include: { vendor: true } }, asset: true }, orderBy: { receivedAt: "desc" }, take: 200
    });
    const expenses = await this.prisma.client.expenseRequest.findMany({
      where: { firmId, purchaseReceiptId: { in: receipts.map((receipt) => receipt.id) } }, select: { id: true, purchaseReceiptId: true, expenseNumber: true, status: true, amount: true }
    });
    const expenseByReceipt = new Map(expenses.filter((expense) => expense.purchaseReceiptId).map((expense) => [expense.purchaseReceiptId!, expense]));
    return receipts.map((receipt) => ({ ...receipt, expense: expenseByReceipt.get(receipt.id) ?? null }));
  }

  async createPurchaseOrder(firmId: string, actorId: string, requisitionId: string) {
    const requisition = await this.prisma.client.purchaseRequisition.findFirst({ where: { id: requisitionId, firmId } });
    if (!requisition) throw new NotFoundException("Purchase requisition not found");
    const existing = await this.prisma.client.purchaseOrder.findFirst({ where: { firmId, requisitionId } });
    if (existing) return existing;
    if (requisition.status !== "APPROVED") throw new BadRequestException("The requisition must be approved before ordering");
    if (!requisition.vendorId) throw new BadRequestException("Assign a vendor before creating a purchase order");

    const orderNo = await this.numbering.next({
      firmId,
      branchId: requisition.branchId,
      entityType: "PURCHASE_ORDER",
      year: new Date().getFullYear(),
      pattern: "KKA/PO/{year}/{seq:5}"
    });

    try {
      return await this.prisma.client.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          firmId,
          branchId: requisition.branchId,
          vendorId: requisition.vendorId!,
          orderNo,
          requisitionId,
          description: requisition.description,
          amount: requisition.amount,
          status: "ORDERED",
          orderedAt: new Date(),
          createdById: actorId
        },
        include: { vendor: true }
      });
      await tx.purchaseRequisition.update({ where: { id: requisitionId }, data: { status: "ORDERED" } });
      await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: "procurement.purchase_order_created",
        entityType: "purchase_order",
        entityId: order.id,
        metadata: { orderNo, requisitionId }
      }, tx);
      return order;
      });
    } catch (error: any) {
      if (error?.code !== "P2002") throw error;
      const existing = await this.prisma.client.purchaseOrder.findFirst({ where: { firmId, requisitionId }, include: { vendor: true } });
      if (existing) return existing;
      throw error;
    }
  }

  async receivePurchaseOrder(
    firmId: string,
    actorId: string,
    id: string,
    input: { receivedAt?: string; partial: boolean; deliveryReference: string; idempotencyKey: string; notes?: string }
  ) {
    const existingReceipt = await this.prisma.client.purchaseReceipt.findUnique({
      where: { firmId_idempotencyKey: { firmId, idempotencyKey: input.idempotencyKey } },
      include: { purchaseOrder: { include: { vendor: true } } }
    });
    if (existingReceipt) {
      if (existingReceipt.purchaseOrderId !== id) throw new BadRequestException("Receipt idempotency key belongs to another purchase order");
      return { order: existingReceipt.purchaseOrder, receipt: existingReceipt, auditRef: existingReceipt.id };
    }
    const order = await this.prisma.client.purchaseOrder.findFirst({ where: { id, firmId } });
    if (!order) throw new NotFoundException("Purchase order not found");
    if (order.status === "RECEIVED" && !input.partial) return order;
    if (!["ORDERED", "PARTIALLY_RECEIVED"].includes(order.status)) {
      throw new BadRequestException("This purchase order is not awaiting receipt");
    }

    const nextStatus = input.partial ? "PARTIALLY_RECEIVED" : "RECEIVED";
    const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
    try {
      return await this.prisma.client.$transaction(async (tx) => {
      const receipt = await tx.purchaseReceipt.create({
        data: {
          firmId, purchaseOrderId: id, idempotencyKey: input.idempotencyKey,
          deliveryReference: input.deliveryReference, receivedAt, receivedById: actorId,
          partial: input.partial, notes: input.notes
        }
      });
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: nextStatus, receivedAt },
        include: { vendor: true }
      });
      if (order.requisitionId) {
        await tx.purchaseRequisition.update({ where: { id: order.requisitionId }, data: { status: nextStatus } });
      }
      const audit = await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: input.partial ? "procurement.purchase_order_partially_received" : "procurement.purchase_order_received",
        entityType: "purchase_order",
        entityId: id,
        metadata: { orderNo: order.orderNo, receiptId: receipt.id, deliveryReference: input.deliveryReference, receivedAt: receivedAt.toISOString() }
      }, tx);
      return { order: updated, receipt, auditRef: audit.id };
      });
    } catch (error: any) {
      if (error?.code !== "P2002") throw error;
      const receipt = await this.prisma.client.purchaseReceipt.findUnique({
        where: { firmId_idempotencyKey: { firmId, idempotencyKey: input.idempotencyKey } },
        include: { purchaseOrder: { include: { vendor: true } } }
      });
      if (receipt?.purchaseOrderId === id) return { order: receipt.purchaseOrder, receipt, auditRef: receipt.id };
      throw error;
    }
  }

  async createAssetFromReceipt(firmId: string, actorId: string, receiptId: string, input: any) {
    const receipt = await this.prisma.client.purchaseReceipt.findFirst({ where: { id: receiptId, firmId }, include: { purchaseOrder: true, asset: true } });
    if (!receipt) throw new NotFoundException("Purchase receipt not found");
    if (receipt.asset) return { asset: receipt.asset, receipt, auditRef: receipt.asset.id };
    const assetTag = input.assetTag ?? await this.numbering.next({ firmId, branchId: receipt.purchaseOrder.branchId, entityType: "ASSET", year: new Date().getFullYear(), pattern: "KKA/AST/{year}/{seq:5}" });
    try {
      const asset = await this.prisma.client.asset.create({ data: { firmId, branchId: receipt.purchaseOrder.branchId, assetTag, category: input.category, name: input.name, serialNumber: input.serialNumber, purchaseDate: receipt.receivedAt, purchaseCost: receipt.purchaseOrder.amount, notes: input.notes, purchaseReceiptId: receiptId }, include: { assignments: true } });
      const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "assets.asset_created_from_receipt", entityType: "asset", entityId: asset.id, metadata: { receiptId, orderId: receipt.purchaseOrderId, deliveryReference: receipt.deliveryReference } });
      return { asset, receipt, auditRef: audit.id };
    } catch (error: any) {
      if (error?.code !== "P2002") throw error;
      const asset = await this.prisma.client.asset.findFirst({ where: { firmId, purchaseReceiptId: receiptId }, include: { assignments: true } });
      if (asset) return { asset, receipt, auditRef: asset.id };
      throw error;
    }
  }

  async createExpenseFromReceipt(user: RequestUser, actorId: string, receiptId: string, input: { category: string; description?: string; paymentSource: string }) {
    if (!user.permissions.includes("finance.expense_create")) throw new ForbiddenException("Finance expense permission is required");
    if (!this.finance) throw new ForbiddenException("Finance service is unavailable");
    const receipt = await this.prisma.client.purchaseReceipt.findFirst({ where: { id: receiptId, firmId: user.firmId }, include: { purchaseOrder: true } });
    if (!receipt) throw new NotFoundException("Purchase receipt not found");
    const expense = await this.finance.createExpense(user.firmId, actorId, { branchId: receipt.purchaseOrder.branchId, category: input.category, description: input.description ?? receipt.purchaseOrder.description, amount: Number(receipt.purchaseOrder.amount), currency: "KES", paymentSource: input.paymentSource, purchaseReceiptId: receiptId }, user);
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: actorId, action: "procurement.receipt_linked_to_expense", entityType: "purchase_receipt", entityId: receiptId, metadata: { expenseId: expense.id, expenseStatus: expense.status } });
    return { expense, receipt, auditRef: audit.id };
  }

  // ---------------------------------------------------------------------------
  // Asset custody
  // ---------------------------------------------------------------------------

  assets(firmId: string) {
    return this.prisma.client.asset.findMany({
      where: { firmId },
      include: {
        assignments: {
          include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } },
          orderBy: { assignedAt: "desc" }
        }
      },
      orderBy: { assetTag: "asc" }
    });
  }

  async createAsset(firmId: string, actorId: string, input: any) {
    if (input.branchId) {
      const branch = await this.prisma.client.branch.findFirst({ where: { id: input.branchId, firmId, active: true } });
      if (!branch) throw new BadRequestException("Branch is invalid or inactive");
    }
    const assetTag = input.assetTag ?? await this.numbering.next({
      firmId,
      branchId: input.branchId,
      entityType: "ASSET",
      year: new Date().getFullYear(),
      pattern: "KKA/AST/{year}/{seq:5}"
    });
    const asset = await this.prisma.client.asset.create({
      data: {
        firmId,
        branchId: input.branchId,
        assetTag,
        category: input.category,
        name: input.name,
        serialNumber: input.serialNumber,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        purchaseCost: input.purchaseCost,
        warrantyEndsAt: input.warrantyEndsAt ? new Date(input.warrantyEndsAt) : undefined,
        notes: input.notes
      },
      include: { assignments: true }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "assets.asset_created",
      entityType: "asset",
      entityId: asset.id,
      metadata: { assetTag, name: asset.name }
    });
    return asset;
  }

  async assignAsset(
    firmId: string,
    actorId: string,
    assetId: string,
    input: { userId: string; conditionOnIssue?: string }
  ) {
    const asset = await this.prisma.client.asset.findFirst({ where: { id: assetId, firmId } });
    if (!asset) throw new NotFoundException("Asset not found");
    if (["RETIRED", "LOST"].includes(asset.status)) throw new BadRequestException("This asset cannot be assigned in its current status");
    await this.assertFirmUsers(firmId, [input.userId]);
    const current = await this.prisma.client.assetAssignment.findFirst({ where: { assetId, returnedAt: null } });
    if (current) throw new BadRequestException("This asset is already assigned");

    try {
      return await this.prisma.client.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.create({
        data: { assetId, userId: input.userId, conditionOnIssue: input.conditionOnIssue }
      });
      const updated = await tx.asset.update({
        where: { id: assetId },
        data: { status: "ASSIGNED" },
        include: {
          assignments: { include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } }, orderBy: { assignedAt: "desc" } }
        }
      });
      await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: "assets.asset_assigned",
        entityType: "asset",
        entityId: assetId,
        metadata: { assignmentId: assignment.id, userId: input.userId }
      }, tx);
      return updated;
      });
    } catch (error: any) {
      if (error?.code === "P2002") throw new BadRequestException("This asset is already assigned");
      throw error;
    }
  }

  async returnAsset(
    firmId: string,
    actorId: string,
    assetId: string,
    input: { conditionOnReturn?: string }
  ) {
    const asset = await this.prisma.client.asset.findFirst({ where: { id: assetId, firmId } });
    if (!asset) throw new NotFoundException("Asset not found");
    const assignment = await this.prisma.client.assetAssignment.findFirst({
      where: { assetId, returnedAt: null },
      orderBy: { assignedAt: "desc" }
    });
    if (!assignment) throw new BadRequestException("This asset has no open assignment");

    return this.prisma.client.$transaction(async (tx) => {
      await tx.assetAssignment.update({
        where: { id: assignment.id },
        data: { returnedAt: new Date(), conditionOnReturn: input.conditionOnReturn }
      });
      const updated = await tx.asset.update({
        where: { id: assetId },
        data: { status: "IN_STOCK" },
        include: {
          assignments: { include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } }, orderBy: { assignedAt: "desc" } }
        }
      });
      await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: "assets.asset_returned",
        entityType: "asset",
        entityId: assetId,
        metadata: { assignmentId: assignment.id, userId: assignment.userId }
      }, tx);
      return updated;
    });
  }

  async recordAssetMaintenance(firmId: string, actorId: string, assetId: string, input: any) {
    const asset = await this.prisma.client.asset.findFirst({ where: { id: assetId, firmId } });
    if (!asset) throw new NotFoundException("Asset not found");
    if (input.vendorId) {
      const vendor = await this.prisma.client.vendor.findFirst({ where: { id: input.vendorId, firmId, active: true } });
      if (!vendor) throw new BadRequestException("Vendor is invalid or inactive");
    }
    const maintenance = await this.prisma.client.assetMaintenance.create({ data: { assetId, vendorId: input.vendorId, type: input.type, description: input.description, cost: input.cost, externalReference: input.externalReference, notes: input.notes, recordedById: actorId } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "assets.maintenance_recorded", entityType: "asset_maintenance", entityId: maintenance.id, metadata: { assetId, type: maintenance.type } });
    return { maintenance, auditRef: audit.id };
  }

  async completeAssetMaintenance(firmId: string, actorId: string, id: string, notes?: string) {
    const maintenance = await this.prisma.client.assetMaintenance.findFirst({ where: { id, asset: { firmId } } });
    if (!maintenance) throw new NotFoundException("Asset maintenance record not found");
    if (maintenance.status === "COMPLETED") return { maintenance, auditRef: maintenance.id };
    const updated = await this.prisma.client.assetMaintenance.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date(), notes: notes ?? maintenance.notes } });
    const audit = await this.audit.record({ firmId, actorUserId: actorId, action: "assets.maintenance_completed", entityType: "asset_maintenance", entityId: id, metadata: { assetId: updated.assetId } });
    return { maintenance: updated, auditRef: audit.id };
  }

  async updateAssetStatus(
    firmId: string,
    actorId: string,
    assetId: string,
    input: { status: "IN_STOCK" | "ASSIGNED" | "REPAIR" | "RETIRED" | "LOST"; notes?: string }
  ) {
    const asset = await this.prisma.client.asset.findFirst({ where: { id: assetId, firmId } });
    if (!asset) throw new NotFoundException("Asset not found");
    if (input.status === "ASSIGNED") throw new BadRequestException("Use the custody assignment workflow to assign an asset");
    const current = await this.prisma.client.assetAssignment.findFirst({ where: { assetId, returnedAt: null } });
    if (current) throw new BadRequestException("Return the current custody assignment before changing this asset's status");

    const updated = await this.prisma.client.asset.update({
      where: { id: assetId },
      data: { status: input.status, notes: input.notes ?? asset.notes },
      include: {
        assignments: { include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } }, orderBy: { assignedAt: "desc" } }
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "assets.status_changed",
      entityType: "asset",
      entityId: assetId,
      metadata: { from: asset.status, to: input.status, notes: input.notes ?? null }
    });
    return updated;
  }
}
