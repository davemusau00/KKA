import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { CourtService } from "./court.service";

@Controller("court")
export class CourtController {
  constructor(private readonly court: CourtService) {}

  @Get("dashboard")
  @RequirePermissions("module.calendar")
  dashboard(@CurrentUser() user: RequestUser, @Query("from") from?: string, @Query("to") to?: string) {
    return this.court.dashboard(user.firmId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Get("proceedings")
  @RequirePermissions("matter.view")
  proceedings(@CurrentUser() user: RequestUser, @Query("matterId") matterId?: string) {
    return this.court.proceedings(user.firmId, matterId);
  }

  @Post("proceedings")
  @RequirePermissions("matter.edit")
  proceeding(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      matterId: z.string(),
      courtName: z.string().min(2),
      station: z.string().min(2),
      division: z.string().optional(),
      caseNumber: z.string().min(2),
      proceedingType: z.string().min(2),
      filedAt: z.string().datetime().optional(),
      judgeOrMagistrate: z.string().optional(),
      opposingCounsel: z.string().optional(),
      notes: z.string().optional()
    }).parse(body);
    return this.court.createProceeding(user.firmId, user.id, input);
  }

  @Post("filings")
  @RequirePermissions("document.file")
  filing(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.court.createFiling(user.firmId, user.id, body);
  }

  @Patch("filings/:id")
  @RequirePermissions("document.file")
  updateFiling(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.court.updateFiling(user.firmId, user.id, id, body);
  }

  @Post("service")
  @RequirePermissions("matter.edit")
  service(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.court.createServiceRecord(user.firmId, user.id, body);
  }

  @Post("service/:id/attempts")
  @RequirePermissions("matter.edit")
  attempt(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      attemptedAt: z.string().datetime(),
      outcome: z.string().min(2),
      notes: z.string().optional(),
      served: z.boolean().default(false)
    }).parse(body);
    return this.court.addServiceAttempt(user.firmId, user.id, id, input);
  }
}
