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
    apiClient.post<{ token: string; expiresAt: string }>('/auth/elevate', { password }),

  acceptInvite: (token: string, password: string) =>
    apiClient.post<{ user: BackendUser }>('/auth/accept-invite', { token, password }),
};
