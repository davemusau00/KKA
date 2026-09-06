import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class CourtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async dashboard(firmId: string, from?: Date, to?: Date) {
    const rangeFrom = from ?? new Date();
    const rangeTo = to ?? new Date(Date.now() + 30 * 86400_000);
    const matterIds = (await this.prisma.client.matter.findMany({
      where: { firmId },
      select: { id: true }
    })).map((m) => m.id);
    const [events, filings, service] = await Promise.all([
      this.prisma.client.calendarEvent.findMany({
        where: { firmId, eventType: "COURT", startAt: { gte: rangeFrom, lte: rangeTo } },
        include: { matter: { select: { id: true, internalReference: true, title: true } } },
        orderBy: { startAt: "asc" }
      }),
      this.prisma.client.courtFilingPackage.findMany({
        where: { matterId: { in: matterIds }, status: { notIn: ["STAMPED_FILED", "REJECTED"] } },
        orderBy: { updatedAt: "asc" }
      }),
      this.prisma.client.serviceRecord.findMany({
        where: { matterId: { in: matterIds }, status: { notIn: ["FILED", "SERVED"] } },
        orderBy: { dueDate: "asc" },
        take: 250
      })
    ]);
    return { events, filings, service };
  }

  proceedings(firmId: string, matterId?: string) {
    return this.prisma.client.courtProceeding.findMany({
      where: { matter: { firmId, ...(matterId ? { id: matterId } : {}) } },
      include: { filingPackages: true, serviceRecords: { include: { attempts: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async createProceeding(firmId: string, actorId: string, input: any) {
    const matter = await this.prisma.client.matter.findFirst({ where: { id: input.matterId, firmId } });
    if (!matter) throw new BadRequestException("Matter not found");
    const proceeding = await this.prisma.client.courtProceeding.create({
      data: {
        matterId: input.matterId,
        courtName: input.courtName,
        station: input.station,
        division: input.division,
        caseNumber: input.caseNumber,
        proceedingType: input.proceedingType,
        filedAt: input.filedAt ? new Date(input.filedAt) : undefined,
        judgeOrMagistrate: input.judgeOrMagistrate,
        opposingCounsel: input.opposingCounsel,
        notes: input.notes
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "court.proceeding_created",
      entityType: "court_proceeding", entityId: proceeding.id, matterId: input.matterId,
      metadata: { caseNumber: proceeding.caseNumber, courtName: proceeding.courtName }
    });
    return proceeding;
  }

  async createFiling(firmId: string, actorId: string, input: any) {
    const matter = await this.prisma.client.matter.findFirst({ where: { id: input.matterId, firmId } });
    if (!matter) throw new BadRequestException("Matter not found");
    const filing = await this.prisma.client.courtFilingPackage.create({
      data: {
        matterId: input.matterId,
        proceedingId: input.proceedingId,
        courtStation: input.courtStation,
        division: input.division,
        caseType: input.caseType,
        plaintiff: input.plaintiff,
        defendants: input.defendants ?? [],
        courtAssessmentAmount: input.courtAssessmentAmount,
        feeRequisitionApproved: Boolean(input.feeRequisitionApproved),
        receiptDocumentId: input.receiptDocumentId,
        receiptNumber: input.receiptNumber,
        ctsReference: input.ctsReference,
        courtCaseNumber: input.courtCaseNumber,
        status: input.status ?? "READY_TO_FILE",
        assignedClerkId: input.assignedClerkId
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "court.filing_package_created",
      entityType: "court_filing_package", entityId: filing.id, matterId: input.matterId,
      metadata: { courtStation: filing.courtStation, status: filing.status }
    });
    return filing;
  }

  async updateFiling(firmId: string, actorId: string, id: string, input: Record<string, unknown>) {
    const filing = await this.prisma.client.courtFilingPackage.findFirst({
      where: { id },
    });
    if (!filing) throw new NotFoundException("Filing package not found");
    const matter = await this.prisma.client.matter.findFirst({ where: { id: filing.matterId, firmId } });
    if (!matter) throw new NotFoundException("Filing package not found");
    const updated = await this.prisma.client.courtFilingPackage.update({
      where: { id },
      data: input as any
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "court.filing_package_updated",
      entityType: "court_filing_package", entityId: id, matterId: filing.matterId,
      metadata: { changedKeys: Object.keys(input) }
    });
    return updated;
  }

  async createServiceRecord(firmId: string, actorId: string, input: any) {
    const matter = await this.prisma.client.matter.findFirst({ where: { id: input.matterId, firmId } });
    if (!matter) throw new BadRequestException("Matter not found");
    const record = await this.prisma.client.serviceRecord.create({
      data: {
        matterId: input.matterId,
        proceedingId: input.proceedingId,
        documentId: input.documentId,
        partyName: input.partyName,
        partyAddress: input.partyAddress,
        processServerName: input.processServerName,
        assignedDate: input.assignedDate ? new Date(input.assignedDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        serviceMethod: input.serviceMethod,
        notes: input.notes,
        status: "REQUESTED"
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "court.service_requested",
      entityType: "service_record", entityId: record.id, matterId: input.matterId,
      metadata: { partyName: record.partyName, dueDate: record.dueDate }
    });
    return record;
  }

  async addServiceAttempt(firmId: string, actorId: string, recordId: string, input: any) {
    const record = await this.prisma.client.serviceRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException("Service record not found");
    const matter = await this.prisma.client.matter.findFirst({ where: { id: record.matterId, firmId } });
    if (!matter) throw new NotFoundException("Service record not found");
    const latest = await this.prisma.client.serviceAttempt.findFirst({
      where: { serviceRecordId: recordId },
      orderBy: { attemptNo: "desc" }
    });
    const attempt = await this.prisma.client.serviceAttempt.create({
      data: {
        serviceRecordId: recordId,
        attemptNo: (latest?.attemptNo ?? 0) + 1,
        attemptedAt: new Date(input.attemptedAt),
        outcome: input.outcome,
        notes: input.notes
      }
    });
    await this.prisma.client.serviceRecord.update({
      where: { id: recordId },
      data: {
        status: input.served ? "SERVED" : "ATTEMPTED",
        serviceDate: input.served ? new Date(input.attemptedAt) : undefined
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "court.service_attempt_recorded",
      entityType: "service_record", entityId: recordId, matterId: record.matterId,
      metadata: { attemptNo: attempt.attemptNo, outcome: attempt.outcome, served: Boolean(input.served) }
    });
    return attempt;
  }
}
