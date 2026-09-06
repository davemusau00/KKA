import { Controller, Get } from "@nestjs/common";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { ReportingService } from "./reporting.service";
@Controller("reports")
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}
  @Get("management-dashboard")
  @RequirePermissions("reports.firm.read")
  dashboard(@CurrentUser() user: RequestUser) {
    return this.reporting.managementDashboard(user.firmId);
  }
}
