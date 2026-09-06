import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(firmId: string, q?: string, practiceArea?: string) {
    return this.prisma.client.knowledgeItem.findMany({
      where: {
        firmId,
        ...(practiceArea ? { practiceArea } : {}),
        ...(q ? { OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          { tags: { has: q } }
        ] } : {})
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  async create(firmId: string, actorId: string, input: any) {
    const item = await this.prisma.client.knowledgeItem.create({
      data: { firmId, ownerUserId: actorId, ...input }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "knowledge.item_created",
      entityType: "knowledge_item", entityId: item.id, metadata: { type: item.type, title: item.title }
    });
    return item;
  }
}
