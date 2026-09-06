import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateMeetingSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { OperationsService } from "./operations.service";

@Controller("operations")
export class OperationsController {
  constructor(private readonly ops: OperationsService) {}

  @Get("projects")
  projects(@CurrentUser() user: RequestUser) { return this.ops.listProjects(user.firmId); }

  @Post("projects")
  project(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      branchId: z.string().optional(),
      name: z.string().min(2),
      description: z.string().optional(),
      ownerUserId: z.string().optional(),
      startDate: z.string().datetime().optional(),
      dueDate: z.string().datetime().optional(),
      budget: z.coerce.number().nonnegative().optional(),
      memberUserIds: z.array(z.string()).default([])
    }).parse(body);
    return this.ops.createProject(user.firmId, user.id, input);
  }

  @Post("meetings")
  meeting(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.ops.createMeeting(user.firmId, user.id, CreateMeetingSchema.parse(body));
  }

  @Post("meetings/:id/actions")
  meetingAction(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      text: z.string().min(2),
      assigneeId: z.string().optional(),
      dueAt: z.string().datetime().optional(),
      createTask: z.boolean().default(false)
    }).parse(body);
    return this.ops.addMeetingAction(user.firmId, user.id, id, input);
  }

  @Get("vendors")
  vendors(@CurrentUser() user: RequestUser) { return this.ops.vendors(user.firmId); }

  @Post("vendors")
  vendor(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      name: z.string().min(2),
      kraPin: z.string().optional(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional()
    }).parse(body);
    return this.ops.createVendor(user.firmId, input);
  }

  @Post("purchase-requisitions")
  purchase(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      branchId: z.string(),
      vendorId: z.string().optional(),
      description: z.string().min(2),
      amount: z.coerce.number().positive()
    }).parse(body);
    return this.ops.createPurchaseRequisition(user.firmId, user.id, input);
  }

  @Get("assets")
  assets(@CurrentUser() user: RequestUser) { return this.ops.assets(user.firmId); }

  @Post("assets")
  asset(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.ops.createAsset(user.firmId, body);
  }

  @Post("leave")
  leave(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      type: z.string().min(2),
      startsOn: z.string().datetime(),
      endsOn: z.string().datetime(),
      days: z.coerce.number().positive(),
      reason: z.string().optional()
    }).parse(body);
    return this.ops.requestLeave(user.firmId, user.id, input);
  }
}
