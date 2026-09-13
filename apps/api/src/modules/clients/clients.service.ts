import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { NumberingService } from "../numbering/numbering.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly access: RecordAccessService
  ) {}

  async list(firmId: string, q: string | undefined, user: RequestUser) {
    const matterScope = await this.access.matterWhere(user);
    return this.prisma.client.client.findMany({
      where: {
        firmId,
        matters: { some: matterScope },
        ...(q ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { idNumber: { contains: q, mode: "insensitive" } },
            { clientNumber: { contains: q, mode: "insensitive" } }
          ]
        } : {})
      },
      orderBy: { updatedAt: "desc" },
      take: 250
    });
  }

  async get(firmId: string, id: string, user: RequestUser) {
    const matterScope = await this.access.matterWhere(user);
    const client = await this.prisma.client.client.findFirst({
      where: { id, firmId, matters: { some: matterScope } },
      include: {
        matters: {
          select: {
            id: true, internalReference: true, title: true, status: true, currentStageId: true,
            responsibleBranchId: true, lastActivityAt: true
          }
        }
      }
    });
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  async create(firmId: string, actorId: string, input: Record<string, any>) {
    const clientNumber = await this.numbering.next({
      firmId,
      entityType: "CLIENT",
      year: new Date().getFullYear(),
      pattern: "KKA/CL/{year}/{seq:5}"
    });
    const client = await this.prisma.client.client.create({
      data: { firmId, clientNumber, ...input } as any
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "client.created",
      entityType: "client",
      entityId: client.id,
      clientId: client.id,
      metadata: { clientNumber, displayName: client.displayName }
    });
    return client;
  }

  async update(user: RequestUser, id: string, input: Record<string, unknown>) {
    const existing = await this.prisma.client.client.findFirst({
      where: { id, firmId: user.firmId, matters: { some: await this.access.matterWhere(user) } }
    });
    if (!existing) throw new NotFoundException("Client not found");
    const client = await this.prisma.client.client.update({ where: { id }, data: input as any });
    await this.audit.record({
      firmId: user.firmId,
      actorUserId: user.id,
      action: "client.updated",
      entityType: "client",
      entityId: id,
      clientId: id,
      metadata: { changedKeys: Object.keys(input) }
    });
    return client;
  }
}
