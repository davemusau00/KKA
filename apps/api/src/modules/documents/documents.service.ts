import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { StorageService } from "../../platform/storage/storage.service";
import { AuditService } from "../../platform/audit/audit.service";
import { QueueService, QUEUES } from "../../platform/queue/queue.service";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly queues: QueueService
  ) {}

  list(firmId: string, matterId?: string, q?: string) {
    return this.prisma.client.document.findMany({
      where: {
        matter: { firmId, ...(matterId ? { id: matterId } : {}) },
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { documentType: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } }
          ]
        } : {})
      },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 10 },
        currentVersion: true
      },
      orderBy: { updatedAt: "desc" },
      take: 1000
    });
  }

  async createMetadata(
    firmId: string,
    actorId: string,
    input: {
      matterId: string;
      title: string;
      category: string;
      documentType: string;
      confidentialityLevel: "STANDARD" | "RESTRICTED" | "PARTNER_ONLY" | "SEALED";
    }
  ) {
    const matter = await this.prisma.client.matter.findFirst({ where: { id: input.matterId, firmId } });
    if (!matter) throw new BadRequestException("Matter not found");
    const doc = await this.prisma.client.document.create({
      data: { ...input, ownerUserId: actorId }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "document.created",
      entityType: "document", entityId: doc.id, matterId: doc.matterId,
      metadata: { title: doc.title, documentType: doc.documentType }
    });
    return doc;
  }

  async uploadVersion(
    firmId: string,
    actorId: string,
    documentId: string,
    file: { filename: string; mimetype: string; buffer: Buffer },
    changeSummary?: string
  ) {
    const document = await this.prisma.client.document.findFirst({
      where: { id: documentId, matter: { firmId } },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });
    if (!document) throw new NotFoundException("Document not found");

    const stored = await this.storage.putDocument({
      filename: file.filename,
      mimeType: file.mimetype,
      buffer: file.buffer
    });
    const versionNumber = (document.versions[0]?.versionNumber ?? 0) + 1;

    const version = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.documentVersion.create({
        data: {
          documentId,
          versionNumber,
          storageDriver: stored.driver,
          storagePath: stored.path,
          originalFilename: stored.originalFilename,
          mimeType: stored.mimeType,
          fileSizeBytes: BigInt(stored.sizeBytes),
          checksumSha256: stored.checksumSha256,
          uploadedById: actorId,
          status: "DRAFT",
          changeSummary
        }
      });
      await tx.document.update({
        where: { id: documentId },
        data: { currentVersionId: created.id, updatedAt: new Date() }
      });
      return created;
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "document.version_uploaded",
      entityType: "document_version", entityId: version.id, matterId: document.matterId,
      metadata: {
        documentId, versionNumber, filename: stored.originalFilename,
        sizeBytes: stored.sizeBytes, checksumSha256: stored.checksumSha256
      }
    });
    await this.queues.add(QUEUES.documents, "document.inspect", { versionId: version.id });
    return version;
  }

  async getVersionForDownload(firmId: string, versionId: string) {
    const version = await this.prisma.client.documentVersion.findFirst({
      where: { id: versionId, document: { matter: { firmId } } },
      include: { document: true }
    });
    if (!version) throw new NotFoundException("Document version not found");
    const stream = await this.storage.openDocument(version.storagePath);
    return { version, stream };
  }

  async submitForReview(firmId: string, actorId: string, documentId: string, reviewerId: string, comment?: string) {
    const document = await this.prisma.client.document.findFirst({
      where: { id: documentId, matter: { firmId } },
      include: { currentVersion: true }
    });
    if (!document?.currentVersion) throw new BadRequestException("Document has no current version");
    await this.prisma.client.$transaction([
      this.prisma.client.documentReview.create({
        data: {
          versionId: document.currentVersion.id,
          reviewerId,
          comment
        }
      }),
      this.prisma.client.documentVersion.update({
        where: { id: document.currentVersion.id },
        data: { status: "IN_REVIEW" }
      })
    ]);
    await this.audit.record({
      firmId, actorUserId: actorId, action: "document.review_requested",
      entityType: "document", entityId: documentId, matterId: document.matterId,
      metadata: { versionId: document.currentVersion.id, reviewerId }
    });
    return this.prisma.client.document.findUnique({
      where: { id: documentId },
      include: { currentVersion: true, versions: true }
    });
  }

  async decideReview(
    firmId: string,
    actorId: string,
    documentId: string,
    decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
    comment?: string
  ) {
    const document = await this.prisma.client.document.findFirst({
      where: { id: documentId, matter: { firmId } },
      include: { currentVersion: true }
    });
    if (!document?.currentVersion) throw new BadRequestException("Document has no current version");

    const review = await this.prisma.client.documentReview.findFirst({
      where: { versionId: document.currentVersion.id, reviewerId: actorId, decidedAt: null },
      orderBy: { requestedAt: "desc" }
    });
    if (!review) throw new BadRequestException("No pending review assigned to this user");

    const status = decision === "APPROVED" ? "APPROVED" : "REJECTED";
    await this.prisma.client.$transaction([
      this.prisma.client.documentReview.update({
        where: { id: review.id },
        data: { decision, comment, decidedAt: new Date() }
      }),
      this.prisma.client.documentVersion.update({
        where: { id: document.currentVersion.id },
        data: {
          status,
          reviewedById: actorId,
          reviewedAt: new Date(),
          reviewComment: comment
        }
      })
    ]);

    await this.audit.record({
      firmId, actorUserId: actorId, action: `document.review_${decision.toLowerCase()}`,
      entityType: "document", entityId: documentId, matterId: document.matterId,
      metadata: { versionId: document.currentVersion.id, comment }
    });
    return { ok: true, status };
  }

  async markFiled(firmId: string, actorId: string, documentId: string, filingRef: string) {
    const document = await this.prisma.client.document.findFirst({
      where: { id: documentId, matter: { firmId } },
      include: { currentVersion: true }
    });
    if (!document?.currentVersion) throw new BadRequestException("Document has no current version");
    if (!["APPROVED", "SIGNED", "FILED"].includes(document.currentVersion.status)) {
      throw new BadRequestException("Only approved or signed document versions can be marked filed");
    }
    const version = await this.prisma.client.documentVersion.update({
      where: { id: document.currentVersion.id },
      data: { status: "FILED", courtFilingRef: filingRef, courtFiledAt: new Date() }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "document.filed",
      entityType: "document", entityId: documentId, matterId: document.matterId,
      metadata: { versionId: version.id, filingRef }
    });
    return version;
  }
}
