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
  query: (q: string, limit = 20) => apiClient.get<any>('/search', { params: { q, limit } }).then((response) => {
    const results: SearchResult[] = [
      ...(response.matters || []).map((item: any) => ({ id: item.id, type: 'matter' as const, title: item.title, subtitle: item.internalReference, href: `/matters/${item.id}`, meta: item })),
      ...(response.clients || []).map((item: any) => ({ id: item.id, type: 'client' as const, title: item.displayName, subtitle: item.clientNumber, href: `/clients/${item.id}`, meta: item })),
      ...(response.documents || []).map((item: any) => ({ id: item.id, type: 'document' as const, title: item.title, subtitle: item.documentType, href: `/matters/${item.matterId}/documents`, meta: item })),
      ...(response.tasks || []).map((item: any) => ({ id: item.id, type: 'task' as const, title: item.title, subtitle: item.status, href: `/tasks?task=${item.id}`, meta: item })),
      ...(response.proceedings || []).map((item: any) => ({ id: item.id, type: 'matter' as const, title: item.caseNumber || item.courtName, subtitle: item.courtName, href: `/matters/${item.matterId}/court`, meta: item })),
      ...(response.directory || []).map((item: any) => ({ id: item.id, type: 'contact' as const, title: item.displayName, subtitle: item.organizationName || item.phone, href: `/directory?contact=${item.id}`, meta: item })),
    ];
    return { query: q, results: results.slice(0, limit), total: results.length };
  }),
};
