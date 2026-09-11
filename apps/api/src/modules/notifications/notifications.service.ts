import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { QueueService, QUEUES } from "../../platform/queue/queue.service";
import { RealtimeGateway } from "../../platform/realtime/realtime.gateway";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
    private readonly realtime: RealtimeGateway,
    private readonly access: RecordAccessService
  ) {}

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
  }) {
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

    this.realtime.emitToUser(input.recipientUserId, "notification.created", notification);

    for (const delivery of notification.deliveries) {
      if (delivery.channel !== "IN_APP") {
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
