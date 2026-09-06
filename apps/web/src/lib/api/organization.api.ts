import { apiClient } from './client';

export interface BackendFirm {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendBranch {
  id: string;
  firmId: string;
  name: string;
  code: string;
  address?: string | null;
  postalAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  defaultCourtStation?: string | null;
  numberingPrefix?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendRole {
  id: string;
  firmId: string;
  roleKey: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions?: string[];
}

export interface BackendPermission {
  id: string;
  key: string;
  module: string;
  action: string;
  description: string;
}

export interface CreateBranchInput {
  name: string;
  code: string;
  address?: string;
  postalAddress?: string;
  phone?: string;
  email?: string;
  defaultCourtStation?: string;
  numberingPrefix?: string;
}

export const organizationApi = {
  getFirm: () => apiClient.get<BackendFirm>('/organization'),

  listBranches: () => apiClient.get<BackendBranch[]>('/organization/branches'),

  createBranch: (data: CreateBranchInput) =>
    apiClient.post<BackendBranch>('/organization/branches', data),

  updateBranch: (id: string, updates: Partial<CreateBranchInput>) =>
    apiClient.patch<BackendBranch>(`/organization/branches/${id}`, updates),

  listRoles: () => apiClient.get<BackendRole[]>('/organization/roles'),

  listPermissions: () => apiClient.get<BackendPermission[]>('/organization/permissions'),

  replaceRolePermissions: (roleId: string, permissionKeys: string[]) =>
    apiClient.put(`/organization/roles/${roleId}/permissions`, { permissionKeys }),
};
