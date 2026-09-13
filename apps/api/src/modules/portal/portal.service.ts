import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { StorageService } from "../../platform/storage/storage.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import type { RequestUser } from "../../platform/auth/auth.types";

export const PORTAL_PERMISSIONS = ["matter.summary", "calendar.upcoming", "documents.portal_visible"] as const;
export type PortalPermission = (typeof PORTAL_PERMISSIONS)[number];

@Injectable() export class PortalService{
 constructor(private readonly prisma:PrismaService,private readonly storage:StorageService,private readonly audit:AuditService,private readonly access:RecordAccessService){}
 private hash(t:string){return createHash("sha256").update(t).digest("hex")}
 private hasPermission(grant:{permissions:string[]},permission:PortalPermission){return grant.permissions.includes(permission)}
 private requirePermission(grant:{permissions:string[]},permission:PortalPermission){if(!this.hasPermission(grant,permission))throw new ForbiddenException("Portal grant does not permit this resource")}
 async createGrant(firmId:string,actorId:string,user:RequestUser,input:any){const client=await this.prisma.client.client.findFirst({where:{id:input.clientId,firmId}});if(!client)throw new NotFoundException("Client not found");const scope=await this.access.matterWhere(user);if(input.matterId){const m=await this.prisma.client.matter.findFirst({where:{id:input.matterId,clientId:input.clientId,...scope}});if(!m)throw new NotFoundException("Matter not found for client");}else{const visibleMatter=await this.prisma.client.matter.findFirst({where:{clientId:input.clientId,...scope},select:{id:true}});if(!visibleMatter)throw new NotFoundException("Client has no accessible matter");}const token=randomBytes(32).toString("base64url");const row=await this.prisma.client.portalAccessGrant.create({data:{firmId,clientId:input.clientId,matterId:input.matterId,email:input.email,tokenHash:this.hash(token),status:"ACTIVE",permissions:input.permissions??["matter.summary","calendar.upcoming","documents.portal_visible"],expiresAt:input.expiresAt?new Date(input.expiresAt):undefined}});await this.audit.record({firmId,actorUserId:actorId,action:"portal.grant_created",entityType:"portal_access_grant",entityId:row.id,matterId:input.matterId,metadata:{clientId:input.clientId,email:input.email,permissions:row.permissions}});return{...row,token,warning:"Portal token is returned once. Deliver through an approved channel."};}
 async revoke(firmId:string,actorId:string,user:RequestUser,id:string){const row=await this.prisma.client.portalAccessGrant.findFirst({where:{id,firmId}});if(!row)throw new NotFoundException("Portal access grant not found");const scope=await this.access.matterWhere(user);const visible=await this.prisma.client.matter.findFirst({where:row.matterId?{id:row.matterId,...scope}:{clientId:row.clientId,...scope},select:{id:true}});if(!visible)throw new NotFoundException("Portal access grant not found");const out=await this.prisma.client.portalAccessGrant.update({where:{id},data:{status:"REVOKED",tokenHash:null}});await this.audit.record({firmId,actorUserId:actorId,action:"portal.grant_revoked",entityType:"portal_access_grant",entityId:id,matterId:row.matterId??undefined,metadata:{clientId:row.clientId}});return out;}
 async grants(firmId:string,user:RequestUser){const rows=await this.prisma.client.portalAccessGrant.findMany({where:{firmId},orderBy:{createdAt:"desc"}});const scope=await this.access.matterWhere(user);const visibleClientIds=new Set((await this.prisma.client.client.findMany({where:{firmId,matters:{some:scope}},select:{id:true}})).map(row=>row.id));const visibleMatterIds=new Set((await this.prisma.client.matter.findMany({where:scope,select:{id:true}})).map(row=>row.id));return rows.filter(row=>row.matterId?visibleMatterIds.has(row.matterId):visibleClientIds.has(row.clientId));}
 private async grant(token:string){const row=await this.prisma.client.portalAccessGrant.findUnique({where:{tokenHash:this.hash(token)}});if(!row||row.status!=="ACTIVE"||(row.expiresAt&&row.expiresAt<new Date()))throw new ForbiddenException("Portal access is invalid or expired");return row;}
 async publicSummary(token:string){
  const g=await this.grant(token);
  const client=await this.prisma.client.client.findUnique({where:{id:g.clientId},select:{id:true,displayName:true}});
  if(!this.hasPermission(g,"matter.summary"))return{client,matters:[],permissions:g.permissions,expiresAt:g.expiresAt};
  const where:any={firmId:g.firmId,clientId:g.clientId};
  if(g.matterId)where.id=g.matterId;
  const includeCalendar=this.hasPermission(g,"calendar.upcoming");
  const includeDocuments=this.hasPermission(g,"documents.portal_visible");
  const matters=await this.prisma.client.matter.findMany({
   where,
   select:{
    id:true,internalReference:true,title:true,practiceArea:true,matterType:true,currentStageId:true,status:true,nextAction:true,lastActivityAt:true,
    ...(includeCalendar?{calendarEvents:{where:{startAt:{gte:new Date()}},select:{id:true,title:true,eventType:true,startAt:true,endAt:true,location:true},orderBy:{startAt:"asc"},take:20}}:{}),
    ...(includeDocuments?{documents:{where:{portalVisible:true},select:{id:true,title:true,documentType:true,updatedAt:true}}}: {})
   }
  });
  return{client,matters,permissions:g.permissions,expiresAt:g.expiresAt};
 }
 async publicDocument(token:string,documentId:string){const g=await this.grant(token);this.requirePermission(g,"documents.portal_visible");const d=await this.prisma.client.document.findFirst({where:{id:documentId,portalVisible:true,matter:{firmId:g.firmId,clientId:g.clientId,...(g.matterId?{id:g.matterId}:{})}},include:{currentVersion:true}});if(!d||!d.currentVersion)throw new NotFoundException("Document not available");return{document:d,stream:await this.storage.openDocument(d.currentVersion.storagePath)};}
}
