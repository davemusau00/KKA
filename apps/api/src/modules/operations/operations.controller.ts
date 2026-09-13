import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateMeetingSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { OperationsService } from "./operations.service";

const MeetingUpdateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  agenda: z.unknown().optional(),
  minutes: z.unknown().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  participantUserIds: z.array(z.string()).optional()
});

const EmployeeProfileSchema = z.object({
  employeeNumber: z.string().min(2).max(80).optional(),
  employmentType: z.string().min(2).max(80),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  managerUserId: z.string().nullable().optional(),
  leavePolicyKey: z.string().max(120).nullable().optional(),
  cpdsRequiredAnnual: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().max(5000).nullable().optional()
});

@Controller("operations")
export class OperationsController {
  constructor(private readonly ops: OperationsService) {}

  // ---------------------------------------------------------------------------
  // Internal projects and meetings
  // ---------------------------------------------------------------------------

  @Get("projects")
  @RequirePermissions("module.operations")
  projects(@CurrentUser() user: RequestUser) {
    return this.ops.listProjects(user.firmId);
  }

  @Post("projects")
  @RequirePermissions("operations.manage")
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

  @Get("meetings")
  @RequirePermissions("module.operations")
  meetings(
    @CurrentUser() user: RequestUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("projectId") projectId?: string,
    @Query("matterId") matterId?: string
  ) {
    return this.ops.listMeetings(user.firmId, { from, to, projectId, matterId });
  }

  @Post("meetings")
  @RequirePermissions("operations.manage")
  meeting(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.ops.createMeeting(user.firmId, user.id, CreateMeetingSchema.parse(body));
  }

  @Patch("meetings/:id")
  @RequirePermissions("operations.manage")
  updateMeeting(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.ops.updateMeeting(user.firmId, user.id, id, MeetingUpdateSchema.parse(body));
  }

  @Post("meetings/:id/decisions")
  @RequirePermissions("operations.manage")
  meetingDecision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      text: z.string().min(2).max(5000),
      ownerUserId: z.string().optional()
    }).parse(body);
    return this.ops.addMeetingDecision(user.firmId, user.id, id, input);
  }

  @Post("meetings/:id/actions")
  @RequirePermissions("operations.manage")
  meetingAction(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      text: z.string().min(2),
      assigneeId: z.string().optional(),
      dueAt: z.string().datetime().optional(),
      createTask: z.boolean().default(false)
    }).parse(body);
    return this.ops.addMeetingAction(user.firmId, user.id, id, input);
  }

  // ---------------------------------------------------------------------------
  // People operations and leave
  // ---------------------------------------------------------------------------

  @Get("hr/employees")
  @RequirePermissions("hr.manage")
  employeeProfiles(@CurrentUser() user: RequestUser) {
    return this.ops.listEmployeeProfiles(user.firmId);
  }

  @Patch("hr/employees/:userId")
  @RequirePermissions("hr.manage")
  employeeProfile(
    @CurrentUser() user: RequestUser,
    @Param("userId") userId: string,
    @Body() body: unknown
  ) {
    return this.ops.upsertEmployeeProfile(user.firmId, user.id, userId, EmployeeProfileSchema.parse(body));
  }

  @Get("leave")
  leave(
    @CurrentUser() user: RequestUser,
    @Query("scope") scope?: "self" | "all"
  ) {
    return this.ops.listLeave(user, scope === "all" ? "all" : "self");
  }

  @Post("leave")
  leaveRequest(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      type: z.string().min(2),
      startsOn: z.string().datetime(),
      endsOn: z.string().datetime(),
      days: z.coerce.number().positive(),
      reason: z.string().max(5000).optional()
    }).parse(body);
    return this.ops.requestLeave(user.firmId, user.id, input);
  }

  @Post("leave/:id/decision")
  @RequirePermissions("hr.manage")
  leaveDecision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      decision: z.enum(["APPROVED", "REJECTED"]),
      reason: z.string().max(3000).optional()
    }).parse(body);
    return this.ops.decideLeave(user.firmId, user.id, id, input);
  }

  @Post("leave/:id/cancel")
  cancelLeave(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.ops.cancelLeave(user.firmId, user.id, id, user.permissions.includes("hr.manage"));
  }

  // ---------------------------------------------------------------------------
  // Procurement
  // ---------------------------------------------------------------------------

  @Get("vendors")
  @RequirePermissions("module.operations")
  vendors(@CurrentUser() user: RequestUser) {
    return this.ops.vendors(user.firmId);
  }

  @Post("vendors")
  @RequirePermissions("procurement.manage")
  vendor(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      name: z.string().min(2),
      kraPin: z.string().optional(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional()
    }).parse(body);
    return this.ops.createVendor(user.firmId, user.id, input);
  }

  @Get("purchase-requisitions")
  @RequirePermissions("module.operations")
  requisitions(@CurrentUser() user: RequestUser) {
    return this.ops.listPurchaseRequisitions(user.firmId);
  }

  @Post("purchase-requisitions")
  @RequirePermissions("procurement.manage")
  purchase(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      branchId: z.string(),
      vendorId: z.string().optional(),
      description: z.string().min(2),
      amount: z.coerce.number().positive()
    }).parse(body);
    return this.ops.createPurchaseRequisition(user.firmId, user.id, input);
  }

  @Post("purchase-requisitions/:id/decision")
  @RequirePermissions("procurement.manage")
  requisitionDecision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ decision: z.enum(["APPROVED", "REJECTED"]) }).parse(body);
    return this.ops.decidePurchaseRequisition(user.firmId, user.id, id, input.decision);
  }

  @Get("purchase-orders")
  @RequirePermissions("module.operations")
  purchaseOrders(@CurrentUser() user: RequestUser) {
    return this.ops.listPurchaseOrders(user.firmId);
  }

  @Post("purchase-orders")
  @RequirePermissions("procurement.manage")
  purchaseOrder(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({ requisitionId: z.string() }).parse(body);
    return this.ops.createPurchaseOrder(user.firmId, user.id, input.requisitionId);
  }

  @Post("purchase-orders/:id/receive")
  @RequirePermissions("procurement.manage")
  receivePurchaseOrder(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      receivedAt: z.string().datetime().optional(),
      partial: z.boolean().default(false)
    }).parse(body ?? {});
    return this.ops.receivePurchaseOrder(user.firmId, user.id, id, input);
  }

  // ---------------------------------------------------------------------------
  // Asset custody
  // ---------------------------------------------------------------------------

  @Get("assets")
  @RequirePermissions("module.operations")
  assets(@CurrentUser() user: RequestUser) {
    return this.ops.assets(user.firmId);
  }

  @Post("assets")
  @RequirePermissions("assets.manage")
  asset(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      branchId: z.string().optional(),
      assetTag: z.string().optional(),
      category: z.string().min(2),
      name: z.string().min(2),
      serialNumber: z.string().optional(),
      purchaseDate: z.string().datetime().optional(),
      purchaseCost: z.coerce.number().nonnegative().optional(),
      warrantyEndsAt: z.string().datetime().optional(),
      notes: z.string().max(5000).optional()
    }).parse(body);
    return this.ops.createAsset(user.firmId, user.id, input);
  }

  @Post("assets/:id/assign")
  @RequirePermissions("assets.manage")
  assignAsset(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      userId: z.string(),
      conditionOnIssue: z.string().max(3000).optional()
    }).parse(body);
    return this.ops.assignAsset(user.firmId, user.id, id, input);
  }

  @Post("assets/:id/return")
  @RequirePermissions("assets.manage")
  returnAsset(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ conditionOnReturn: z.string().max(3000).optional() }).parse(body ?? {});
    return this.ops.returnAsset(user.firmId, user.id, id, input);
  }

  @Patch("assets/:id/status")
  @RequirePermissions("assets.manage")
  assetStatus(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      status: z.enum(["IN_STOCK", "ASSIGNED", "REPAIR", "RETIRED", "LOST"]),
      notes: z.string().max(5000).optional()
    }).parse(body);
    return this.ops.updateAssetStatus(user.firmId, user.id, id, input);
  }
}
