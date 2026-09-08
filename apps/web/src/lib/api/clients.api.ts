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
  phone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  postalAddress?: string | null;
  county?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  // relations (populated on detail fetch)
  matters?: { id: string; internalReference: string; title: string }[];
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

function normalizeClient(client: any): BackendClient {
  return {
    ...client,
    type: client.type === 'ORGANIZATION' ? 'CORPORATE' : 'INDIVIDUAL',
    phone: client.phone ?? null,
    email: client.email ?? null,
    matters: client.matters?.map((matter: any) => ({ ...matter, matterNumber: matter.matterNumber ?? matter.internalReference }))
  };
}

export const clientsApi = {
  /** List clients with optional search, pagination */
  list: async (params?: {
    q?: string;
    status?: ClientStatus;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get<any>('/clients', { params }).then((rows) => {
      const data = Array.isArray(rows) ? rows.map(normalizeClient) : (rows.data || []).map(normalizeClient);
      return { data, total: rows.total ?? data.length, page: rows.page ?? 1, limit: rows.limit ?? data.length };
    });
  },

  /** Get a single client with full detail */
  get: (id: string) => apiClient.get<any>(`/clients/${id}`).then(normalizeClient),

  /** Create a new client record */
  create: (dto: CreateClientDto) =>
    apiClient.post<any>('/clients', { ...dto, type: dto.type === 'CORPORATE' ? 'ORGANIZATION' : 'PERSON', phone: dto.primaryPhone, email: dto.primaryEmail }).then(normalizeClient),

  /** Update client profile */
  update: (id: string, dto: Partial<CreateClientDto>) =>
    apiClient.patch<any>(`/clients/${id}`, { ...dto, ...(dto.type ? { type: dto.type === 'CORPORATE' ? 'ORGANIZATION' : 'PERSON' } : {}), phone: dto.primaryPhone, email: dto.primaryEmail }).then(normalizeClient),
};
