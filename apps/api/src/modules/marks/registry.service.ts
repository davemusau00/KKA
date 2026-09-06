import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { validateImage } from '@kka/document-engine';
import { z } from 'zod';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { StorageService } from '../../platform/storage/storage.service';
import { AuditService } from '../../platform/audit/audit.service';
import type { RequestUser } from '../../platform/auth/auth.types';

export const MarkUpdateSchema = z.object({
  displayName: z.string().min(2).max(200).optional(), description: z.string().max(2000).optional(),
  branchId: z.string().nullable().optional(), active: z.boolean().optional(),
  permittedRoleKeys: z.array(z.string()).optional(), permittedUserIds: z.array(z.string()).optional(),
  allowedDocumentTypes: z.array(z.string()).optional(), allowedMatterTypes: z.array(z.string()).optional(),
  requiresApproval: z.boolean().optional(), approvalRoleKeys: z.array(z.string()).optional(),
  effectiveFrom: z.string().datetime().nullable().optional(), effectiveTo: z.string().datetime().nullable().optional(),
  canApplyAutomatically: z.boolean().optional()
});
@Injectable()
export class RegistryService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, private readonly audit: AuditService) {}
  async update(user: RequestUser, id: string, input: z.infer<typeof MarkUpdateSchema>) {
    const asset = await this.prisma.client.firmMarkAsset.findFirst({ where: { id, firmId: user.firmId } });
    if (!asset) throw new NotFoundException('Mark not found');
    if (input.branchId && !await this.prisma.client.branch.findFirst({ where: { id: input.branchId, firmId: user.firmId } })) throw new BadRequestException('Branch not found');
    if (input.permittedUserIds?.length && await this.prisma.client.user.count({ where: { id: { in: input.permittedUserIds }, firmId: user.firmId } }) !== input.permittedUserIds.length) throw new BadRequestException('Invalid authorized users');
    const from = input.effectiveFrom === undefined ? asset.effectiveFrom : input.effectiveFrom ? new Date(input.effectiveFrom) : null;
    const to = input.effectiveTo === undefined ? asset.effectiveTo : input.effectiveTo ? new Date(input.effectiveTo) : null;
    if (from && to && from >= to) throw new BadRequestException('Effective end must follow start');
    return this.prisma.client.$transaction(async tx => {
      const row = await tx.firmMarkAsset.update({ where: { id }, data: { ...input, effectiveFrom: from, effectiveTo: to } });
      await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'mark.updated', entityType: 'firm_mark_asset', entityId: id, metadata: { active: row.active } }, tx);
      return row;
    });
  }
  async upload(user: RequestUser, id: string, signature: boolean, file: { buffer: Buffer; mimetype: string }) {
    if (signature) {
      const profile = await this.prisma.client.signatureProfile.findFirst({ where: { id, user: { firmId: user.firmId } } });
      if (!profile) throw new NotFoundException('Signature profile not found');
      if (profile.userId !== user.id && !user.permissions.includes('admin.settings_manage')) throw new ForbiddenException('Signature owner permission required');
    } else if (!await this.prisma.client.firmMarkAsset.findFirst({ where: { id, firmId: user.firmId, active: true } })) throw new NotFoundException('Active mark not found');
    let image: Awaited<ReturnType<typeof validateImage>>;
    try { image = await validateImage(file.buffer, file.mimetype); } catch (e) { throw new BadRequestException(e instanceof Error ? e.message : 'Invalid image'); }
    const stored = await this.storage.putMark({ filename: signature ? 'signature.png' : 'mark.png', mimeType: image.mimeType, buffer: image.buffer });
    try {
      return await this.prisma.client.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
        let row;
        if (signature) {
          const latest = await tx.signatureAssetVersion.findFirst({ where: { profileId: id }, orderBy: { version: 'desc' } });
          await tx.signatureAssetVersion.updateMany({ where: { profileId: id }, data: { active: false } });
          row = await tx.signatureAssetVersion.create({ data: { profileId: id, version: (latest?.version ?? 0) + 1, storagePath: stored.path, mimeType: stored.mimeType, checksumSha256: stored.checksumSha256 } });
          await tx.signatureProfile.update({ where: { id }, data: { approvalStatus: 'PENDING' } });
        } else {
          const latest = await tx.firmMarkAssetVersion.findFirst({ where: { assetId: id }, orderBy: { version: 'desc' } });
          row = await tx.firmMarkAssetVersion.create({ data: { assetId: id, version: (latest?.version ?? 0) + 1, storagePath: stored.path, mimeType: stored.mimeType, checksumSha256: stored.checksumSha256, widthPx: image.width, heightPx: image.height, transparentReady: image.transparent, createdById: user.id } });
        }
        await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: signature ? 'signature.version_uploaded' : 'mark.version_uploaded', entityType: signature ? 'signature_profile' : 'firm_mark_asset', entityId: id, metadata: { versionId: row.id, checksum: stored.checksumSha256 } }, tx);
        const { storagePath: _path, ...safe } = row;
        return safe;
      });
    } catch (e) { await this.storage.deleteMark(stored.path).catch(() => undefined); throw e; }
  }
  async signatures(user: RequestUser) {
    return this.prisma.client.signatureProfile.findMany({ where: { user: { firmId: user.firmId }, ...(user.permissions.includes('admin.settings_manage') ? {} : { userId: user.id }) }, include: { versions: { select: { id: true, version: true, active: true, checksumSha256: true, createdAt: true }, orderBy: { version: 'desc' } }, delegationsFrom: true } });
  }
  async preview(user: RequestUser, versionId: string, signature: boolean) {
    const v = signature ? await this.prisma.client.signatureAssetVersion.findFirst({ where: { id: versionId, profile: { user: { firmId: user.firmId }, ...(user.permissions.includes('admin.settings_manage') ? {} : { userId: user.id }) } } })
      : await this.prisma.client.firmMarkAssetVersion.findFirst({ where: { id: versionId, asset: { firmId: user.firmId } }, include: { asset: true } });
    if (!v) throw new NotFoundException('Asset not found');
    await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'asset.previewed', entityType: signature ? 'signature_asset_version' : 'firm_mark_asset_version', entityId: versionId });
    return { stream: await this.storage.openMark(v.storagePath), mimeType: v.mimeType };
  }
}
