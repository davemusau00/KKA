import { apiClient } from './client';

export interface CurrentAuthUser {
  id: string;
  firmId: string;
  email: string;
  fullName: string;
  homeBranchId?: string | null;
  roleKeys: string[];
  permissions: string[];
}

export interface LoginResult {
  user: CurrentAuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResult>('/auth/login', { email, password }),

  me: () => apiClient.get<CurrentAuthUser>('/auth/me'),

  logout: () => apiClient.post<{ ok: boolean }>('/auth/logout'),

  logoutAll: () => apiClient.post<{ ok: boolean; revokedSessions: number }>('/auth/logout-all'),

  inspectUserSessions: (userId: string) => apiClient.get<{ userId: string; activeSessionCount: number; checkedAt: string }>(`/auth/users/${userId}/sessions`),

  revokeUserSessions: (userId: string) => apiClient.post<{ ok: boolean; userId: string; revokedSessions: number }>(`/auth/users/${userId}/revoke-sessions`),

  elevate: (password: string) =>
    apiClient.post<{ elevationToken: string; expiresInSeconds: number }>('/auth/elevate', { password }),

  inspectInvite: (token: string) => apiClient.post<{ valid: boolean }>('/auth/inspect-invite', { token }),

  acceptInvite: (token: string, password: string) =>
    apiClient.post<{ ok: boolean; auditId: string; user: CurrentAuthUser }>('/auth/accept-invite', { token, password }),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ ok: boolean; deliveryStatus: 'UNCONFIGURED' | 'MANUAL' | 'SENT'; localToken?: string }>('/auth/request-password-reset', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ ok: boolean }>('/auth/reset-password', { token, password }),
};
