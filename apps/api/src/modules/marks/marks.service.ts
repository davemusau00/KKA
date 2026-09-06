import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { StorageService } from "../../platform/storage/storage.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class MarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService
  ) {}

  listAssets(firmId: string) {
    return this.prisma.client.firmMarkAsset.findMany({
      where: { firmId },
      include: { versions: { orderBy: { version: "desc" }, select: { id: true, version: true, mimeType: true, checksumSha256: true, widthPx: true, heightPx: true, createdAt: true } } },
      orderBy: [{ active: "desc" }, { displayName: "asc" }]
    });
  }

  async createAsset(firmId: string, actorId: string, input: any) {
    if (input.branchId && !await this.prisma.client.branch.findFirst({ where: { id: input.branchId, firmId } })) throw new BadRequestException('Branch not found');
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
    if (!await this.prisma.client.user.findFirst({ where: { id: input.delegateUserId, firmId, status: 'ACTIVE' } })) throw new BadRequestException('Delegate not found');
    if (new Date(input.endsAt) <= new Date(input.startsAt) || new Date(input.endsAt) <= new Date()) throw new BadRequestException('Delegation must have a future end after its start');
    const row = await this.prisma.client.signatureDelegation.create({ data: { delegatorProfileId: input.delegatorProfileId, delegateUserId: input.delegateUserId, allowedActions: input.allowedActions ?? [], allowedMatterTypes: input.allowedMatterTypes ?? [], allowedDocumentTypes: input.allowedDocumentTypes ?? [], startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), reason: input.reason } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "signature.delegation_created", entityType: "signature_delegation", entityId: row.id, metadata: { delegateUserId: row.delegateUserId, endsAt: row.endsAt } });
    return row;
  }

}
