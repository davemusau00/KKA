import { apiClient } from './client';

export type ClientType = 'INDIVIDUAL' | 'CORPORATE';
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';

export interface BackendClient {
  id: string;
  firmId: string;
  clientNumber: string;
  type: ClientType;
  displayName: string;
  idNumber?: string | null;
  kraPin?: string | null;
  primaryPhone: string;
  primaryEmail?: string | null;
  postalAddress?: string | null;
  county?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  // relations (populated on detail fetch)
  matters?: { id: string; matterNumber: string; title: string }[];
}

export interface CreateClientDto {
  type: ClientType;
  displayName: string;
  primaryPhone: string;
  primaryEmail?: string;
  idNumber?: string;
  kraPin?: string;
  postalAddress?: string;
  county?: string;
}

export interface ClientsListResponse {
  data: BackendClient[];
  total: number;
  page: number;
  limit: number;
}

export const clientsApi = {
  /** List clients with optional search, pagination */
  list: (params?: {
    q?: string;
    status?: ClientStatus;
    page?: number;
    limit?: number;
  }) => apiClient.get<ClientsListResponse>('/clients', { params }),

  /** Get a single client with full detail */
  get: (id: string) => apiClient.get<BackendClient>(`/clients/${id}`),

  /** Create a new client record */
  create: (dto: CreateClientDto) =>
    apiClient.post<BackendClient>('/clients', dto),

  /** Update client profile */
  update: (id: string, dto: Partial<CreateClientDto>) =>
    apiClient.patch<BackendClient>(`/clients/${id}`, dto),
};
