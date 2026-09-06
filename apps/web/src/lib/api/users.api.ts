import { apiClient } from './client';

export interface BackendUser {
  id: string;
  firmId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  jobTitle?: string | null;
  homeBranchId?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  avatarUrl?: string | null;
  roleKeys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InviteUserInput {
  email: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  homeBranchId?: string;
  roleKeys: string[];
}

export const usersApi = {
  list: () => apiClient.get<BackendUser[]>('/users'),

  invite: (data: InviteUserInput) => apiClient.post<{ id: string; inviteToken?: string }>('/users/invite', data),

  setStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED') =>
    apiClient.patch(`/users/${id}/status`, { status }),

  setRoles: (id: string, roleKeys: string[]) =>
    apiClient.patch(`/users/${id}/roles`, { roleKeys }),
};
