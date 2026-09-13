import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, CircleHelp, Compass, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authApi, type OnboardingState } from '../../lib/api/auth.api';

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

const manualSections = [
  { title: 'Getting started', workspace: 'dashboard', who: 'Every authenticated user', needs: 'An active account and server-issued permissions.', steps: 'Review your role, branch and access boundary, then use the navigation or global search to open work you are allowed to see.', saved: 'Onboarding steps and manual viewing are stored against your user account.', evidence: 'Onboarding actions create audit references; they never grant a permission.' },
  { title: 'Clients and intake', workspace: 'clients', who: 'Staff with client/intake permissions', needs: 'Contact details, intake facts, conflict/KYC information and consent where required.', steps: 'Register or review the intake, complete the gates, then use the authorized conversion path to create a client and matter.', saved: 'The conversion path creates server records and timeline/audit evidence.', evidence: 'Do not treat an intake as a matter or legal engagement until the required gates are satisfied.' },
  { title: 'Matters and workflow', workspace: 'matters', who: 'Assigned or expressly authorized matter users', needs: 'An authoritative matter and the right access scope.', steps: 'Review assignments, stage, handoffs and next actions; use explicit lifecycle transitions rather than editing status labels.', saved: 'Server-backed transitions retain assignments, stages and audit history where connected.', evidence: 'Restricted matters may be absent rather than described as forbidden.' },
  { title: 'Tasks and deadlines', workspace: 'tasks', who: 'Assigned users and supervisors', needs: 'A matter/task record and permitted assignee.', steps: 'Create, delegate and complete work through the authorized task flow; check dependencies and deadline source before changing work status.', saved: 'Server task/deadline mutations retain actor, dependency and revision evidence where connected.', evidence: 'A deadline date alone is not proof of a legal calculation or notification delivery.' },
  { title: 'Court operations', workspace: 'court', who: 'Court clerks, advocates and authorized support staff', needs: 'A matter, court event/proceeding and supporting source or court evidence.', steps: 'Use the court diary, filing and service flow to record evidence-backed transitions and outcomes.', saved: 'Connected court outcome, filing and service routes create persisted records and audits.', evidence: 'Do not represent filing, acceptance, service or an outcome without the required receipt, affidavit or source evidence.' },
  { title: 'Documents and approvals', workspace: 'documents', who: 'Document users with matter access', needs: 'An authorized matter and a controlled document/version.', steps: 'Create or upload a document, select the version, then follow review/approval controls before any permitted mark action.', saved: 'Document versions and workflow events are immutable where the server engine is connected.', evidence: 'Visual marks are not cryptographic signatures, and no local action can manufacture executed status.' },
  { title: 'Communications', workspace: 'comms', who: 'Authorized channel members', needs: 'A permitted channel or matter context.', steps: 'Use a matter channel or direct thread, mention staff carefully, and convert a message to a task only when an accountable action is required.', saved: 'Connected channel messages, read markers and message-to-task conversions persist server-side.', evidence: 'Provider delivery, attachment binary upload and realtime delivery require separate proof.' },
  { title: 'Finance and client money', workspace: 'finance', who: 'Finance users with appropriate matter access', needs: 'The correct firm/client account, source reference and finance permission.', steps: 'Record receipts, journals, expenses, transfers and reconciliation through their dedicated flows; use reversals for corrections.', saved: 'Connected finance routes retain ledger/audit evidence and cleared-state controls.', evidence: 'A screen amount is not a payment, distribution, bank confirmation or reconciled client-money balance.' },
  { title: 'People and HR', workspace: 'operations', who: 'HR managers and authorized staff', needs: 'A firm user/employee record and HR permission.', steps: 'Manage departments, lifecycle items, leave requests, appraisals, CPD and restricted notes from Operations.', saved: 'Connected HR records are firm-scoped and mutations create audit evidence.', evidence: 'Staff-document metadata is manual reference data unless an actual file-storage record exists.' },
  { title: 'Procurement and assets', workspace: 'operations', who: 'Procurement, asset and finance users', needs: 'Vendor, branch, category, approval and delivery/GRN reference as appropriate.', steps: 'Raise a requisition, follow approval/order/receipt states, then create linked asset or finance work only from the persisted receipt.', saved: 'Requisitions, receipts, assets and custody records are server-backed where connected.', evidence: 'Manual vendor/repair metadata and a receipt reference do not prove payment, quantity matching or supplier delivery.' },
  { title: 'Projects and meetings', workspace: 'operations', who: 'Operations managers and participants', needs: 'A project or scheduled meeting and relevant permissions.', steps: 'Record milestones, manual spend, minutes, decisions, attendance and task-backed actions in the project/meeting register.', saved: 'Connected project and meeting mutations persist state and audits.', evidence: 'Manual project spend is explicitly operational, not finance-posted; recurrence metadata is not occurrence generation.' },
  { title: 'Knowledge, reports and administration', workspace: 'knowledge', who: 'Knowledge, reporting and administration users', needs: 'The relevant module permission.', steps: 'Publish reusable internal guidance through Knowledge; use reports and settings only within your assigned access.', saved: 'Knowledge item transitions persist when the server module is connected.', evidence: 'Reports and exports must be server-derived; do not infer firm outcomes from browser data.' },
  { title: 'Security and troubleshooting', workspace: 'help', who: 'Every user; administrators for account actions', needs: 'A live authenticated session.', steps: 'Use password recovery, session logout and support escalation paths when access or saving fails. Re-open the record after a confirmed write.', saved: 'Password/session and onboarding routes emit their documented audit records.', evidence: 'If the API is unavailable or rejects an action, treat it as unsaved and retain the manual process/evidence.' },
];

export const HelpCenterWorkspace: React.FC = () => {
  const { currentUser, setActiveWorkspace } = useApp();
  const [query, setQuery] = useState('');
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [savingGuide, setSavingGuide] = useState<number | null>(null);
  const [progressError, setProgressError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        let state = await authApi.onboarding();
        if (!state.manualViewedAt) state = (await authApi.updateOnboarding({ action: 'VIEW_MANUAL' })).state;
        if (active) setOnboarding(state);
      } catch {
        if (active) setProgressError('Help progress is unavailable. Checklist changes will not be saved.');
      } finally {
        if (active) setLoadingProgress(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filteredGuides = useMemo(() => guides.filter((guide) => `${guide.title} ${guide.body}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredFaq = useMemo(() => faq.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredManual = useMemo(() => manualSections.filter((section) => Object.values(section).join(' ').toLowerCase().includes(query.toLowerCase())), [query]);
  const completed = useMemo(() => new Set(onboarding?.completedSteps ?? []), [onboarding]);
  const completedGuideCount = useMemo(() => guides.filter((_guide, index) => completed.has(`HELP_${index}`)).length, [completed]);

  const markGuideComplete = async (index: number) => {
    if (!onboarding || completed.has(`HELP_${index}`)) return;
    setSavingGuide(index);
    setProgressError('');
    try {
      const result = await authApi.updateOnboarding({ action: 'COMPLETE_STEP', stepKey: `HELP_${index}` });
      setOnboarding(result.state);
    } catch {
      setProgressError('Help progress could not be saved. No completion was recorded.');
    } finally {
      setSavingGuide(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8 text-slate-100">
      <header className="rounded-3xl border border-amber-900/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 p-6 sm:p-8">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400"><CircleHelp className="h-7 w-7" /></div><div><p className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-amber-500">KKA OS field guide</p><h1 className="mt-1 text-2xl font-serif font-bold">Help Center & Guided Onboarding</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">Quick operational guidance for {currentUser.fullName}. This is intentionally task-oriented: what to do, where to do it, and what the system records.</p></div></div>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2"><Search className="h-4 w-4 text-amber-500" /><input className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help, workflows and FAQs…" /></div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5">
          <div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><Compass className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">Operational tour</h2></div><p className="mt-1 text-xs text-slate-500">Mark steps as understood. Progress is stored in your server-side onboarding record.</p></div><span className="text-xs text-slate-500">{loadingProgress ? 'Loading…' : `${completedGuideCount}/${guides.length}`}</span></div>
          {progressError && <p role="status" className="mb-3 rounded-xl border border-amber-900/60 bg-amber-950/20 p-3 text-xs text-amber-200">{progressError}</p>}
          <div className="space-y-2">{filteredGuides.map((guide) => { const originalIndex = guides.indexOf(guide); const done = completed.has(`HELP_${originalIndex}`); return <button key={guide.title} disabled={loadingProgress || savingGuide === originalIndex || done || !onboarding} onClick={() => void markGuideComplete(originalIndex)} className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed ${done ? 'border-emerald-800 bg-emerald-950/15' : 'border-slate-800 bg-slate-950/45 hover:border-slate-700'}`}><div className="flex items-start gap-3">{done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}<div><div className="font-semibold text-slate-100">{guide.title}{savingGuide === originalIndex ? ' · Saving…' : ''}</div><p className="mt-1 text-xs leading-relaxed text-slate-400">{guide.body}</p></div></div></button>; })}</div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><div className="mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">FAQ</h2></div><div className="space-y-3">{filteredFaq.map(([question, answer]) => <details key={question} className="rounded-xl border border-slate-800 bg-slate-950/45 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-200">{question}</summary><p className="mt-2 text-xs leading-relaxed text-slate-400">{answer}</p></details>)}</div></section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" /><h2 className="font-semibold">Three rules of the OS</h2></div><ol className="space-y-2 text-xs leading-relaxed text-slate-400"><li><span className="font-semibold text-slate-200">1. Server-confirmed means saved.</span> If the API rejects a mutation, the UI must not claim success.</li><li><span className="font-semibold text-slate-200">2. Matter access follows the server.</span> Search, documents, tasks and related records must respect the same access boundary.</li><li><span className="font-semibold text-slate-200">3. Evidence beats labels.</span> Filed, paid, served, signed and reconciled states require the corresponding persisted evidence.</li></ol></section>

          <section className="rounded-2xl border border-amber-900/40 bg-amber-950/15 p-5"><div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /><h2 className="font-semibold">Jump back into work</h2></div><div className="grid grid-cols-2 gap-2">{[['dashboard', 'Dashboard'], ['matters', 'Matters'], ['operations', 'Operations'], ['knowledge', 'Knowledge']].map(([id, label]) => <button key={id} onClick={() => setActiveWorkspace(id)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800">{label}</button>)}</div></section>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /><div><h2 className="font-semibold">KKA OS user manual</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Each entry explains the operating boundary before directing you back to the relevant workspace. It does not replace firm policy, legal judgment, or required evidence.</p></div></div>
        <div className="grid gap-3 lg:grid-cols-2">{filteredManual.map((section) => <details key={section.title} className="rounded-xl border border-slate-800 bg-slate-950/45 p-4"><summary className="cursor-pointer font-semibold text-slate-100">{section.title}</summary><div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-400"><p><span className="font-semibold text-slate-200">Who can use it:</span> {section.who}</p><p><span className="font-semibold text-slate-200">What you need first:</span> {section.needs}</p><p><span className="font-semibold text-slate-200">Procedure:</span> {section.steps}</p><p><span className="font-semibold text-slate-200">What gets saved:</span> {section.saved}</p><p><span className="font-semibold text-slate-200">Evidence boundary:</span> {section.evidence}</p><button type="button" onClick={() => setActiveWorkspace(section.workspace)} className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800">Open {section.workspace === 'help' ? 'Help Center' : `${section.workspace} workspace`}</button></div></details>)}{!filteredManual.length && <p className="py-8 text-center text-sm text-slate-500">No manual section matches this search.</p>}</div>
      </section>
    </div>
  );
};
