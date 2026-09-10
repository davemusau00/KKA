import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async createPublic(input: unknown, meta: { ip?: string; userAgent?: string; referrer?: string }) {
    const parsed = PublicLeadSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const value = parsed.data;
    if (value.website) return { reference: 'RECEIVED', status: 'NEW' }; // bot honeypot: do not reveal rejection

    const firmId = publicFirmId();
    const phone = normalizeKenyanPhone(value.phone);
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
      const lead = await tx.websiteLead.create({
        data: {
          firmId, reference, name:value.name, email, phone,
          practiceAreaSlug:value.practiceAreaSlug || null, message:value.message,
          status:duplicate ? 'DUPLICATE' : 'NEW', priority, score, consent:true,
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
          firmId, formId:form?.id, leadId:lead.id, payload:value,
          ipHash:meta.ip ? hashSensitive(meta.ip) : null, userAgent:meta.userAgent || null,
          referrer:meta.referrer || null, landingPage:value.landingPage || null, status:'PROCESSED'
        }
      });
      return lead;
    });
    return { id:created.id, reference:created.reference, status:created.status };
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

  async appointment(user: RequestUser, id: string, raw: unknown) {
    const input = AppointmentSchema.parse(raw);
    const lead = await this.get(user,id);
    await assertFirmUser(this.prisma,user.firmId,input.assignedUserId);
    const startsAt = new Date(input.startsAt), endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException('Appointment end must be after start');
    const event = await this.calendar.create(user.firmId,user.id,{
      title:`Website consultation: ${lead.name}`,
      eventType:'CLIENT_MEETING', startAt:input.startsAt, endAt:input.endsAt,
      timezone:'Africa/Nairobi', allDay:false, location:input.location,
      assignedUserId:input.assignedUserId, participantUserIds:[input.assignedUserId],
      sourceType:'WEBSITE_LEAD', editPolicy:'CONFIRM',
      notes:`Lead ${lead.reference}\n${lead.phone}${lead.email ? `\n${lead.email}` : ''}${input.notes ? `\n\n${input.notes}` : ''}`
    });
    const appointment = await this.prisma.client.websiteLeadAppointment.create({
      data:{ leadId:id, assignedUserId:input.assignedUserId, calendarEventId:event.id, startsAt, endsAt, location:input.location, notes:input.notes }
    });
    await this.prisma.client.websiteLead.update({ where:{ id }, data:{ status:'CONSULTATION_BOOKED', ownerUserId:lead.ownerUserId ?? input.assignedUserId } });
    await this.event(user,id,'lead.consultation_booked',`Consultation booked for ${startsAt.toISOString()}`,{ calendarEventId:event.id });
    return { appointment, calendarEvent:event };
  }

  async startIntake(user: RequestUser, id: string) {
    const lead = await this.get(user,id);
    if (lead.intakeId) return lead.intake;
    if (['DECLINED','DUPLICATE','CONFLICT','OUT_OF_SCOPE'].includes(lead.status)) throw new BadRequestException(`Cannot start intake from ${lead.status}`);
    const area = lead.practiceAreaSlug ? await this.prisma.client.websitePracticeArea.findFirst({ where:{ firmId:user.firmId, slug:lead.practiceAreaSlug } }) : null;
    const intake = await this.intake.create(user.firmId,user.id,{
      source:`PUBLIC_SITE:${lead.reference}`,
      clientName:lead.name,
      phone:lead.phone,
      email:lead.email ?? undefined,
      briefDescription:lead.message,
      practiceArea:area?.title ?? 'General Legal Enquiry',
      matterType:area?.title ?? undefined,
      assignedOwnerId:lead.ownerUserId ?? user.id,
      notes:`Originated from website lead ${lead.reference}. Source: ${lead.source ?? 'DIRECT'}.`
    });
    await this.prisma.client.websiteLead.update({ where:{ id }, data:{ status:'INTAKE_STARTED', intakeId:intake.id } });
    await this.event(user,id,'lead.intake_started',`Formal intake ${intake.intakeNumber ?? intake.id} created`,{ intakeId:intake.id, intakeNumber:intake.intakeNumber });
    await this.audit.record({ firmId:user.firmId, actorUserId:user.id, action:'website.lead_to_intake', entityType:'website_lead', entityId:id, metadata:{ intakeId:intake.id, intakeNumber:intake.intakeNumber } });
    return intake;
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
