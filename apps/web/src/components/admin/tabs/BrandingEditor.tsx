import React, { useEffect, useState } from 'react';
import { useBranding } from '../../../context/BrandingContext';
import { apiClient } from '../../../lib/api/client';
export function BrandingEditor() {
  const { branding, canManage, refresh } = useBranding();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (!file) { setPreview(''); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  async function save(restore = false) {
    setBusy(true); setMessage('');
    try {
      if (restore) await apiClient.post('/branding/restore-default');
      else { const data = new FormData(); data.append('file', file!); await apiClient.post('/branding/logo', data); }
      await refresh(); setFile(null); setMessage(restore ? 'Default logo restored.' : 'Logo saved.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save logo'); } finally { setBusy(false); }
  }
  return <section className="space-y-3 mb-5" aria-label="Firm branding">
    <h3 className="font-semibold">Firm logo</h3>
    <div className="rounded-xl bg-white p-3 w-full max-w-64"><img className="h-24 w-full object-contain" src={preview || branding.imageUrl} alt={preview ? 'Unsaved logo preview' : 'Current firm logo'} /></div>
    <p className="text-sm">{branding.source === 'managed' ? 'Saved firm branding' : 'Bundled default logo'}. PNG or JPEG, up to 5 MiB and 4096 pixels per side.</p>
    {canManage ? <><input aria-label="Upload firm logo" type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e => { const next = e.target.files?.[0]; setMessage(''); if (next && next.size > 5 * 1024 * 1024) { setMessage('Maximum upload size is 5 MiB.'); return; } setFile(next ?? null); }} />
    <div className="flex flex-wrap gap-2"><button className="admin-btn-primary" disabled={!file || busy} onClick={() => save()}>Save logo</button><button className="admin-btn-secondary" disabled={!file || busy} onClick={() => setFile(null)}>Cancel preview</button><button className="admin-btn-secondary" disabled={busy || branding.source === 'default'} onClick={() => save(true)}>Restore default</button></div></> : <p className="text-sm">Sign in with firm settings permission to manage the logo.</p>}
    <p role="status">{busy ? 'Saving…' : message}</p>
  </section>;
}
