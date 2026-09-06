import { apiClient } from './client';

export interface BackendNotification {
  id: string;
  firmId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  read: boolean;
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
