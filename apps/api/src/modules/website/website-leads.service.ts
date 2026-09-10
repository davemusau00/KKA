import { SiteContentService } from './site-content.service';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { RequestUser } from '../../platform/auth/auth.types';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { AuditService } from '../../platform/audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { IntakeService } from '../intake/intake.service';
import { CalendarService } from '../calendar/calendar.service';
import {
  AppointmentSchema, AssignLeadSchema, ContactAttemptSchema, PublicLeadSchema, UpdateLeadSchema
} from './website.schemas';
import { assertFirmUser, hashSensitive, normalizeKenyanPhone, publicFirmId } from './website.utils';

const TERMINAL = new Set(['CONVERTED','DECLINED','DUPLICATE','CONFLICT','OUT_OF_SCOPE']);
const TRANSITIONS: Record<string, Set<string>> = {
  NEW: new Set(['REVIEWING','CONTACTED','DUPLICATE','DECLINED','OUT_OF_SCOPE']),
  REVIEWING: new Set(['CONTACTED','QUALIFIED','DECLINED','DUPLICATE','CONFLICT','OUT_OF_SCOPE']),
  CONTACTED: new Set(['CONSULTATION_BOOKED','QUALIFIED','NO_RESPONSE','DECLINED','OUT_OF_SCOPE']),
  CONSULTATION_BOOKED: new Set(['CONSULTED','CONTACTED','NO_RESPONSE']),
  CONSULTED: new Set(['QUALIFIED','DECLINED','OUT_OF_SCOPE','CONFLICT']),
  QUALIFIED: new Set(['INTAKE_STARTED','DECLINED','CONFLICT']),
  NO_RESPONSE: new Set(['CONTACTED','DECLINED']),
  INTAKE_STARTED: new Set(['CONVERTED','CONFLICT','DECLINED']),
};

@Injectable()
export class WebsiteLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: NumberingService,
    private readonly intake: IntakeService,
    private readonly calendar: CalendarService,
    private readonly audit: AuditService,
    private readonly content: SiteContentService,
  ) {}

  async createPublic(input: unknown, meta: { ip?: string; userAgent?: string; referrer?: string }) {
    const parsed = PublicLeadSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const value = parsed.data;
    if (value.website) throw new BadRequestException('Unable to accept this enquiry.');

    const firmId = publicFirmId();
    const publicData=await this.content.bootstrap();
    const definition=publicData.forms?.find(f=>f.key==='general-enquiry');
    if(!definition)throw new BadRequestException('The enquiry form is not available.');
    if(value.formVersion && value.formVersion!==definition.version)throw new ConflictException('This form has changed. Reload the page before submitting.');
    if(value.practiceAreaSlug && !publicData.practiceAreas.some(a=>a.slug===value.practiceAreaSlug))throw new BadRequestException('Choose an available practice area.');
    const phone = normalizeKenyanPhone(value.phone);
    if(!/^\+[1-9]\d{7,14}$/.test(phone))throw new BadRequestException('Enter a valid phone number including its country code.');
    const email = value.email || null;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const duplicate = await this.prisma.client.websiteLead.findFirst({
      where: {
        firmId, createdAt: { gte: since },
        OR: [{ phone }, ...(email ? [{ email: { equals: email, mode:'insensitive' as const } }] : [])]
      }, orderBy: { createdAt:'desc' }
    });

    const reference = await this.numbering.next({
      firmId, entityType:'WEBSITE_LEAD', year:new Date().getFullYear(), pattern:'KKA/WEB/{year}/{seq:5}'
    });
    const score = this.score(value);
    const priority = score >= 80 ? 'URGENT' : score >= 55 ? 'HIGH' : score < 20 ? 'LOW' : 'NORMAL';

    const created = await this.prisma.client.$transaction(async tx => {
      if(value.idempotencyKey){
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${firmId+':lead:'+value.idempotencyKey}))`;
        const prior=await tx.websiteFormSubmission.findFirst({where:{firmId,payload:{path:['idempotencyKey'],equals:value.idempotencyKey}},include:{lead:true}});
        if(prior){
          const old=prior.payload as any;
          if(old.requestHash!==hashSensitive(JSON.stringify(value)))throw new ConflictException('This submission key was already used for different information.');
          if(!prior.lead)throw new ConflictException('The original submission is not available.');
          return prior.lead;
        }
      }
      const lead = await tx.websiteLead.create({
        data: {
          firmId, reference, name:value.name, email, phone,
          practiceAreaSlug:value.practiceAreaSlug || null, message:value.message,
          status:'NEW', priority, score, consent:true,
          source:value.source || value.utm?.utm_source || 'DIRECT', landingPage:value.landingPage || '/',
          dispositionReason:duplicate ? `Possible duplicate of ${duplicate.reference}` : null,
        }
      });
      await tx.websiteLeadEvent.create({
        data:{ leadId:lead.id, type:'lead.created', note:'Website enquiry received', metadata:{ score, priority } }
      });
      if (duplicate) {
        await tx.websiteLeadEvent.create({
          data:{ leadId:lead.id, type:'lead.duplicate_detected', note:`Possible duplicate of ${duplicate.reference}`, metadata:{ duplicateId:duplicate.id } }
        });
      }
      await tx.websiteAttributionTouch.create({
        data:{
          leadId:lead.id, source:value.utm?.utm_source || value.source || null,
          medium:value.utm?.utm_medium || null, campaign:value.utm?.utm_campaign || null,
          term:value.utm?.utm_term || null, content:value.utm?.utm_content || null,
          referrer:meta.referrer || null, landingPage:value.landingPage || null
        }
      });
      const form = await tx.websiteFormDefinition.findFirst({ where:{ firmId, key:'general-enquiry', active:true } });
      await tx.websiteFormSubmission.create({
        data:{
          firmId, formId:form?.id, leadId:lead.id, payload:{...value,requestHash:hashSensitive(JSON.stringify(value)),formVersion:definition.version,consentText:definition.consentText},
          ipHash:meta.ip ? hashSensitive(meta.ip) : null, userAgent:meta.userAgent || null,
          referrer:meta.referrer || null, landingPage:value.landingPage || null, status:'PROCESSED'
        }
      });
      const recipients=await tx.user.findMany({where:{firmId,status:'ACTIVE',roles:{some:{role:{permissions:{some:{permission:{key:'website.leads.view'}}}}}}},select:{id:true}});
      if(recipients.length)await tx.notification.createMany({data:recipients.map(r=>({recipientUserId:r.id,category:'WEBSITE_LEAD',title:'New website enquiry',message:`Enquiry ${lead.reference} is ready for review.`,urgency:priority}))});
      if(email)await tx.websiteLeadEvent.create({data:{leadId:lead.id,type:'lead.ack_pending',note:'Acknowledgement queued for local mail capture',metadata:{}}});
      return lead;
    });
    return { reference:created.reference, status:'RECEIVED' };
  }

  async list(user: RequestUser, query: { status?: string; ownerUserId?: string; q?: string; from?: string; to?: string; limit?: string; cursor?: string }) {
    const take = Math.min(Math.max(Number(query.limit ?? 100), 1), 250);
    const q = query.q?.trim();
    return this.prisma.client.websiteLead.findMany({
      where:{
        firmId:user.firmId,
        ...(query.status ? { status:query.status as any } : {}),
        ...(query.ownerUserId ? { ownerUserId:query.ownerUserId } : {}),
        ...(query.from || query.to ? { createdAt:{ ...(query.from ? { gte:new Date(query.from) } : {}), ...(query.to ? { lte:new Date(query.to) } : {}) } } : {}),
        ...(q ? { OR:[
          { reference:{ contains:q, mode:'insensitive' } }, { name:{ contains:q, mode:'insensitive' } },
          { phone:{ contains:q, mode:'insensitive' } }, { email:{ contains:q, mode:'insensitive' } }
        ] } : {})
      },
      include:{ owner:{ select:{ id:true, fullName:true, email:true } }, _count:{ select:{ events:true, contactAttempts:true, appointments:true } } },
      orderBy:[{ createdAt:'desc' }, { id:'desc' }], take,
      ...(query.cursor ? { cursor:{ id:query.cursor }, skip:1 } : {})
    });
  }

  async get(user: RequestUser, id: string) {
    const lead = await this.prisma.client.websiteLead.findFirst({
      where:{ id, firmId:user.firmId },
      include:{
        owner:{ select:{ id:true, fullName:true, email:true, phone:true } },
        intake:{ select:{ id:true, intakeNumber:true, disposition:true, convertedMatterId:true } },
        events:{ include:{ actor:{ select:{ id:true, fullName:true } } }, orderBy:{ createdAt:'desc' } },
        assignments:{ include:{ user:{ select:{ id:true, fullName:true } }, assignedBy:{ select:{ id:true, fullName:true } } }, orderBy:{ assignedAt:'desc' } },
        contactAttempts:{ include:{ actor:{ select:{ id:true, fullName:true } } }, orderBy:{ contactedAt:'desc' } },
        appointments:{ include:{ assignedUser:{ select:{ id:true, fullName:true } } }, orderBy:{ startsAt:'desc' } },
        attribution:{ orderBy:{ occurredAt:'asc' } }, submissions:{ orderBy:{ createdAt:'desc' } }
      }
    });
    if (!lead) throw new NotFoundException('Website lead not found');
    return lead;
  }

  async update(user: RequestUser, id: string, raw: unknown) {
    const input = UpdateLeadSchema.parse(raw);
    const lead = await this.get(user, id);
    if(input.status==='CONVERTED' && !lead.intake?.convertedMatterId)throw new BadRequestException('Conversion requires a converted formal intake.');
    if (input.status && input.status !== lead.status) {
      const allowed = TRANSITIONS[lead.status];
      if (TERMINAL.has(lead.status) || (allowed && !allowed.has(input.status))) {
        throw new BadRequestException(`Lead cannot move from ${lead.status} to ${input.status}`);
      }
    }
    const updated = await this.prisma.client.websiteLead.update({
      where:{ id }, data:{
        ...(input.status ? { status:input.status, convertedAt:input.status === 'CONVERTED' ? new Date() : undefined } : {}),
        ...(input.priority ? { priority:input.priority } : {}),
        ...(input.dispositionReason !== undefined ? { dispositionReason:input.dispositionReason } : {})
      }
    });
    await this.event(user, id, 'lead.updated', `Lead updated${input.status ? ` to ${input.status}` : ''}`, input);
    await this.audit.record({ firmId:user.firmId, actorUserId:user.id, action:'website.lead_updated', entityType:'website_lead', entityId:id, metadata:input });
    return updated;
  }

  async assign(user: RequestUser, id: string, raw: unknown) {
    const input = AssignLeadSchema.parse(raw);
    const lead = await this.get(user, id);
    await assertFirmUser(this.prisma, user.firmId, input.userId);
    const result = await this.prisma.client.$transaction(async tx => {
      await tx.websiteLeadAssignment.updateMany({ where:{ leadId:id, endedAt:null }, data:{ endedAt:new Date() } });
      await tx.websiteLeadAssignment.create({ data:{ leadId:id, userId:input.userId, assignedById:user.id, reason:input.reason } });
      return tx.websiteLead.update({ where:{ id }, data:{ ownerUserId:input.userId, status:lead.status === 'NEW' ? 'REVIEWING' : lead.status } });
    });
    await this.event(user,id,'lead.assigned',`Lead assigned to ${input.userId}`,input);
    await this.audit.record({ firmId:user.firmId, actorUserId:user.id, action:'website.lead_assigned', entityType:'website_lead', entityId:id, metadata:input });
    return result;
  }

  async contact(user: RequestUser, id: string, raw: unknown) {
    const input = ContactAttemptSchema.parse(raw);
    await this.get(user,id);
    const attempt = await this.prisma.client.websiteLeadContactAttempt.create({ data:{ leadId:id, actorUserId:user.id, ...input } });
    await this.prisma.client.websiteLead.updateMany({ where:{ id, firmId:user.firmId, status:{ in:['NEW','REVIEWING','NO_RESPONSE'] } }, data:{ status:'CONTACTED' } });
    await this.event(user,id,'lead.contact_attempt',`${input.direction} ${input.channel}: ${input.outcome}`,input);
    return attempt;
  }

  async appointment(user:RequestUser,id:string,raw:unknown){
    const input=AppointmentSchema.parse(raw);await assertFirmUser(this.prisma,user.firmId,input.assignedUserId);
    const startsAt=new Date(input.startsAt),endsAt=new Date(input.endsAt);
    if(endsAt<=startsAt)throw new BadRequestException('Appointment end must be after start');
    return this.prisma.client.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.firmId+':website-appointment:'+id}))`;
      const lead=await tx.websiteLead.findFirst({where:{id,firmId:user.firmId}});if(!lead)throw new NotFoundException('Website lead not found');
      const prior=await tx.websiteLeadAppointment.findFirst({where:{leadId:id,assignedUserId:input.assignedUserId,startsAt,endsAt}});
      if(prior)return {appointment:prior,calendarEvent:await tx.calendarEvent.findUnique({where:{id:prior.calendarEventId!}})};
      if(!['NEW','REVIEWING','CONTACTED','CONSULTATION_BOOKED'].includes(lead.status))throw new BadRequestException('This lead cannot be booked for consultation in its current state.');
      const event=await this.calendar.create(user.firmId,user.id,{title:`Website consultation: ${lead.name}`,eventType:'CLIENT_MEETING',startAt:input.startsAt,endAt:input.endsAt,timezone:'Africa/Nairobi',allDay:false,location:input.location,assignedUserId:input.assignedUserId,participantUserIds:[input.assignedUserId],sourceType:'WEBSITE_LEAD',editPolicy:'CONFIRM',notes:`Lead ${lead.reference}`},tx);
      const appointment=await tx.websiteLeadAppointment.create({data:{leadId:id,assignedUserId:input.assignedUserId,calendarEventId:event.id,startsAt,endsAt,location:input.location,notes:input.notes}});
      await tx.websiteLead.update({where:{id},data:{status:'CONSULTATION_BOOKED',ownerUserId:lead.ownerUserId??input.assignedUserId}});
      await tx.websiteLeadEvent.create({data:{leadId:id,actorUserId:user.id,type:'lead.consultation_booked',note:'Consultation recorded in the firm calendar',metadata:{calendarEventId:event.id}}});
      return {appointment,calendarEvent:event};
    },{timeout:30000});
  }

  async startIntake(user:RequestUser,id:string){
    return this.prisma.client.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.firmId+':website-intake:'+id}))`;
      const lead=await tx.websiteLead.findFirst({where:{id,firmId:user.firmId},include:{intake:true}});
      if(!lead)throw new NotFoundException('Website lead not found');
      if(lead.intake)return lead.intake;
      if(lead.status!=='QUALIFIED')throw new BadRequestException('Qualify this enquiry before starting formal intake.');
      const area=lead.practiceAreaSlug?await tx.websitePracticeArea.findFirst({where:{firmId:user.firmId,slug:lead.practiceAreaSlug}}):null;
      const intake=await this.intake.create(user.firmId,user.id,{
        source:`PUBLIC_SITE:${lead.reference}`,clientName:lead.name,phone:lead.phone,email:lead.email??undefined,
        briefDescription:lead.message,practiceArea:area?.title??'General Legal Enquiry',matterType:area?.title,
        assignedOwnerId:lead.ownerUserId??user.id,notes:`Website enquiry ${lead.reference}`
      },tx);
      await tx.websiteLead.update({where:{id},data:{status:'INTAKE_STARTED',intakeId:intake.id}});
      await tx.websiteLeadEvent.create({data:{leadId:id,actorUserId:user.id,type:'lead.intake_started',note:`Formal intake ${intake.intakeNumber} created`,metadata:{intakeId:intake.id}}});
      await this.audit.record({firmId:user.firmId,actorUserId:user.id,action:'website.lead_to_intake',entityType:'website_lead',entityId:id,metadata:{intakeId:intake.id}},tx);
      return intake;
    },{timeout:30000});
  }

  async analytics(user: RequestUser, days = 30) {
    const since = new Date(Date.now() - Math.min(Math.max(days,1),365) * 86400000);
    const [total, converted, byStatus, byPractice, bySource] = await Promise.all([
      this.prisma.client.websiteLead.count({ where:{ firmId:user.firmId, createdAt:{ gte:since } } }),
      this.prisma.client.websiteLead.count({ where:{ firmId:user.firmId, createdAt:{ gte:since }, intakeId:{ not:null } } }),
      this.prisma.client.websiteLead.groupBy({ by:['status'], where:{ firmId:user.firmId, createdAt:{ gte:since } }, _count:{ _all:true } }),
      this.prisma.client.websiteLead.groupBy({ by:['practiceAreaSlug'], where:{ firmId:user.firmId, createdAt:{ gte:since } }, _count:{ _all:true } }),
      this.prisma.client.websiteLead.groupBy({ by:['source'], where:{ firmId:user.firmId, createdAt:{ gte:since } }, _count:{ _all:true } }),
    ]);
    return { since, total, convertedToIntake:converted, conversionRate: total ? converted/total : 0, byStatus, byPractice, bySource };
  }

  private score(value: any) {
    let score = 10;
    if (value.email) score += 10;
    if (value.practiceAreaSlug) score += 15;
    const text = String(value.message).toLowerCase();
    if (text.length > 200) score += 10;
    if (/court|hearing|deadline|served|summons|judgment|accident|injur|dismiss|termination|urgent/.test(text)) score += 20;
    if (/today|tomorrow|this week|deadline|urgent|immediately/.test(text)) score += 20;
    if (value.utm?.utm_campaign) score += 5;
    return Math.min(score,100);
  }

  private async event(user: RequestUser, leadId: string, type: string, note: string, metadata: unknown = {}) {
    await this.prisma.client.websiteLeadEvent.create({ data:{ leadId, actorUserId:user.id, type, note, metadata:metadata as any } });
  }
}
