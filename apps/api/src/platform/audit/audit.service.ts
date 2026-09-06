import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditInput {
  firmId?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  matterId?: string;
  clientId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    const previous = await this.prisma.client.auditEvent.findFirst({
      where: { firmId: input.firmId ?? null },
      orderBy: { occurredAt: "desc" },
      select: { eventHash: true }
    });

    const metadata = input.metadata ?? {};
    const material = JSON.stringify({
      previousHash: previous?.eventHash ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      matterId: input.matterId ?? null,
      actorUserId: input.actorUserId ?? null,
      metadata,
      timestamp: new Date().toISOString()
    });
    const eventHash = createHash("sha256").update(material).digest("hex");

    return this.prisma.client.auditEvent.create({
      data: {
        firmId: input.firmId,
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        matterId: input.matterId,
        clientId: input.clientId,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: metadata as any,
        previousHash: previous?.eventHash,
        eventHash
      }
    });
  }
}
