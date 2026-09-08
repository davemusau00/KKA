import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(firmId: string, filters: { matterId?: string; assignedToId?: string; status?: string }) {
    return this.prisma.client.task.findMany({
      where: {
        matter: filters.matterId ? { id: filters.matterId, firmId } : { firmId },
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
    if (input.matterId) {
      const matter = await this.prisma.client.matter.findFirst({ where: { id: input.matterId, firmId } });
      if (!matter) throw new BadRequestException("Matter not found");
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
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, matter: { firmId } },
      include: { dependencies: { include: { dependsOn: true } } }
    });
    if (!task) throw new NotFoundException("Task not found");

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
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, matter: { firmId } },
      include: { dependencies: true }
    });
    if (!task) throw new NotFoundException("Task not found");

    if (input.assignedToId) {
      const assignee = await this.prisma.client.user.findFirst({ where: { id: input.assignedToId, firmId, status: "ACTIVE" } });
      if (!assignee) throw new BadRequestException("Assigned user is not active in this firm");
    }

    const dependencyIds = input.dependencyIds as string[] | undefined;
    if (dependencyIds) {
      if (dependencyIds.includes(taskId)) throw new BadRequestException("A task cannot depend on itself");
      const dependencies = await this.prisma.client.task.findMany({ where: { id: { in: dependencyIds }, matter: { firmId } }, select: { id: true } });
      if (dependencies.length !== new Set(dependencyIds).size) throw new BadRequestException("One or more dependencies are invalid");
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
    const task = await this.prisma.client.task.findFirst({ where: { id: taskId, matter: { firmId } } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.status === "COMPLETED") throw new BadRequestException("Completed tasks must be reversed explicitly");
    const updated = await this.prisma.client.task.update({ where: { id: taskId }, data: { status: "CANCELLED", blockedReason: "Archived by user" } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "task.archived", entityType: "task", entityId: taskId, matterId: updated.matterId ?? undefined, metadata: {} });
    return updated;
  }
}
