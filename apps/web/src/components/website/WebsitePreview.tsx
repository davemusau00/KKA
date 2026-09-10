import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { websiteApi } from '../../lib/websiteApi';

const origin = (import.meta.env.VITE_SITE_PREVIEW_ORIGIN || 'http://127.0.0.1:5174').replace(/\/$/, '');
type PreviewSession = { token: string; expiresAt: number };
type PreviewDraft = Record<string, unknown>;

function mergeById<T extends Record<string, any>>(base: T[] | undefined, changes: T[] | undefined) {
  if (!changes) return base;
  const byId = new Map((base || []).map(item => [item.id, item]));
  for (const change of changes) {
    if (change.id && byId.has(change.id)) byId.set(change.id, { ...byId.get(change.id), ...change });
    else if (change.id) byId.set(change.id, change);
  }
  return [...byId.values()];
}

function mergeSnapshot(base: any, draft?: PreviewDraft) {
  if (!draft) return base;
  const next = structuredClone(base);
  for (const key of ['settings', 'page']) {
    const value = draft[key] as any;
    if (!value) continue;
    if (key === 'settings') next.bootstrap.settings = { ...next.bootstrap.settings, ...value };
    if (key === 'page') {
      const pages = next.pages || [];
      const index = pages.findIndex((page: any) => page.id === value.id || page.slug === value.slug);
      if (index >= 0) pages[index] = { ...pages[index], ...value };
      else pages.push(value);
      next.pages = pages;
    }
  }
  for (const key of ['partners', 'practiceAreas', 'publications', 'testimonials', 'metrics', 'forms']) {
    const value = draft[key] as any[] | undefined;
    if (!value) continue;
    next.bootstrap[key] = mergeById(next.bootstrap[key], value);
  }
  return next;
}

export function WebsitePreview({ slug, draft }: { slug: string; draft?: PreviewDraft }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const snapshotRef = useRef<any>(null);
  const sessionRef = useRef<PreviewSession | null>(null);
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [width, setWidth] = useState(390);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const send = (type: 'website.preview.session' | 'website.preview.snapshot', current?: any) => {
    const active = sessionRef.current;
    if (!active || !frame.current?.contentWindow) return;
    frame.current.contentWindow.postMessage({ type, token: active.token, slug, snapshot: current }, origin);
  };

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow || event.data?.type !== 'website.preview.ready') return;
      send('website.preview.session', snapshotRef.current);
    };
    addEventListener('message', receive);
    return () => removeEventListener('message', receive);
  }, [slug]);

  useEffect(() => {
    if (!session || !snapshotRef.current || !draft) return;
    const timer = window.setTimeout(() => {
      const merged = mergeSnapshot(snapshotRef.current, draft);
      setSnapshot(merged);
      send('website.preview.snapshot', merged);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, session]);

  async function open() {
    setLoading(true);
    setError('');
    try {
      const nextSession = await websiteApi.preview();
      const savedSnapshot = await websiteApi.previewSnapshot(nextSession.token);
      sessionRef.current = nextSession;
      snapshotRef.current = savedSnapshot;
      const merged = mergeSnapshot(savedSnapshot, draft);
      setSession(nextSession);
      setSnapshot(merged);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Preview unavailable');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session && snapshot) send('website.preview.session', snapshot);
  }, [session, snapshot, slug]);

  return <section className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
    <div className="flex items-center justify-between gap-3">
      <div><h3 className="font-semibold">Live public preview</h3><p className="text-xs text-slate-500">Review the public visual composition while you work.</p></div>
      <button type="button" className="admin-btn-secondary min-h-11" onClick={open} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {session ? 'Refresh preview' : 'Open preview'}</button>
    </div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">{error}</p>}
    {session && <>
      <label className="block text-xs font-medium">Preview width<select className="admin-input mt-1 min-h-11" value={width} onChange={event => setWidth(Number(event.target.value))}>{[360, 390, 430, 768, 1024, 1440].map(size => <option key={size} value={size}>{size}px</option>)}</select></label>
      <div className="max-w-full overflow-auto rounded-lg bg-slate-100 p-2 dark:bg-slate-950"><iframe key={session.token} ref={frame} title="Public website draft preview" src={`${origin}/preview`} sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" style={{ width, height: 720, border: '1px solid #cbd5e1', background: '#fff' }} /></div>
      <p className="text-xs text-slate-500">{draft ? 'Preview of unsaved changes. Save the draft when it is ready.' : 'Preview of the saved draft. This private link expires after ten minutes.'}</p>
    </>}
  </section>;
}
