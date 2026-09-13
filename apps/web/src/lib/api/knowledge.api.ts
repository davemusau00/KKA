import { apiClient } from './client';

export type KnowledgeStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface KnowledgeItemDto {
  id: string;
  firmId: string;
  type: string;
  title: string;
  summary?: string | null;
  practiceArea?: string | null;
  tags: string[];
  documentId?: string | null;
  status: KnowledgeStatus | string;
  ownerUserId: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const knowledgeApi = {
  list: (params?: { q?: string; practiceArea?: string; status?: string }) =>
    apiClient.get<KnowledgeItemDto[]>('/knowledge', { params }),
  get: (id: string) => apiClient.get<KnowledgeItemDto>(`/knowledge/${id}`),
  create: (input: {
    type: string;
    title: string;
    summary?: string;
    practiceArea?: string;
    tags?: string[];
    documentId?: string;
  }) => apiClient.post<KnowledgeItemDto>('/knowledge', input),
  update: (id: string, input: {
    type?: string;
    title?: string;
    summary?: string | null;
    practiceArea?: string | null;
    tags?: string[];
    documentId?: string | null;
  }) => apiClient.patch<KnowledgeItemDto>(`/knowledge/${id}`, input),
  setStatus: (id: string, status: KnowledgeStatus) =>
    apiClient.post<KnowledgeItemDto>(`/knowledge/${id}/status`, { status }),
};
