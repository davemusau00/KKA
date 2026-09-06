import { apiClient } from './client';

export interface SearchResult {
  id: string;
  type: 'matter' | 'client' | 'task' | 'document' | 'contact' | 'user';
  title: string;
  subtitle?: string;
  href?: string;
  meta?: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export const searchApi = {
  /** Unified search across Matters, Clients, Tasks, Documents (debounce 250ms client-side) */
  query: (q: string, limit = 20) =>
    apiClient.get<SearchResponse>('/search', { params: { q, limit } }),
};
