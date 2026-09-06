import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { WorkflowsService } from "./workflows.service";

const StageSchema = z.object({
  stageNumber: z.number().int().positive().optional(),
  code: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(3000).optional(),
  targetDurationDays: z.number().int().nonnegative().default(0),
  responsibleRoleKeys: z.array(z.string()).default([]),
  assignmentStrategy: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  approvalRoleKey: z.string().optional(),
  allowedNextStageCodes: z.array(z.string()).default([]),
  requiredTaskTitles: z.array(z.string()).default([]),
  requiredDocumentTypes: z.array(z.string()).default([]),
  checklistItems: z.array(z.string()).default([]),
  autoCreateTasks: z.array(z.record(z.string(), z.unknown())).default([]),
  notificationRules: z.array(z.record(z.string(), z.unknown())).default([])
});

@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.workflows.list(user.firmId);
  }

  @Post()
  @RequirePermissions("admin.workflows_manage")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      name: z.string().min(2),
      practiceArea: z.string().min(2),
      matterType: z.string().min(2),
      description: z.string().optional()
    }).parse(body);
    return this.workflows.createTemplate(user.firmId, user.id, input);
  }

  @Post(":templateId/versions")
  @RequirePermissions("admin.workflows_manage")
  version(
    @CurrentUser() user: RequestUser,
    @Param("templateId") templateId: string,
    @Body() body: unknown
  ) {
    const input = z.object({ stages: z.array(StageSchema).min(1) }).parse(body);
    return this.workflows.createVersion(user.firmId, user.id, templateId, input.stages);
  }

  @Post("versions/:versionId/publish")
  @RequirePermissions("admin.workflows_manage")
  publish(
    @CurrentUser() user: RequestUser,
    @Param("versionId") versionId: string,
    @Body() body: unknown
  ) {
    const input = z.object({ effectiveFrom: z.string().datetime().optional() }).parse(body);
    return this.workflows.publish(user.firmId, user.id, versionId, input.effectiveFrom ? new Date(input.effectiveFrom) : undefined);
  }
}
