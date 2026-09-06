import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RealtimeGateway } from "../../platform/realtime/realtime.gateway";

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway
  ) {}

  listChannels(firmId: string, userId: string) {
    return this.prisma.client.communicationChannel.findMany({
      where: {
        firmId,
        OR: [
          { private: false },
          { memberships: { some: { userId } } },
          { matter: { assignments: { some: { userId, endsAt: null } } } }
        ]
      },
      include: { memberships: true },
      orderBy: { name: "asc" }
    });
  }

  messages(firmId: string, userId: string, channelId: string, before?: Date) {
    return this.prisma.client.channelMessage.findMany({
      where: {
        channelId,
        channel: {
          firmId,
          OR: [
            { private: false },
            { memberships: { some: { userId } } },
            { matter: { assignments: { some: { userId, endsAt: null } } } }
          ]
        },
        ...(before ? { createdAt: { lt: before } } : {})
      },
      include: { attachments: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async send(firmId: string, userId: string, channelId: string, text: string, replyToId?: string) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    if (channel.private) {
      const member = await this.prisma.client.channelMembership.findUnique({
        where: { channelId_userId: { channelId, userId } }
      });
      const assigned = channel.matterId
        ? await this.prisma.client.matterAssignment.findFirst({ where: { matterId: channel.matterId, userId, endsAt: null } })
        : null;
      if (!member && !assigned) throw new BadRequestException("User is not a member of this channel");
    }
    const message = await this.prisma.client.channelMessage.create({
      data: { channelId, senderId: userId, text, replyToId }
    });
    this.realtime.emitToChannel(channelId, "message.created", message);
    await this.audit.record({
      firmId, actorUserId: userId, action: "communication.message_sent",
      entityType: "channel_message", entityId: message.id, matterId: channel.matterId ?? undefined,
      metadata: { channelId }
    });
    return message;
  }

  async joinRealtimeChannel(firmId: string, userId: string, channelId: string) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    return { channelId, socketRoom: `channel:${channelId}` };
  }
}
