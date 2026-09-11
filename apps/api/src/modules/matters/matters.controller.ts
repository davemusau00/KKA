import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateMatterSchema, StageTransitionSchema } from "@kka/contracts";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { MattersService } from "./matters.service";

@Controller("matters")
export class MattersController {
  constructor(private readonly matters: MattersService) {}

  @Get()
  @RequirePermissions("module.matters")
  list(
    @CurrentUser() user: RequestUser,
    @Query("q") q?: string,
    @Query("status") status?: string,
    @Query("branchId") branchId?: string,
    @Query("practiceArea") practiceArea?: string,
    @Query("stageOwnerId") stageOwnerId?: string
  ) {
    return this.matters.list(user.firmId, { q, status, branchId, practiceArea, stageOwnerId }, user);
  }

  @Get(":id")
  @RequirePermissions("matter.view")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.matters.get(user.firmId, id, user);
  }

  @Post()
  @RequirePermissions("matter.create")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.matters.create(user.firmId, user.id, CreateMatterSchema.parse(body));
  }

  @Patch(":id")
  @RequirePermissions("matter.edit")
  update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.matters.update(user.firmId, user.id, id, body);
  }

  @Get(":id/stage-validation/:toStage")
  @RequirePermissions("matter.stage_advance")
  validate(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Param("toStage") toStage: string
  ) {
    return this.matters.validateTransition(user.firmId, id, Number(toStage));
  }

  @Post(":id/stage-transitions")
  @RequirePermissions("matter.stage_advance")
  transition(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.matters.transition(user.firmId, user.id, id, StageTransitionSchema.parse(body));
  }

  @Post("handoffs/:handoffId/acknowledge")
  @RequirePermissions("matter.view")
  acknowledge(@CurrentUser() user: RequestUser, @Param("handoffId") handoffId: string) {
    return this.matters.acknowledgeHandoff(user.firmId, user.id, handoffId);
  }

  @Get(":id/timeline")
  @RequirePermissions("matter.view")
  timeline(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.matters.timeline(user.firmId, id, user);
  }
}
