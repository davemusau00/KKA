import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RealtimeGateway } from "../../platform/realtime/realtime.gateway";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import type { RequestUser } from "../../platform/auth/auth.types";

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
    private readonly access: RecordAccessService
  ) {}

  private async channelWhere(user: RequestUser) {
    const matterScope = await this.access.matterWhere(user);
    return {
      firmId: user.firmId,
      OR: [
        { matterId: null, private: false },
        { matterId: null, memberships: { some: { userId: user.id } } },
        { matter: { AND: [matterScope, { OR: [
          { private: false },
          { memberships: { some: { userId: user.id } } },
          { assignments: { some: { userId: user.id, endsAt: null } } }
        ] }] } }
      ]
    };
  }

  private async assertChannelAccess(user: RequestUser, channel: { id: string; firmId: string; private: boolean; matterId: string | null }) {
    if (channel.matterId && !(await this.access.canViewMatter(user, channel.matterId))) throw new NotFoundException("Channel not found");
    if (!channel.private) return;
    const member = await this.prisma.client.channelMembership.findUnique({ where: { channelId_userId: { channelId: channel.id, userId: user.id } } });
    const assigned = channel.matterId
      ? await this.prisma.client.matterAssignment.findFirst({ where: { matterId: channel.matterId, userId: user.id, endsAt: null } })
      : null;
    if (!member && !assigned) throw new NotFoundException("Channel not found");
  }

  async listChannels(user: RequestUser) {
    return this.prisma.client.communicationChannel.findMany({
      where: await this.channelWhere(user),
      include: { memberships: true },
      orderBy: { name: "asc" }
    });
  }

  async messages(user: RequestUser, channelId: string, before?: Date) {
    return this.prisma.client.channelMessage.findMany({
      where: {
        channelId,
        channel: await this.channelWhere(user),
        ...(before ? { createdAt: { lt: before } } : {})
      },
      include: { attachments: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async send(user: RequestUser, channelId: string, text: string, replyToId?: string) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId: user.firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    await this.assertChannelAccess(user, channel);
    const message = await this.prisma.client.channelMessage.create({
      data: { channelId, senderId: user.id, text, replyToId }
    });
    this.realtime.emitToChannel(channelId, "message.created", message);
    await this.audit.record({
      firmId: user.firmId, actorUserId: user.id, action: "communication.message_sent",
      entityType: "channel_message", entityId: message.id, matterId: channel.matterId ?? undefined,
      metadata: { channelId }
    });
    return message;
  }

  async joinRealtimeChannel(user: RequestUser, channelId: string) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId: user.firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    await this.assertChannelAccess(user, channel);
    return { channelId, socketRoom: `channel:${channelId}` };
  }
}
