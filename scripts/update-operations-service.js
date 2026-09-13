const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/api/src/modules/operations/operations.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const rruleHelper = `
export function calculateRRuleOccurrences(
  rruleStr: string,
  startsAt: Date,
  horizonDays: number = 90,
  untilLimit?: Date
): Date[] {
  const occurrences: Date[] = [];
  const startMs = startsAt.getTime();
  const maxEndMs = Math.min(
    Date.now() + horizonDays * 24 * 60 * 60 * 1000,
    untilLimit ? untilLimit.getTime() : Infinity
  );

  const parts: Record<string, string> = {};
  rruleStr.split(';').forEach(p => {
    const [k, v] = p.trim().split('=');
    if (k && v) parts[k.toUpperCase()] = v.toUpperCase();
  });

  const freq = parts['FREQ'] || 'WEEKLY';
  const interval = Math.max(1, parseInt(parts['INTERVAL'] || '1', 10));
  const count = parts['COUNT'] ? parseInt(parts['COUNT'], 10) : Infinity;
  const until = parts['UNTIL'] ? new Date(parts['UNTIL']).getTime() : maxEndMs;
  const effectiveEndMs = Math.min(maxEndMs, until);

  const byDays = parts['BYDAY'] ? parts['BYDAY'].split(',').map(d => d.trim()) : null;

  let current = new Date(startsAt);
  while (current.getTime() <= effectiveEndMs && occurrences.length < count) {
    if (current.getTime() >= startMs) {
      if (!byDays || byDays.length === 0) {
        occurrences.push(new Date(current));
      } else {
        const dayCode = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][current.getDay()];
        if (byDays.includes(dayCode)) {
          occurrences.push(new Date(current));
        }
      }
    }

    if (freq === 'DAILY') {
      current.setDate(current.getDate() + interval);
    } else if (freq === 'WEEKLY') {
      if (byDays && byDays.length > 1) {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7 * interval);
      }
    } else if (freq === 'MONTHLY') {
      current.setMonth(current.getMonth() + interval);
    } else {
      current.setDate(current.getDate() + 7 * interval);
    }
  }

  return occurrences;
}
`;

const projectFinancialsMethod = `
  async getProjectFinancials(user: RequestUser, projectId: string) {
    const project = await this.prisma.client.internalProject.findFirst({
      where: { id: projectId, firmId: user.firmId },
      include: {
        milestones: true,
        spend: { orderBy: { occurredAt: 'desc' } }
      }
    });
    if (!project) throw new NotFoundException("Project not found");

    const approvedExpenses = await this.prisma.client.expenseRequest.findMany({
      where: { projectId, firmId: user.firmId, status: 'APPROVED' }
    });

    const paidExpenses = await this.prisma.client.expenseRequest.findMany({
      where: { projectId, firmId: user.firmId, status: 'PAID' }
    });

    const approvedRequisitions = await this.prisma.client.purchaseRequisition.findMany({
      where: { projectId, firmId: user.firmId, status: 'APPROVED' }
    });

    const approvedOrders = await this.prisma.client.purchaseOrder.findMany({
      where: { projectId, firmId: user.firmId, status: 'APPROVED' }
    });

    const budget = Number(project.budget || 0);

    const committedExpenseTotal = approvedExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const committedRequisitionTotal = approvedRequisitions.reduce((acc, r) => acc + Number(r.amount), 0);
    const committedOrderTotal = approvedOrders.reduce((acc, o) => acc + Number(o.amount), 0);
    const committed = committedExpenseTotal + committedRequisitionTotal + committedOrderTotal;

    const actualExpenseTotal = paidExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const postedSpendTotal = project.spend
      .filter((s: any) => s.source === 'FINANCE_POSTED')
      .reduce((acc: number, s: any) => acc + Number(s.amount), 0);
    const actual = actualExpenseTotal + postedSpendTotal;

    const manualSpend = project.spend
      .filter((s: any) => s.source === 'MANUAL')
      .reduce((acc: number, s: any) => acc + Number(s.amount), 0);

    const forecast = actual + committed + manualSpend;
    const remaining = Math.max(0, budget - (actual + committed));

    let healthStatus: 'on_track' | 'at_risk' | 'over_budget' = 'on_track';
    if (budget > 0) {
      if (actual + committed > budget) {
        healthStatus = 'over_budget';
      } else if (actual + committed > budget * 0.85) {
        healthStatus = 'at_risk';
      }
    }

    return {
      projectId: project.id,
      projectName: project.name,
      budget,
      committed,
      actual,
      manualUnverified: manualSpend,
      forecast,
      remaining,
      healthStatus,
      utilizationPercent: budget > 0 ? Math.round(((actual + committed) / budget) * 100) : 0,
      breakdown: {
        approvedExpenses,
        paidExpenses,
        approvedRequisitions,
        approvedOrders,
        manualSpend: project.spend.filter((s: any) => s.source === 'MANUAL'),
        financePostedSpend: project.spend.filter((s: any) => s.source === 'FINANCE_POSTED')
      }
    };
  }
`;

const meetingSeriesMethods = `
  async listMeetingSeries(firmId: string, filters: { projectId?: string; matterId?: string }) {
    return this.prisma.client.meetingSeries.findMany({
      where: {
        firmId,
        isActive: true,
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.matterId ? { matterId: filters.matterId } : {})
      },
      include: {
        meetings: {
          take: 5,
          where: { startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMeetingSeries(firmId: string, seriesId: string) {
    const series = await this.prisma.client.meetingSeries.findFirst({
      where: { id: seriesId, firmId },
      include: {
        meetings: {
          orderBy: { startsAt: 'asc' },
          include: {
            participants: {
              include: { user: { select: { id: true, fullName: true, email: true, jobTitle: true } } }
            },
            decisions: true,
            actions: true
          }
        }
      }
    });
    if (!series) throw new NotFoundException("Meeting series not found");
    return series;
  }

  async createMeetingSeries(firmId: string, actorId: string, input: {
    title: string;
    description?: string;
    recurrenceRule: string;
    startsAt: string | Date;
    durationMinutes?: number;
    location?: string;
    projectId?: string;
    matterId?: string;
    agendaTemplate?: any;
    defaultAttendeeIds?: string[];
    rollingHorizonDays?: number;
  }) {
    const duration = input.durationMinutes || 60;
    const rollingDays = input.rollingHorizonDays || 90;
    const startDate = new Date(input.startsAt);

    if (input.defaultAttendeeIds?.length) {
      await this.assertFirmUsers(firmId, input.defaultAttendeeIds);
    }
    if (input.projectId) {
      const proj = await this.prisma.client.internalProject.findFirst({ where: { id: input.projectId, firmId } });
      if (!proj) throw new BadRequestException("Project is invalid");
    }
    if (input.matterId) {
      const mat = await this.prisma.client.matter.findFirst({ where: { id: input.matterId, firmId } });
      if (!mat) throw new BadRequestException("Matter is invalid");
    }

    const occurrences = calculateRRuleOccurrences(input.recurrenceRule, startDate, rollingDays);

    const series = await this.prisma.client.meetingSeries.create({
      data: {
        firmId,
        title: input.title,
        description: input.description,
        recurrenceRule: input.recurrenceRule,
        startsAt: startDate,
        durationMinutes: duration,
        location: input.location,
        projectId: input.projectId,
        matterId: input.matterId,
        organizerId: actorId,
        agendaTemplate: input.agendaTemplate,
        defaultAttendeeIds: input.defaultAttendeeIds || [],
        rollingHorizonDays: rollingDays,
        lastGeneratedUntil: occurrences.length ? occurrences[occurrences.length - 1] : startDate,
      }
    });

    for (const occDate of occurrences) {
      const endsAt = new Date(occDate.getTime() + duration * 60 * 1000);
      await this.prisma.client.meeting.upsert({
        where: {
          seriesId_seriesOccurrenceStart: {
            seriesId: series.id,
            seriesOccurrenceStart: occDate
          }
        },
        create: {
          firmId,
          projectId: input.projectId,
          matterId: input.matterId,
          seriesId: series.id,
          seriesOccurrenceStart: occDate,
          title: input.title,
          startsAt: occDate,
          endsAt,
          location: input.location,
          agenda: input.agendaTemplate,
          organizerId: actorId,
          status: 'SCHEDULED',
          participants: input.defaultAttendeeIds?.length ? {
            create: input.defaultAttendeeIds.map(userId => ({ userId }))
          } : undefined
        },
        update: {}
      });
    }

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "operations.meeting_series_created",
      entityType: "meeting_series",
      entityId: series.id,
      matterId: input.matterId,
      metadata: { title: series.title, occurrencesGenerated: occurrences.length }
    });

    return this.getMeetingSeries(firmId, series.id);
  }

  async updateMeetingSeries(
    firmId: string,
    actorId: string,
    seriesId: string,
    input: {
      scope: 'this' | 'future' | 'all';
      meetingId?: string;
      updates: {
        title?: string;
        description?: string;
        location?: string;
        agenda?: any;
        status?: string;
      }
    }
  ) {
    const series = await this.prisma.client.meetingSeries.findFirst({ where: { id: seriesId, firmId } });
    if (!series) throw new NotFoundException("Meeting series not found");

    if (input.scope === 'this' && input.meetingId) {
      return this.updateMeeting(firmId, actorId, input.meetingId, input.updates);
    }

    if (input.scope === 'future' && input.meetingId) {
      const targetMeeting = await this.prisma.client.meeting.findFirst({ where: { id: input.meetingId, seriesId } });
      if (!targetMeeting) throw new NotFoundException("Meeting occurrence not found");

      await this.prisma.client.meeting.updateMany({
        where: {
          seriesId,
          startsAt: { gte: targetMeeting.startsAt },
          status: { in: ['SCHEDULED'] }
        },
        data: {
          ...(input.updates.title ? { title: input.updates.title } : {}),
          ...(input.updates.location !== undefined ? { location: input.updates.location } : {}),
          ...(input.updates.status ? { status: input.updates.status } : {})
        }
      });

      await this.audit.record({
        firmId,
        actorUserId: actorId,
        action: "operations.meeting_series_future_updated",
        entityType: "meeting_series",
        entityId: seriesId,
        metadata: { fromDate: targetMeeting.startsAt.toISOString(), changed: Object.keys(input.updates) }
      });

      return this.getMeetingSeries(firmId, seriesId);
    }

    await this.prisma.client.meetingSeries.update({
      where: { id: seriesId },
      data: {
        ...(input.updates.title ? { title: input.updates.title } : {}),
        ...(input.updates.description !== undefined ? { description: input.updates.description } : {}),
        ...(input.updates.location !== undefined ? { location: input.updates.location } : {})
      }
    });

    await this.prisma.client.meeting.updateMany({
      where: {
        seriesId,
        startsAt: { gte: new Date() },
        status: { in: ['SCHEDULED'] }
      },
      data: {
        ...(input.updates.title ? { title: input.updates.title } : {}),
        ...(input.updates.location !== undefined ? { location: input.updates.location } : {})
      }
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "operations.meeting_series_all_updated",
      entityType: "meeting_series",
      entityId: seriesId,
      metadata: { changed: Object.keys(input.updates) }
    });

    return this.getMeetingSeries(firmId, seriesId);
  }

  async advanceMeetingSeriesOccurrences(firmId: string, seriesId?: string) {
    const seriesList = await this.prisma.client.meetingSeries.findMany({
      where: {
        firmId,
        isActive: true,
        ...(seriesId ? { id: seriesId } : {})
      }
    });

    let totalCreated = 0;
    for (const s of seriesList) {
      const occurrences = calculateRRuleOccurrences(s.recurrenceRule, s.startsAt, s.rollingHorizonDays);
      for (const occDate of occurrences) {
        const existing = await this.prisma.client.meeting.findUnique({
          where: {
            seriesId_seriesOccurrenceStart: {
              seriesId: s.id,
              seriesOccurrenceStart: occDate
            }
          }
        });
        if (!existing) {
          const endsAt = new Date(occDate.getTime() + s.durationMinutes * 60 * 1000);
          await this.prisma.client.meeting.create({
            data: {
              firmId,
              projectId: s.projectId,
              matterId: s.matterId,
              seriesId: s.id,
              seriesOccurrenceStart: occDate,
              title: s.title,
              startsAt: occDate,
              endsAt,
              location: s.location,
              agenda: s.agendaTemplate ?? undefined,
              organizerId: s.organizerId,
              status: 'SCHEDULED',
              participants: s.defaultAttendeeIds?.length ? {
                create: s.defaultAttendeeIds.map(userId => ({ userId }))
              } : undefined
            }
          });
          totalCreated++;
        }
      }
      if (occurrences.length) {
        await this.prisma.client.meetingSeries.update({
          where: { id: s.id },
          data: { lastGeneratedUntil: occurrences[occurrences.length - 1] }
        });
      }
    }

    return { seriesProcessed: seriesList.length, newOccurrencesCreated: totalCreated };
  }
`;

// 1. Add rruleHelper before @Injectable()
if (!content.includes('function calculateRRuleOccurrences')) {
  content = content.replace(
    '@Injectable()',
    `${rruleHelper.trim()}\r\n\r\n@Injectable()`
  );
}

// 2. Add getProjectFinancials after recordProjectSpend
if (!content.includes('getProjectFinancials(')) {
  content = content.replace(
    /async recordProjectSpend\(firmId: string, actorId: string, projectId: string, input: any\) \{[\s\S]*?return \{ spend, auditRef: audit\.id \};\r?\n  \}/,
    (m) => `${m}\r\n${projectFinancialsMethod}`
  );
}

// 3. Add meetingSeriesMethods after updateMeeting
if (!content.includes('createMeetingSeries(')) {
  content = content.replace(
    /return this\.prisma\.client\.meeting\.findUnique\(\{[\s\S]*?actions: true\r?\n\s*\}\r?\n\s*\}\);\r?\n  \}/,
    (m) => `${m}\r\n${meetingSeriesMethods}`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated operations.service.ts with MeetingSeries and Project Financials');
