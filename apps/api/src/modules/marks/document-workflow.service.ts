import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { ApplyDocumentMarksSchema, type ApplyDocumentMarks } from '@kka/contracts';
import { renderMarks, validateImage } from '@kka/document-engine';
import { Prisma, type DocumentOperation } from '@kka/database';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { StorageService } from '../../platform/storage/storage.service';
import { AuditService } from '../../platform/audit/audit.service';
import { RedisService } from '../../platform/redis/redis.service';
import type { RequestUser } from '../../platform/auth/auth.types';
import { DocumentAccessService } from './document-access.service';
const hash = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const json = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

@Injectable()
export class DocumentWorkflowService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, private readonly audit: AuditService, private readonly redis: RedisService, private readonly access: DocumentAccessService) {}
  async actor(id: string): Promise<RequestUser> {
    const u = await this.prisma.client.user.findUnique({ where: { id }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
    if (!u || u.status !== 'ACTIVE') throw new ForbiddenException('User is no longer active');
    return { id: u.id, firmId: u.firmId, email: u.email, fullName: u.fullName, roleKeys: u.roles.map(r => r.role.key), permissions: u.roles.flatMap(r => r.role.permissions.map(p => p.permission.key)) };
  }
  private async validate(user: RequestUser, input: ApplyDocumentMarks, requireElevation: boolean) {
    if (!user.permissions.includes('document.sign')) throw new ForbiddenException('Document application permission required');
    const document = await this.access.document(user, input.documentId);
    const version = await this.prisma.client.documentVersion.findFirst({ where: { id: input.inputVersionId, documentId: document.id } });
    if (!version || version.mimeType !== 'application/pdf') throw new BadRequestException('Choose a stored PDF version');
    const policies = await this.prisma.client.documentMarkPolicy.findMany({ where: { firmId: user.firmId, active: true } });
    const applicable = policies.filter(p => (!p.documentTypes.length || p.documentTypes.includes(document.documentType)) && (!p.matterTypes.length || p.matterTypes.includes(document.matter.matterType)));
    let approval = applicable.some(p => p.requiresApproval);
    let elevation = applicable.some(p => p.requiresReauth);
    const approvalRoles = new Set(applicable.flatMap(p => p.approvalRoleKeys));
    const now = new Date();
    const marks: Array<{ buffer: Buffer; placement: ApplyDocumentMarks['items'][number]['placement']; assetId?: string; versionId: string; signature: boolean; signerId?: string; checksum: string }> = [];
    for (const item of input.items) {
      if (item.kind === 'mark') {
        const v = await this.prisma.client.firmMarkAssetVersion.findFirst({ where: { id: item.versionId, asset: { firmId: user.firmId, active: true } }, include: { asset: true } });
        if (!v) throw new NotFoundException('Active mark version not found');
        const a = v.asset;
        if (a.branchId && a.branchId !== document.matter.responsibleBranchId) throw new ForbiddenException('Mark belongs to another branch');
        if ((a.effectiveFrom && a.effectiveFrom > now) || (a.effectiveTo && a.effectiveTo <= now)) throw new ForbiddenException('Mark is outside its effective dates');
        if ((a.permittedRoleKeys.length || a.permittedUserIds.length) && !a.permittedUserIds.includes(user.id) && !a.permittedRoleKeys.some(r => user.roleKeys.includes(r))) throw new ForbiddenException('Mark use is not authorized');
        if ((a.allowedDocumentTypes.length && !a.allowedDocumentTypes.includes(document.documentType)) || (a.allowedMatterTypes.length && !a.allowedMatterTypes.includes(document.matter.matterType))) throw new ForbiddenException('Mark is not allowed for this document');
        if (applicable.some(p => p.allowedMarkAssetTypes.length && !p.allowedMarkAssetTypes.includes(a.type))) throw new ForbiddenException('Document policy does not permit this mark');
        const p = item.placement;
        if (p.opacity < a.minOpacity || p.rotation < a.minRotationDegrees || p.rotation > a.maxRotationDegrees) throw new BadRequestException('Placement exceeds mark constraints');
        approval ||= a.requiresApproval; a.approvalRoleKeys.forEach(r => approvalRoles.add(r)); elevation ||= a.type !== 'LOGO';
        const raw = await this.storage.readMark(v.storagePath);
        if (hash(raw) !== v.checksumSha256) throw new ConflictException('Mark checksum mismatch');
        const normalized = await validateImage(raw, v.mimeType);
        marks.push({ buffer: normalized.buffer, placement: p, assetId: a.id, versionId: v.id, signature: false, checksum: v.checksumSha256 });
      } else {
        const v = await this.prisma.client.signatureAssetVersion.findFirst({ where: { id: item.versionId, active: true, profile: { user: { firmId: user.firmId, status: 'ACTIVE' }, approvalStatus: 'APPROVED' } }, include: { profile: true } });
        if (!v) throw new NotFoundException('Approved signature version not found');
        if ((v.profile.validFrom && v.profile.validFrom > now) || (v.profile.validTo && v.profile.validTo <= now)) throw new ForbiddenException('Signature profile has expired');
        if (v.profile.userId !== user.id) {
          const grants = await this.prisma.client.signatureDelegation.findMany({ where: { delegatorProfileId: v.profileId, delegateUserId: user.id, startsAt: { lte: now }, endsAt: { gt: now }, revokedAt: null } });
          if (!grants.some(g => g.allowedActions.includes('APPLY') && (!g.allowedMatterTypes.length || g.allowedMatterTypes.includes(document.matter.matterType)) && (!g.allowedDocumentTypes.length || g.allowedDocumentTypes.includes(document.documentType)))) throw new ForbiddenException('Active signature delegation required');
        }
        const raw = await this.storage.readMark(v.storagePath);
        if (hash(raw) !== v.checksumSha256) throw new ConflictException('Signature checksum mismatch');
        marks.push({ buffer: (await validateImage(raw, v.mimeType)).buffer, placement: item.placement, versionId: v.id, signature: true, signerId: v.profile.userId, checksum: v.checksumSha256 });
        elevation = true;
      }
    }
    if (applicable.some(p => p.requiresReviewComplete) && !['APPROVED','SIGNED','FILED','SERVED'].includes(version.status)) throw new BadRequestException('Complete document review first');
    if (requireElevation && elevation) {
      const raw = input.elevationToken ? await this.redis.client.get(`elevation:${input.elevationToken}`) : null;
      if (!raw || (JSON.parse(raw) as { userId: string }).userId !== user.id) throw new ForbiddenException('Confirm your password before applying controlled marks');
    }
    const buffer = await this.storage.readDocument(version.storagePath);
    if (hash(buffer) !== version.checksumSha256) throw new ConflictException('Input PDF checksum mismatch');
    return { document, version, marks, buffer, approval, approvalRoles: [...approvalRoles] };
  }
  async preview(user: RequestUser, input: ApplyDocumentMarks) {
    const checked = await this.validate(user, input, false);
    try {
      const output = await renderMarks(checked.buffer, checked.marks);
      await this.audit.record({ firmId:user.firmId,actorUserId:user.id,action:'document.mark_previewed',entityType:'document_version',entityId:input.inputVersionId,metadata:{placements:input.items.length} });
      return output;
    } catch (e) { throw new BadRequestException(e instanceof Error ? e.message : 'Could not render PDF'); }
  }
  async legacy(user: RequestUser, input: { documentId: string; inputVersionId: string; markAssetId: string; markAssetVersionId: string; placementPresetId?: string; executionBlockVersionId?: string; reason?: string; elevationToken?: string }) {
    await this.access.document(user, input.documentId);
    if (input.executionBlockVersionId) throw new BadRequestException('Use the document workspace to select versioned signature representations');
    const v = await this.prisma.client.documentVersion.findFirst({ where: { id: input.inputVersionId, documentId: input.documentId } });
    const asset = await this.prisma.client.firmMarkAssetVersion.findFirst({ where: { id: input.markAssetVersionId, assetId: input.markAssetId, asset: { firmId: user.firmId } } });
    if (!v || !asset) throw new NotFoundException('Document or mark version not found');
    const preset = input.placementPresetId ? await this.prisma.client.documentPlacementPreset.findFirst({ where: { id: input.placementPresetId, firmId: user.firmId, active: true } }) : null;
    if (input.placementPresetId && !preset) throw new NotFoundException('Placement preset not found');
    const pdf = await PDFDocument.load(await this.storage.readDocument(v.storagePath));
    const selection = preset?.pageSelection ?? 'LAST';
    const pages = selection === 'ALL' ? pdf.getPages().map((_, i) => i + 1) : selection === 'FIRST' ? [1] : selection === 'EXPLICIT' ? ((preset?.constraints as { pages?: number[] })?.pages ?? []) : [pdf.getPageCount()];
    return this.submit(user, { documentId: input.documentId, inputVersionId: input.inputVersionId, idempotencyKey: hash(JSON.stringify({ ...input, elevationToken: undefined })), reason: input.reason ?? 'Apply firm mark', elevationToken: input.elevationToken,
      items: pages.map(page => ({ kind: 'mark', versionId: asset.id, placement: { page, x: preset?.xPoints ?? 50, y: preset?.yPoints ?? 50, width: (preset?.widthPoints ?? 100) * (preset?.scale ?? 1), height: (preset?.heightPoints ?? 100) * (preset?.scale ?? 1), rotation: preset?.rotation ?? 0, opacity: preset?.opacity ?? 1 } })) });
  }
  async submit(user: RequestUser, input: ApplyDocumentMarks) {
    const { elevationToken: _, ...safe } = input;
    const payloadHash = hash(JSON.stringify(safe));
    const previous = await this.prisma.client.documentOperation.findUnique({ where: { firmId_idempotencyKey: { firmId: user.firmId, idempotencyKey: input.idempotencyKey } } });
    if (previous) { await this.access.document(user, previous.documentId); if (previous.payloadHash !== payloadHash) throw new ConflictException('Request key already used for different content'); return this.safe(previous); }
    const checked = await this.validate(user, input, true);
    // Validate geometry before creating an approval or changing any document.
    await renderMarks(checked.buffer, checked.marks);
    let op: DocumentOperation;
    try { op = await this.prisma.client.$transaction(async tx => {
      const approval = checked.approval ? await tx.approvalRequest.create({ data: { firmId: user.firmId, type: 'DOCUMENT_MARK', entityType: 'Document', entityId: input.documentId, requestedById: user.id, requiredRoleKeys: checked.approvalRoles.length ? checked.approvalRoles : ['managing_partner'], assignedUserIds: [], payload: json(safe), reason: input.reason } }) : null;
      return tx.documentOperation.create({ data: { firmId: user.firmId, actorId: user.id, documentId: input.documentId, kind: 'MARKS', idempotencyKey: input.idempotencyKey, payloadHash, payload: json({ ...safe, inputChecksum: checked.version.checksumSha256, assetChecksums: checked.marks.map(m => m.checksum) }), status: approval ? 'PENDING_APPROVAL' : 'QUEUED', approvalRequestId: approval?.id } });
    }); } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const concurrent = await this.prisma.client.documentOperation.findUnique({ where: { firmId_idempotencyKey: { firmId: user.firmId, idempotencyKey: input.idempotencyKey } } });
        if (concurrent && concurrent.payloadHash === payloadHash && concurrent.actorId === user.id) return this.safe(concurrent);
        throw new ConflictException('Request key already used');
      }
      throw e;
    }
    return checked.approval ? this.safe(op) : this.execute(op.id);
  }
  safe(op: DocumentOperation) {
    const { payload, ...safe } = op;
    const data = payload as { configuration?: { marks?: unknown[] }; previewPath?: string };
    return { ...safe, suggestedMarks: op.kind === 'GENERATE' ? data.configuration?.marks ?? [] : [], previewUrl: data.previewPath ? `/api/v1/document-operations/${op.id}/preview-file` : undefined };
  }
  async previewFile(user: RequestUser, id: string) {
    const op = await this.prisma.client.documentOperation.findFirst({ where: { id, firmId: user.firmId, actorId: user.id, status: 'COMPLETED' } });
    if (!op) throw new NotFoundException('Preview not found');
    await this.access.document(user,op.documentId);
    const path = (op.payload as { previewPath?: string })?.previewPath;
    if (!path) throw new NotFoundException('Preview not ready');
    return this.storage.openDocument(path);
  }
  async execute(id: string) {
    const op = await this.prisma.client.documentOperation.findUniqueOrThrow({ where: { id } });
    if (op.status === 'COMPLETED') return this.safe(op);
    if (op.approvalRequestId) {
      const approval = await this.prisma.client.approvalRequest.findUnique({ where: { id: op.approvalRequestId } });
      if (approval?.status !== 'APPROVED') throw new ForbiddenException('Application approval is required');
    }
    const claimed = await this.prisma.client.documentOperation.updateMany({ where: { id, OR: [{ status: { in: ['QUEUED','FAILED','APPROVED'] } }, { status: 'PROCESSING', updatedAt: { lt: new Date(Date.now() - 300000) } }] }, data: { status: 'PROCESSING', attempts: { increment: 1 }, error: null } });
    if (!claimed.count) return this.safe(await this.prisma.client.documentOperation.findUniqueOrThrow({ where: { id } }));
    let storedPath: string | undefined;
    try {
      const user = await this.actor(op.actorId);
      const input = ApplyDocumentMarksSchema.parse(op.payload);
      const checked = await this.validate(user, input, false);
      const pinned = op.payload as { inputChecksum: string; assetChecksums: string[] };
      if (checked.version.checksumSha256 !== pinned.inputChecksum || checked.marks.some((m, i) => m.checksum !== pinned.assetChecksums[i])) throw new ConflictException('Approved input changed');
      const output = await renderMarks(checked.buffer, checked.marks);
      const stored = await this.storage.putDocument({ filename: 'marked.pdf', mimeType: 'application/pdf', buffer: output }); storedPath = stored.path;
      const result = await this.prisma.client.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${op.documentId}))`;
        const current = await tx.documentOperation.findUniqueOrThrow({ where: { id } });
        if (current.status !== 'PROCESSING' || current.attempts !== op.attempts + 1) throw new ConflictException('Operation lease changed; retry from history');
        const latest = await tx.documentVersion.findFirst({ where: { documentId: op.documentId }, orderBy: { versionNumber: 'desc' } });
        const v = await tx.documentVersion.create({ data: { documentId: op.documentId, versionNumber: (latest?.versionNumber ?? 0) + 1, storageDriver: stored.driver, storagePath: stored.path, originalFilename: stored.originalFilename, mimeType: stored.mimeType, fileSizeBytes: BigInt(stored.sizeBytes), checksumSha256: stored.checksumSha256, uploadedById: op.actorId, status: 'DRAFT', changeSummary: input.reason } });
        for (const m of checked.marks) await tx.documentMarkApplication.create({ data: { documentId: op.documentId, inputVersionId: input.inputVersionId, outputVersionId: v.id, markAssetId: m.assetId, markAssetVersionId: m.signature ? undefined : m.versionId, signatureAssetVersionId: m.signature ? m.versionId : undefined, signerUserId: m.signerId, operationId: op.id, requestedById: op.actorId, status: 'APPLIED', placementResolved: json(m.placement), inputChecksum: checked.version.checksumSha256, outputChecksum: stored.checksumSha256, reason: input.reason, appliedAt: new Date() } });
        await tx.document.update({ where: { id: op.documentId }, data: { currentVersionId: v.id } });
        await this.audit.record({ firmId: op.firmId, actorUserId: op.actorId, action: 'document.marks_applied', entityType: 'document_operation', entityId: id, matterId: checked.document.matterId, metadata: { inputVersionId: input.inputVersionId, outputVersionId: v.id, checksum: stored.checksumSha256 } }, tx);
        return tx.documentOperation.update({ where: { id }, data: { status: 'COMPLETED', outputVersionId: v.id } });
      });
      return this.safe(result);
    } catch (e) {
      if (storedPath) await this.storage.deleteDocument(storedPath).catch(() => undefined);
      await this.prisma.client.documentOperation.updateMany({ where: { id, status:'PROCESSING', attempts:op.attempts+1 }, data: { status: 'FAILED', error: e instanceof Error ? e.message : 'Rendering failed' } });
      const row = await this.prisma.client.documentOperation.findUniqueOrThrow({where:{id}});
      return this.safe(row);
    }
  }
  async list(user: RequestUser, documentId: string) { await this.access.document(user, documentId); return (await this.prisma.client.documentOperation.findMany({ where: { firmId: user.firmId, documentId }, orderBy: { createdAt: 'desc' } })).map(o => this.safe(o)); }
  async retry(user: RequestUser, id: string, elevationToken?: string) {
    const op = await this.prisma.client.documentOperation.findFirst({ where: { id, firmId: user.firmId, actorId: user.id } });
    if (!op) throw new NotFoundException('Operation not found');
    if (op.kind !== 'MARKS') throw new BadRequestException('Use generation retry for this operation');
    await this.validate(user, { ...ApplyDocumentMarksSchema.parse(op.payload), elevationToken }, true);
    return this.execute(id);
  }
}
