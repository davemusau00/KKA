import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService, private readonly access: RecordAccessService) {}

  async managementDashboard(user: RequestUser) {
    const firmId = user.firmId;
    const matterScope = await this.access.matterWhere(user);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000);
    const sevenDays = new Date(now.getTime() + 7 * 86400_000);

    const [activeMatters, stalledMatters, overdueTasks, courtNext7, pendingApprovals, pendingExpenses, mattersByStage] =
      await Promise.all([
        this.prisma.client.matter.count({ where: { ...matterScope, status: "ACTIVE" } }),
        this.prisma.client.matter.count({ where: { ...matterScope, status: "ACTIVE", lastActivityAt: { lt: thirtyDaysAgo } } }),
        this.prisma.client.task.count({ where: { matter: matterScope, dueAt: { lt: now }, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
        this.prisma.client.calendarEvent.count({ where: { firmId, eventType: "COURT", startAt: { gte: now, lte: sevenDays }, OR: [{ matterId: null }, { matter: matterScope }] } }),
        this.prisma.client.approvalRequest.count({ where: { firmId, status: "PENDING" } }),
        this.prisma.client.expenseRequest.count({ where: { firmId, status: "SUBMITTED" } }),
        this.prisma.client.matter.groupBy({
          by: ["currentStageId"],
          where: { ...matterScope, status: "ACTIVE" },
          _count: { _all: true },
          orderBy: { currentStageId: "asc" }
        })
      ]);

    return {
      generatedAt: now,
      activeMatters,
      stalledMatters,
      overdueTasks,
      courtNext7,
      pendingApprovals,
      pendingExpenses,
      mattersByStage: mattersByStage.map((row) => ({ stage: row.currentStageId, count: row._count._all }))
    };
  }
}
