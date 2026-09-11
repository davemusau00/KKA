import { apiClient } from './client';
import { BackendUser } from './users.api';

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

  elevate: (password: string) =>
    apiClient.post<{ elevationToken: string; expiresInSeconds: number }>('/auth/elevate', { password }),

  acceptInvite: (token: string, password: string) =>
    apiClient.post<{ user: BackendUser }>('/auth/accept-invite', { token, password }),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ ok: boolean; deliveryStatus: 'UNCONFIGURED' | 'MANUAL' | 'SENT'; localToken?: string }>('/auth/request-password-reset', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ ok: boolean }>('/auth/reset-password', { token, password }),
};
