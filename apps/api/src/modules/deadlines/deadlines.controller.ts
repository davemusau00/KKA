import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { DeadlinesService } from "./deadlines.service";

const calculationMethod = z.enum(["MANUAL", "CALENDAR_DAYS", "BUSINESS_DAYS"]);
const stayPeriods = z.array(z.object({ startAt: z.string().datetime(), endAt: z.string().datetime(), reason: z.string().min(2) })).optional();
const base = z.object({
  title: z.string().min(2).max(300), deadlineType: z.string().min(2).max(100), source: z.string().min(2).max(500),
  sourceEventId: z.string().optional(), sourceDocumentId: z.string().optional(), legalRuleCode: z.string().max(100).optional(),
  calculationMethod: calculationMethod.optional(), calculationAnchorAt: z.string().datetime().nullable().optional(), calculationDays: z.number().int().min(0).max(36500).optional(),
  excludedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(1000).optional(), officialDueAt: z.string().datetime().optional(), internalTargetAt: z.string().datetime().nullable().optional(),
  courtOrderOverride: z.boolean().optional(), courtOrderDocumentId: z.string().optional(), reminderSchedule: z.array(z.object({ offsetDays: z.number().int(), channel: z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]) })).max(20).optional(),
  responsibleUserId: z.string().optional(), escalationUserId: z.string().optional(), stayPeriods, riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]), immutable: z.boolean().optional(), notes: z.string().max(10000).optional()
});

@Controller("deadlines")
export class DeadlinesController {
  constructor(private readonly deadlines: DeadlinesService) {}

  @Get()
  @RequirePermissions("task.view")
  list(@CurrentUser() user: RequestUser, @Query("matterId") matterId?: string) {
    return this.deadlines.list(user, matterId);
  }

  @Get(":id")
  @RequirePermissions("task.view")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.deadlines.get(user, id);
  }

  @Post()
  @RequirePermissions("task.create")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.deadlines.create(user, base.extend({ matterId: z.string() }).parse(body));
  }

  @Post(":id/revisions")
  @RequirePermissions("task.edit")
  revise(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.deadlines.revise(user, id, base.partial().extend({
      expectedVersion: z.number().int().positive(), action: z.enum(["RECALCULATED", "EXTENDED", "COURT_ORDER_OVERRIDE", "STAY_APPLIED", "STAY_LIFTED"]),
      source: z.string().min(2).max(500), reason: z.string().min(2).max(3000)
    }).parse(body));
  }

  @Post(":id/complete")
  @RequirePermissions("task.edit")
  complete(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.deadlines.complete(user, id, z.object({ expectedVersion: z.number().int().positive(), note: z.string().max(3000).optional() }).parse(body));
  }
}
