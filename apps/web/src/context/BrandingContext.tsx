import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { authApi } from '../lib/api/auth.api';
export interface Branding { source: string; imageUrl: string; versionId: string | null; width?: number; height?: number }
const defaultBranding: Branding = { source: 'default', imageUrl: '/firm-logo.png', versionId: null };
const Context = createContext({ branding: defaultBranding, canManage: false, refresh: async () => {} });
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState(defaultBranding);
  const [canManage, setCanManage] = useState(false);
  const refresh = useCallback(async () => {
    let authenticated = false;
    try { const user = await authApi.me(); authenticated = true; setCanManage(user.permissions.includes('admin.settings_manage')); } catch { setCanManage(false); }
    try { setBranding(await apiClient.get<Branding>(authenticated ? '/branding' : '/branding/public')); } catch { setBranding(defaultBranding); }
  }, []);
  useEffect(() => { void refresh(); window.addEventListener('focus', refresh); window.addEventListener('kka:auth-changed', refresh); return () => { window.removeEventListener('focus', refresh); window.removeEventListener('kka:auth-changed', refresh); }; }, [refresh]);
  useEffect(() => { document.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(link => { link.href = branding.imageUrl; }); }, [branding]);
  return <Context.Provider value={{ branding, canManage, refresh }}>{children}</Context.Provider>;
}
export const useBranding = () => useContext(Context);
