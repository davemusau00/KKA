import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ConvertIntakeSchema, CreateIntakeSchema, IntakePartySchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { IntakeService } from "./intake.service";

@Controller("intake")
export class IntakeController {
  constructor(private readonly intake: IntakeService) {}

  @Get()
  @RequirePermissions("module.clients")
  list(@CurrentUser() user: RequestUser, @Query("disposition") disposition?: string) {
    return this.intake.list(user.firmId, disposition);
  }

  @Get(":id")
  @RequirePermissions("module.clients")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.intake.get(user.firmId, id);
  }

  @Post()
  @RequirePermissions("matter.create")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.intake.create(user.firmId, user.id, CreateIntakeSchema.parse(body));
  }

  @Post(":id/parties")
  @RequirePermissions("matter.create")
  addParty(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.intake.addParty(user.firmId, user.id, id, IntakePartySchema.parse(body));
  }

  @Patch(":id")
  @RequirePermissions("matter.create")
  update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.intake.update(user.firmId, user.id, id, CreateIntakeSchema.partial().parse(body));
  }

  @Post(":id/conflict-search")
  @RequirePermissions("matter.create")
  conflict(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.intake.runConflictSearch(user.firmId, user.id, id);
  }

  @Post(":id/conflict-clearance")
  @RequirePermissions("matter.settlement_approve")
  clearance(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ notes: z.string().max(3000).optional() }).parse(body);
    return this.intake.clearConflict(user.firmId, user.id, id, input.notes);
  }

  @Post(":id/kyc")
  @RequirePermissions("matter.create")
  kyc(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.intake.upsertKyc(user.firmId, user.id, id, body);
  }

  @Post(":id/convert")
  @RequirePermissions("matter.create")
  convert(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.intake.convert(user.firmId, user.id, id, ConvertIntakeSchema.parse(body));
  }
}
