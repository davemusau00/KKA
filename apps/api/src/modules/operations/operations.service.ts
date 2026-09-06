import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
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

  listProjects(firmId: string) {
    return this.prisma.client.internalProject.findMany({
      where: { firmId },
      include: { members: true },
      orderBy: { updatedAt: "desc" }
    });
  }

  async createProject(firmId: string, actorId: string, input: any) {
    const project = await this.prisma.client.internalProject.create({
      data: {
        firmId,
        branchId: input.branchId,
        name: input.name,
        description: input.description,
        ownerUserId: input.ownerUserId ?? actorId,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        budget: input.budget,
        members: input.memberUserIds?.length ? {
          create: input.memberUserIds.map((userId: string) => ({ userId }))
        } : undefined
      },
      include: { members: true }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "operations.project_created",
      entityType: "internal_project", entityId: project.id, metadata: { name: project.name }
    });
    return project;
  }

  async createMeeting(firmId: string, actorId: string, input: any) {
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
          create: input.participantUserIds.map((userId: string) => ({ userId }))
        } : undefined
      },
      include: { participants: true }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "meeting.created",
      entityType: "meeting", entityId: meeting.id, matterId: meeting.matterId ?? undefined,
      metadata: { title: meeting.title }
    });
    return meeting;
  }

  async addMeetingAction(
    firmId: string,
    actorId: string,
    meetingId: string,
    input: { text: string; assigneeId?: string; dueAt?: string; createTask?: boolean }
  ) {
    const meeting = await this.prisma.client.meeting.findFirst({ where: { id: meetingId, firmId } });
    if (!meeting) throw new NotFoundException("Meeting not found");
    let taskId: string | undefined;
    if (input.createTask && input.assigneeId && input.dueAt) {
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
    return this.prisma.client.meetingAction.create({
      data: {
        meetingId,
        taskId,
        text: input.text,
        assigneeId: input.assigneeId,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined
      }
    });
  }

  vendors(firmId: string) {
    return this.prisma.client.vendor.findMany({ where: { firmId }, orderBy: { name: "asc" } });
  }

  createVendor(firmId: string, input: any) {
    return this.prisma.client.vendor.create({ data: { firmId, ...input } });
  }

  async createPurchaseRequisition(firmId: string, actorId: string, input: any) {
    const requisitionNo = await this.numbering.next({
      firmId,
      branchId: input.branchId,
      entityType: "PURCHASE_REQUISITION",
      year: new Date().getFullYear(),
      pattern: "KKA/PR/{year}/{seq:5}"
    });
    const requisition = await this.prisma.client.purchaseRequisition.create({
      data: {
        firmId,
        branchId: input.branchId,
        vendorId: input.vendorId,
        requisitionNo,
        requestedById: actorId,
        description: input.description,
        amount: input.amount,
        status: "SUBMITTED"
      }
    });
    await this.prisma.client.approvalRequest.create({
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
    return requisition;
  }

  assets(firmId: string) {
    return this.prisma.client.asset.findMany({
      where: { firmId },
      include: { assignments: true },
      orderBy: { assetTag: "asc" }
    });
  }

  async createAsset(firmId: string, input: any) {
    const assetTag = input.assetTag ?? await this.numbering.next({
      firmId,
      branchId: input.branchId,
      entityType: "ASSET",
      year: new Date().getFullYear(),
      pattern: "KKA/AST/{year}/{seq:5}"
    });
    return this.prisma.client.asset.create({
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
      }
    });
  }

  async requestLeave(firmId: string, actorId: string, input: any) {
    const user = await this.prisma.client.user.findFirst({ where: { id: actorId, firmId } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.client.leaveRequest.create({
      data: {
        userId: actorId,
        type: input.type,
        startsOn: new Date(input.startsOn),
        endsOn: new Date(input.endsOn),
        days: input.days,
        reason: input.reason,
        status: "SUBMITTED"
      }
    });
  }
}
