import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import { roleContext } from "../../platform/auth/role-context";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: RecordAccessService
  ) {}

  private async actor(firmId: string, actorId: string): Promise<RequestUser> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: actorId, firmId, status: "ACTIVE" },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!user) throw new NotFoundException("Task actor not found");
    return {
      id: user.id, firmId: user.firmId, email: user.email, fullName: user.fullName,
      homeBranchId: user.homeBranchId, ...roleContext(user.firmId, user.roles)
    };
  }

  private async assertMatterAccess(user: RequestUser, matterId?: string | null) {
    if (matterId && !(await this.access.canViewMatter(user, matterId))) {
      throw new NotFoundException("Task not found");
    }
  }

  private firmTaskWhere(firmId: string) {
    return {
      OR: [
        { matter: { firmId } },
        { matterId: null, createdBy: { firmId } }
      ]
    };
  }

  async list(firmId: string, filters: { matterId?: string; assignedToId?: string; status?: string }, user: RequestUser) {
    const matterScope = await this.access.matterWhere(user);
    return this.prisma.client.task.findMany({
      where: {
        matter: filters.matterId ? { id: filters.matterId, ...matterScope } : matterScope,
        ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
        ...(filters.status ? { status: filters.status as any } : {})
      },
      include: {
        matter: { select: { id: true, internalReference: true, title: true } },
        assignedTo: { select: { id: true, fullName: true } },
        dependencies: { include: { dependsOn: { select: { id: true, title: true, status: true } } } }
      },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }]
    });
  }

  async create(firmId: string, actorId: string, input: any) {
    const actor = await this.actor(firmId, actorId);
    if (input.matterId) {
      await this.assertMatterAccess(actor, input.matterId);
    }
    const assignee = await this.prisma.client.user.findFirst({ where: { id: input.assignedToId, firmId, status: "ACTIVE" }, select: { id: true } });
    if (!assignee) throw new BadRequestException("Assigned user is not active in this firm");
    if (input.dependencyIds?.length) {
      const dependencies = await this.prisma.client.task.findMany({
        where: input.matterId
          ? { id: { in: input.dependencyIds }, matterId: input.matterId, matter: await this.access.matterWhere(actor) }
          : { id: { in: input.dependencyIds }, matterId: null, createdBy: { firmId } },
        select: { id: true }
      });
      if (dependencies.length !== new Set(input.dependencyIds).size) {
        throw new BadRequestException("One or more dependencies are inaccessible or belong to a different matter");
      }
    }
    const task = await this.prisma.client.task.create({
      data: {
        matterId: input.matterId,
        stageNumber: input.stageNumber,
        title: input.title,
        description: input.description,
        assignedToId: input.assignedToId,
        createdById: actorId,
        reviewerId: input.reviewerId,
        priority: input.priority,
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        dueAt: new Date(input.dueAt),
        officialDeadlineAt: input.officialDeadlineAt ? new Date(input.officialDeadlineAt) : undefined,
        dependencies: input.dependencyIds?.length ? {
          create: input.dependencyIds.map((dependsOnId: string) => ({ dependsOnId }))
        } : undefined
      },
      include: { dependencies: true }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "task.created",
      entityType: "task", entityId: task.id, matterId: task.matterId ?? undefined,
      metadata: { title: task.title, assignedToId: task.assignedToId }
    });
    return task;
  }

  async setStatus(firmId: string, actorId: string, taskId: string, input: any) {
    const actor = await this.actor(firmId, actorId);
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, ...this.firmTaskWhere(firmId) },
      include: { dependencies: { include: { dependsOn: true } } }
    });
    if (!task) throw new NotFoundException("Task not found");
    await this.assertMatterAccess(actor, task.matterId);

    if (input.status === "COMPLETED" && !input.force) {
      const incomplete = task.dependencies.filter(
        (dep) => dep.dependsOn.status !== "COMPLETED" && dep.dependsOn.status !== "CANCELLED"
      );
      if (incomplete.length) {
        throw new BadRequestException({
          message: "Task is blocked by incomplete dependencies",
          dependencies: incomplete.map((dep) => ({ id: dep.dependsOn.id, title: dep.dependsOn.title, status: dep.dependsOn.status }))
        });
      }
    }
    if (input.force && !input.forceReason?.trim()) throw new BadRequestException("forceReason is required");

    const updated = await this.prisma.client.task.update({
      where: { id: taskId },
      data: {
        status: input.status,
        blockedReason: input.blockedReason,
        completedAt: input.status === "COMPLETED" ? new Date() : null
      }
    });
    if (updated.matterId) {
      await this.prisma.client.matter.update({
        where: { id: updated.matterId },
        data: { lastActivityAt: new Date() }
      });
    }
    await this.audit.record({
      firmId, actorUserId: actorId,
      action: input.force ? "task.status_forced" : "task.status_changed",
      entityType: "task", entityId: taskId, matterId: updated.matterId ?? undefined,
      metadata: { from: task.status, to: input.status, forceReason: input.forceReason }
    });
    return updated;
  }

  async update(firmId: string, actorId: string, taskId: string, input: any) {
    const actor = await this.actor(firmId, actorId);
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, ...this.firmTaskWhere(firmId) },
      include: { dependencies: true }
    });
    if (!task) throw new NotFoundException("Task not found");
    await this.assertMatterAccess(actor, task.matterId);

    if (input.assignedToId) {
      const assignee = await this.prisma.client.user.findFirst({ where: { id: input.assignedToId, firmId, status: "ACTIVE" } });
      if (!assignee) throw new BadRequestException("Assigned user is not active in this firm");
    }

    const dependencyIds = input.dependencyIds as string[] | undefined;
    if (dependencyIds) {
      if (dependencyIds.includes(taskId)) throw new BadRequestException("A task cannot depend on itself");
      const dependencies = await this.prisma.client.task.findMany({
        where: task.matterId
          ? { id: { in: dependencyIds }, matterId: task.matterId, matter: await this.access.matterWhere(actor) }
          : { id: { in: dependencyIds }, matterId: null, createdBy: { firmId } },
        select: { id: true }
      });
      if (dependencies.length !== new Set(dependencyIds).size) throw new BadRequestException("One or more dependencies are inaccessible or belong to a different matter");
    }

    const { dependencyIds: nextDependencyIds, ...fields } = input;
    const updated = await this.prisma.client.$transaction(async (tx) => {
      if (nextDependencyIds) {
        await tx.taskDependency.deleteMany({ where: { taskId } });
        if (nextDependencyIds.length) await tx.taskDependency.createMany({ data: nextDependencyIds.map((dependsOnId: string) => ({ taskId, dependsOnId })) });
      }
      return tx.task.update({
        where: { id: taskId },
        data: {
          ...fields,
          ...(fields.startAt !== undefined ? { startAt: fields.startAt ? new Date(fields.startAt) : null } : {}),
          ...(fields.dueAt ? { dueAt: new Date(fields.dueAt) } : {}),
          ...(fields.officialDeadlineAt !== undefined ? { officialDeadlineAt: fields.officialDeadlineAt ? new Date(fields.officialDeadlineAt) : null } : {})
        } as any,
        include: { dependencies: true }
      });
    });

    await this.audit.record({ firmId, actorUserId: actorId, action: "task.updated", entityType: "task", entityId: taskId, matterId: updated.matterId ?? undefined, metadata: { changedKeys: Object.keys(input) } });
    return updated;
  }

  async archive(firmId: string, actorId: string, taskId: string) {
    const actor = await this.actor(firmId, actorId);
    const task = await this.prisma.client.task.findFirst({ where: { id: taskId, ...this.firmTaskWhere(firmId) } });
    if (!task) throw new NotFoundException("Task not found");
    await this.assertMatterAccess(actor, task.matterId);
    if (task.status === "COMPLETED") throw new BadRequestException("Completed tasks must be reversed explicitly");
    const updated = await this.prisma.client.task.update({ where: { id: taskId }, data: { status: "CANCELLED", blockedReason: "Archived by user" } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "task.archived", entityType: "task", entityId: taskId, matterId: updated.matterId ?? undefined, metadata: {} });
    return updated;
  }
}
