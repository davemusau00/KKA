import { apiClient } from './client';

export interface DeadlineDto {
  id: string;
  matterId: string;
  title: string;
  deadlineType: string;
  officialDueAt: string;
  source: string;
  riskLevel: string;
  notes?: string | null;
  completedAt?: string | null;
  version: number;
  status: string;
}

export const deadlinesApi = {
  list: (params?: { matterId?: string }) => apiClient.get<DeadlineDto[]>('/deadlines', { params }),
  get: (id: string) => apiClient.get<DeadlineDto>(`/deadlines/${id}`),
};
