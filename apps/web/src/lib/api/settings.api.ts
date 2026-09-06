import { apiClient } from './client';

export type SettingScope = 'FIRM' | 'BRANCH' | 'USER';

export interface SettingDefinition {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'json';
  defaultValue: unknown;
  enumValues?: string[];
  scopes: SettingScope[];
}

export interface ResolvedSetting {
  key: string;
  value: unknown;
  resolvedAt: SettingScope;
}

export const settingsApi = {
  /** List all available setting definitions */
  listDefinitions: () =>
    apiClient.get<SettingDefinition[]>('/settings/definitions'),

  /** Resolve a setting value for the current context (firm → branch → user cascade) */
  resolve: (key: string) =>
    apiClient.post<ResolvedSetting>(`/settings/resolve/${key}`),

  /** Set a setting value at a given scope */
  set: (
    key: string,
    value: unknown,
    scope: SettingScope = 'FIRM',
    scopeId?: string,
  ) =>
    apiClient.post<ResolvedSetting>(`/settings/${key}`, {
      value,
      scope,
      scopeId,
    }),
};
