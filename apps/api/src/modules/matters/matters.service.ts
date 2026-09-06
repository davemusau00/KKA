import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { NumberingService } from "../numbering/numbering.service";

@Injectable()
export class MattersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService
  ) {}

  list(
    firmId: string,
    filters: { q?: string; status?: string; branchId?: string; practiceArea?: string; stageOwnerId?: string }
  ) {
    return this.prisma.client.matter.findMany({
      where: {
        firmId,
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.branchId ? { responsibleBranchId: filters.branchId } : {}),
        ...(filters.practiceArea ? { practiceArea: filters.practiceArea } : {}),
        ...(filters.stageOwnerId ? { currentStageOwnerId: filters.stageOwnerId } : {}),
        ...(filters.q ? {
          OR: [
            { internalReference: { contains: filters.q, mode: "insensitive" } },
            { title: { contains: filters.q, mode: "insensitive" } },
            { client: { displayName: { contains: filters.q, mode: "insensitive" } } }
          ]
        } : {})
      },
      include: {
        client: { select: { id: true, displayName: true, phone: true } },
        responsibleBranch: { select: { id: true, name: true, code: true } },
        supervisor: { select: { id: true, fullName: true } },
        currentStageOwner: { select: { id: true, fullName: true } }
      },
      orderBy: [{ priority: "desc" }, { lastActivityAt: "desc" }],
      take: 500
    });
  }

  async get(firmId: string, id: string) {
    const matter = await this.prisma.client.matter.findFirst({
      where: { id, firmId },
      include: {
        client: true,
        originatingBranch: true,
        responsibleBranch: true,
        supervisor: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        currentStageOwner: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        assignments: true,
        parties: true,
        proceedings: true,
        stageInstances: { include: { stage: true, checklist: true }, orderBy: { enteredAt: "desc" } },
        handoffs: { include: { items: true }, orderBy: { createdAt: "desc" } }
      }
    });
    if (!matter) throw new NotFoundException("Matter not found");
    return matter;
  }

  async create(
    firmId: string,
    actorId: string,
    input: {
      clientId: string;
      legalEntityId?: string;
      title: string;
      practiceArea: string;
      practiceCode: string;
      matterType: string;
      workflowVersionId?: string;
      originatingBranchId: string;
      responsibleBranchId: string;
      supervisingUserId: string;
      currentStageOwnerId?: string;
      courtClerkId?: string;
      financeContactId?: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      summary?: string;
      nextAction?: string;
    }
  ) {
    const branch = await this.prisma.client.branch.findFirst({
      where: { id: input.originatingBranchId, firmId, active: true }
    });
    if (!branch) throw new BadRequestException("Originating branch is invalid");

    const internalReference = await this.numbering.next({
      firmId,
      branchId: input.originatingBranchId,
      entityType: "MATTER",
      year: new Date().getFullYear(),
      pattern: "{firm}/{practice}/{year}/{seq:5}",
      tokens: { practice: input.practiceCode.toUpperCase() }
    });

    const initialStage = input.workflowVersionId
      ? await this.prisma.client.workflowStage.findFirst({
          where: { workflowVersionId: input.workflowVersionId, stageNumber: 1 }
        })
      : null;

    const matter = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.matter.create({
        data: {
          firmId,
          legalEntityId: input.legalEntityId,
          clientId: input.clientId,
          internalReference,
          title: input.title,
          practiceArea: input.practiceArea,
          matterType: input.matterType,
          workflowVersionId: input.workflowVersionId,
          originatingBranchId: input.originatingBranchId,
          responsibleBranchId: input.responsibleBranchId,
          supervisingUserId: input.supervisingUserId,
          currentStageOwnerId: input.currentStageOwnerId ?? input.supervisingUserId,
          courtClerkId: input.courtClerkId,
          financeContactId: input.financeContactId,
          currentStageId: initialStage?.stageNumber ?? 1,
          priority: input.priority,
          summary: input.summary,
          nextAction: input.nextAction
        }
      });

      if (initialStage) {
        const stageInstance = await tx.matterStageInstance.create({
          data: {
            matterId: created.id,
            workflowStageId: initialStage.id,
            ownerUserId: input.currentStageOwnerId ?? input.supervisingUserId
          }
        });
        if (initialStage.checklistItems.length) {
          await tx.matterStageChecklistItem.createMany({
            data: initialStage.checklistItems.map((label, index) => ({
              stageInstanceId: stageInstance.id,
              key: `item_${index + 1}`,
              label
            }))
          });
        }
      }

      await tx.communicationChannel.create({
        data: {
          firmId,
          matterId: created.id,
          type: "MATTER",
          name: internalReference.replace(/\//g, "-"),
          description: input.title,
          private: true
        }
      });

      return created;
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "matter.created",
      entityType: "matter",
      entityId: matter.id,
      matterId: matter.id,
      clientId: input.clientId,
      metadata: { internalReference, practiceArea: input.practiceArea, matterType: input.matterType }
    });

    return this.get(firmId, matter.id);
  }

  async update(firmId: string, actorId: string, id: string, input: Record<string, unknown>) {
    const existing = await this.prisma.client.matter.findFirst({ where: { id, firmId } });
    if (!existing) throw new NotFoundException("Matter not found");

    const allowedKeys = [
      "title", "responsibleBranchId", "supervisingUserId", "currentStageOwnerId", "courtClerkId",
      "financeContactId", "priority", "status", "summary", "nextAction", "closureReason"
    ];
    const data = Object.fromEntries(Object.entries(input).filter(([key]) => allowedKeys.includes(key)));

    const matter = await this.prisma.client.matter.update({
      where: { id },
      data: { ...data, lastActivityAt: new Date() } as any
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "matter.updated",
      entityType: "matter",
      entityId: id,
      matterId: id,
      metadata: { changedKeys: Object.keys(data) }
    });
    return matter;
  }

  async validateTransition(firmId: string, matterId: string, toStageNumber: number) {
    const matter = await this.prisma.client.matter.findFirst({
      where: { id: matterId, firmId },
      include: {
        workflowVersion: {
          include: { stages: true }
        },
        tasks: true,
        documents: true,
        stageInstances: {
          include: { checklist: true, stage: true },
          orderBy: { enteredAt: "desc" },
          take: 1
        }
      }
    });
    if (!matter) throw new NotFoundException("Matter not found");
    const workflow = matter.workflowVersion;
    if (!workflow) {
      return {
        canAdvance: true,
        warnings: ["Matter has no workflow version. Transition rules cannot be evaluated."],
        blockers: []
      };
    }

    const currentStage = workflow.stages.find((stage) => stage.stageNumber === matter.currentStageId);
    const targetStage = workflow.stages.find((stage) => stage.stageNumber === toStageNumber);
    if (!targetStage) throw new BadRequestException("Target stage does not exist in this workflow version");

    const blockers: Array<{ type: string; message: string; ids?: string[] }> = [];
    const warnings: string[] = [];

    if (currentStage?.allowedNextStageCodes.length &&
        !currentStage.allowedNextStageCodes.includes(targetStage.code)) {
      blockers.push({ type: "transition", message: `Transition ${currentStage.code} -> ${targetStage.code} is not allowed` });
    }

    const incompleteTasks = matter.tasks.filter(
      (task) => task.stageNumber === matter.currentStageId &&
                task.status !== "COMPLETED" &&
                task.status !== "CANCELLED"
    );
    if (incompleteTasks.length) {
      blockers.push({
        type: "tasks",
        message: `${incompleteTasks.length} current-stage tasks are incomplete`,
        ids: incompleteTasks.map((task) => task.id)
      });
    }

    const missingDocs = (currentStage?.requiredDocumentTypes ?? []).filter(
      (requiredType) => !matter.documents.some((document) =>
        document.documentType.toLowerCase() === requiredType.toLowerCase()
      )
    );
    if (missingDocs.length) {
      blockers.push({ type: "documents", message: `Missing required documents: ${missingDocs.join(", ")}` });
    }

    const currentInstance = matter.stageInstances[0];
    const incompleteChecklist = currentInstance?.checklist.filter((item) => !item.completed) ?? [];
    if (incompleteChecklist.length) {
      blockers.push({
        type: "checklist",
        message: `${incompleteChecklist.length} stage checklist items are incomplete`,
        ids: incompleteChecklist.map((item) => item.id)
      });
    }

    if (currentStage?.requiresApproval) {
      const approval = await this.prisma.client.approvalRequest.findFirst({
        where: {
          firmId,
          type: "STAGE_GATE",
          entityType: "Matter",
          entityId: matterId,
          status: "APPROVED"
        },
        orderBy: { resolvedAt: "desc" }
      });
      if (!approval) blockers.push({ type: "approval", message: "Required stage-gate approval has not been granted" });
    }

    return {
      canAdvance: blockers.length === 0,
      blockers,
      warnings,
      currentStage: currentStage ? { stageNumber: currentStage.stageNumber, code: currentStage.code, name: currentStage.name } : null,
      targetStage: { stageNumber: targetStage.stageNumber, code: targetStage.code, name: targetStage.name }
    };
  }

  async transition(
    firmId: string,
    actorId: string,
    matterId: string,
    input: {
      toStageNumber: number;
      newOwnerUserId: string;
      handoffNotes: string;
      criticalNextAction?: string;
      checklistItems?: Array<{ key: string; label: string; completed: boolean }>;
      override: boolean;
      overrideReason?: string;
    }
  ) {
    const validation = await this.validateTransition(firmId, matterId, input.toStageNumber);
    if (!validation.canAdvance && !input.override) {
      throw new BadRequestException({ message: "Stage transition blocked", ...validation });
    }
    if (!validation.canAdvance && input.override && !input.overrideReason?.trim()) {
      throw new BadRequestException("An override reason is required");
    }

    const matter = await this.prisma.client.matter.findFirst({
      where: { id: matterId, firmId },
      include: { workflowVersion: { include: { stages: true } } }
    });
    if (!matter) throw new NotFoundException("Matter not found");
    const targetStage = matter.workflowVersion?.stages.find((stage) => stage.stageNumber === input.toStageNumber);
    if (!targetStage) throw new BadRequestException("Target workflow stage not found");

    const result = await this.prisma.client.$transaction(async (tx) => {
      const currentInstance = await tx.matterStageInstance.findFirst({
        where: { matterId, completedAt: null },
        orderBy: { enteredAt: "desc" }
      });
      if (currentInstance) {
        await tx.matterStageInstance.update({
          where: { id: currentInstance.id },
          data: {
            completedAt: new Date(),
            completionNote: input.handoffNotes,
            overrideReason: input.override ? input.overrideReason : undefined
          }
        });
      }

      const handoff = await tx.stageHandoff.create({
        data: {
          matterId,
          fromStageNumber: matter.currentStageId,
          toStageNumber: input.toStageNumber,
          fromUserId: actorId,
          toUserId: input.newOwnerUserId,
          handoffNotes: input.handoffNotes,
          criticalNextAction: input.criticalNextAction,
          items: input.checklistItems?.length ? {
            create: input.checklistItems.map((item) => ({ text: item.label, completed: item.completed }))
          } : undefined
        },
        include: { items: true }
      });

      const newInstance = await tx.matterStageInstance.create({
        data: {
          matterId,
          workflowStageId: targetStage.id,
          ownerUserId: input.newOwnerUserId
        }
      });

      if (targetStage.checklistItems.length) {
        await tx.matterStageChecklistItem.createMany({
          data: targetStage.checklistItems.map((label, index) => ({
            stageInstanceId: newInstance.id,
            key: `item_${index + 1}`,
            label
          }))
        });
      }

      const autoTasks = Array.isArray(targetStage.autoCreateTasks) ? targetStage.autoCreateTasks as any[] : [];
      for (const taskDef of autoTasks) {
        await tx.task.create({
          data: {
            matterId,
            stageNumber: input.toStageNumber,
            title: String(taskDef.title),
            assignedToId: input.newOwnerUserId,
            createdById: actorId,
            priority: (taskDef.priority ?? "MEDIUM") as any,
            dueAt: new Date(Date.now() + Number(taskDef.dueInDays ?? 3) * 86400_000)
          }
        });
      }

      await tx.matter.update({
        where: { id: matterId },
        data: {
          currentStageId: input.toStageNumber,
          currentStageOwnerId: input.newOwnerUserId,
          nextAction: input.criticalNextAction ?? targetStage.name,
          lastActivityAt: new Date()
        }
      });

      return { handoff, stageInstanceId: newInstance.id };
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: input.override ? "matter.stage_transition_overridden" : "matter.stage_transitioned",
      entityType: "matter",
      entityId: matterId,
      matterId,
      metadata: {
        fromStage: matter.currentStageId,
        toStage: input.toStageNumber,
        newOwnerUserId: input.newOwnerUserId,
        handoffId: result.handoff.id,
        overrideReason: input.overrideReason
      }
    });

    return this.get(firmId, matterId);
  }

  async acknowledgeHandoff(firmId: string, userId: string, handoffId: string) {
    const handoff = await this.prisma.client.stageHandoff.findFirst({
      where: { id: handoffId, matter: { firmId } }
    });
    if (!handoff) throw new NotFoundException("Handoff not found");
    if (handoff.toUserId !== userId) throw new ForbiddenException("Only the handoff recipient can acknowledge it");
    if (handoff.acknowledgedAt) return handoff;

    const updated = await this.prisma.client.stageHandoff.update({
      where: { id: handoffId },
      data: { acknowledgedAt: new Date(), acknowledgedByUserId: userId }
    });
    await this.audit.record({
      firmId,
      actorUserId: userId,
      action: "handoff.acknowledged",
      entityType: "handoff",
      entityId: handoffId,
      matterId: handoff.matterId,
      metadata: {}
    });
    return updated;
  }

  timeline(firmId: string, matterId: string) {
    return this.prisma.client.auditEvent.findMany({
      where: { firmId, matterId },
      orderBy: { occurredAt: "desc" },
      take: 1000
    });
  }
}
