import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@kka/database';
import type { RequestUser } from '../../platform/auth/auth.types';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { AuditService } from '../../platform/audit/audit.service';
import { QueueService } from '../../platform/queue/queue.service';

export const WEBSITE_PUBLISH_QUEUE = 'website-publish';

@Injectable()
export class WebsitePublishingService {
  constructor(private readonly prisma:PrismaService,private readonly queues:QueueService,private readonly audit:AuditService) {}

  list(user:RequestUser){return this.prisma.client.websitePublishRelease.findMany({where:{firmId:user.firmId},include:{requestedBy:{select:{id:true,fullName:true}}},orderBy:{version:'desc'},take:100});}

  async publish(user:RequestUser){
    const release=await this.prisma.client.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.firmId + ':website-publish'}))`;
      const latest=await tx.websitePublishRelease.findFirst({where:{firmId:user.firmId},orderBy:{version:'desc'}});
      return tx.websitePublishRelease.create({data:{firmId:user.firmId,version:(latest?.version??0)+1,status:'QUEUED',requestedById:user.id}});
    });
    await this.queues.add(WEBSITE_PUBLISH_QUEUE,'website.publish',{firmId:user.firmId,releaseId:release.id},{jobId:release.id});
    await this.audit.record({firmId:user.firmId,actorUserId:user.id,action:'website.publish_requested',entityType:'website_release',entityId:release.id,metadata:{version:release.version}});
    return release;
  }

  async rollback(user:RequestUser,targetVersion:number){
    const release=await this.prisma.client.websitePublishRelease.findFirst({where:{firmId:user.firmId,version:targetVersion,status:'PUBLISHED'}});
    if(!release)throw new NotFoundException('Published website release not found');
    const manifest=release.manifest as any;
    await this.prisma.client.$transaction(async tx=>{
      for(const item of manifest.pages??[]){
        const page=await tx.websitePage.findFirst({where:{id:item.id,firmId:user.firmId}});if(!page)continue;
        const v=await tx.websitePageVersion.findFirst({where:{pageId:page.id,version:item.version}});if(!v)continue;
        const snap=v.snapshot as any;
        await tx.websiteBlock.deleteMany({where:{pageId:page.id}});
        const blocks=Array.isArray(snap?.blocks)?snap.blocks:[];
        if(blocks.length)await tx.websiteBlock.createMany({data:blocks.map((b:any,i:number)=>({pageId:page.id,blockType:String(b.blockType||'RICH_TEXT'),variant:String(b.variant||'default'),displayOrder:i,theme:String(b.theme||'light'),content:b.content||{},settings:b.settings||{},visible:b.visible!==false}))});
        await tx.websitePage.update({where:{id:page.id},data:{title:v.title,description:v.description,seo:v.seo ?? Prisma.JsonNull,heroAssetId:snap?.heroAssetId||null,currentVersion:v.version,status:item.status||'PUBLISHED',publishedAt:item.publishedAt?new Date(item.publishedAt):new Date()}});
      }
      for(const item of manifest.publications??[]){
        const pub=await tx.websitePublication.findFirst({where:{id:item.id,firmId:user.firmId}});if(!pub)continue;
        const v=await tx.websitePublicationVersion.findFirst({where:{publicationId:pub.id,version:item.version}});if(!v)continue;
        const snap=v.snapshot as any;
        await tx.websitePublication.update({where:{id:pub.id},data:{title:v.title,excerpt:v.excerpt,body:v.body,seo:v.seo ?? Prisma.JsonNull,coverId:snap?.coverId||null,authorProfileId:snap?.authorProfileId||null,duration:snap?.duration||null,practiceAreaSlugs:snap?.practiceAreaSlugs||[],tags:snap?.tags||[],currentVersion:v.version,status:item.status||'PUBLISHED',publishedAt:item.publishedAt?new Date(item.publishedAt):new Date()}});
      }
      await tx.websitePublishRelease.updateMany({where:{firmId:user.firmId,status:'PUBLISHED'},data:{status:'ROLLED_BACK'}});
    });
    await this.audit.record({firmId:user.firmId,actorUserId:user.id,action:'website.release_rolled_back',entityType:'website_release',entityId:release.id,metadata:{targetVersion}});
    return this.publish(user);
  }
}
