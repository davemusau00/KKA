import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(firmId: string, filters: { q?: string; practiceArea?: string; status?: string }) {
    return this.prisma.client.knowledgeItem.findMany({
      where: {
        firmId,
        ...(filters.practiceArea ? { practiceArea: filters.practiceArea } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.q ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { summary: { contains: filters.q, mode: "insensitive" } },
            { tags: { has: filters.q } }
          ]
        } : {})
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    });
  }

  async get(firmId: string, id: string) {
    const item = await this.prisma.client.knowledgeItem.findFirst({ where: { id, firmId } });
    if (!item) throw new NotFoundException("Knowledge item not found");
    return item;
  }

  async create(firmId: string, actorId: string, input: any) {
    if (input.documentId) {
      const document = await this.prisma.client.document.findFirst({ where: { id: input.documentId, firmId } });
      if (!document) throw new BadRequestException("Linked document is not available in this firm");
    }

    const item = await this.prisma.client.knowledgeItem.create({
      data: {
        firmId,
        ownerUserId: actorId,
        type: input.type,
        title: input.title,
        summary: input.summary,
        practiceArea: input.practiceArea,
        tags: input.tags,
        documentId: input.documentId,
        status: "DRAFT"
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "knowledge.item_created",
      entityType: "knowledge_item",
      entityId: item.id,
      metadata: { type: item.type, title: item.title }
    });
    return item;
  }

  async update(firmId: string, actorId: string, id: string, input: any) {
    const existing = await this.prisma.client.knowledgeItem.findFirst({ where: { id, firmId } });
    if (!existing) throw new NotFoundException("Knowledge item not found");
    if (existing.status === "ARCHIVED") throw new BadRequestException("Archived knowledge items must be restored before editing");

    if (input.documentId) {
      const document = await this.prisma.client.document.findFirst({ where: { id: input.documentId, firmId } });
      if (!document) throw new BadRequestException("Linked document is not available in this firm");
    }

    const item = await this.prisma.client.knowledgeItem.update({
      where: { id },
      data: {
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.practiceArea !== undefined ? { practiceArea: input.practiceArea } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.documentId !== undefined ? { documentId: input.documentId } : {}),
        ...(existing.status === "PUBLISHED" ? { status: "DRAFT", approvedById: null, approvedAt: null } : {})
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "knowledge.item_updated",
      entityType: "knowledge_item",
      entityId: id,
      metadata: { changed: Object.keys(input), previousStatus: existing.status, nextStatus: item.status }
    });
    return item;
  }

  async setStatus(
    firmId: string,
    actorId: string,
    id: string,
    status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED"
  ) {
    const existing = await this.prisma.client.knowledgeItem.findFirst({ where: { id, firmId } });
    if (!existing) throw new NotFoundException("Knowledge item not found");

    if (status === "PUBLISHED" && (!existing.summary || existing.summary.trim().length < 10)) {
      throw new BadRequestException("Published knowledge items require a useful summary");
    }

    const item = await this.prisma.client.knowledgeItem.update({
      where: { id },
      data: {
        status,
        approvedById: status === "PUBLISHED" ? actorId : status === "DRAFT" ? null : existing.approvedById,
        approvedAt: status === "PUBLISHED" ? new Date() : status === "DRAFT" ? null : existing.approvedAt
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "knowledge.status_changed",
      entityType: "knowledge_item",
      entityId: id,
      metadata: { from: existing.status, to: status }
    });
    return item;
  }
}
