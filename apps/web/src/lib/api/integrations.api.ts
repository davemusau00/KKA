import { apiClient } from './client';

export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'UNKNOWN';

export interface IntegrationInfo {
  id: string;
  name: string;
  description?: string;
  status: IntegrationStatus;
  lastCheckedAt?: string;
  latencyMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  details?: Record<string, unknown>;
}

export const integrationsApi = {
  /** List all integrations and their live status */
  list: () => apiClient.get<IntegrationInfo[]>('/integrations'),

  /** Get a single integration's status */
  get: (id: string) => apiClient.get<IntegrationInfo>(`/integrations/${id}`),

  /** Trigger a live connection test (replaces fake setTimeout) */
  test: (id: string) =>
    apiClient.post<IntegrationTestResult>(`/integrations/${id}/test`),
};
