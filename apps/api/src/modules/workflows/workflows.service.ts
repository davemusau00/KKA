import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(firmId: string) {
    return this.prisma.client.workflowTemplate.findMany({
      where: { firmId },
      include: {
        versions: {
          include: { stages: { orderBy: { stageNumber: "asc" } } },
          orderBy: { version: "desc" }
        }
      },
      orderBy: [{ practiceArea: "asc" }, { name: "asc" }]
    });
  }

  async createTemplate(
    firmId: string,
    actorId: string,
    input: { name: string; practiceArea: string; matterType: string; description?: string }
  ) {
    const template = await this.prisma.client.workflowTemplate.create({
      data: { firmId, ...input }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "workflow.template_created",
      entityType: "workflow_template", entityId: template.id, metadata: input
    });
    return template;
  }

  async createVersion(
    firmId: string,
    actorId: string,
    templateId: string,
    stages: Array<Record<string, any>>
  ) {
    const template = await this.prisma.client.workflowTemplate.findFirst({ where: { id: templateId, firmId } });
    if (!template) throw new NotFoundException("Workflow template not found");
    const latest = await this.prisma.client.workflowVersion.findFirst({
      where: { templateId },
      orderBy: { version: "desc" }
    });
    const versionNo = (latest?.version ?? 0) + 1;

    const version = await this.prisma.client.workflowVersion.create({
      data: {
        templateId,
        version: versionNo,
        status: "DRAFT",
        stages: {
          create: stages.map((stage, index) => ({
            stageNumber: Number(stage.stageNumber ?? index + 1),
            code: String(stage.code ?? `STAGE_${index + 1}`),
            name: String(stage.name),
            description: stage.description ? String(stage.description) : undefined,
            targetDurationDays: Number(stage.targetDurationDays ?? 0),
            responsibleRoleKeys: Array.isArray(stage.responsibleRoleKeys) ? stage.responsibleRoleKeys.map(String) : [],
            assignmentStrategy: stage.assignmentStrategy ? String(stage.assignmentStrategy) : undefined,
            requiresApproval: Boolean(stage.requiresApproval ?? false),
            approvalRoleKey: stage.approvalRoleKey ? String(stage.approvalRoleKey) : undefined,
            allowedNextStageCodes: Array.isArray(stage.allowedNextStageCodes) ? stage.allowedNextStageCodes.map(String) : [],
            requiredTaskTitles: Array.isArray(stage.requiredTaskTitles) ? stage.requiredTaskTitles.map(String) : [],
            requiredDocumentTypes: Array.isArray(stage.requiredDocumentTypes) ? stage.requiredDocumentTypes.map(String) : [],
            checklistItems: Array.isArray(stage.checklistItems) ? stage.checklistItems.map(String) : [],
            autoCreateTasks: stage.autoCreateTasks ?? [],
            notificationRules: stage.notificationRules ?? []
          }))
        }
      },
      include: { stages: { orderBy: { stageNumber: "asc" } } }
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "workflow.version_created",
      entityType: "workflow_version", entityId: version.id, metadata: { templateId, version: versionNo }
    });
    return version;
  }

  async publish(firmId: string, actorId: string, versionId: string, effectiveFrom?: Date) {
    const version = await this.prisma.client.workflowVersion.findFirst({
      where: { id: versionId, template: { firmId } },
      include: { stages: true }
    });
    if (!version) throw new NotFoundException("Workflow version not found");
    if (!version.stages.length) throw new BadRequestException("Cannot publish workflow with no stages");

    const duplicateStageNumbers = new Set<number>();
    const seen = new Set<number>();
    for (const stage of version.stages) {
      if (seen.has(stage.stageNumber)) duplicateStageNumbers.add(stage.stageNumber);
      seen.add(stage.stageNumber);
    }
    if (duplicateStageNumbers.size) throw new BadRequestException("Workflow contains duplicate stage numbers");

    await this.prisma.client.$transaction(async (tx) => {
      await tx.workflowVersion.updateMany({
        where: { templateId: version.templateId, status: "PUBLISHED" },
        data: { status: "RETIRED", effectiveTo: effectiveFrom ?? new Date() }
      });
      await tx.workflowVersion.update({
        where: { id: versionId },
        data: {
          status: "PUBLISHED",
          effectiveFrom: effectiveFrom ?? new Date(),
          publishedAt: new Date(),
          publishedById: actorId
        }
      });
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "workflow.version_published",
      entityType: "workflow_version", entityId: versionId,
      metadata: { templateId: version.templateId, version: version.version }
    });

    return this.prisma.client.workflowVersion.findUnique({
      where: { id: versionId },
      include: { stages: { orderBy: { stageNumber: "asc" } } }
    });
  }
}
