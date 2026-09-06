import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { QueueService, QUEUES } from "../../platform/queue/queue.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class MailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
    private readonly audit: AuditService
  ) {}

  senderIdentities(firmId: string) {
    return this.prisma.client.senderIdentity.findMany({
      where: { integration: { firmId }, active: true },
      include: {
        integration: {
          select: { id: true, kind: true, name: true, status: true, enabled: true }
        }
      },
      orderBy: { email: "asc" }
    });
  }

  async send(
    firmId: string,
    actorId: string,
    input: {
      senderIdentityId: string;
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      bodyText?: string;
      bodyHtml?: string;
      matterId?: string;
      clientId?: string;
      intakeId?: string;
    }
  ) {
    const sender = await this.prisma.client.senderIdentity.findFirst({
      where: { id: input.senderIdentityId, integration: { firmId, enabled: true } },
      include: { integration: true }
    });
    if (!sender) throw new BadRequestException("Sender identity is not active");
    if (sender.integration.kind !== "SMTP") {
      throw new BadRequestException("This backend package currently sends live mail only through SMTP connections");
    }

    const recipients = [
      ...input.to.map((address) => ({ type: "TO", address })),
      ...(input.cc ?? []).map((address) => ({ type: "CC", address })),
      ...(input.bcc ?? []).map((address) => ({ type: "BCC", address }))
    ];
    if (!recipients.length) throw new BadRequestException("At least one recipient is required");

    const message = await this.prisma.client.mailMessage.create({
      data: {
        firmId,
        senderIdentityId: sender.id,
        direction: "OUTBOUND",
        subject: input.subject,
        bodyText: input.bodyText,
        bodyHtml: input.bodyHtml,
        fromAddress: sender.email,
        matterId: input.matterId,
        clientId: input.clientId,
        intakeId: input.intakeId,
        triageStatus: input.matterId ? "MATTER_LINKED" : "UNASSIGNED",
        queuedAt: new Date(),
        createdById: actorId,
        recipients: { create: recipients },
        deliveries: {
          create: [{ status: "QUEUED" }]
        }
      },
      include: { recipients: true, deliveries: true }
    });

    await this.queues.add(QUEUES.mail, "mail.send", {
      messageId: message.id,
      integrationConnectionId: sender.integrationConnectionId
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "mail.queued",
      entityType: "mail_message", entityId: message.id, matterId: input.matterId,
      clientId: input.clientId, metadata: { subject: input.subject, recipientCount: recipients.length }
    });
    return message;
  }

  triage(firmId: string, status = "UNASSIGNED") {
    return this.prisma.client.mailMessage.findMany({
      where: { firmId, direction: "INBOUND", triageStatus: status },
      include: { recipients: true, attachments: true, deliveries: true },
      orderBy: { receivedAt: "desc" },
      take: 500
    });
  }

  async linkToMatter(firmId: string, actorId: string, messageId: string, matterId: string) {
    const message = await this.prisma.client.mailMessage.findFirst({ where: { id: messageId, firmId } });
    const matter = await this.prisma.client.matter.findFirst({ where: { id: matterId, firmId } });
    if (!message || !matter) throw new NotFoundException("Message or matter not found");
    const updated = await this.prisma.client.mailMessage.update({
      where: { id: messageId },
      data: { matterId, triageStatus: "MATTER_LINKED" }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "mail.linked_to_matter",
      entityType: "mail_message", entityId: messageId, matterId, metadata: {}
    });
    return updated;
  }
}
