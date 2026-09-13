import { test, expect } from '@playwright/test';
import { parseWorkspaceLocation, serializeWorkspaceRoute } from '../src/lib/routing/workspaceRoutes';

test('workspace routes survive matter detail and tab serialization', () => {
  expect(parseWorkspaceLocation('/matters/matter%2Fone', '?tab=documents')).toEqual({
    workspace: 'matters', matterId: 'matter/one', matterTab: 'documents'
  });
  expect(serializeWorkspaceRoute({ workspace: 'matters', matterId: 'matter/one', matterTab: 'documents' }))
    .toBe('/matters/matter%2Fone?tab=documents');
});

test('workspace routes fall back safely for unknown paths', () => {
  expect(parseWorkspaceLocation('/not-a-real-workspace')).toEqual({ workspace: 'dashboard' });
  expect(parseWorkspaceLocation('/clients/%E0%A4%A')).toEqual({ workspace: 'dashboard' });
  expect(serializeWorkspaceRoute({ workspace: 'finance' })).toBe('/finance');
});

test('resource-detail routes round-trip to their authoritative workspace', () => {
  const cases = [
    ['/clients/client-1', { workspace: 'clients', resourceType: 'client', resourceId: 'client-1' }],
    ['/tasks/task-1', { workspace: 'tasks', resourceType: 'task', resourceId: 'task-1' }],
    ['/documents/doc-1', { workspace: 'documents', resourceType: 'document', resourceId: 'doc-1' }],
    ['/court/proceedings/proceeding-1', { workspace: 'court', resourceType: 'proceeding', resourceId: 'proceeding-1' }],
    ['/operations/projects/project-1', { workspace: 'operations', resourceType: 'project', resourceId: 'project-1' }],
    ['/knowledge/item-1', { workspace: 'knowledge', resourceType: 'knowledge_item', resourceId: 'item-1' }],
  ] as const;
  for (const [path, route] of cases) {
    expect(parseWorkspaceLocation(path)).toEqual(route);
    expect(serializeWorkspaceRoute(route)).toBe(path);
  }
});
