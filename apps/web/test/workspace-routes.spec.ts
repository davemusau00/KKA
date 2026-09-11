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
  expect(serializeWorkspaceRoute({ workspace: 'finance' })).toBe('/finance');
});
