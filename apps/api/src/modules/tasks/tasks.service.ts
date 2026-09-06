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
}
