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
  useEffect(() => {
    let active=true; const img=new Image();
    img.onload=()=>{
      if(!active)return;
      const canvas=document.createElement('canvas');canvas.width=180;canvas.height=180;const ctx=canvas.getContext('2d')!;
      const scale=160/Math.max(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(180-img.naturalWidth*scale)/2,(180-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
      const pixels=ctx.getImageData(0,0,180,180);let maximum=0;
      for(let i=3;i<pixels.data.length;i+=4)maximum=Math.max(maximum,pixels.data[i]);
      if(maximum>0&&maximum<64){for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.round(pixels.data[i]*255/maximum);ctx.putImageData(pixels,0,0);}
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(link=>{link.href=canvas.toDataURL('image/png');});
    };
    img.onerror=()=>{if(img.src.endsWith('/firm-logo.png'))return;img.src='/firm-logo.png';};img.src=branding.imageUrl;
    return()=>{active=false;};
  }, [branding]);
  return <Context.Provider value={{ branding, canManage, refresh }}>{children}</Context.Provider>;
}
export const useBranding = () => useContext(Context);
