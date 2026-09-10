import { Injectable, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { RequestUser } from '../../platform/auth/auth.types';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { AuditService } from '../../platform/audit/audit.service';
import { QueueService } from '../../platform/queue/queue.service';
import { SiteContentService } from './site-content.service';
import type { SiteSnapshot } from '@kka/contracts';
export const WEBSITE_PUBLISH_QUEUE='website-publish';
@Injectable()
export class WebsitePublishingService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private dispatching=false;
  constructor(private readonly prisma:PrismaService,private readonly queues:QueueService,private readonly audit:AuditService,private readonly content:SiteContentService) {}
  onModuleInit(){this.timer=setInterval(()=>{void this.dispatch().catch(error=>console.error('Website dispatch failed',error.message));},15000);this.timer.unref();}
  onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
  list(user:RequestUser){return this.prisma.client.websitePublishRelease.findMany({where:{firmId:user.firmId},select:{id:true,version:true,status:true,error:true,createdAt:true,publishedAt:true,manifest:true},orderBy:{version:'desc'},take:100}).then(rows=>rows.map((r:any)=>({...r,manifest:{routeCount:r.manifest?.artifact?.routeCount,rollbackOf:r.manifest?.rollbackOf}})));}
  async publish(user:RequestUser, snapshot?:SiteSnapshot, rollbackOf?:number){
    const release=await this.prisma.client.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.firmId+':website-publish'}))`;
      const latest=await tx.websitePublishRelease.findFirst({where:{firmId:user.firmId},orderBy:{version:'desc'}});
      const frozen=snapshot??await this.content.capture(user.firmId,tx);
      frozen.bootstrap.releaseVersion=(latest?.version??0)+1;
      await tx.websitePage.updateMany({where:{firmId:user.firmId,status:'SCHEDULED',scheduledFor:{lte:new Date()}},data:{status:'APPROVED'}});
      await tx.websitePublication.updateMany({where:{firmId:user.firmId,status:'SCHEDULED',scheduledFor:{lte:new Date()}},data:{status:'APPROVED'}});
      return tx.websitePublishRelease.create({data:{firmId:user.firmId,version:(latest?.version??0)+1,status:'QUEUED',requestedById:user.id||null,manifest:JSON.parse(JSON.stringify({schemaVersion:1,snapshot:frozen,rollbackOf}))}});
    },{isolationLevel:'RepeatableRead',timeout:30000});
    await this.audit.record({firmId:user.firmId,actorUserId:user.id||undefined,action:rollbackOf?'website.rollback_requested':'website.publish_requested',entityType:'website_release',entityId:release.id,metadata:{version:release.version,rollbackOf}});
    // The release row is the durable outbox. Redis unavailability cannot lose this request.
    void this.dispatch().catch(error=>console.error('Website release remains queued:',error.message));
    return {id:release.id,version:release.version,status:release.status};
  }
  async rollback(user:RequestUser,targetVersion:number){
    const r=await this.prisma.client.websitePublishRelease.findFirst({where:{firmId:user.firmId,version:targetVersion,status:{in:['PUBLISHED','ROLLED_BACK']}}});
    const manifest=r?.manifest as any;
    if(!manifest?.snapshot||!manifest?.artifact)throw new NotFoundException('A completed snapshot release is required for rollback');
    return this.publish(user,JSON.parse(JSON.stringify(manifest.snapshot)),targetVersion);
  }
  async dispatch(){
    if(this.dispatching)return;this.dispatching=true;
    try {
      const now=new Date();
      const due=[...await this.prisma.client.websitePage.findMany({where:{status:'SCHEDULED',scheduledFor:{lte:now}},select:{firmId:true}}),...await this.prisma.client.websitePublication.findMany({where:{status:'SCHEDULED',scheduledFor:{lte:now}},select:{firmId:true}})];
      for(const firmId of new Set(due.map(x=>x.firmId)))await this.publish({firmId,id:'',email:'',fullName:'Scheduled publisher',roleKeys:[],permissions:[]});
      const rows=await this.prisma.client.websitePublishRelease.findMany({where:{status:'QUEUED'},orderBy:{createdAt:'asc'},take:100});
      for(const row of rows)await this.queues.add(WEBSITE_PUBLISH_QUEUE,'website.publish',{firmId:row.firmId,releaseId:row.id},{jobId:row.id});
      const acknowledgements=await this.prisma.client.websiteLeadEvent.findMany({where:{type:'lead.ack_pending'},select:{id:true},take:100});
      for(const event of acknowledgements)await this.queues.add('website-ack','website.ack',{eventId:event.id},{jobId:event.id});
    }finally{this.dispatching=false;}
  }
}
