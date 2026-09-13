import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import type { RequestUser } from "../../platform/auth/auth.types";
import { NumberingService } from "../numbering/numbering.service";
import { TasksService } from "../tasks/tasks.service";

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly tasks: TasksService
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

  listProjects(firmId: string) {
    return this.prisma.client.internalProject.findMany({
      where: { firmId },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
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

  listPurchaseRequisitions(firmId: string) {
    return this.prisma.client.purchaseRequisition.findMany({
      where: { firmId },
      include: { vendor: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createPurchaseRequisition(firmId: string, actorId: string, input: any) {
    const branch = await this.prisma.client.branch.findFirst({ where: { id: input.branchId, firmId, active: true } });
    if (!branch) throw new BadRequestException("Branch is invalid or inactive");
    if (input.vendorId) {
      const vendor = await this.prisma.client.vendor.findFirst({ where: { id: input.vendorId, firmId, active: true } });
      if (!vendor) throw new BadRequestException("Vendor is invalid or inactive");
    }

    const requisitionNo = await this.numbering.next({
      firmId,
      branchId: input.branchId,
      entityType: "PURCHASE_REQUISITION",
      year: new Date().getFullYear(),
      pattern: "KKA/PR/{year}/{seq:5}"
    });

    return this.prisma.client.$transaction(async (tx) => {
      const requisition = await tx.purchaseRequisition.create({
        data: {
          firmId,
          branchId: input.branchId,
          vendorId: input.vendorId,
          requisitionNo,
          requestedById: actorId,
          description: input.description,
          amount: input.amount,
          status: "SUBMITTED"
        },
        include: { vendor: true }
      });
      await tx.approvalRequest.create({
        data: {
          firmId,
          type: "PURCHASE_REQUISITION",
          entityType: "PurchaseRequisition",
          entityId: requisition.id,
          requestedById: actorId,
          requiredRoleKeys: ["administrator", "managing_partner"],
          assignedUserIds: [],
          payload: { requisitionNo, amount: input.amount }
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

    return this.prisma.client.$transaction(async (tx) => {
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
  }

  async receivePurchaseOrder(
    firmId: string,
    actorId: string,
    id: string,
    input: { receivedAt?: string; partial: boolean }
  ) {
    const order = await this.prisma.client.purchaseOrder.findFirst({ where: { id, firmId } });
    if (!order) throw new NotFoundException("Purchase order not found");
    if (order.status === "RECEIVED" && !input.partial) return order;
    if (!["ORDERED", "PARTIALLY_RECEIVED"].includes(order.status)) {
      throw new BadRequestException("This purchase order is not awaiting receipt");
    }

    const nextStatus = input.partial ? "PARTIALLY_RECEIVED" : "RECEIVED";
    const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
    return this.prisma.client.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: nextStatus, receivedAt },
        include: { vendor: true }
      });
      if (order.requisitionId) {
        await tx.purchaseRequisition.update({ where: { id: order.requisitionId }, data: { status: nextStatus } });
      }
      await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: input.partial ? "procurement.purchase_order_partially_received" : "procurement.purchase_order_received",
        entityType: "purchase_order",
        entityId: id,
        metadata: { orderNo: order.orderNo, receivedAt: receivedAt.toISOString() }
      }, tx);
      return updated;
    });
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

    return this.prisma.client.$transaction(async (tx) => {
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
    if (current && input.status === "IN_STOCK") throw new BadRequestException("Return the current custody assignment before marking the asset in stock");

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
