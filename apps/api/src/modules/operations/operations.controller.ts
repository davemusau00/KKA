import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateMeetingSchema, CalculatedLeavePolicySchema, CalculatedLeaveRequestSchema, LeavePreviewSchema, LeaveDecisionSchema, LeaveCancelSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { OperationsService } from "./operations.service";
import { ApprovalsService } from "../approvals/approvals.service";
import { LeaveService } from './leave.service';

const MeetingUpdateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  agenda: z.unknown().optional(),
  minutes: z.unknown().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  recurrenceRule: z.string().max(500).nullable().optional(),
  recurrenceUntil: z.string().datetime().nullable().optional(),
  participantUserIds: z.array(z.string()).optional()
});

const EmployeeProfileSchema = z.object({
  employeeNumber: z.string().min(2).max(80).optional(),
  employmentType: z.string().min(2).max(80),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  employmentStatus: z.enum(["ACTIVE", "ON_LEAVE", "SUSPENDED", "OFFBOARDED"]).optional(),
  probationEndsAt: z.string().datetime().nullable().optional(),
  managerUserId: z.string().nullable().optional(),
  leavePolicyKey: z.string().max(120).nullable().optional(),
  cpdsRequiredAnnual: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().max(5000).nullable().optional()
});

const LifecycleItemSchema = z.object({
  lifecycle: z.enum(["ONBOARDING", "OFFBOARDING"]),
  key: z.string().min(2).max(120),
  title: z.string().min(2).max(500),
  dueAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional()
});

const AppraisalSchema = z.object({
  reviewerUserId: z.string().optional(),
  periodStartsAt: z.string().datetime(),
  periodEndsAt: z.string().datetime(),
  status: z.enum(["DRAFT", "FINALIZED", "ACKNOWLEDGED"]).optional(),
  rating: z.coerce.number().min(0).max(5).nullable().optional(),
  summary: z.string().max(10000).nullable().optional(),
  developmentPlan: z.string().max(10000).nullable().optional()
});

const CpdSchema = z.object({
  title: z.string().min(2).max(500),
  provider: z.string().max(500).nullable().optional(),
  occurredOn: z.string().datetime(),
  hours: z.coerce.number().positive().max(1000),
  notes: z.string().max(5000).nullable().optional()
});

const CredentialSchema = z.object({
  admissionNumber: z.string().min(2).max(120),
  admissionDate: z.string().datetime().nullable().optional(),
  practicingCertificateNo: z.string().max(120).nullable().optional(),
  certificateExpiresAt: z.string().datetime().nullable().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED", "RETIRED"]).optional(),
  notes: z.string().max(5000).nullable().optional()
});

const LeaveBalanceSchema = z.object({
  policyKey: z.string().min(2).max(120),
  year: z.coerce.number().int().min(2000).max(2200),
  openingDays: z.coerce.number().min(0).max(366).optional(),
  adjustmentDays: z.coerce.number().min(-366).max(366).optional(),
  notes: z.string().trim().min(3).max(5000)
}).strict();

const HrNoteSchema = z.object({
  category: z.string().min(2).max(120),
  body: z.string().min(2).max(10000),
  visibleToUserIds: z.array(z.string()).max(100).optional()
});

const StaffDocumentSchema = z.object({
  category: z.string().min(2).max(120),
  title: z.string().min(2).max(500),
  externalReference: z.string().max(1000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional()
});

@Controller("operations")
export class OperationsController {
  constructor(private readonly ops: OperationsService, private readonly approvals: ApprovalsService, private readonly calculatedLeave: LeaveService) {}

  // ---------------------------------------------------------------------------
  // Internal projects and meetings
  // ---------------------------------------------------------------------------

  @Get("projects")
  @RequirePermissions("module.operations")
  projects(@CurrentUser() user: RequestUser) {
    return this.ops.listProjects(user);
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

  @Post("projects/:id/status")
  @RequirePermissions("operations.manage")
  projectStatus(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ status: z.enum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]) }).parse(body);
    return this.ops.setProjectStatus(user.firmId, user.id, id, input.status);
  }

  @Post("projects/:id/matters")
  @RequirePermissions("operations.manage")
  linkProjectMatter(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ matterId: z.string() }).parse(body);
    return this.ops.linkProjectMatter(user, user.id, id, input.matterId);
  }

  @Post("projects/:id/documents")
  @RequirePermissions("operations.manage")
  linkProjectDocument(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ documentId: z.string() }).parse(body);
    return this.ops.linkProjectDocument(user, user.id, id, input.documentId);
  }

  @Post("projects/:id/milestones")
  @RequirePermissions("operations.manage")
  milestone(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ title: z.string().min(2).max(500), description: z.string().max(5000).optional(), dueAt: z.string().datetime().optional(), ownerUserId: z.string().optional() }).parse(body);
    return this.ops.addProjectMilestone(user.firmId, user.id, id, input);
  }

  @Post("project-milestones/:id/complete")
  @RequirePermissions("operations.manage")
  completeMilestone(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.ops.completeProjectMilestone(user.firmId, user.id, id);
  }

  @Post("projects/:id/spend")
  @RequirePermissions("operations.manage")
  projectSpend(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ description: z.string().min(2).max(1000), amount: z.coerce.number().positive(), occurredAt: z.string().datetime(), financeReference: z.string().max(300).optional() }).parse(body);
    return this.ops.recordProjectSpend(user.firmId, user.id, id, input);
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
    const input = CreateMeetingSchema.extend({ recurrenceRule: z.string().max(500).optional(), recurrenceUntil: z.string().datetime().optional() }).parse(body);
    return this.ops.createMeeting(user.firmId, user.id, input);
  }

  @Patch("meetings/:id")
  @RequirePermissions("operations.manage")
  updateMeeting(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.ops.updateMeeting(user.firmId, user.id, id, MeetingUpdateSchema.parse(body));
  }

  @Post("meetings/:id/attendance/:userId")
  @RequirePermissions("operations.manage")
  attendance(@CurrentUser() user: RequestUser, @Param("id") id: string, @Param("userId") userId: string, @Body() body: unknown) {
    const input = z.object({ attendanceStatus: z.enum(["PRESENT", "ABSENT", "APOLOGY", "LATE"]) }).parse(body);
    return this.ops.setMeetingAttendance(user.firmId, user.id, id, userId, input.attendanceStatus);
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

  @Post("meeting-actions/:id/complete")
  @RequirePermissions("operations.manage")
  completeMeetingAction(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.ops.completeMeetingAction(user.firmId, user.id, id);
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

  @Get("hr/employees/:userId/records")
  @RequirePermissions("hr.manage")
  employeeRecords(@CurrentUser() user: RequestUser, @Param("userId") userId: string) {
    return this.ops.hrRecords(user, userId);
  }

  @Post("hr/employees/:userId/lifecycle")
  @RequirePermissions("hr.manage")
  lifecycleItem(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    return this.ops.upsertLifecycleItem(user.firmId, user.id, userId, LifecycleItemSchema.parse(body));
  }

  @Post("hr/lifecycle/:id/completion")
  @RequirePermissions("hr.manage")
  lifecycleCompletion(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ completed: z.boolean() }).parse(body);
    return this.ops.completeLifecycleItem(user.firmId, user.id, id, input.completed);
  }

  @Post("hr/employees/:userId/appraisals")
  @RequirePermissions("hr.manage")
  appraisal(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    return this.ops.recordAppraisal(user.firmId, user.id, userId, AppraisalSchema.parse(body));
  }

  @Post("hr/employees/:userId/cpd")
  @RequirePermissions("hr.manage")
  cpd(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    return this.ops.recordCpd(user.firmId, user.id, userId, CpdSchema.parse(body));
  }

  @Post("hr/employees/:userId/advocate-credentials")
  @RequirePermissions("hr.manage")
  advocateCredential(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    return this.ops.upsertAdvocateCredential(user.firmId, user.id, userId, CredentialSchema.parse(body));
  }

  @Get("hr/leave-policies")
  @RequirePermissions("hr.manage")
  leavePolicies(@CurrentUser() user: RequestUser) {
    return this.ops.listLeavePolicies(user.firmId);
  }

  @Post("hr/leave-policies")
  @RequirePermissions("hr.manage")
  leavePolicy(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.ops.upsertLeavePolicy(user.firmId, user.id, CalculatedLeavePolicySchema.parse(body));
  }

  @Post("hr/employees/:userId/leave-balances")
  @RequirePermissions("hr.manage")
  leaveBalance(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    return this.ops.upsertLeaveBalance(user.firmId, user.id, userId, LeaveBalanceSchema.parse(body));
  }

  @Post("hr/employees/:userId/restricted-notes")
  @RequirePermissions("hr.manage")
  hrNote(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    return this.ops.addHrNote(user.firmId, user.id, userId, HrNoteSchema.parse(body));
  }

  @Post("hr/employees/:userId/staff-documents")
  @RequirePermissions("hr.manage")
  staffDocument(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    return this.ops.recordStaffDocument(user.firmId, user.id, userId, StaffDocumentSchema.parse(body));
  }

  @Post("hr/employees/:userId/offboard")
  @RequirePermissions("hr.manage")
  offboardEmployee(@CurrentUser() user: RequestUser, @Param("userId") userId: string, @Body() body: unknown) {
    const input = z.object({ offboardedAt: z.string().datetime(), reason: z.string().max(5000).optional() }).parse(body);
    return this.ops.offboardEmployee(user.firmId, user.id, userId, input);
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
    return this.calculatedLeave.request(user, CalculatedLeaveRequestSchema.parse(body));
  }

  @Get('leave/policies')
  employeeLeavePolicies(@CurrentUser() user: RequestUser) { return this.calculatedLeave.policies(user); }

  @Get('leave/balance')
  calculatedLeaveBalance(@CurrentUser() user: RequestUser, @Query() query: unknown) {
    const input = z.object({ userId: z.string().optional(), policyKey: z.string().min(2).max(80), year: z.coerce.number().int().min(2000).max(2200) }).strict().parse(query);
    return this.calculatedLeave.balance(user, input.userId ?? user.id, input.policyKey, input.year);
  }

  @Post('leave/preview')
  previewLeave(@CurrentUser() user: RequestUser, @Body() body: unknown) { return this.calculatedLeave.preview(user, LeavePreviewSchema.parse(body)); }

  @Post('leave/:id/reconcile-policy')
  @RequirePermissions('hr.manage')
  reconcileLeave(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: unknown) {
    const input = z.object({ policyKey: z.string().min(2).max(80), revision: z.number().int().nonnegative(), reason: z.string().trim().min(3).max(3000) }).strict().parse(body);
    return this.calculatedLeave.reconcileHistorical(user, id, input);
  }

  @Post("leave/:id/decision")
  @RequirePermissions("hr.manage")
  leaveDecision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = LeaveDecisionSchema.parse(body);
    return this.calculatedLeave.transition(user, id, input.decision, input.revision, input.reason);
  }

  @Post("leave/:id/cancel")
  cancelLeave(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.calculatedLeave.transition(user, id, 'CANCELLED', LeaveCancelSchema.parse(body).revision);
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

  @Post("vendors/:id/documents")
  @RequirePermissions("procurement.manage")
  vendorDocument(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ category: z.string().min(2).max(120), title: z.string().min(2).max(500), externalReference: z.string().max(1000).optional(), expiresAt: z.string().datetime().optional() }).parse(body);
    return this.ops.recordVendorDocument(user.firmId, user.id, id, input);
  }

  @Get("purchase-categories")
  @RequirePermissions("module.operations")
  categories(@CurrentUser() user: RequestUser) { return this.ops.purchaseCategories(user.firmId); }

  @Post("purchase-categories")
  @RequirePermissions("procurement.manage")
  category(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({ key: z.string().min(2).max(80), name: z.string().min(2).max(300), approvalThreshold: z.coerce.number().nonnegative().optional(), financeAccountCode: z.string().max(120).optional(), active: z.boolean().optional() }).parse(body);
    return this.ops.savePurchaseCategory(user.firmId, user.id, input);
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
      categoryId: z.string().optional(),
      description: z.string().min(2),
      amount: z.coerce.number().positive(),
      idempotencyKey: z.string().uuid()
    }).parse(body);
    return this.ops.createPurchaseRequisition(user.firmId, user.id, input);
  }

  @Post("purchase-requisitions/:id/quotes")
  @RequirePermissions("procurement.manage")
  quote(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ vendorId: z.string(), reference: z.string().min(2).max(300), amount: z.coerce.number().positive(), currency: z.string().length(3).optional(), validUntil: z.string().datetime().optional(), notes: z.string().max(5000).optional() }).parse(body);
    return this.ops.recordVendorQuote(user.firmId, user.id, id, input);
  }

  @Post("purchase-requisitions/:id/decision")
  @RequirePermissions("approval.decide")
  requisitionDecision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), comment: z.string().max(3000).optional() }).parse(body);
    return this.approvals.decidePurchaseRequisition(user.firmId, user.id, user.roleKeys, id, input.decision, input.comment);
  }

  @Get("purchase-orders")
  @RequirePermissions("module.operations")
  purchaseOrders(@CurrentUser() user: RequestUser) {
    return this.ops.listPurchaseOrders(user.firmId);
  }

  @Get("purchase-receipts")
  @RequirePermissions("module.operations")
  purchaseReceipts(@CurrentUser() user: RequestUser) {
    return this.ops.listPurchaseReceipts(user.firmId);
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
      partial: z.boolean().default(false),
      deliveryReference: z.string().min(2).max(300),
      idempotencyKey: z.string().uuid(),
      notes: z.string().max(5000).optional()
    }).parse(body ?? {});
    return this.ops.receivePurchaseOrder(user.firmId, user.id, id, input);
  }

  @Post("purchase-receipts/:id/assets")
  @RequirePermissions("assets.manage")
  assetFromReceipt(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ assetTag: z.string().max(120).optional(), category: z.string().min(2).max(120), name: z.string().min(2).max(500), serialNumber: z.string().max(300).optional(), notes: z.string().max(5000).optional() }).parse(body);
    return this.ops.createAssetFromReceipt(user.firmId, user.id, id, input);
  }

  @Post("purchase-receipts/:id/expenses")
  @RequirePermissions("procurement.manage")
  expenseFromReceipt(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ category: z.string().min(2).max(120), description: z.string().max(5000).optional(), paymentSource: z.string().min(2).max(120) }).parse(body);
    return this.ops.createExpenseFromReceipt(user, user.id, id, input);
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

  @Post("assets/:id/maintenance")
  @RequirePermissions("assets.manage")
  assetMaintenance(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ vendorId: z.string().optional(), type: z.string().min(2).max(120), description: z.string().min(2).max(5000), cost: z.coerce.number().nonnegative().optional(), externalReference: z.string().max(1000).optional(), notes: z.string().max(5000).optional() }).parse(body);
    return this.ops.recordAssetMaintenance(user.firmId, user.id, id, input);
  }

  @Post("asset-maintenance/:id/complete")
  @RequirePermissions("assets.manage")
  completeAssetMaintenance(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ notes: z.string().max(5000).optional() }).parse(body ?? {});
    return this.ops.completeAssetMaintenance(user.firmId, user.id, id, input.notes);
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
