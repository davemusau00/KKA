import { apiClient } from './client';

export interface BackendNotification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  category: string;
  urgency: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: (unreadOnly = false) =>
    apiClient.get<BackendNotification[]>('/notifications', {
      params: unreadOnly ? { unread: 'true' } : undefined,
    }),

  markRead: (id: string) =>
    apiClient.post<{ ok: boolean }>(`/notifications/${id}/read`),
};
