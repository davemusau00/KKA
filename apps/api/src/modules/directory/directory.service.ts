import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(firmId: string, type?: string, q?: string) {
    return this.prisma.client.directoryContact.findMany({
      where: {
        firmId,
        ...(type ? { type } : {}),
        ...(q ? { OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { organizationName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } }
        ] } : {})
      },
      orderBy: { displayName: "asc" },
      take: 1000
    });
  }

  async create(firmId: string, actorId: string, input: Record<string, any>) {
    const contact = await this.prisma.client.directoryContact.create({ data: { firmId, ...input } as any });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "directory.contact_created",
      entityType: "directory_contact", entityId: contact.id, metadata: { type: contact.type, displayName: contact.displayName }
    });
    return contact;
  }

  async update(firmId: string, actorId: string, id: string, input: Record<string, unknown>) {
    const existing = await this.prisma.client.directoryContact.findFirst({ where: { id, firmId } });
    if (!existing) throw new NotFoundException("Directory contact not found");
    const contact = await this.prisma.client.directoryContact.update({ where: { id }, data: input as any });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "directory.contact_updated",
      entityType: "directory_contact", entityId: id, metadata: { changedKeys: Object.keys(input) }
    });
    return contact;
  }
}
