import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class CourtService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly access: RecordAccessService) {}

  private async assertMatter(user: RequestUser, matterId: string) {
    if (!(await this.access.canViewMatter(user, matterId))) throw new NotFoundException("Court record not found");
  }

  private async assertMatterDocument(user: RequestUser, matterId: string, documentId?: string, versionId?: string) {
    if (!documentId) return;
    const document = await this.prisma.client.document.findFirst({ where: { id: documentId, matterId, matter: { firmId: user.firmId } }, select: { id: true } });
    if (!document) throw new BadRequestException("Document does not belong to this matter");
    if (versionId) {
      const version = await this.prisma.client.documentVersion.findFirst({ where: { id: versionId, documentId }, select: { id: true } });
      if (!version) throw new BadRequestException("Document version does not belong to the filing document");
    }
  }

  private async filingFor(user: RequestUser, id: string) {
    const filing = await this.prisma.client.courtFilingPackage.findFirst({ where: { id } });
    if (!filing) throw new NotFoundException("Filing package not found");
    await this.assertMatter(user, filing.matterId);
    return filing;
  }

  private async serviceFor(user: RequestUser, id: string) {
    const record = await this.prisma.client.serviceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Service record not found");
    await this.assertMatter(user, record.matterId);
    return record;
  }

  async dashboard(user: RequestUser, from?: Date, to?: Date) {
    const rangeFrom = from ?? new Date();
    const rangeTo = to ?? new Date(Date.now() + 30 * 86400_000);
    const matterIds = (await this.prisma.client.matter.findMany({ where: await this.access.matterWhere(user), select: { id: true } })).map((m) => m.id);
    const [events, filings, service] = await Promise.all([
      this.prisma.client.calendarEvent.findMany({ where: { firmId: user.firmId, eventType: "COURT", startAt: { gte: rangeFrom, lte: rangeTo }, OR: [{ matterId: null }, { matterId: { in: matterIds } }] }, include: { matter: { select: { id: true, internalReference: true, title: true } } }, orderBy: { startAt: "asc" } }),
      this.prisma.client.courtFilingPackage.findMany({ where: { matterId: { in: matterIds }, status: { notIn: ["ACCEPTED", "REJECTED"] } }, orderBy: { updatedAt: "asc" } }),
      this.prisma.client.serviceRecord.findMany({ where: { matterId: { in: matterIds }, status: { notIn: ["FILED", "SERVED"] } }, orderBy: { dueDate: "asc" }, take: 250 })
    ]);
    return { events, filings, service };
  }

  async proceedings(user: RequestUser, matterId?: string) {
    const matterScope = await this.access.matterWhere(user);
    return this.prisma.client.courtProceeding.findMany({ where: { matter: matterId ? { id: matterId, ...matterScope } : matterScope }, include: { filingPackages: true, serviceRecords: { include: { attempts: true } } }, orderBy: { createdAt: "desc" } });
  }

  async createProceeding(user: RequestUser, input: any) {
    await this.assertMatter(user, input.matterId);
    const proceeding = await this.prisma.client.courtProceeding.create({ data: { ...input, filedAt: input.filedAt ? new Date(input.filedAt) : undefined } });
    await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.proceeding_created", entityType: "court_proceeding", entityId: proceeding.id, matterId: input.matterId, metadata: { caseNumber: proceeding.caseNumber, courtName: proceeding.courtName } });
    return proceeding;
  }

  async createFiling(user: RequestUser, input: any) {
    await this.assertMatter(user, input.matterId);
    if (input.proceedingId && !await this.prisma.client.courtProceeding.findFirst({ where: { id: input.proceedingId, matterId: input.matterId } })) throw new BadRequestException("Proceeding does not belong to this matter");
    await this.assertMatterDocument(user, input.matterId, input.documentId, input.documentVersionId);
    const filing = await this.prisma.client.courtFilingPackage.create({ data: { ...input, status: "READY_TO_FILE", submittedAt: undefined, submittedById: undefined, acceptedAt: undefined, verifiedAt: undefined, verifiedById: undefined } });
    await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.filing_package_created", entityType: "court_filing_package", entityId: filing.id, matterId: input.matterId, metadata: { courtStation: filing.courtStation, status: filing.status } });
    return filing;
  }

  async updateFiling(user: RequestUser, id: string, input: Record<string, unknown>) {
    const filing = await this.filingFor(user, id);
    if (["ACCEPTED", "REJECTED"].includes(filing.status)) throw new BadRequestException("Finalized filings cannot be edited; record a correction package");
    await this.assertMatterDocument(user, filing.matterId, input.documentId as string | undefined, input.documentVersionId as string | undefined);
    const updated = await this.prisma.client.courtFilingPackage.update({ where: { id }, data: input as any });
    await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.filing_package_updated", entityType: "court_filing_package", entityId: id, matterId: filing.matterId, metadata: { changedKeys: Object.keys(input) } });
    return updated;
  }

  async transitionFiling(user: RequestUser, id: string, input: any) {
    const filing = await this.filingFor(user, id);
    if (input.action === "SUBMIT") {
      if (!filing.documentId || !filing.documentVersionId || !filing.filingMethod || !input.filingReference?.trim()) throw new BadRequestException("Submitting requires its document/version, filing method, and filing reference");
      const updated = await this.prisma.client.courtFilingPackage.update({ where: { id }, data: { status: "SUBMITTED", submittedAt: new Date(input.submittedAt), submittedById: user.id, filingReference: input.filingReference } });
      await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.filing_submitted", entityType: "court_filing_package", entityId: id, matterId: filing.matterId, metadata: { filingReference: input.filingReference, filingMethod: filing.filingMethod } });
      return updated;
    }
    if (input.action === "ACCEPT") {
      if (!filing.documentId || !filing.documentVersionId || !filing.filingReference || !input.courtReceiptDocumentId) throw new BadRequestException("Accepting requires a submitted document/version, filing reference, and court receipt document");
      await this.assertMatterDocument(user, filing.matterId, input.courtReceiptDocumentId);
      const updated = await this.prisma.client.courtFilingPackage.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: new Date(input.acceptedAt), courtReceiptDocumentId: input.courtReceiptDocumentId, verifiedById: user.id, verifiedAt: new Date() } });
      await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.filing_accepted", entityType: "court_filing_package", entityId: id, matterId: filing.matterId, metadata: { filingReference: filing.filingReference, courtReceiptDocumentId: input.courtReceiptDocumentId } });
      return updated;
    }
    if (input.action === "REJECT") {
      const updated = await this.prisma.client.courtFilingPackage.update({ where: { id }, data: { status: "REJECTED", rejectedAt: new Date(input.rejectedAt), rejectionReason: input.reason, failureReason: input.reason } });
      await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.filing_rejected", entityType: "court_filing_package", entityId: id, matterId: filing.matterId, metadata: { reason: input.reason } });
      return updated;
    }
    throw new BadRequestException("Unknown filing transition");
  }

  async createServiceRecord(user: RequestUser, input: any) {
    await this.assertMatter(user, input.matterId);
    await this.assertMatterDocument(user, input.matterId, input.documentId);
    if (input.proceedingId && !await this.prisma.client.courtProceeding.findFirst({ where: { id: input.proceedingId, matterId: input.matterId } })) throw new BadRequestException("Proceeding does not belong to this matter");
    const record = await this.prisma.client.serviceRecord.create({ data: { ...input, assignedDate: input.assignedDate ? new Date(input.assignedDate) : undefined, dueDate: input.dueDate ? new Date(input.dueDate) : undefined, status: "REQUESTED" } });
    await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.service_requested", entityType: "service_record", entityId: record.id, matterId: input.matterId, metadata: { partyName: record.partyName, dueDate: record.dueDate } });
    return record;
  }

  async addServiceAttempt(user: RequestUser, recordId: string, input: any) {
    const record = await this.serviceFor(user, recordId);
    if (input.served && !input.affidavitDocumentId) throw new BadRequestException("Recording served status requires an affidavit of service document");
    await this.assertMatterDocument(user, record.matterId, input.affidavitDocumentId);
    await this.assertMatterDocument(user, record.matterId, input.substituteServiceOrderDocumentId);
    if (input.nextDeadlineId && !await this.prisma.client.deadline.findFirst({ where: { id: input.nextDeadlineId, matterId: record.matterId }, select: { id: true } })) {
      throw new BadRequestException("Next service deadline does not belong to this matter");
    }
    return this.prisma.client.$transaction(async (tx) => {
      const latest = await tx.serviceAttempt.findFirst({ where: { serviceRecordId: recordId }, orderBy: { attemptNo: "desc" } });
      const attempt = await tx.serviceAttempt.create({ data: { serviceRecordId: recordId, attemptNo: (latest?.attemptNo ?? 0) + 1, attemptedAt: new Date(input.attemptedAt), outcome: input.outcome, serviceAddress: input.serviceAddress, affidavitDocumentId: input.affidavitDocumentId, returnedService: Boolean(input.returnedService), failureReason: input.failureReason, notes: input.notes } });
      const status = input.served ? "SERVED" : input.returnedService ? "RETURNED" : "ATTEMPTED";
      const updated = await tx.serviceRecord.update({ where: { id: recordId }, data: { status, serviceDate: input.served ? new Date(input.attemptedAt) : undefined, affidavitDocumentId: input.affidavitDocumentId ?? record.affidavitDocumentId, affidavitStatus: input.served ? "RECEIVED" : record.affidavitStatus, substituteServiceOrderDocumentId: input.substituteServiceOrderDocumentId ?? record.substituteServiceOrderDocumentId, returnedService: Boolean(input.returnedService), nextAction: input.nextAction ?? record.nextAction, nextDeadlineId: input.nextDeadlineId ?? record.nextDeadlineId } });
      await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.service_attempt_recorded", entityType: "service_record", entityId: recordId, matterId: record.matterId, metadata: { attemptNo: attempt.attemptNo, outcome: attempt.outcome, status: updated.status, affidavitDocumentId: input.affidavitDocumentId } }, tx);
      return { record: updated, attempt };
    });
  }

  async fileAffidavit(user: RequestUser, recordId: string, affidavitDocumentId: string) {
    const record = await this.serviceFor(user, recordId);
    if (record.status !== "SERVED") throw new BadRequestException("Only served records with evidence can have an affidavit filed");
    await this.assertMatterDocument(user, record.matterId, affidavitDocumentId);
    const updated = await this.prisma.client.serviceRecord.update({ where: { id: recordId }, data: { affidavitDocumentId, affidavitStatus: "FILED", status: "FILED" } });
    await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "court.service_affidavit_filed", entityType: "service_record", entityId: recordId, matterId: record.matterId, metadata: { affidavitDocumentId } });
    return updated;
  }
}
