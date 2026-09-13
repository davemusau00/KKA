import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IntegrationConnectionSchema } from "@kka/contracts";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { IntegrationsService } from "./integrations.service";
import { FeatureFlag } from "../../platform/features/feature-flags.decorator";

@Controller("integrations")
@FeatureFlag("module.integrations")
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @RequirePermissions("module.integrations")
  list(@CurrentUser() user: RequestUser) {
    return this.integrations.list(user.firmId);
  }

  @Post()
  @RequirePermissions("admin.settings_manage")
  upsert(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.integrations.createOrUpdate(user.firmId, user.id, IntegrationConnectionSchema.parse(body));
  }

  @Post(":id/test")
  @RequirePermissions("admin.settings_manage")
  test(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.integrations.test(user.firmId, user.id, id);
  }
}
