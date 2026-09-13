import { apiClient } from './client';

export interface CommunicationAttachmentDto {
  id: string;
  documentId?: string | null;
  filename: string;
  mimeType?: string | null;
  sizeBytes?: string | number | null;
}

export interface CommunicationMessageDto {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  replyToId?: string | null;
  convertedTaskId?: string | null;
  createdAt: string;
  attachments: CommunicationAttachmentDto[];
  mentions: Array<{ userId: string; readAt?: string | null }>;
}

export interface CommunicationChannelDto {
  id: string;
  matterId?: string | null;
  type: string;
  name: string;
  description?: string | null;
  private: boolean;
  memberships: Array<{ userId: string; lastReadAt?: string | null; lastReadMessageId?: string | null }>;
}

export const communicationsApi = {
  listChannels: () => apiClient.get<CommunicationChannelDto[]>('/communications/channels'),
  createMatterChannel: (matterId: string, input: { name?: string; description?: string; private?: boolean; memberIds?: string[] } = {}) =>
    apiClient.post<{ channel: CommunicationChannelDto; auditRef: string }>(`/communications/channels/matter/${encodeURIComponent(matterId)}`, input),
  createDirectChannel: (input: { userId: string; matterId?: string }) =>
    apiClient.post<{ channel: CommunicationChannelDto; auditRef: string }>('/communications/channels/direct', input),
  messages: (channelId: string, before?: string) =>
    apiClient.get<CommunicationMessageDto[]>(`/communications/channels/${encodeURIComponent(channelId)}/messages`, { params: before ? { before } : undefined }),
  send: (channelId: string, input: { text: string; replyToId?: string; mentionUserIds?: string[]; attachmentDocumentIds?: string[] }) =>
    apiClient.post<{ message: CommunicationMessageDto; auditRef: string }>(`/communications/channels/${encodeURIComponent(channelId)}/messages`, input),
  markRead: (channelId: string, lastReadMessageId?: string) =>
    apiClient.post<{ channelId: string; lastReadMessageId?: string; readAt: string; auditRef: string }>(`/communications/channels/${encodeURIComponent(channelId)}/read`, { lastReadMessageId }),
  convertToTask: (messageId: string, input: { title: string; assignedToId: string; dueAt: string; priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }) =>
    apiClient.post<{ task: { id: string }; message: CommunicationMessageDto; auditRef: string }>(`/communications/messages/${encodeURIComponent(messageId)}/convert-task`, input)
};
