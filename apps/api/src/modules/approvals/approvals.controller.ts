import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { ApprovalsService } from "./approvals.service";

@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  @RequirePermissions('approval.view')
  list(@CurrentUser() user: RequestUser, @Query("status") status?: "PENDING" | "APPROVED" | "REJECTED") {
    return this.approvals.list(user.firmId, status ?? "PENDING");
  }

  @Post(":id/decision")
  @RequirePermissions('approval.decide')
  decide(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      decision: z.enum(["APPROVED", "REJECTED"]),
      comment: z.string().max(3000).optional()
    }).parse(body);
    return this.approvals.decide(user.firmId, user.id, user.roleKeys, id, input.decision, input.comment);
  }
}
