import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, CircleHelp, Compass, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const guides = [
  { title: 'Open a new personal injury matter', body: 'Start in Clients & Intake. Complete conflict clearance and KYC, then convert the qualified intake into a matter. The server creates the authoritative matter number and workflow.' },
  { title: 'Record a court outcome', body: 'Open Court Operations or the calendar court event. Record the outcome once. The server can create the next hearing, court-directed deadline, preparation task and matter next action in one transaction.' },
  { title: 'Work with controlled documents', body: 'Use Documents to create or upload matter documents. New versions remain immutable. Firm artwork and signatures are applied to a new version rather than overwriting the source.' },
  { title: 'Request leave', body: 'Open Operations → People & Leave. Submit the date range and chargeable days. HR users see the firm leave register and can approve or reject submitted requests.' },
  { title: 'Raise a purchase requisition', body: 'Open Operations → Procurement. Select the branch and vendor, enter the business purpose and amount, then submit. Approval, purchase-order creation and receipt are separate audited states.' },
  { title: 'Assign a laptop or other asset', body: 'Open Operations → Asset Custody. Choose an in-stock asset and assign it to a staff member. Returning the asset closes the custody record and moves it back to stock.' },
  { title: 'Capture meeting decisions', body: 'Open Operations → Projects & Meetings. Select the meeting, save minutes, record decisions and convert assigned actions with due dates into tasks.' },
  { title: 'Publish internal know-how', body: 'Open Knowledge. Create a draft procedure, precedent, case note or policy. Move it to review, then publish it once the summary is complete.' },
];

const faq = [
  ['Why does a button sometimes disappear?', 'Most screens are capability-driven. The server permissions assigned to your roles determine which modules and actions you can use.'],
  ['Can I work when the API is unavailable?', 'Normal operating mode treats the server as authoritative. The system should show an unavailable state rather than pretending local browser data was saved.'],
  ['Where do court deadlines come from?', 'Deadlines can be entered manually or created from a court outcome. Each persisted deadline keeps its calculation metadata and revision history.'],
  ['Does applying a signature alter the source document?', 'No. Controlled marks and visual signatures create a new immutable document version and an audit event.'],
  ['What is the difference between a requisition and a purchase order?', 'A requisition asks the firm to approve a purchase. An approved requisition can become a purchase order, which is then separately received.'],
  ['Where should reusable legal research live?', 'Use the Knowledge workspace for procedures, case notes, precedents, checklists and policies. Matter-specific evidence should remain on the matter/document record.'],
];

export const HelpCenterWorkspace: React.FC = () => {
  const { currentUser, setActiveWorkspace } = useApp();
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState<Set<number>>(() => {
    try { return new Set<number>(JSON.parse(localStorage.getItem('kka_help_progress') || '[]')); } catch { return new Set<number>(); }
  });

  const filteredGuides = useMemo(() => guides.filter((guide) => `${guide.title} ${guide.body}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredFaq = useMemo(() => faq.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const toggle = (index: number) => {
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index); else next.add(index);
      localStorage.setItem('kka_help_progress', JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8 text-slate-100">
      <header className="rounded-3xl border border-amber-900/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 p-6 sm:p-8">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400"><CircleHelp className="h-7 w-7" /></div><div><p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-amber-500">KKA OS field guide</p><h1 className="mt-1 text-2xl font-serif font-bold">Help Center & Guided Onboarding</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">Quick operational guidance for {currentUser.fullName}. This is intentionally task-oriented: what to do, where to do it, and what the system records.</p></div></div>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2"><Search className="h-4 w-4 text-amber-500" /><input className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help, workflows and FAQs…" /></div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5">
          <div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><Compass className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">Operational tour</h2></div><p className="mt-1 text-xs text-slate-500">Mark steps as understood. Progress is a local UI preference, not firm business data.</p></div><span className="text-xs text-slate-500">{completed.size}/{guides.length}</span></div>
          <div className="space-y-2">{filteredGuides.map((guide) => { const originalIndex = guides.indexOf(guide); const done = completed.has(originalIndex); return <button key={guide.title} onClick={() => toggle(originalIndex)} className={`w-full rounded-xl border p-4 text-left transition ${done ? 'border-emerald-800 bg-emerald-950/15' : 'border-slate-800 bg-slate-950/45 hover:border-slate-700'}`}><div className="flex items-start gap-3">{done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}<div><div className="font-semibold text-slate-100">{guide.title}</div><p className="mt-1 text-xs leading-relaxed text-slate-400">{guide.body}</p></div></div></button>; })}</div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><div className="mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">FAQ</h2></div><div className="space-y-3">{filteredFaq.map(([question, answer]) => <details key={question} className="rounded-xl border border-slate-800 bg-slate-950/45 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-200">{question}</summary><p className="mt-2 text-xs leading-relaxed text-slate-400">{answer}</p></details>)}</div></section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">Three rules of the OS</h2></div><ol className="space-y-2 text-xs leading-relaxed text-slate-400"><li><span className="font-semibold text-slate-200">1. Server-confirmed means saved.</span> If the API rejects a mutation, the UI must not claim success.</li><li><span className="font-semibold text-slate-200">2. Matter access follows the server.</span> Search, documents, tasks and related records must respect the same access boundary.</li><li><span className="font-semibold text-slate-200">3. Evidence beats labels.</span> Filed, paid, served, signed and reconciled states require the corresponding persisted evidence.</li></ol></section>

          <section className="rounded-2xl border border-amber-900/40 bg-amber-950/15 p-5"><div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /><h2 className="font-semibold">Jump back into work</h2></div><div className="grid grid-cols-2 gap-2">{[['dashboard', 'Dashboard'], ['matters', 'Matters'], ['operations', 'Operations'], ['knowledge', 'Knowledge']].map(([id, label]) => <button key={id} onClick={() => setActiveWorkspace(id)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800">{label}</button>)}</div></section>
        </div>
      </div>
    </div>
  );
};
