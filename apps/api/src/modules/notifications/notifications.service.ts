import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { QueueService, QUEUES } from "../../platform/queue/queue.service";
import { RealtimeGateway } from "../../platform/realtime/realtime.gateway";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import { roleContext } from "../../platform/auth/role-context";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
    private readonly realtime: RealtimeGateway,
    private readonly access: RecordAccessService
  ) {}

  private async recipientContext(recipientUserId: string): Promise<RequestUser> {
    const recipient = await this.prisma.client.user.findFirst({
      where: { id: recipientUserId, status: "ACTIVE" },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!recipient) throw new NotFoundException("Notification recipient not found");
    return {
      id: recipient.id,
      firmId: recipient.firmId,
      email: recipient.email,
      fullName: recipient.fullName,
      homeBranchId: recipient.homeBranchId,
      ...roleContext(recipient.firmId, recipient.roles)
    };
  }

  private async assertRecipientMatterAccess(recipient: RequestUser, matterId?: string) {
    if (matterId && !(await this.access.canViewMatter(recipient, matterId))) {
      throw new ForbiddenException("Notification recipient cannot access this matter");
    }
  }

  async list(user: RequestUser, unreadOnly = false) {
    const rows = await this.prisma.client.notification.findMany({
      where: { recipientUserId: user.id, ...(unreadOnly ? { readAt: null } : {}) },
      include: { deliveries: true },
      orderBy: { createdAt: "desc" },
      take: 500
    });
    const visible = await Promise.all(rows.map(async row => !row.matterId || await this.access.canViewMatter(user, row.matterId) ? row : null));
    return visible.filter((row): row is NonNullable<typeof row> => row !== null);
  }

  async create(input: {
    recipientUserId: string;
    matterId?: string;
    category: string;
    title: string;
    message: string;
    actionUrl?: string;
    urgency?: string;
    channels?: Array<"IN_APP" | "EMAIL" | "SMS" | "WHATSAPP" | "PUSH">;
  }): Promise<Awaited<ReturnType<typeof this.prisma.client.notification.create>> | null> {
    const recipient = await this.recipientContext(input.recipientUserId);
    await this.assertRecipientMatterAccess(recipient, input.matterId);
    const channels = input.channels?.length ? input.channels : ["IN_APP"];
    const notification = await this.prisma.client.notification.create({
      data: {
        recipientUserId: input.recipientUserId,
        matterId: input.matterId,
        category: input.category,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        urgency: input.urgency ?? "NORMAL",
        deliveries: {
          create: channels.map((channel) => ({ channel: channel as any }))
        }
      },
      include: { deliveries: true }
    });

    try {
      const currentRecipient = await this.recipientContext(input.recipientUserId);
      await this.assertRecipientMatterAccess(currentRecipient, input.matterId);
    } catch (error) {
      await this.prisma.client.notification.delete({ where: { id: notification.id } });
      if (error instanceof NotFoundException || error instanceof ForbiddenException) return null;
      throw error;
    }

    this.realtime.emitToUser(input.recipientUserId, "notification.created", notification);

    for (const delivery of notification.deliveries) {
      if (delivery.channel !== "IN_APP") {
        const currentRecipient = await this.recipientContext(input.recipientUserId);
        await this.assertRecipientMatterAccess(currentRecipient, input.matterId);
        await this.queues.add(QUEUES.notifications, "notification.deliver", {
          notificationId: notification.id,
          deliveryId: delivery.id
        });
      } else {
        await this.prisma.client.notificationDelivery.update({
          where: { id: delivery.id },
          data: { status: "DELIVERED", deliveredAt: new Date() }
        });
      }
    }
    return notification;
  }

  async markRead(user: RequestUser, id: string) {
    const row = await this.prisma.client.notification.findFirst({ where: { id, recipientUserId: user.id }, select: { matterId: true } });
    if (!row || (row.matterId && !await this.access.canViewMatter(user, row.matterId))) return { count: 0 };
    return this.prisma.client.notification.updateMany({
      where: { id, recipientUserId: user.id },
      data: { readAt: new Date() }
    });
  }
}
