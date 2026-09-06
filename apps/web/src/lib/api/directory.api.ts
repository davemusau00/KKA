import { apiClient } from './client';

export interface BackendDirectoryContact {
  id: string;
  firmId: string;
  type: string;
  displayName: string;
  organizationName?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  county?: string | null;
  specialization?: string | null;
  identifiers?: Record<string, unknown> | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDirectoryContactInput {
  type: string;
  displayName: string;
  organizationName?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  county?: string;
  specialization?: string;
  identifiers?: Record<string, unknown>;
  notes?: string;
  active?: boolean;
}

export const directoryApi = {
  list: (params?: { type?: string; q?: string }) =>
    apiClient.get<BackendDirectoryContact[]>('/directory', { params }),

  create: (data: CreateDirectoryContactInput) =>
    apiClient.post<BackendDirectoryContact>('/directory', data),

  update: (id: string, updates: Partial<CreateDirectoryContactInput>) =>
    apiClient.patch<BackendDirectoryContact>(`/directory/${id}`, updates),
};
