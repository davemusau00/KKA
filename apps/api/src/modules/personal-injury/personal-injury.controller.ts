import { Body, Controller, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { PersonalInjuryService } from "./personal-injury.service";

const money = z.coerce.number().nonnegative();
@Controller("personal-injury")
export class PersonalInjuryController {
  constructor(private readonly pi: PersonalInjuryService) {}

  @Get(":matterId") @RequirePermissions("matter.view")
  get(@CurrentUser() u: RequestUser, @Param("matterId") id: string) { return this.pi.get(u.firmId, u.id, id); }

  @Put(":matterId/profile") @RequirePermissions("matter.edit")
  profile(@CurrentUser() u: RequestUser, @Param("matterId") id: string, @Body() body: unknown) {
    const input = z.object({ incidentDate:z.string().datetime().optional(), incidentTime:z.string().optional(), incidentLocation:z.string().optional(), accidentNarrative:z.string().optional(), obNumber:z.string().optional(), policeStation:z.string().optional(), investigatingOfficer:z.string().optional(), investigatingPhone:z.string().optional(), roadConditions:z.string().optional(), vehicleRegistrationPrimary:z.string().optional(), insurerClaimReference:z.string().optional() }).parse(body);
    return this.pi.updateProfile(u.firmId,u.id,id,input);
  }

  @Post(":matterId/vehicles") @RequirePermissions("matter.edit")
  vehicle(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addVehicle(u.firmId,u.id,id,z.object({ registrationNo:z.string().min(2), makeModel:z.string().optional(), ownerName:z.string().optional(), driverName:z.string().optional(), driverLicenseNo:z.string().optional(), insuranceCompany:z.string().optional(), policyNumber:z.string().optional(), ntsaSearchObtained:z.boolean().default(false), ntsaSearchRef:z.string().optional(), notes:z.string().optional() }).parse(body)); }

  @Post(":matterId/witnesses") @RequirePermissions("matter.edit")
  witness(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addWitness(u.firmId,u.id,id,z.object({ name:z.string().min(2), contact:z.string().optional(), statementRequested:z.boolean().default(false), statementReceived:z.boolean().default(false), statementDate:z.string().datetime().optional(), keyObservations:z.string().optional(), documentId:z.string().optional() }).parse(body)); }

  @Post(":matterId/evidence") @RequirePermissions("matter.edit")
  evidence(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addEvidence(u.firmId,u.id,id,z.object({ title:z.string().min(2), category:z.string().min(2), documentId:z.string().optional(), obtainedAt:z.string().datetime().optional(), obtainedById:z.string().optional(), notes:z.string().optional() }).parse(body)); }

  @Post(":matterId/injuries") @RequirePermissions("matter.edit")
  injury(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addInjury(u.firmId,u.id,id,z.object({ description:z.string().min(2), severity:z.string().min(2), bodyPart:z.string().optional(), permanentEffects:z.string().optional(), disabilityPercent:z.coerce.number().min(0).max(100).optional() }).parse(body)); }

  @Post(":matterId/treatments") @RequirePermissions("matter.edit")
  treatment(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addTreatment(u.firmId,u.id,id,z.object({ facilityName:z.string().min(2), doctorName:z.string().optional(), admissionDate:z.string().datetime().optional(), dischargeDate:z.string().datetime().optional(), treatmentSummary:z.string().optional(), costAmount:money.default(0), receiptNumber:z.string().optional(), receiptDocumentId:z.string().optional() }).parse(body)); }

  @Post(":matterId/medical-reports") @RequirePermissions("matter.edit")
  medical(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addMedicalReport(u.firmId,u.id,id,z.object({ doctorName:z.string().min(2), specialty:z.string().optional(), facility:z.string().optional(), requestedAt:z.string().datetime().optional(), feeAmount:money.default(0), status:z.string().default("REQUESTED"), appointmentDate:z.string().datetime().optional(), notes:z.string().optional() }).parse(body)); }

  @Patch(":matterId/medical-reports/:reportId") @RequirePermissions("matter.edit")
  medicalUpdate(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Param("reportId") reportId:string,@Body() body:Record<string,unknown>) { return this.pi.updateMedicalReport(u.firmId,u.id,id,reportId,body); }

  @Put(":matterId/liability-quantum") @RequirePermissions("matter.edit")
  liability(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.updateLiability(u.firmId,u.id,id,z.object({ claimantPercent:z.coerce.number().min(0).max(100).default(0), defendantPercent:z.coerce.number().min(0).max(100).default(100), contributoryNegligence:z.boolean().default(false), contributoryNotes:z.string().optional(), supportingEvidence:z.any().optional(), weaknesses:z.any().optional(), advocateOpinion:z.string().optional(), generalDamages:money.default(0), generalDamagesJustification:z.string().optional(), futureMedicalExpenses:money.default(0), lossOfEarnings:money.default(0), lossOfEarningCapacity:money.default(0), otherDamages:money.default(0), specialDamages:z.array(z.object({ head:z.string().min(1), amount:money, evidenced:z.boolean().default(false), receiptReference:z.string().optional(), evidenceDocumentId:z.string().optional(), notes:z.string().optional() })).default([]) }).parse(body)); }

  @Post(":matterId/negotiations") @RequirePermissions("matter.edit")
  negotiation(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addNegotiation(u.firmId,u.id,id,z.object({ occurredAt:z.string().datetime().optional(), party:z.string().min(1), direction:z.string().min(1), amount:money.optional(), status:z.string().optional(), notes:z.string().optional(), documentId:z.string().optional() }).parse(body)); }

  @Put(":matterId/hearing-brief") @RequirePermissions("matter.edit")
  hearing(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:Record<string,unknown>) { return this.pi.updateHearingBrief(u.firmId,u.id,id,body); }

  @Put(":matterId/judgment") @RequirePermissions("matter.edit")
  judgment(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:Record<string,unknown>) { return this.pi.updateJudgment(u.firmId,u.id,id,body); }

  @Post(":matterId/recovery-actions") @RequirePermissions("matter.edit")
  recovery(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { return this.pi.addRecovery(u.firmId,u.id,id,z.object({ actionType:z.string().min(2), status:z.string().min(1), amount:money.optional(), dueAt:z.string().datetime().optional(), completedAt:z.string().datetime().optional(), counterparty:z.string().optional(), reference:z.string().optional(), documentId:z.string().optional(), notes:z.string().optional() }).parse(body)); }

  @Put(":matterId/settlement") @RequirePermissions("matter.settlement_approve")
  settlement(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:Record<string,unknown>) { return this.pi.updateSettlement(u.firmId,u.id,id,body); }

  @Put(":matterId/closure") @RequirePermissions("matter.close")
  closure(@CurrentUser() u: RequestUser,@Param("matterId") id:string,@Body() body:unknown) { const input=z.object({ checklist:z.any(), closingNote:z.string().optional(), financeReconciled:z.boolean().default(false), documentsComplete:z.boolean().default(false), clientInformed:z.boolean().default(false), supervisorApproved:z.boolean().default(false), archivedAt:z.string().datetime().optional() }).parse(body); return this.pi.updateClosure(u.firmId,u.id,id,input); }
}
