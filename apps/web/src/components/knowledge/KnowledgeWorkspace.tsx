import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, BookOpen, CheckCircle2, FileText, Plus, RefreshCw, Search, Send, Tags } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { knowledgeApi, type KnowledgeItemDto, type KnowledgeStatus } from '../../lib/api/knowledge.api';

const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500';
const primaryButton = 'rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50';
const secondaryButton = 'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50';

const statusTone: Record<string, string> = {
  DRAFT: 'border-slate-700 bg-slate-900 text-slate-300',
  IN_REVIEW: 'border-amber-800 bg-amber-950/50 text-amber-300',
  PUBLISHED: 'border-emerald-800 bg-emerald-950/50 text-emerald-300',
  ARCHIVED: 'border-rose-900 bg-rose-950/40 text-rose-300',
};

function Status({ value }: { value: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${statusTone[value] || statusTone.DRAFT}`}>{value.replaceAll('_', ' ')}</span>;
}

export const KnowledgeWorkspace: React.FC = () => {
  const { hasUserPermission } = useApp();
  const canManage = hasUserPermission('knowledge.manage');
  const [items, setItems] = useState<KnowledgeItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ type: 'PROCEDURE', title: '', summary: '', practiceArea: '', tags: '', documentId: '' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await knowledgeApi.list({ q: q || undefined, status: status || undefined })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load the knowledge library.'); }
    finally { setLoading(false); }
  }, [q, status]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 180); return () => window.clearTimeout(timer); }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); setMessage(success); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed.'); }
    finally { setBusy(false); }
  }

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const groupedTags = useMemo(() => {
    const counts = new Map<string, number>();
    items.flatMap((item) => item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [items]);

  const counts = {
    published: items.filter((item) => item.status === 'PUBLISHED').length,
    review: items.filter((item) => item.status === 'IN_REVIEW').length,
    draft: items.filter((item) => item.status === 'DRAFT').length,
  };

  const transition = (item: KnowledgeItemDto, next: KnowledgeStatus) => run(() => knowledgeApi.setStatus(item.id, next), `Knowledge item moved to ${next.replaceAll('_', ' ').toLowerCase()}.`);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8 text-slate-100">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-amber-500">Institutional memory</p>
          <h1 className="mt-1 text-2xl font-serif font-bold">Knowledge, Precedents & Practice Playbooks</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">A governed internal library for legal procedures, precedents, case notes, research, firm policy and reusable know-how.</p>
        </div>
        <button className={secondaryButton} onClick={() => void load()} disabled={loading || busy}><RefreshCw className="mr-1 inline h-3.5 w-3.5" />Refresh</button>
      </header>

      {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-800 bg-rose-950/40 text-rose-200' : 'border-emerald-800 bg-emerald-950/40 text-emerald-200'}`}>{error || message}</div>}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><div className="text-xl font-bold">{counts.published}</div><div className="text-[11px] text-slate-400">Published</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><div className="text-xl font-bold">{counts.review}</div><div className="text-[11px] text-slate-400">In review</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><div className="text-xl font-bold">{counts.draft}</div><div className="text-[11px] text-slate-400">Drafts</div></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-2"><Search className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">Find knowledge</h2></div>
            <div className="space-y-3"><input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, summary or tag…" /><select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All lifecycle states</option><option value="PUBLISHED">Published</option><option value="IN_REVIEW">In review</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select></div>
            {!!groupedTags.length && <div className="mt-4"><div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500"><Tags className="h-3 w-3" />Popular tags</div><div className="flex flex-wrap gap-1.5">{groupedTags.map(([tag, count]) => <button key={tag} onClick={() => setQ(tag)} className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 hover:border-amber-700">{tag} · {count}</button>)}</div></div>}
          </section>

          {canManage && <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-2"><Plus className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">New knowledge item</h2></div>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run(async () => {
              if (!form.title.trim() || form.summary.trim().length < 3) throw new Error('Add a title and summary.');
              const item = await knowledgeApi.create({ type: form.type, title: form.title, summary: form.summary, practiceArea: form.practiceArea || undefined, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), documentId: form.documentId || undefined });
              setSelectedId(item.id); setForm({ type: 'PROCEDURE', title: '', summary: '', practiceArea: '', tags: '', documentId: '' });
            }, 'Knowledge draft created.'); }}>
              <label className="block text-xs text-slate-400">Type<select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PROCEDURE">Procedure</option><option value="PRECEDENT">Precedent</option><option value="CASE_NOTE">Case note</option><option value="RESEARCH">Research</option><option value="POLICY">Firm policy</option><option value="CHECKLIST">Checklist</option><option value="FAQ">FAQ</option></select></label>
              <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
              <textarea className={`${inputClass} min-h-28`} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="What should another lawyer know without opening another document?" />
              <div className="grid grid-cols-2 gap-3"><input className={inputClass} value={form.practiceArea} onChange={(e) => setForm({ ...form, practiceArea: e.target.value })} placeholder="Practice area" /><input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tags, comma, separated" /></div>
              <input className={inputClass} value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} placeholder="Linked document ID (optional)" />
              <button className={primaryButton} disabled={busy}>Create draft</button>
            </form>
          </section>}
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5 shadow-xl">
          <div className="mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">Library</h2><span className="text-xs text-slate-500">{items.length} items</span></div>
          {loading ? <div className="py-16 text-center text-slate-500">Loading knowledge…</div> : <div className="space-y-3">{items.map((item) => <article key={item.id} className={`rounded-xl border p-4 transition ${selectedId === item.id ? 'border-amber-600 bg-amber-950/10' : 'border-slate-800 bg-slate-950/45 hover:border-slate-700'}`}>
            <button className="w-full text-left" onClick={() => setSelectedId(selectedId === item.id ? '' : item.id)}><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-amber-500" /><h3 className="truncate font-semibold text-slate-100">{item.title}</h3></div><div className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">{item.type.replaceAll('_', ' ')}{item.practiceArea ? ` · ${item.practiceArea}` : ''}</div></div><Status value={item.status} /></div>{item.summary && <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.summary}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">#{tag}</span>)}</div></button>
            {selectedId === item.id && canManage && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-3">{item.status === 'DRAFT' && <button className={secondaryButton} disabled={busy} onClick={() => void transition(item, 'IN_REVIEW')}><Send className="mr-1 inline h-3 w-3" />Send for review</button>}{item.status === 'IN_REVIEW' && <button className={primaryButton} disabled={busy} onClick={() => void transition(item, 'PUBLISHED')}><CheckCircle2 className="mr-1 inline h-3 w-3" />Publish</button>}{item.status === 'PUBLISHED' && <button className={secondaryButton} disabled={busy} onClick={() => void transition(item, 'DRAFT')}>Return to draft</button>}{item.status !== 'ARCHIVED' && <button className={secondaryButton} disabled={busy} onClick={() => void transition(item, 'ARCHIVED')}><Archive className="mr-1 inline h-3 w-3" />Archive</button>}{item.status === 'ARCHIVED' && <button className={secondaryButton} disabled={busy} onClick={() => void transition(item, 'DRAFT')}>Restore</button>}</div>}
          </article>)}{!items.length && <div className="py-16 text-center text-sm text-slate-500">No knowledge items match this view.</div>}</div>}
        </section>
      </div>
    </div>
  );
};
