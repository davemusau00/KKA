import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";

@Controller("audit")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("admin.audit_view")
  list(
    @CurrentUser() user: RequestUser,
    @Query("matterId") matterId?: string,
    @Query("entityType") entityType?: string,
    @Query("actorUserId") actorUserId?: string
  ) {
    return this.prisma.client.auditEvent.findMany({
      where: {
        firmId: user.firmId,
        ...(matterId ? { matterId } : {}),
        ...(entityType ? { entityType } : {}),
        ...(actorUserId ? { actorUserId } : {})
      },
      orderBy: { occurredAt: "desc" },
      take: 2000
    });
  }
}
