import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';
import type { RequestUser } from '../../platform/auth/auth.types';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { StorageService } from '../../platform/storage/storage.service';
import { AuditService } from '../../platform/audit/audit.service';
import { env } from '../../platform/env';
import { MediaMetadataSchema } from './website.schemas';
import { publicAssetUrl } from './website.utils';

const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm','application/pdf']);

@Injectable()
export class WebsiteMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async list(user: RequestUser, q?: string) {
    const query = q?.trim();
    const items = await this.prisma.client.websiteMediaAsset.findMany({
      where:{ firmId:user.firmId, ...(query ? { OR:[
        { originalName:{ contains:query, mode:'insensitive' } }, { alt:{ contains:query, mode:'insensitive' } },
        { caption:{ contains:query, mode:'insensitive' } }, { credit:{ contains:query, mode:'insensitive' } }
      ] } : {}) }, orderBy:{ createdAt:'desc' }, take:500
    });
    return items.map(x => ({ ...x, publicUrl:publicAssetUrl(x.id,x.checksum), previewUrl:`/api/v1/website/admin/media/${x.id}/content` }));
  }

  async open(user:RequestUser,id:string){const asset=await this.prisma.client.websiteMediaAsset.findFirst({where:{id,firmId:user.firmId}});if(!asset)throw new NotFoundException('Media not found');return {mimeType:asset.mimeType,stream:await this.storage.openDocument(asset.storagePath)};}
  async upload(user: RequestUser, file: { filename:string; mimetype:string; buffer:Buffer }, rawMeta: unknown) {
    if (!file.buffer.length) throw new BadRequestException('Empty upload');
    if (file.buffer.length > env().MAX_UPLOAD_BYTES) throw new BadRequestException('Upload exceeds configured file-size limit');
    if (!ALLOWED.has(file.mimetype)) throw new BadRequestException('Unsupported media type');
    const meta = MediaMetadataSchema.parse(rawMeta);

    let width: number | null = null;
    let height: number | null = null;
    let buffer = file.buffer;
    let mimeType = file.mimetype;
    if (file.mimetype.startsWith('image/')) {
      try{
        const image=sharp(file.buffer,{limitInputPixels:4096*4096,animated:false});const metadata=await image.metadata();
        const expected:Record<string,string>={jpeg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',heif:'image/avif'};
        if(expected[metadata.format||'']!==file.mimetype || (metadata.pages??1)>1)throw new Error('Image type does not match its content');
        const normalized=await image.rotate().png().toBuffer({resolveWithObject:true});buffer=normalized.data;width=normalized.info.width;height=normalized.info.height;mimeType='image/png';
      }catch{throw new BadRequestException('Upload a valid, non-animated image within the image size limit.');}
    }
    const variants:Record<string,any>={};
    if(width&&height){
      for(const w of [...new Set([320,640,960,1440,1920,width].filter(w=>w<=width!))])for(const format of ['avif','webp','jpeg'] as const){
        const output=await sharp(buffer).resize({width:w,withoutEnlargement:true}).toFormat(format,{quality:format==='avif'?55:80}).toBuffer({resolveWithObject:true});
        const storedVariant=await this.storage.putDocument({filename:`${w}.${format}`,mimeType:`image/${format}`,buffer:output.data});
        variants[`w${w}-${format}`]={width:output.info.width,height:output.info.height,mimeType:`image/${format}`,storagePath:storedVariant.path,checksum:storedVariant.checksumSha256};
      }
    }

    const stored = await this.storage.putDocument({ filename:file.filename, mimeType, buffer });
    const asset = await this.prisma.client.websiteMediaAsset.create({
      data:{
        firmId:user.firmId, filename:file.filename, originalName:file.filename, mimeType:stored.mimeType,
        sizeBytes:buffer.length, storagePath:stored.path, alt:meta.alt, caption:meta.caption, credit:meta.credit,
        width, height, focalX:meta.focalX, focalY:meta.focalY, checksum:stored.checksumSha256,
        variants, createdById:user.id
      }
    });
    await this.audit.record({ firmId:user.firmId, actorUserId:user.id, action:'website.media_uploaded', entityType:'website_media_asset', entityId:asset.id, metadata:{ mimeType:asset.mimeType, sizeBytes:asset.sizeBytes, originalName:asset.originalName } });
    return { ...asset, publicUrl:publicAssetUrl(asset.id,asset.checksum) };
  }

  async update(user: RequestUser, id: string, raw: unknown) {
    const input = MediaMetadataSchema.partial().parse(raw);
    const existing = await this.prisma.client.websiteMediaAsset.findFirst({ where:{ id, firmId:user.firmId } });
    if (!existing) throw new NotFoundException('Media asset not found');
    const updated = await this.prisma.client.websiteMediaAsset.update({ where:{ id }, data:input });
    await this.audit.record({ firmId:user.firmId, actorUserId:user.id, action:'website.media_updated', entityType:'website_media_asset', entityId:id, metadata:input });
    return { ...updated, publicUrl:publicAssetUrl(updated.id,updated.checksum) };
  }

  async remove(user: RequestUser, id: string) {
    const asset = await this.prisma.client.websiteMediaAsset.findFirst({ where:{ id, firmId:user.firmId } });
    if (!asset) throw new NotFoundException('Media asset not found');
    const [releases, blocks] = await Promise.all([
      this.prisma.client.websitePublishRelease.findMany({where:{firmId:user.firmId}}),
      this.prisma.client.websiteBlock.findMany({where:{page:{firmId:user.firmId}}})
    ]);
    if(releases.some(r=>JSON.stringify(r.manifest).includes(id)) || blocks.some(b=>JSON.stringify(b.content).includes(id)))
      throw new BadRequestException('Media is retained by a page or website release');
    const [profiles,pubs,pages] = await Promise.all([
      this.prisma.client.websiteProfessionalProfile.count({ where:{ imageId:id } }),
      this.prisma.client.websitePublication.count({ where:{ coverId:id } }),
      this.prisma.client.websitePage.count({ where:{ heroAssetId:id } })
    ]);
    if (profiles + pubs + pages > 0) throw new BadRequestException('Media asset is currently in use');
    await this.prisma.client.websiteMediaAsset.delete({ where:{ id } });
    await this.storage.deleteDocument(asset.storagePath).catch(() => undefined);
    await this.audit.record({ firmId:user.firmId, actorUserId:user.id, action:'website.media_deleted', entityType:'website_media_asset', entityId:id, metadata:{ originalName:asset.originalName } });
    return { ok:true };
  }
}
