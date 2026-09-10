import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { NumberingService } from "../numbering/numbering.service";
import { ClientsService } from "../clients/clients.service";
import { MattersService } from "../matters/matters.service";

@Injectable()
export class IntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly clients: ClientsService,
    private readonly matters: MattersService
  ) {}

  list(firmId: string, disposition?: string) {
    return this.prisma.client.intake.findMany({
      where: { firmId, ...(disposition ? { disposition } : {}) },
      include: { parties: true, conflictChecks: { orderBy: { checkedAt: "desc" }, take: 1 }, kycRecords: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async get(firmId: string, id: string) {
    const intake = await this.prisma.client.intake.findFirst({
      where: { id, firmId },
      include: { parties: true, conflictChecks: { orderBy: { checkedAt: "desc" } }, kycRecords: true }
    });
    if (!intake) throw new NotFoundException("Intake not found");
    return intake;
  }

  async create(firmId: string, actorId: string, input: Record<string, any>, transaction?: import("@kka/database").Prisma.TransactionClient) {
    const client=transaction ?? this.prisma.client;
    const intakeNumber = await this.numbering.next({
      firmId,
      entityType: "INTAKE",
      year: new Date().getFullYear(),
      pattern: "KKA/IN/{year}/{seq:5}"
    }, client);
    const intake = await client.intake.create({
      data: {
        firmId,
        intakeNumber,
        ...input,
        incidentDate: input.incidentDate ? new Date(input.incidentDate) : undefined
      } as any
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "intake.created",
      entityType: "intake", entityId: intake.id, metadata: { intakeNumber }
    }, transaction);
    return intake;
  }

  async update(firmId: string, actorId: string, intakeId: string, input: Record<string, any>) {
    const existing = await this.prisma.client.intake.findFirst({ where: { id: intakeId, firmId } });
    if (!existing) throw new NotFoundException("Intake not found");
    if (existing.disposition === "CONVERTED") throw new BadRequestException("Converted intakes are immutable");
    const intake = await this.prisma.client.intake.update({
      where: { id: intakeId },
      data: { ...input, ...(input.incidentDate ? { incidentDate: new Date(input.incidentDate) } : {}) } as any,
      include: { parties: true, conflictChecks: { orderBy: { checkedAt: "desc" }, take: 1 }, kycRecords: true }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "intake.updated",
      entityType: "intake", entityId: intakeId, metadata: { fields: Object.keys(input) }
    });
    return intake;
  }

  addParty(firmId: string, actorId: string, intakeId: string, input: Record<string, any>) {
    return this.prisma.client.intakeParty.create({
      data: { intakeId, ...input } as any
    }).then(async (party) => {
      await this.audit.record({
        firmId, actorUserId: actorId, action: "intake.party_added",
        entityType: "intake_party", entityId: party.id, metadata: { intakeId, role: party.role }
      });
      return party;
    });
  }

  async runConflictSearch(firmId: string, actorId: string, intakeId: string) {
    const intake = await this.get(firmId, intakeId);
    const searchTerms = [
      intake.clientName,
      intake.nationalId,
      ...intake.parties.flatMap((p) => [p.name, p.idOrRegNumber])
    ].filter((v): v is string => Boolean(v?.trim()));

    const matches: Array<Record<string, unknown>> = [];
    for (const term of Array.from(new Set(searchTerms))) {
      const clients = await this.prisma.client.client.findMany({
        where: {
          firmId,
          OR: [
            { displayName: { contains: term, mode: "insensitive" } },
            { idNumber: { equals: term, mode: "insensitive" } }
          ]
        },
        take: 10
      });
      for (const c of clients) {
        matches.push({
          partyName: term, matchedEntity: "client", matchedEntityId: c.id,
          matchType: c.idNumber?.toLowerCase() === term.toLowerCase() ? "id_number" : "name",
          severity: c.idNumber?.toLowerCase() === term.toLowerCase() ? "HIGH" : "MEDIUM",
          display: c.displayName
        });
      }

      const parties = await this.prisma.client.matterParty.findMany({
        where: {
          matter: { firmId },
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { idNumber: { equals: term, mode: "insensitive" } }
          ]
        },
        include: { matter: { select: { internalReference: true, title: true } } },
        take: 20
      });
      for (const p of parties) {
        matches.push({
          partyName: term, matchedEntity: "matter_party", matchedEntityId: p.id,
          matterId: p.matterId, matterRef: p.matter.internalReference, role: p.partyType,
          severity: ["defendant", "advocate_opposing"].includes(p.partyType.toLowerCase()) ? "HIGH" : "MEDIUM",
          display: p.name
        });
      }
    }

    const status = matches.some((m) => m.severity === "HIGH") ? "POSSIBLE_MATCH" : "CLEAR";
    const check = await this.prisma.client.conflictCheck.create({
      data: {
        intakeId,
        checkedByUserId: actorId,
        status,
        partiesSearched: searchTerms,
        matchesFound: matches as any
      }
    });
    await this.prisma.client.intake.update({
      where: { id: intakeId },
      data: { disposition: status === "CLEAR" ? "CONFLICT_CLEARED" : "UNDER_REVIEW" }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "intake.conflict_checked",
      entityType: "intake", entityId: intakeId, metadata: { status, matchCount: matches.length }
    });
    return check;
  }

  async clearConflict(firmId: string, actorId: string, intakeId: string, notes?: string) {
    const latest = await this.prisma.client.conflictCheck.findFirst({
      where: { intakeId },
      orderBy: { checkedAt: "desc" }
    });
    if (!latest) throw new BadRequestException("Run a conflict search first");
    const check = await this.prisma.client.conflictCheck.update({
      where: { id: latest.id },
      data: {
        status: "OVERRIDDEN_APPROVED",
        clearanceNotes: notes,
        clearedByPartnerId: actorId,
        clearedAt: new Date()
      }
    });
    await this.prisma.client.intake.update({
      where: { id: intakeId },
      data: { disposition: "CONFLICT_CLEARED" }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "intake.conflict_cleared",
      entityType: "intake", entityId: intakeId, metadata: { notes }
    });
    return check;
  }

  async upsertKyc(firmId: string, actorId: string, intakeId: string, input: Record<string, any>) {
    await this.get(firmId, intakeId);
    const existing = await this.prisma.client.kycRecord.findFirst({ where: { intakeId } });
    const data = {
      idDocumentType: String(input.idDocumentType),
      idNumber: String(input.idNumber),
      idVerified: Boolean(input.idVerified),
      kycDocumentIds: Array.isArray(input.kycDocumentIds) ? input.kycDocumentIds.map(String) : [],
      warrantToActSigned: Boolean(input.warrantToActSigned),
      retainerAgreementSigned: Boolean(input.retainerAgreementSigned),
      retainerAgreedAmount: input.retainerAgreedAmount,
      retainerDepositPaid: Boolean(input.retainerDepositPaid),
      depositReceiptRef: input.depositReceiptRef ? String(input.depositReceiptRef) : undefined,
      termsAccepted: Boolean(input.termsAccepted),
      partnerApproval: String(input.partnerApproval ?? "PENDING"),
      approvedByUserId: input.partnerApproval === "APPROVED" ? actorId : undefined,
      approvedAt: input.partnerApproval === "APPROVED" ? new Date() : undefined
    };
    const record = existing
      ? await this.prisma.client.kycRecord.update({ where: { id: existing.id }, data })
      : await this.prisma.client.kycRecord.create({ data: { intakeId, ...data } });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "intake.kyc_updated",
      entityType: "intake", entityId: intakeId, metadata: { idVerified: record.idVerified, partnerApproval: record.partnerApproval }
    });
    return record;
  }

  async convert(
    firmId: string,
    actorId: string,
    intakeId: string,
    options: {
      supervisingUserId: string;
      responsibleBranchId: string;
      originatingBranchId: string;
      legalEntityId?: string;
      workflowVersionId?: string;
      stageOwnerId?: string;
      courtClerkId?: string;
      financeContactId?: string;
      initialAction?: string;
    }
  ) {
    const converted = await this.prisma.client.$transaction(async (tx) => {
      const intake = await tx.intake.findFirst({
        where: { id: intakeId, firmId },
        include: { parties: true, conflictChecks: { orderBy: { checkedAt: "desc" }, take: 1 }, kycRecords: { orderBy: { updatedAt: "desc" }, take: 1 } }
      });
      if (!intake) throw new NotFoundException("Intake not found");
      if (intake.convertedMatterId) return { alreadyConverted: true, matterId: intake.convertedMatterId };

      const conflict = intake.conflictChecks[0];
      if (!conflict || !["CLEAR", "OVERRIDDEN_APPROVED"].includes(conflict.status)) throw new BadRequestException("Conflict clearance is required before conversion");
      const kyc = intake.kycRecords[0];
      if (!kyc?.idVerified || !kyc.warrantToActSigned || !kyc.retainerAgreementSigned || kyc.partnerApproval !== "APPROVED") throw new BadRequestException("KYC, authority to act, retainer and partner approval must be complete");

      let clientId = intake.clientId;
      if (!clientId) {
        const clientNumber = await this.numbering.next({ firmId, entityType: "CLIENT", year: new Date().getFullYear(), pattern: "KKA/CL/{year}/{seq:5}" }, tx);
        const client = await tx.client.create({ data: { firmId, clientNumber, type: "PERSON", displayName: intake.clientName, idNumber: intake.nationalId, phone: intake.phone, email: intake.email, preferredContactMethod: "PHONE", kycStatus: "VERIFIED" } });
        clientId = client.id;
      }

      const practiceCode = intake.practiceArea.toLowerCase().includes("personal") ? "PI" : "GEN";
      const matter = await this.matters.createInTransaction(tx, firmId, {
        clientId, legalEntityId: options.legalEntityId,
        title: `${intake.clientName} - ${intake.matterType ?? intake.practiceArea}`,
        practiceArea: intake.practiceArea, practiceCode, matterType: intake.matterType ?? intake.practiceArea,
        workflowVersionId: options.workflowVersionId, originatingBranchId: options.originatingBranchId,
        responsibleBranchId: options.responsibleBranchId, supervisingUserId: options.supervisingUserId,
        currentStageOwnerId: options.stageOwnerId, courtClerkId: options.courtClerkId, financeContactId: options.financeContactId,
        priority: "MEDIUM", summary: intake.briefDescription, nextAction: options.initialAction ?? "Complete opening workflow"
      });

      await tx.intake.update({ where: { id: intakeId }, data: { disposition: "CONVERTED", convertedMatterId: matter.id, clientId } });
      if (intake.parties.length) {
        await tx.matterParty.createMany({ data: intake.parties.map((party) => ({ matterId: matter.id, partyType: party.role, name: party.name, idNumber: party.idOrRegNumber, phone: party.phone, email: party.email, organizationName: party.insuranceCompany, notes: party.notes })) });
      }
      return { alreadyConverted: false, matterId: matter.id };
    });

    const matter = await this.matters.get(firmId, converted.matterId);
    if (converted.alreadyConverted) return matter;

    await this.audit.record({
      firmId, actorUserId: actorId, action: "intake.converted",
      entityType: "intake", entityId: intakeId, matterId: matter.id, clientId: matter.clientId,
      metadata: { internalReference: matter.internalReference }
    });
    return matter;
  }
}
