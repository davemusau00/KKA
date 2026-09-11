import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import { roleContext } from "../../platform/auth/role-context";

@Injectable()
export class PersonalInjuryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly recordAccess: RecordAccessService) {}

  private async assertMatter(firmId: string, actorId: string, matterId: string) {
    const matter = await this.prisma.client.matter.findFirst({ where: { id: matterId, firmId } });
    if (!matter) throw new NotFoundException("Matter not found");
    const actor = await this.prisma.client.user.findFirst({
      where: { id: actorId, firmId },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!actor) throw new NotFoundException("Matter not found");
    const context = roleContext(firmId, actor.roles);
    const canView = await this.recordAccess.canViewMatter({ id: actor.id, firmId, email: actor.email, fullName: actor.fullName, homeBranchId: actor.homeBranchId, ...context }, matterId);
    if (!canView) throw new NotFoundException("Matter not found");
    if (matter.practiceArea.toLowerCase() !== "personal injury") {
      throw new BadRequestException("Structured personal-injury data is only available for Personal Injury matters");
    }
    return matter;
  }

  private async profile(firmId: string, actorId: string, matterId: string) {
    await this.assertMatter(firmId, actorId, matterId);
    return this.prisma.client.personalInjuryCase.upsert({
      where: { matterId },
      create: { matterId },
      update: {}
    });
  }

  async get(firmId: string, actorId: string, matterId: string) {
    await this.profile(firmId, actorId, matterId);
    return this.prisma.client.personalInjuryCase.findUnique({
      where: { matterId },
      include: {
        vehicles: true, witnesses: true, evidence: true, injuries: true, treatments: true,
        medicalReports: { orderBy: { requestedAt: "desc" } },
        liability: { include: { specialDamages: true } },
        negotiations: { orderBy: { occurredAt: "desc" } },
        hearingBrief: true, judgment: true,
        recoveryActions: { orderBy: { createdAt: "desc" } },
        settlement: { include: { deductions: true } }, closure: true
      }
    });
  }

  async updateProfile(firmId: string, actorId: string, matterId: string, input: any) {
    await this.profile(firmId, actorId, matterId);
    const data = { ...input };
    if (data.incidentDate) data.incidentDate = new Date(data.incidentDate);
    const updated = await this.prisma.client.personalInjuryCase.update({ where: { matterId }, data });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.profile_updated", entityType: "personal_injury_case", entityId: updated.id, matterId, metadata: { changedKeys: Object.keys(input) } });
    return updated;
  }

  async addVehicle(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piVehicle.create({ data: { personalInjuryId: p.id, ...input } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.vehicle_added", entityType: "pi_vehicle", entityId: row.id, matterId, metadata: { registrationNo: row.registrationNo } });
    return row;
  }

  async addWitness(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const data = { ...input, statementDate: input.statementDate ? new Date(input.statementDate) : undefined };
    const row = await this.prisma.client.piWitness.create({ data: { personalInjuryId: p.id, ...data } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.witness_added", entityType: "pi_witness", entityId: row.id, matterId, metadata: { name: row.name } });
    return row;
  }

  async addEvidence(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piEvidenceItem.create({ data: { personalInjuryId: p.id, ...input, obtainedAt: input.obtainedAt ? new Date(input.obtainedAt) : undefined } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.evidence_added", entityType: "pi_evidence", entityId: row.id, matterId, metadata: { category: row.category, documentId: row.documentId } });
    return row;
  }

  async addInjury(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piInjury.create({ data: { personalInjuryId: p.id, ...input } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.injury_added", entityType: "pi_injury", entityId: row.id, matterId, metadata: { description: row.description } });
    return row;
  }

  async addTreatment(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piTreatmentEpisode.create({ data: {
      personalInjuryId: p.id, ...input,
      admissionDate: input.admissionDate ? new Date(input.admissionDate) : undefined,
      dischargeDate: input.dischargeDate ? new Date(input.dischargeDate) : undefined
    } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.treatment_added", entityType: "pi_treatment", entityId: row.id, matterId, metadata: { facilityName: row.facilityName } });
    return row;
  }

  async addMedicalReport(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piMedicalReportRequest.create({ data: {
      personalInjuryId: p.id, ...input,
      requestedAt: input.requestedAt ? new Date(input.requestedAt) : undefined,
      appointmentDate: input.appointmentDate ? new Date(input.appointmentDate) : undefined
    } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.medical_report_requested", entityType: "pi_medical_report", entityId: row.id, matterId, metadata: { doctorName: row.doctorName, status: row.status } });
    return row;
  }

  async updateMedicalReport(firmId: string, actorId: string, matterId: string, id: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const found = await this.prisma.client.piMedicalReportRequest.findFirst({ where: { id, personalInjuryId: p.id } });
    if (!found) throw new NotFoundException("Medical report request not found");
    const data: any = { ...input };
    for (const k of ["requestedAt","appointmentDate","examinedAt","receivedAt","reviewedAt"]) if (data[k]) data[k] = new Date(data[k]);
    const row = await this.prisma.client.piMedicalReportRequest.update({ where: { id }, data });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.medical_report_updated", entityType: "pi_medical_report", entityId: row.id, matterId, metadata: { changedKeys: Object.keys(input) } });
    return row;
  }

  async updateLiability(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const { specialDamages = [], ...data } = input;
    const row = await this.prisma.client.$transaction(async (tx) => {
      const liability = await tx.piLiabilityAssessment.upsert({
        where: { personalInjuryId: p.id },
        create: { personalInjuryId: p.id, ...data, assessedById: actorId, assessedAt: new Date() },
        update: { ...data, assessedById: actorId, assessedAt: new Date() }
      });
      if (Array.isArray(specialDamages)) {
        await tx.piSpecialDamage.deleteMany({ where: { liabilityAssessmentId: liability.id } });
        if (specialDamages.length) await tx.piSpecialDamage.createMany({ data: specialDamages.map((d: any) => ({ liabilityAssessmentId: liability.id, ...d })) });
      }
      return tx.piLiabilityAssessment.findUnique({ where: { id: liability.id }, include: { specialDamages: true } });
    });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.liability_quantum_updated", entityType: "pi_liability", entityId: row!.id, matterId, metadata: { specialDamageCount: specialDamages.length } });
    return row;
  }

  async addNegotiation(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piNegotiationEntry.create({ data: { personalInjuryId: p.id, recordedById: actorId, ...input, occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date() } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.negotiation_recorded", entityType: "pi_negotiation", entityId: row.id, matterId, metadata: { party: row.party, direction: row.direction, amount: row.amount?.toString() } });
    return row;
  }

  async updateHearingBrief(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piHearingBrief.upsert({
      where: { personalInjuryId: p.id },
      create: { personalInjuryId: p.id, ...input, readyAt: input.ready ? new Date() : undefined, readyById: input.ready ? actorId : undefined },
      update: { ...input, ...(input.ready ? { readyAt: new Date(), readyById: actorId } : {}) }
    });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.hearing_brief_updated", entityType: "pi_hearing_brief", entityId: row.id, matterId, metadata: { ready: row.ready } });
    return row;
  }

  async updateJudgment(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const defendantPercent = input.liabilityDefendantPercent ?? input.liabilityPercent;
    const claimantPercent = input.liabilityClaimantPercent ?? (defendantPercent === undefined ? undefined : 100 - Number(defendantPercent));
    const data: any = {
      judgmentDate: input.judgmentDate ? new Date(input.judgmentDate) : undefined,
      liabilityPercent: defendantPercent,
      liabilityClaimantPercent: claimantPercent,
      liabilityDefendantPercent: defendantPercent,
      generalDamages: input.generalDamages,
      specialDamages: input.specialDamages,
      futureMedical: input.futureMedical,
      costsAmount: input.costsAwarded ?? input.costsAmount,
      interestRatePercent: input.interestRatePercent,
      interestFromDate: input.interestFromDate ? new Date(input.interestFromDate) : undefined,
      totalAward: input.totalAward,
      paymentDeadline: input.paymentDeadline ? new Date(input.paymentDeadline) : undefined,
      appealDeadline: input.appealDeadline ? new Date(input.appealDeadline) : undefined,
      appealRecommended: input.appealRecommended,
      appealJustification: input.appealJustification,
      recoveryTriggered: input.recoveryTriggered,
    };
    const row = await this.prisma.client.piJudgmentAward.upsert({ where: { personalInjuryId: p.id }, create: { personalInjuryId: p.id, ...data }, update: data });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.judgment_updated", entityType: "pi_judgment", entityId: row.id, matterId, metadata: { totalAward: row.totalAward.toString() } });
    return row;
  }

  async addRecovery(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const row = await this.prisma.client.piRecoveryAction.create({ data: {
      personalInjuryId: p.id, createdById: actorId, ...input,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined
    } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.recovery_action_added", entityType: "pi_recovery", entityId: row.id, matterId, metadata: { actionType: row.actionType, status: row.status } });
    return row;
  }

  async updateSettlement(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const grossAmount = input.grossAmount ?? input.grossSettlementAmount;
    const clientFundsReceived = input.clientFundsReceived ?? input.fundsReceivedAmount ?? 0;
    const professionalFees = input.professionalFees ?? 0;
    const disbursements = input.disbursements ?? input.totalDisbursements ?? 0;
    const otherDeductions = Array.isArray(input.otherDeductions)
      ? input.otherDeductions.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
      : (input.otherDeductions ?? 0);
    const netClientAmount = input.netClientAmount;
    for (const [name, value] of Object.entries({ grossAmount, clientFundsReceived, professionalFees, disbursements, otherDeductions, netClientAmount })) {
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) throw new BadRequestException(`${name} must be a non-negative amount`);
    }
    if (netClientAmount !== undefined && grossAmount !== undefined) {
      const expected = Number(grossAmount) - Number(professionalFees) - Number(disbursements) - Number(otherDeductions);
      if (Math.abs(expected - Number(netClientAmount)) > 0.01) throw new BadRequestException("Settlement net amount does not reconcile with its deductions");
    }
    const clientAccounts = await this.prisma.client.ledgerAccount.findMany({ where: { firmId, fundType: "CLIENT", active: true }, select: { id: true } });
    const clientAccountIds = clientAccounts.map((account) => account.id);
    const receipts = clientAccountIds.length ? await this.prisma.client.paymentReceipt.findMany({ where: { firmId, matterId, accountId: { in: clientAccountIds }, clearedAt: { not: null } }, select: { amount: true } }) : [];
    const recordedClientFunds = receipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    if (Number(clientFundsReceived) > recordedClientFunds + 0.01) throw new BadRequestException("Settlement claims more client funds than recorded receipts");

    const deductions = Array.isArray(input.deductions) ? input.deductions : [];
    const data: any = {
      grossAmount, clientFundsReceived, professionalFees, disbursements, otherDeductions,
      netClientAmount,
      clientApproved: input.clientApproved ?? ["approved", "disbursed"].includes(input.clientApprovalStatus),
      partnerApproved: input.partnerApproved ?? false,
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
      settlementStatementDocumentId: input.settlementStatementDocumentId,
      dischargeDocumentId: input.dischargeDocumentId
    };
    const row = await this.prisma.client.$transaction(async (tx) => {
      const settlement = await tx.piSettlementDistribution.upsert({ where: { personalInjuryId: p.id }, create: { personalInjuryId: p.id, ...data }, update: data });
      if (Array.isArray(deductions)) {
        await tx.piSettlementDeduction.deleteMany({ where: { settlementId: settlement.id } });
        if (deductions.length) await tx.piSettlementDeduction.createMany({ data: deductions.map((d: any) => ({ settlementId: settlement.id, ...d })) });
      }
      return tx.piSettlementDistribution.findUnique({ where: { id: settlement.id }, include: { deductions: true } });
    });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.settlement_updated", entityType: "pi_settlement", entityId: row!.id, matterId, metadata: { netClientAmount: row!.netClientAmount.toString(), clientApproved: row!.clientApproved, partnerApproved: row!.partnerApproved } });
    return row;
  }

  async updateClosure(firmId: string, actorId: string, matterId: string, input: any) {
    const p = await this.profile(firmId, actorId, matterId);
    const data = { ...input, approvedAt: input.supervisorApproved ? new Date() : undefined, approvedById: input.supervisorApproved ? actorId : undefined, archivedAt: input.archivedAt ? new Date(input.archivedAt) : undefined };
    const row = await this.prisma.client.piClosureRecord.upsert({ where: { personalInjuryId: p.id }, create: { personalInjuryId: p.id, ...data }, update: data });
    await this.audit.record({ firmId, actorUserId: actorId, action: "pi.closure_record_updated", entityType: "pi_closure", entityId: row.id, matterId, metadata: { supervisorApproved: row.supervisorApproved, financeReconciled: row.financeReconciled } });
    return row;
  }
}
