import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { validateImage, visibleBranding } from '@kka/document-engine';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { StorageService } from '../../platform/storage/storage.service';
import { AuditService } from '../../platform/audit/audit.service';
import { env } from '../../platform/env';
export const BRANDING_KEY = 'firm.branding.logo';

@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, private readonly audit: AuditService) {}
  async current(firmId?: string) {
    if (!firmId) return null;
    const setting = await this.prisma.client.settingValue.findFirst({ where: { firmId, scopeType: 'FIRM', scopeId: firmId, definition: { key: BRANDING_KEY }, lifecycle: 'ACTIVE' }, orderBy: { version: 'desc' } });
    const value = setting?.value as { versionId?: string } | null;
    if (!value?.versionId) return null;
    return this.prisma.client.firmMarkAssetVersion.findFirst({ where: { id: value.versionId, asset: { firmId, type: 'LOGO', active: true, branchId: null } } });
  }
  async metadata(firmId?: string, publicView = false) {
    const version = await this.current(firmId);
    return { source: version ? 'managed' : 'default', versionId: version?.id ?? null, width: version?.widthPx ?? null, height: version?.heightPx ?? null,
      imageUrl: version ? `${env().API_PUBLIC_URL}/api/v1/${publicView ? 'branding/public' : 'branding'}/image?v=${version.checksumSha256}` : '/firm-logo.png' };
  }
  async image(firmId?: string) {
    const version = await this.current(firmId);
    if (!version) throw new NotFoundException('No managed branding image');
    return { stream: await this.storage.openMark(version.storagePath), mimeType: version.mimeType };
  }
  async upload(firmId: string, actorId: string, buffer: Buffer, mime: string) {
    let image: Awaited<ReturnType<typeof validateImage>>;
    try { image = await validateImage(buffer, mime); } catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Invalid image'); }
    const stored = await this.storage.putMark({ filename: 'firm-logo.png', mimeType: image.mimeType, buffer: await visibleBranding(image.buffer) });
    try { await this.prisma.client.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${firmId + ':branding'}))`;
      const asset = await tx.firmMarkAsset.findFirst({ where: { firmId, type: 'LOGO', intendedUse: 'Application branding', active: true, branchId: null }, orderBy: { createdAt: 'asc' } }) ?? await tx.firmMarkAsset.create({ data: { firmId, type: 'LOGO', displayName: 'Firm branding logo', intendedUse: 'Application branding', permittedRoleKeys: [], permittedUserIds: [], allowedDocumentTypes: [], allowedMatterTypes: [], approvalRoleKeys: [], createdById: actorId } });
      const previous = await tx.firmMarkAssetVersion.findFirst({ where: { assetId: asset.id }, orderBy: { version: 'desc' } });
      const version = await tx.firmMarkAssetVersion.create({ data: { assetId: asset.id, version: (previous?.version ?? 0) + 1, storagePath: stored.path, mimeType: stored.mimeType, checksumSha256: stored.checksumSha256, widthPx: image.width, heightPx: image.height, transparentReady: image.transparent, createdById: actorId } });
      await this.select(tx, firmId, actorId, version.id);
    }); } catch (e) { await this.storage.deleteMark(stored.path).catch(() => undefined); throw e; }
    return this.metadata(firmId);
  }
  private async select(tx: import('@kka/database').Prisma.TransactionClient, firmId: string, actorId: string, versionId: string | null) {
    const def = await tx.settingDefinition.upsert({ where: { key: BRANDING_KEY }, update: {}, create: { key: BRANDING_KEY, category: 'branding', label: 'Firm logo', description: 'Selected public branding logo version', valueType: 'ASSET', allowedScopes: ['FIRM'], featureDependencyKeys: [] } });
    const latest = await tx.settingValue.findFirst({ where: { definitionId: def.id, firmId }, orderBy: { version: 'desc' } });
    await tx.settingValue.updateMany({ where: { definitionId: def.id, firmId, lifecycle: 'ACTIVE' }, data: { lifecycle: 'SUPERSEDED' } });
    await tx.settingValue.create({ data: { definitionId: def.id, firmId, scopeType: 'FIRM', scopeId: firmId, value: { versionId }, version: (latest?.version ?? 0) + 1, createdById: actorId } });
    await this.audit.record({ firmId, actorUserId: actorId, action: 'branding.changed', entityType: 'firm', entityId: firmId, metadata: { versionId } }, tx);
  }
  async restore(firmId: string, actorId: string) {
    await this.prisma.client.$transaction(async tx => { await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${firmId + ':branding'}))`; await this.select(tx, firmId, actorId, null); });
    return this.metadata(firmId);
  }
}
