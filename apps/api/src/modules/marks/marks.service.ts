import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { StorageService } from "../../platform/storage/storage.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RedisService } from "../../platform/redis/redis.service";

function pageIndexes(selection: string, total: number, config: any): number[] {
  if (selection === "FIRST") return [0];
  if (selection === "LAST") return [Math.max(0, total - 1)];
  if (selection === "ALL") return Array.from({ length: total }, (_, i) => i);
  if (selection === "EXPLICIT" && Array.isArray(config?.pages)) {
    return config.pages
      .map((n: unknown) => Number(n) - 1)
      .filter((n: number) => Number.isInteger(n) && n >= 0 && n < total);
  }
  return [Math.max(0, total - 1)];
}

@Injectable()
export class MarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly redis: RedisService
  ) {}

  listAssets(firmId: string) {
    return this.prisma.client.firmMarkAsset.findMany({
      where: { firmId },
      include: { versions: { orderBy: { version: "desc" } } },
      orderBy: [{ active: "desc" }, { displayName: "asc" }]
    });
  }

  async createAsset(firmId: string, actorId: string, input: any) {
    const asset = await this.prisma.client.firmMarkAsset.create({
      data: {
        firmId,
        branchId: input.branchId,
        displayName: input.displayName,
        type: input.type,
        description: input.description,
        intendedUse: input.intendedUse,
        permittedRoleKeys: input.permittedRoleKeys,
        permittedUserIds: input.permittedUserIds,
        allowedDocumentTypes: input.allowedDocumentTypes,
        allowedMatterTypes: input.allowedMatterTypes,
        canApplyAutomatically: input.canApplyAutomatically,
        requiresApproval: input.requiresApproval,
        approvalRoleKeys: input.approvalRoleKeys,
        createdById: actorId
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "mark.asset_created",
      entityType: "firm_mark_asset", entityId: asset.id,
      metadata: { type: asset.type, displayName: asset.displayName }
    });
    return asset;
  }

  async uploadAssetVersion(
    firmId: string,
    actorId: string,
    assetId: string,
    file: { filename: string; mimetype: string; buffer: Buffer }
  ) {
    const asset = await this.prisma.client.firmMarkAsset.findFirst({ where: { id: assetId, firmId } });
    if (!asset) throw new NotFoundException("Mark asset not found");
    if (!["image/png", "image/jpeg"].includes(file.mimetype)) {
      throw new BadRequestException("Firm marks must currently be PNG or JPEG");
    }

    const stored = await this.storage.putMark({
      filename: file.filename,
      mimeType: file.mimetype,
      buffer: file.buffer
    });
    const latest = await this.prisma.client.firmMarkAssetVersion.findFirst({
      where: { assetId },
      orderBy: { version: "desc" }
    });
    const version = await this.prisma.client.firmMarkAssetVersion.create({
      data: {
        assetId,
        version: (latest?.version ?? 0) + 1,
        storagePath: stored.path,
        mimeType: stored.mimeType,
        checksumSha256: stored.checksumSha256,
        transparentReady: stored.mimeType === "image/png",
        createdById: actorId
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "mark.asset_version_uploaded",
      entityType: "firm_mark_asset_version", entityId: version.id,
      metadata: { assetId, version: version.version, checksumSha256: version.checksumSha256 }
    });
    return version;
  }

  async createPlacement(firmId: string, actorId: string, input: any) {
    const preset = await this.prisma.client.documentPlacementPreset.create({
      data: {
        firmId,
        name: input.name,
        pageSelection: input.pageSelection ?? "LAST",
        anchorType: input.anchorType ?? "PAGE",
        anchorName: input.anchorName,
        xPoints: input.xPoints,
        yPoints: input.yPoints,
        widthPoints: input.widthPoints,
        heightPoints: input.heightPoints,
        scale: input.scale ?? 1,
        rotation: input.rotation ?? 0,
        opacity: input.opacity ?? 1,
        constraints: input.constraints ?? {}
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "mark.placement_created",
      entityType: "document_placement_preset", entityId: preset.id, metadata: { name: preset.name }
    });
    return preset;
  }

  placements(firmId: string) {
    return this.prisma.client.documentPlacementPreset.findMany({ where: { firmId, active: true }, orderBy: { name: "asc" } });
  }

  policies(firmId: string) {
    return this.prisma.client.documentMarkPolicy.findMany({ where: { firmId }, orderBy: { name: "asc" } });
  }

  async createPolicy(firmId: string, actorId: string, input: any) {
    const row = await this.prisma.client.documentMarkPolicy.create({ data: { firmId, ...input } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "mark.policy_created", entityType: "document_mark_policy", entityId: row.id, metadata: { name: row.name } });
    return row;
  }

  executionBlocks(firmId: string) {
    return this.prisma.client.executionBlockTemplate.findMany({ where: { firmId }, include: { versions: { orderBy: { version: "desc" } } }, orderBy: { name: "asc" } });
  }

  async createExecutionBlock(firmId: string, actorId: string, input: any) {
    const row = await this.prisma.client.executionBlockTemplate.create({
      data: { firmId, branchId: input.branchId, name: input.name, documentTypes: input.documentTypes ?? [], signerRoleKeys: input.signerRoleKeys ?? [], active: true,
        versions: { create: { version: 1, definition: input.definition, createdById: actorId, effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined } } },
      include: { versions: true }
    });
    await this.audit.record({ firmId, actorUserId: actorId, action: "mark.execution_block_created", entityType: "execution_block_template", entityId: row.id, metadata: { name: row.name } });
    return row;
  }

  async addExecutionBlockVersion(firmId: string, actorId: string, templateId: string, input: any) {
    const t = await this.prisma.client.executionBlockTemplate.findFirst({ where: { id: templateId, firmId } });
    if (!t) throw new NotFoundException("Execution block template not found");
    const latest = await this.prisma.client.executionBlockTemplateVersion.findFirst({ where: { templateId }, orderBy: { version: "desc" } });
    return this.prisma.client.executionBlockTemplateVersion.create({ data: { templateId, version: (latest?.version ?? 0) + 1, definition: input.definition, effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined, effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined, createdById: actorId } });
  }

  async upsertSignatureProfile(firmId: string, actorId: string, input: any) {
    const user = await this.prisma.client.user.findFirst({ where: { id: input.userId, firmId } });
    if (!user) throw new NotFoundException("User not found");
    const row = await this.prisma.client.signatureProfile.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, professionalDisplayName: input.professionalDisplayName, postNominals: input.postNominals, jobTitle: input.jobTitle, admissionNumber: input.admissionNumber, typedSignatureAllowed: input.typedSignatureAllowed ?? false, approvalStatus: input.approvalStatus ?? "PENDING" },
      update: { professionalDisplayName: input.professionalDisplayName, postNominals: input.postNominals, jobTitle: input.jobTitle, admissionNumber: input.admissionNumber, typedSignatureAllowed: input.typedSignatureAllowed ?? false, approvalStatus: input.approvalStatus ?? "PENDING" }
    });
    await this.audit.record({ firmId, actorUserId: actorId, action: "signature.profile_upserted", entityType: "signature_profile", entityId: row.id, metadata: { userId: row.userId, approvalStatus: row.approvalStatus } });
    return row;
  }

  async uploadSignatureAsset(firmId: string, actorId: string, profileId: string, file: { filename: string; mimetype: string; buffer: Buffer }) {
    const profile = await this.prisma.client.signatureProfile.findFirst({ where: { id: profileId, user: { firmId } } });
    if (!profile) throw new NotFoundException("Signature profile not found");
    if (!["image/png", "image/jpeg"].includes(file.mimetype)) throw new BadRequestException("Signature assets must be PNG or JPEG");
    const stored = await this.storage.putMark({ filename: file.filename, mimeType: file.mimetype, buffer: file.buffer });
    const latest = await this.prisma.client.signatureAssetVersion.findFirst({ where: { profileId }, orderBy: { version: "desc" } });
    const row = await this.prisma.client.signatureAssetVersion.create({ data: { profileId, version: (latest?.version ?? 0) + 1, storagePath: stored.path, mimeType: stored.mimeType, checksumSha256: stored.checksumSha256 } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "signature.asset_uploaded", entityType: "signature_asset_version", entityId: row.id, metadata: { profileId, version: row.version } });
    return row;
  }

  async createDelegation(firmId: string, actorId: string, input: any) {
    const profile = await this.prisma.client.signatureProfile.findFirst({ where: { id: input.delegatorProfileId, user: { firmId } } });
    if (!profile) throw new NotFoundException("Delegator profile not found");
    const row = await this.prisma.client.signatureDelegation.create({ data: { delegatorProfileId: input.delegatorProfileId, delegateUserId: input.delegateUserId, allowedActions: input.allowedActions ?? [], allowedMatterTypes: input.allowedMatterTypes ?? [], allowedDocumentTypes: input.allowedDocumentTypes ?? [], startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), reason: input.reason } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "signature.delegation_created", entityType: "signature_delegation", entityId: row.id, metadata: { delegateUserId: row.delegateUserId, endsAt: row.endsAt } });
    return row;
  }

  async apply(
    firmId: string,
    actor: { id: string; roleKeys: string[] },
    input: {
      documentId: string;
      inputVersionId: string;
      markAssetId: string;
      markAssetVersionId: string;
      placementPresetId?: string;
      executionBlockVersionId?: string;
      signerUserId?: string;
      reason?: string;
      elevationToken?: string;
    }
  ) {
    const document = await this.prisma.client.document.findFirst({
      where: { id: input.documentId, matter: { firmId } },
      include: { matter: true }
    });
    if (!document) throw new NotFoundException("Document not found");

    const version = await this.prisma.client.documentVersion.findFirst({
      where: { id: input.inputVersionId, documentId: document.id }
    });
    if (!version) throw new NotFoundException("Input document version not found");
    if (version.mimeType !== "application/pdf") {
      throw new BadRequestException("Mark application currently requires a PDF input version");
    }

    const asset = await this.prisma.client.firmMarkAsset.findFirst({
      where: { id: input.markAssetId, firmId, active: true }
    });
    if (!asset) throw new NotFoundException("Firm mark asset not found");

    if (asset.permittedUserIds.length && !asset.permittedUserIds.includes(actor.id)) {
      const permittedByRole = actor.roleKeys.some((role) => asset.permittedRoleKeys.includes(role));
      if (!permittedByRole) throw new ForbiddenException("User is not allowed to apply this mark");
    } else if (asset.permittedRoleKeys.length &&
               !actor.roleKeys.some((role) => asset.permittedRoleKeys.includes(role))) {
      throw new ForbiddenException("User role is not allowed to apply this mark");
    }

    if (asset.allowedDocumentTypes.length && !asset.allowedDocumentTypes.includes(document.documentType)) {
      throw new BadRequestException("This mark is not permitted for this document type");
    }
    if (asset.allowedMatterTypes.length && !asset.allowedMatterTypes.includes(document.matter.matterType)) {
      throw new BadRequestException("This mark is not permitted for this matter type");
    }

    const policy = await this.prisma.client.documentMarkPolicy.findFirst({
      where: {
        firmId, active: true,
        OR: [
          { documentTypes: { isEmpty: true } },
          { documentTypes: { has: document.documentType } }
        ],
        AND: [{ OR: [
          { matterTypes: { isEmpty: true } },
          { matterTypes: { has: document.matter.matterType } }
        ] }]
      },
      orderBy: { updatedAt: "desc" }
    });
    if (policy && policy.allowedMarkAssetTypes.length && !policy.allowedMarkAssetTypes.includes(asset.type)) {
      throw new ForbiddenException("The active document mark policy does not permit this mark type");
    }
    if (policy?.requiresReviewComplete && !["APPROVED", "SIGNED", "FILED", "SERVED"].includes(version.status)) {
      throw new BadRequestException("Document review/approval must be complete before this mark may be applied");
    }
    if (policy?.requiresReauth) {
      if (!input.elevationToken) throw new ForbiddenException("Re-authentication is required before applying this mark");
      const raw = await this.redis.client.get(`elevation:${input.elevationToken}`);
      const elevation = raw ? JSON.parse(raw) as { userId?: string } : null;
      if (!elevation || elevation.userId !== actor.id) throw new ForbiddenException("Re-authentication token is invalid or expired");
    }

    if (asset.requiresApproval || policy?.requiresApproval) {
      const approval = await this.prisma.client.approvalRequest.create({
        data: {
          firmId,
          type: "DOCUMENT_MARK",
          entityType: "Document",
          entityId: document.id,
          requestedById: actor.id,
          requiredRoleKeys: Array.from(new Set([...(asset.approvalRoleKeys ?? []), ...(policy?.approvalRoleKeys ?? [])])),
          assignedUserIds: [],
          payload: input as any,
          reason: input.reason
        }
      });
      return { status: "PENDING_APPROVAL", approvalRequestId: approval.id };
    }

    return this.applyApproved(firmId, actor.id, input);
  }

  async applyApproved(firmId: string, actorId: string, input: any) {
    const document = await this.prisma.client.document.findFirst({
      where: { id: input.documentId, matter: { firmId } },
      include: { matter: true }
    });
    if (!document) throw new NotFoundException("Document not found");
    const version = await this.prisma.client.documentVersion.findFirst({
      where: { id: input.inputVersionId, documentId: document.id }
    });
    if (!version) throw new NotFoundException("Input version not found");

    const assetVersion = await this.prisma.client.firmMarkAssetVersion.findFirst({
      where: { id: input.markAssetVersionId, assetId: input.markAssetId }
    });
    if (!assetVersion) throw new NotFoundException("Mark asset version not found");

    const placement = input.placementPresetId
      ? await this.prisma.client.documentPlacementPreset.findFirst({
          where: { id: input.placementPresetId, firmId, active: true }
        })
      : null;

    const executionVersion = input.executionBlockVersionId
      ? await this.prisma.client.executionBlockTemplateVersion.findUnique({
          where: { id: input.executionBlockVersionId }
        })
      : null;

    const inputBuffer = await this.storage.readDocument(version.storagePath);
    const markBuffer = await this.storage.readMark(assetVersion.storagePath);
    const pdf = await PDFDocument.load(inputBuffer, { ignoreEncryption: false });
    const markImage = assetVersion.mimeType === "image/png"
      ? await pdf.embedPng(markBuffer)
      : await pdf.embedJpg(markBuffer);

    const pages = pdf.getPages();
    const p = placement ?? {
      pageSelection: "LAST",
      xPoints: 430,
      yPoints: 45,
      widthPoints: 130,
      heightPoints: 55,
      scale: 1,
      rotation: 0,
      opacity: 1,
      constraints: {}
    } as any;
    const selected = pageIndexes(p.pageSelection, pages.length, p.constraints);

    const resolved: any[] = [];
    for (const pageIndex of selected) {
      const page = pages[pageIndex]!;
      const width = Number(p.widthPoints ?? 130) * Number(p.scale ?? 1);
      const height = Number(p.heightPoints ?? (width * markImage.height / markImage.width));
      const x = Math.max(0, Math.min(Number(p.xPoints ?? 430), page.getWidth() - width));
      const y = Math.max(0, Math.min(Number(p.yPoints ?? 45), page.getHeight() - height));
      page.drawImage(markImage, {
        x, y, width, height,
        rotate: degrees(Number(p.rotation ?? 0)),
        opacity: Number(p.opacity ?? 1)
      });
      resolved.push({ page: pageIndex + 1, x, y, width, height, rotation: p.rotation ?? 0, opacity: p.opacity ?? 1 });
    }

    if (executionVersion) {
      const definition = executionVersion.definition as any;
      const pageIndex = Math.max(0, Math.min(Number(definition.page ?? pages.length) - 1, pages.length - 1));
      const page = pages[pageIndex]!;
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const x = Number(definition.xPoints ?? 55);
      const y = Number(definition.yPoints ?? 85);
      const color = rgb(0.08, 0.12, 0.2);
      if (definition.headingText) page.drawText(String(definition.headingText), { x, y: y + 34, size: 8, font, color });
      if (definition.signatoryText) page.drawText(String(definition.signatoryText), { x, y: y + 18, size: 10, font: bold, color });
      if (definition.roleText) page.drawText(String(definition.roleText), { x, y: y + 4, size: 7, font, color });
    }

    const outputBuffer = Buffer.from(await pdf.save());
    const stored = await this.storage.putDocument({
      filename: version.originalFilename.replace(/\.pdf$/i, "") + "-marked.pdf",
      mimeType: "application/pdf",
      buffer: outputBuffer
    });

    const latest = await this.prisma.client.documentVersion.findFirst({
      where: { documentId: document.id },
      orderBy: { versionNumber: "desc" }
    });
    const outputVersion = await this.prisma.client.$transaction(async (tx) => {
      const out = await tx.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: (latest?.versionNumber ?? version.versionNumber) + 1,
          storageDriver: stored.driver,
          storagePath: stored.path,
          originalFilename: stored.originalFilename,
          mimeType: stored.mimeType,
          fileSizeBytes: BigInt(stored.sizeBytes),
          checksumSha256: stored.checksumSha256,
          uploadedById: actorId,
          status: version.status,
          notes: `Server-applied firm mark from version ${version.versionNumber}`,
          changeSummary: input.reason ?? "Applied authorized firm mark"
        }
      });
      await tx.document.update({
        where: { id: document.id },
        data: { currentVersionId: out.id }
      });
      return out;
    });

    const application = await this.prisma.client.documentMarkApplication.create({
      data: {
        documentId: document.id,
        inputVersionId: version.id,
        outputVersionId: outputVersion.id,
        markAssetId: input.markAssetId,
        markAssetVersionId: assetVersion.id,
        placementPresetId: placement?.id,
        executionBlockVersionId: executionVersion?.id,
        requestedById: actorId,
        signerUserId: input.signerUserId,
        status: "APPLIED",
        placementResolved: resolved,
        inputChecksum: version.checksumSha256,
        outputChecksum: stored.checksumSha256,
        reason: input.reason,
        appliedAt: new Date()
      }
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "document.mark_applied",
      entityType: "document_mark_application", entityId: application.id, matterId: document.matterId,
      metadata: {
        documentId: document.id,
        inputVersionId: version.id,
        outputVersionId: outputVersion.id,
        markAssetVersionId: assetVersion.id,
        placementResolved: resolved
      }
    });

    return { status: "APPLIED", application, outputVersion };
  }
}
