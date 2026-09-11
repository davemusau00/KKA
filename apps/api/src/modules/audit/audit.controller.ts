import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { RecordAccessService } from "../../platform/auth/record-access.service";

@Controller("audit")
export class AuditController {
  constructor(private readonly prisma: PrismaService, private readonly access: RecordAccessService) {}

  @Get()
  @RequirePermissions("admin.audit_view")
  list(
    @CurrentUser() user: RequestUser,
    @Query("matterId") matterId?: string,
    @Query("entityType") entityType?: string,
    @Query("actorUserId") actorUserId?: string
  ) {
    const where = {
      firmId: user.firmId,
      ...(matterId ? { matterId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(actorUserId ? { actorUserId } : {})
    };
    return this.prisma.client.auditEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 2000
    }).then(async (rows) => {
      const visibleMatterIds = new Set<string>();
      for (const row of rows) {
        if (row.matterId && await this.access.canViewMatter(user, row.matterId)) visibleMatterIds.add(row.matterId);
      }
      return rows.filter((row) => !row.matterId || visibleMatterIds.has(row.matterId));
    });
  }
}
