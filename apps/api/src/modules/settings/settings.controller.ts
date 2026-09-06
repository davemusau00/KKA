import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { SettingWriteSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("definitions")
  @RequirePermissions("admin.settings_manage")
  definitions() {
    return this.settings.definitions();
  }

  @Post("resolve/:key")
  resolve(
    @Param("key") key: string,
    @CurrentUser() user: RequestUser,
    @Body() body: unknown
  ) {
    const context = z.object({
      legalEntityId: z.string().optional(),
      branchId: z.string().optional(),
      departmentId: z.string().optional(),
      practiceAreaId: z.string().optional(),
      matterTypeId: z.string().optional(),
      workflowTemplateId: z.string().optional(),
      roleIds: z.array(z.string()).optional(),
      teamId: z.string().optional(),
      userId: z.string().optional(),
      clientId: z.string().optional(),
      matterId: z.string().optional(),
      documentTemplateId: z.string().optional(),
      integrationConnectionId: z.string().optional(),
      portalProfileId: z.string().optional()
    }).parse(body);
    return this.settings.resolve(key, { firmId: user.firmId, ...context });
  }

  @Post(":key")
  @RequirePermissions("admin.settings_manage")
  write(
    @Param("key") key: string,
    @CurrentUser() user: RequestUser,
    @Body() body: unknown
  ) {
    return this.settings.write(user.firmId, user.id, key, SettingWriteSchema.parse(body) as any);
  }

  @Get(":key/history")
  @RequirePermissions("admin.settings_manage")
  history(
    @Param("key") key: string,
    @Query("scopeType") scopeType?: any,
    @Query("scopeId") scopeId?: string
  ) {
    return this.settings.history(key, scopeType, scopeId);
  }
}
