import { apiClient } from './client';

export interface BackendUser {
  id: string;
  firmId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  jobTitle?: string | null;
  homeBranchId?: string | null;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
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

  invite: (data: InviteUserInput) => apiClient.post<InviteResult>('/users/invite', data),

  resendInvite: (id: string) => apiClient.post<InviteResult>(`/users/${id}/invite/resend`),

  setStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED') =>
    apiClient.patch(`/users/${id}/status`, { status }),

  setRoles: (id: string, roleKeys: string[]) =>
    apiClient.patch(`/users/${id}/roles`, { roleKeys }),

  setHomeBranch: (id: string, homeBranchId: string | null) =>
    apiClient.patch<{ user: BackendUser; auditId: string }>(`/users/${id}/home-branch`, { homeBranchId }),
};

export interface InviteResult {
  user: BackendUser;
  invite: { id: string; expiresAt: string; deliveryStatus: 'UNCONFIGURED' };
  auditId: string;
  localInviteToken?: string;
}
