import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Compass, ShieldCheck, X } from 'lucide-react';
import { authApi, type CurrentAuthUser, type OnboardingState } from '../../lib/api/auth.api';

type Props = {
  user: CurrentAuthUser;
  state: OnboardingState;
  onStateChange: (state: OnboardingState) => void;
  onDismiss: () => void;
  onOpenWorkspace: (workspace: string) => void;
};

const steps = [
  { key: 'VERIFY_PROFILE', title: 'Verify your profile', description: 'Confirm the account that the server authenticated for this session.' },
  { key: 'ROLE_BRANCH', title: 'Your role and branch', description: 'Understand the firm role and home branch currently attached to this account.' },
  { key: 'PERMISSIONS', title: 'Your permissions', description: 'Workspace access follows server-issued permissions, not browser-only switches.' },
  { key: 'CORE_OS_TOUR', title: 'Core OS tour', description: 'Start with the firm workspaces that are available to your role.' },
  { key: 'ROLE_TOUR', title: 'Role-specific tour', description: 'Focus the next steps on the work your role performs most often.' },
  { key: 'HELP_CENTER', title: 'Help Center', description: 'Use the task-oriented field guide when you need a process reminder.' },
] as const;

export const OnboardingWizard: React.FC<Props> = ({ user, state, onStateChange, onDismiss, onOpenWorkspace }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const index = Math.max(0, steps.findIndex((step) => step.key === state.currentStepKey));
  const step = steps[index] ?? steps[0];
  const isStarted = state.status !== 'NOT_STARTED';
  const roleWorkspaces = useMemo(() => {
    if (user.permissions.some((permission) => permission.startsWith('finance.'))) return ['finance', 'approvals', 'reports'];
    if (user.permissions.some((permission) => permission.startsWith('court.'))) return ['court', 'calendar', 'documents'];
    if (user.permissions.some((permission) => permission.startsWith('admin.') || permission.startsWith('hr.'))) return ['operations', 'admin', 'reports'];
    return ['matters', 'tasks', 'documents', 'clients'];
  }, [user.permissions]);

  const update = async (input: Parameters<typeof authApi.updateOnboarding>[0]) => {
    setBusy(true);
    setError('');
    try {
      onStateChange((await authApi.updateOnboarding(input)).state);
      return true;
    } catch {
      setError('Setup progress could not be saved. No onboarding change was recorded.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (index === steps.length - 1) {
      await update({ action: 'COMPLETE' });
      return;
    }
    await update({ action: 'COMPLETE_STEP', stepKey: step.key, currentStepKey: steps[index + 1].key });
  };

  const postpone = async () => {
    if (await update({ action: 'POSTPONE', dismissedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })) onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <section className="w-full max-w-2xl rounded-3xl border border-amber-900/50 bg-slate-900 p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400"><Compass className="h-6 w-6" /></div><div><p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-amber-500">KKA OS setup</p><h1 id="onboarding-title" className="mt-1 text-2xl font-serif font-bold">{isStarted ? step.title : `Welcome, ${user.fullName}`}</h1><p className="mt-2 text-sm leading-relaxed text-slate-400">{isStarted ? step.description : 'A short, optional setup introduces the workspaces and access boundaries for your account.'}</p></div></div><button type="button" aria-label="Postpone setup" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100" disabled={busy} onClick={() => void postpone()}><X className="h-4 w-4" /></button></div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-amber-900/60 bg-amber-950/20 p-3 text-sm text-amber-200">{error}</p>}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm text-slate-300">
          {!isStarted ? <p>Setup can be postponed at any time. It never grants access or changes your role; access remains controlled by the server.</p> : <>{step.key === 'VERIFY_PROFILE' && <dl className="grid gap-2 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Email</dt><dd>{user.email}</dd></div><div><dt className="text-xs text-slate-500">Home branch</dt><dd>{user.homeBranchId || 'Not assigned'}</dd></div></dl>}{step.key === 'ROLE_BRANCH' && <dl className="grid gap-2 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Roles</dt><dd>{user.roleKeys.length ? user.roleKeys.join(', ') : 'No active role'}</dd></div><div><dt className="text-xs text-slate-500">Home branch</dt><dd>{user.homeBranchId || 'Not assigned'}</dd></div></dl>}{step.key === 'PERMISSIONS' && <div><ShieldCheck className="mb-2 h-5 w-5 text-amber-400" /><p>This session has {user.permissions.length} server-issued permissions. Buttons and record access may remain unavailable where a permission or record policy does not allow them.</p></div>}{step.key === 'CORE_OS_TOUR' && <p>Start with Matters, Tasks, Documents, and Clients. Only server-confirmed writes should be treated as saved.</p>}{step.key === 'ROLE_TOUR' && <div><p className="mb-3">Recommended workspaces for this account:</p><div className="flex flex-wrap gap-2">{roleWorkspaces.map((workspace) => <button key={workspace} type="button" onClick={() => onOpenWorkspace(workspace)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold capitalize hover:bg-slate-800">{workspace}</button>)}</div></div>}{step.key === 'HELP_CENTER' && <p>The Help Center records guide completion against this onboarding state. It remains unavailable rather than silently using browser-only progress if the API cannot save it.</p>}</>}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{isStarted ? `${index + 1} of ${steps.length}` : 'Optional first-login setup'}</span><div className="flex gap-2"><button type="button" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100" disabled={busy} onClick={() => void postpone()}>Do this later</button><button type="button" className="inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60" disabled={busy} onClick={() => void (isStarted ? next() : update({ action: 'START', currentStepKey: steps[0].key }))}>{isStarted && index === steps.length - 1 ? 'Finish setup' : isStarted ? 'Continue' : 'Start setup'} <ArrowRight className="ml-1 h-4 w-4" /></button></div></div>
      </section>
    </div>
  );
};
