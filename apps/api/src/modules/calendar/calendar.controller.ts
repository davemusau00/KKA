import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateCalendarEventSchema, RescheduleCalendarEventSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { CalendarService } from "./calendar.service";

@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get("events")
  @RequirePermissions("module.calendar")
  list(
    @CurrentUser() user: RequestUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("userId") userId?: string,
    @Query("matterId") matterId?: string
  ) {
    return this.calendar.list(
      user.firmId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      userId,
      matterId,
      user
    );
  }

  @Post("events")
  @RequirePermissions("calendar.manage")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.calendar.create(user.firmId, user.id, CreateCalendarEventSchema.parse(body));
  }

  @Post("events/:id/reschedule")
  @RequirePermissions("calendar.manage")
  reschedule(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.calendar.reschedule(user.firmId, user.id, id, RescheduleCalendarEventSchema.parse(body));
  }

  @Post("events/:id/documents")
  @RequirePermissions("document.upload")
  linkDocument(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ documentId: z.string(), requirementKey: z.string().optional() }).parse(body);
    return this.calendar.linkDocument(user.firmId, user.id, id, input.documentId, input.requirementKey);
  }

  @Post("events/:id/court-outcome")
  @RequirePermissions("calendar.manage")
  outcome(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      outcome: z.string().min(2),
      status: z.string().min(2),
      nextDate: z.string().datetime().optional(),
      directions: z.string().optional()
    }).parse(body);
    return this.calendar.completeFromCourtOutcome(user.firmId, user.id, id, input);
  }
}
