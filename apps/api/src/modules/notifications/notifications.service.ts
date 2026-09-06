import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { QueueService, QUEUES } from "../../platform/queue/queue.service";
import { RealtimeGateway } from "../../platform/realtime/realtime.gateway";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
    private readonly realtime: RealtimeGateway
  ) {}

  list(userId: string, unreadOnly = false) {
    return this.prisma.client.notification.findMany({
      where: { recipientUserId: userId, ...(unreadOnly ? { readAt: null } : {}) },
      include: { deliveries: true },
      orderBy: { createdAt: "desc" },
      take: 500
    });
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

  markRead(userId: string, id: string) {
    return this.prisma.client.notification.updateMany({
      where: { id, recipientUserId: userId },
      data: { readAt: new Date() }
    });
  }
}
