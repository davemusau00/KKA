import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { CourtService } from "./court.service";

const filingDraft = z.object({
  matterId: z.string(), proceedingId: z.string().optional(), courtStation: z.string().min(2), division: z.string().optional(), caseType: z.string().optional(),
  plaintiff: z.string().optional(), defendants: z.array(z.unknown()).optional(), courtAssessmentAmount: z.number().nonnegative().optional(), feeRequisitionApproved: z.boolean().optional(),
  documentId: z.string().optional(), documentVersionId: z.string().optional(), filingMethod: z.string().min(2).optional(), paymentReceiptId: z.string().optional(),
  receiptDocumentId: z.string().optional(), receiptNumber: z.string().optional(), ctsReference: z.string().optional(), courtCaseNumber: z.string().optional(), assignedClerkId: z.string().optional()
});
const filingEdit = filingDraft.omit({ matterId: true, proceedingId: true }).partial();

@Controller("court")
export class CourtController {
  constructor(private readonly court: CourtService) {}

  @Get("dashboard")
  @RequirePermissions("court.view")
  dashboard(@CurrentUser() user: RequestUser, @Query("from") from?: string, @Query("to") to?: string) {
    return this.court.dashboard(user, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Get("proceedings")
  @RequirePermissions("court.view")
  proceedings(@CurrentUser() user: RequestUser, @Query("matterId") matterId?: string) {
    return this.court.proceedings(user, matterId);
  }

  @Post("proceedings")
  @RequirePermissions("court.proceeding_manage")
  proceeding(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.court.createProceeding(user, z.object({ matterId: z.string(), courtName: z.string().min(2), station: z.string().min(2), division: z.string().optional(), caseNumber: z.string().min(2), proceedingType: z.string().min(2), filedAt: z.string().datetime().optional(), judgeOrMagistrate: z.string().optional(), opposingCounsel: z.string().optional(), notes: z.string().optional() }).parse(body));
  }

  @Post("filings")
  @RequirePermissions("court.filing_manage")
  filing(@CurrentUser() user: RequestUser, @Body() body: unknown) { return this.court.createFiling(user, filingDraft.parse(body)); }

  @Patch("filings/:id")
  @RequirePermissions("court.filing_manage")
  updateFiling(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) { return this.court.updateFiling(user, id, filingEdit.parse(body)); }

  @Post("filings/:id/transition")
  @RequirePermissions("court.filing_manage")
  transitionFiling(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.court.transitionFiling(user, id, z.discriminatedUnion("action", [
      z.object({ action: z.literal("SUBMIT"), submittedAt: z.string().datetime(), filingReference: z.string().min(2) }),
      z.object({ action: z.literal("ACCEPT"), acceptedAt: z.string().datetime(), courtReceiptDocumentId: z.string() }),
      z.object({ action: z.literal("REJECT"), rejectedAt: z.string().datetime(), reason: z.string().min(2).max(3000) })
    ]).parse(body));
  }

  @Post("service")
  @RequirePermissions("court.service_manage")
  service(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.court.createServiceRecord(user, z.object({ matterId: z.string(), proceedingId: z.string().optional(), documentId: z.string().optional(), partyName: z.string().min(2), partyAddress: z.string().optional(), partyContact: z.string().optional(), processServerName: z.string().optional(), assignedDate: z.string().datetime().optional(), dueDate: z.string().datetime().optional(), serviceMethod: z.string().min(2).optional(), notes: z.string().optional() }).parse(body));
  }

  @Post("service/:id/attempts")
  @RequirePermissions("court.service_manage")
  attempt(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.court.addServiceAttempt(user, id, z.object({ attemptedAt: z.string().datetime(), outcome: z.string().min(2), serviceAddress: z.string().optional(), affidavitDocumentId: z.string().optional(), substituteServiceOrderDocumentId: z.string().optional(), returnedService: z.boolean().default(false), failureReason: z.string().optional(), nextAction: z.string().optional(), nextDeadlineId: z.string().optional(), notes: z.string().optional(), served: z.boolean().default(false) }).parse(body));
  }

  @Post("service/:id/affidavit-filed")
  @RequirePermissions("court.service_manage")
  affidavit(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) { return this.court.fileAffidavit(user, id, z.object({ affidavitDocumentId: z.string() }).parse(body).affidavitDocumentId); }
}
