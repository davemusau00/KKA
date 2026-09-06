import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { QueueService } from "../../platform/queue/queue.service";
import { AuditService } from "../../platform/audit/audit.service";
import { createHash } from "node:crypto";

@Injectable()
export class AutomationService {
  constructor(private readonly prisma:PrismaService,private readonly queues:QueueService,private readonly audit:AuditService){}
  list(firmId:string){return this.prisma.client.automationRule.findMany({where:{firmId},include:{runs:{orderBy:{createdAt:"desc"},take:20}},orderBy:{name:"asc"}});}
  async create(firmId:string,actorId:string,input:any){const row=await this.prisma.client.automationRule.create({data:{firmId,...input}});await this.audit.record({firmId,actorUserId:actorId,action:"automation.rule_created",entityType:"automation_rule",entityId:row.id,metadata:{name:row.name,triggerKey:row.triggerKey}});return row;}
  async update(firmId:string,actorId:string,id:string,input:any){const f=await this.prisma.client.automationRule.findFirst({where:{id,firmId}});if(!f)throw new NotFoundException("Automation rule not found");const row=await this.prisma.client.automationRule.update({where:{id},data:input});await this.audit.record({firmId,actorUserId:actorId,action:"automation.rule_updated",entityType:"automation_rule",entityId:id,metadata:{changedKeys:Object.keys(input)}});return row;}
  async run(firmId:string,actorId:string,id:string,event:unknown,idempotencyKey?:string){const rule=await this.prisma.client.automationRule.findFirst({where:{id,firmId,enabled:true}});if(!rule)throw new NotFoundException("Enabled automation rule not found");const key=idempotencyKey??createHash("sha256").update(`${id}:${JSON.stringify(event)}:${Date.now()}`).digest("hex");const run=await this.prisma.client.automationRun.create({data:{ruleId:id,triggerEvent:event as any,idempotencyKey:key,status:"QUEUED"}});await this.queues.add("automation","execute-rule",{runId:run.id,ruleId:id,firmId,actorId});return run;}
  runs(firmId:string){return this.prisma.client.automationRun.findMany({where:{rule:{firmId}},include:{rule:{select:{name:true,triggerKey:true}}},orderBy:{createdAt:"desc"},take:250});}
}
