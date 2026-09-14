import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@kka/database";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { RealtimeGateway } from "../../platform/realtime/realtime.gateway";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import { roleContext } from "../../platform/auth/role-context";
import type { RequestUser } from "../../platform/auth/auth.types";
import { NotificationsService } from "../notifications/notifications.service";

type MessageInput = { text: string; replyToId?: string; mentionUserIds?: string[]; attachmentDocumentIds?: string[] };
type TaskConversionInput = { title: string; assignedToId: string; dueAt: string; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" };

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
    private readonly access: RecordAccessService,
    private readonly notifications: NotificationsService
  ) {}

  private async channelWhere(user: RequestUser): Promise<Prisma.CommunicationChannelWhereInput> {
    const matterScope = await this.access.matterWhere(user);
    return {
      firmId: user.firmId,
      OR: [
        { matterId: null, private: false },
        { matterId: null, memberships: { some: { userId: user.id } } },
        {
          matter: matterScope,
          OR: [
            { private: false },
            { memberships: { some: { userId: user.id } } },
            { matter: { assignments: { some: { userId: user.id, endsAt: null } } } }
          ]
        }
      ]
    };
  }

  private async userContext(firmId: string, userId: string): Promise<RequestUser> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, firmId, status: "ACTIVE" },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!user) throw new BadRequestException("Selected staff member is not active in this firm");
    return { id: user.id, firmId: user.firmId, email: user.email, fullName: user.fullName, homeBranchId: user.homeBranchId, ...roleContext(user.firmId, user.roles) };
  }

  private async assertChannelAccess(user: RequestUser, channel: { id: string; private: boolean; matterId: string | null }) {
    if (channel.matterId && !(await this.access.canViewMatter(user, channel.matterId))) throw new NotFoundException("Channel not found");
    if (!channel.private) return;
    const member = await this.prisma.client.channelMembership.findUnique({ where: { channelId_userId: { channelId: channel.id, userId: user.id } } });
    const assigned = channel.matterId ? await this.prisma.client.matterAssignment.findFirst({ where: { matterId: channel.matterId, userId: user.id, endsAt: null } }) : null;
    if (!member && !assigned) throw new NotFoundException("Channel not found");
  }

  private async activeParticipantIds(firmId: string, channel: { id: string; matterId: string | null }) {
    const memberIds = (await this.prisma.client.channelMembership.findMany({ where: { channelId: channel.id }, select: { userId: true } })).map((row) => row.userId);
    const assigneeIds = channel.matterId
      ? (await this.prisma.client.matterAssignment.findMany({ where: { matterId: channel.matterId, endsAt: null, userId: { not: null } }, select: { userId: true } })).flatMap((row) => row.userId ? [row.userId] : [])
      : [];
    const ids = [...new Set([...memberIds, ...assigneeIds])];
    if (!ids.length) return [];
    return (await this.prisma.client.user.findMany({ where: { id: { in: ids }, firmId, status: "ACTIVE" }, select: { id: true } })).map((row) => row.id);
  }

  private async attachmentData(user: RequestUser, channel: { matterId: string | null }, documentIds: string[]) {
    if (!documentIds.length) return [];
    if (!channel.matterId) throw new BadRequestException("Document attachments require a matter channel so access remains bounded to one matter");
    const documents = await this.prisma.client.document.findMany({
      where: { id: { in: documentIds }, matterId: channel.matterId, matter: await this.access.matterWhere(user) },
      include: { currentVersion: true }
    });
    if (documents.length !== new Set(documentIds).size || documents.some((document) => !document.currentVersion)) throw new BadRequestException("Each attachment must be an accessible, current document from this matter");
    return documents.map((document) => ({ documentId: document.id, filename: document.currentVersion!.originalFilename, mimeType: document.currentVersion!.mimeType, sizeBytes: document.currentVersion!.fileSizeBytes }));
  }

  private async mentionRecipients(user: RequestUser, channel: { id: string; matterId: string | null }, ids: string[]) {
    const uniqueIds = [...new Set(ids)].filter((id) => id !== user.id);
    if (!uniqueIds.length) return [];
    const participants = new Set(await this.activeParticipantIds(user.firmId, channel));
    if (uniqueIds.some((id) => !participants.has(id))) throw new BadRequestException("Mentions are limited to active channel participants");
    if (channel.matterId) for (const id of uniqueIds) {
      const recipient = await this.userContext(user.firmId, id);
      if (!(await this.access.canViewMatter(recipient, channel.matterId))) throw new BadRequestException("Mentioned staff member cannot access this matter");
    }
    return uniqueIds;
  }

  async listChannels(user: RequestUser) {
    return this.prisma.client.communicationChannel.findMany({ where: await this.channelWhere(user), include: { memberships: true }, orderBy: { name: "asc" } });
  }

  async getOrCreateMatterChannel(user: RequestUser, matterId: string, input: { name?: string; description?: string; private?: boolean; memberIds?: string[] }) {
    if (!(await this.access.canViewMatter(user, matterId))) throw new NotFoundException("Matter not found");
    const matter = await this.prisma.client.matter.findFirst({ where: { id: matterId, ...(await this.access.matterWhere(user)) }, select: { internalReference: true, title: true } });
    if (!matter) throw new NotFoundException("Matter not found");
    const memberIds = [...new Set([user.id, ...(input.memberIds ?? [])])];
    for (const memberId of memberIds) {
      const member = await this.userContext(user.firmId, memberId);
      if (!(await this.access.canViewMatter(member, matterId))) throw new BadRequestException("Every channel member must be able to access this matter");
    }
    const channelKey = `matter:${matterId}:discussion`;
    const channel = await this.prisma.client.communicationChannel.upsert({
      where: { firmId_channelKey: { firmId: user.firmId, channelKey } },
      create: { firmId: user.firmId, channelKey, matterId, type: "MATTER", name: input.name?.trim() || `${matter.internalReference}: ${matter.title}`, description: input.description?.trim() || undefined, private: input.private ?? false, memberships: { create: memberIds.map((userId) => ({ userId, role: userId === user.id ? "OWNER" : "MEMBER" })) } },
      update: {}
    });
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "communication.matter_channel_ready", entityType: "communication_channel", entityId: channel.id, matterId, metadata: { private: channel.private } });
    return { channel, auditRef: audit.id };
  }

  async getOrCreateDirectChannel(user: RequestUser, targetUserId: string, matterId?: string) {
    if (targetUserId === user.id) throw new BadRequestException("Choose another staff member for a direct thread");
    const target = await this.userContext(user.firmId, targetUserId);
    if (matterId && (!(await this.access.canViewMatter(user, matterId)) || !(await this.access.canViewMatter(target, matterId)))) throw new NotFoundException("Matter not found");
    const channelKey = `direct:${matterId ?? "firm"}:${[user.id, targetUserId].sort().join(":")}`;
    const channel = await this.prisma.client.communicationChannel.upsert({
      where: { firmId_channelKey: { firmId: user.firmId, channelKey } },
      create: { firmId: user.firmId, channelKey, matterId, type: "DIRECT", name: `Direct: ${user.fullName} and ${target.fullName}`, private: true, memberships: { create: [{ userId: user.id, role: "MEMBER" }, { userId: targetUserId, role: "MEMBER" }] } },
      update: {}
    });
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "communication.direct_channel_ready", entityType: "communication_channel", entityId: channel.id, matterId, metadata: { participantUserId: targetUserId } });
    return { channel, auditRef: audit.id };
  }

  async messages(user: RequestUser, channelId: string, before?: Date) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId: user.firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    await this.assertChannelAccess(user, channel);
    return this.prisma.client.channelMessage.findMany({ where: { channelId, ...(before ? { createdAt: { lt: before } } : {}) }, include: { attachments: true, mentions: { select: { userId: true, readAt: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  }

  async send(user: RequestUser, channelId: string, input: MessageInput) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId: user.firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    await this.assertChannelAccess(user, channel);
    if (input.replyToId && !await this.prisma.client.channelMessage.findFirst({ where: { id: input.replyToId, channelId, deletedAt: null }, select: { id: true } })) throw new BadRequestException("Reply target is not available in this channel");
    const attachments = await this.attachmentData(user, channel, [...new Set(input.attachmentDocumentIds ?? [])]);
    const mentionUserIds = await this.mentionRecipients(user, channel, input.mentionUserIds ?? []);
    const message = await this.prisma.client.channelMessage.create({
      data: { channelId, senderId: user.id, text: input.text.trim(), replyToId: input.replyToId, attachments: attachments.length ? { create: attachments } : undefined, mentions: mentionUserIds.length ? { create: mentionUserIds.map((userId) => ({ userId })) } : undefined },
      include: { attachments: true, mentions: { select: { userId: true, readAt: true } } }
    });
    await this.prisma.client.channelMembership.upsert({ where: { channelId_userId: { channelId, userId: user.id } }, create: { channelId, userId: user.id, role: "MEMBER", lastReadAt: message.createdAt, lastReadMessageId: message.id }, update: { lastReadAt: message.createdAt, lastReadMessageId: message.id } });
    this.realtime.emitToChannel(channelId, "message.created", message);
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "communication.message_sent", entityType: "channel_message", entityId: message.id, matterId: channel.matterId ?? undefined, metadata: { channelId, attachmentCount: attachments.length, mentionCount: mentionUserIds.length } });
    await Promise.all(mentionUserIds.map((recipientUserId) => this.notifications.create({ recipientUserId, matterId: channel.matterId ?? undefined, category: "TASK_MENTION", title: "Mentioned in an internal discussion", message: `${user.fullName} mentioned you in ${channel.name}`, actionUrl: "/communications", channels: ["IN_APP"] })));
    return { message, auditRef: audit.id };
  }

  async markRead(user: RequestUser, channelId: string, lastReadMessageId?: string) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId: user.firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    await this.assertChannelAccess(user, channel);
    let messageId = lastReadMessageId;
    if (messageId && !await this.prisma.client.channelMessage.findFirst({ where: { id: messageId, channelId }, select: { id: true } })) throw new BadRequestException("Read marker must belong to this channel");
    if (!messageId) messageId = (await this.prisma.client.channelMessage.findFirst({ where: { channelId }, orderBy: { createdAt: "desc" }, select: { id: true } }))?.id;
    const now = new Date();
    await this.prisma.client.$transaction(async (tx) => {
      await tx.channelMembership.upsert({ where: { channelId_userId: { channelId, userId: user.id } }, create: { channelId, userId: user.id, role: "MEMBER", lastReadAt: now, lastReadMessageId: messageId }, update: { lastReadAt: now, lastReadMessageId: messageId } });
      await tx.messageMention.updateMany({ where: { userId: user.id, readAt: null, message: { channelId } }, data: { readAt: now } });
    });
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "communication.channel_read", entityType: "communication_channel", entityId: channelId, matterId: channel.matterId ?? undefined, metadata: { lastReadMessageId: messageId } });
    return { channelId, lastReadMessageId: messageId, readAt: now, auditRef: audit.id };
  }

  async convertMessageToTask(user: RequestUser, messageId: string, input: TaskConversionInput) {
    if (!user.permissions.includes("task.create")) throw new ForbiddenException("Task creation permission is required");
    const message = await this.prisma.client.channelMessage.findFirst({ where: { id: messageId, channel: await this.channelWhere(user) }, include: { channel: true } });
    if (!message) throw new NotFoundException("Message not found");
    await this.assertChannelAccess(user, message.channel);
    if (message.convertedTaskId) {
      const existing = await this.prisma.client.task.findUnique({ where: { id: message.convertedTaskId } });
      if (existing) return { task: existing, message, auditRef: message.id };
    }
    const assignee = await this.prisma.client.user.findFirst({ where: { id: input.assignedToId, firmId: user.firmId, status: "ACTIVE" }, select: { id: true } });
    if (!assignee) throw new BadRequestException("Assigned staff member is not active in this firm");
    if (message.channel.matterId) {
      const assigneeContext = await this.userContext(user.firmId, assignee.id);
      if (!(await this.access.canViewMatter(assigneeContext, message.channel.matterId))) throw new BadRequestException("Assigned staff member cannot access this matter");
    }
    let task;
    try {
      task = await this.prisma.client.task.create({ data: { sourceMessageId: message.id, matterId: message.channel.matterId, title: input.title.trim(), description: `Created from internal message ${message.id}:\n\n${message.text}`, assignedToId: assignee.id, createdById: user.id, priority: input.priority, dueAt: new Date(input.dueAt) } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      task = await this.prisma.client.task.findUnique({ where: { sourceMessageId: message.id } });
      if (!task) throw error;
    }
    await this.prisma.client.channelMessage.update({ where: { id: message.id }, data: { convertedTaskId: task.id } });
    const audit = await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "communication.message_converted_to_task", entityType: "channel_message", entityId: message.id, matterId: message.channel.matterId ?? undefined, metadata: { taskId: task.id, assignedToId: assignee.id } });
    await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: "task.created_from_message", entityType: "task", entityId: task.id, matterId: task.matterId ?? undefined, metadata: { messageId: message.id } });
    await this.notifications.create({ recipientUserId: assignee.id, matterId: task.matterId ?? undefined, category: "ASSIGNMENT", title: "Task created from an internal message", message: `${user.fullName} assigned you a task from an internal discussion`, actionUrl: "/tasks", channels: ["IN_APP"] });
    return { task, message: { ...message, convertedTaskId: task.id }, auditRef: audit.id };
  }

  async joinRealtimeChannel(user: RequestUser, channelId: string) {
    const channel = await this.prisma.client.communicationChannel.findFirst({ where: { id: channelId, firmId: user.firmId } });
    if (!channel) throw new NotFoundException("Channel not found");
    await this.assertChannelAccess(user, channel);
    return { channelId, socketRoom: `channel:${channelId}` };
  }
}
