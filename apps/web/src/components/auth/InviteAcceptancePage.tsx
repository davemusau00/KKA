import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { authApi } from '../../lib/api/auth.api';
import { FirmLogo } from '../common/FirmLogo';

export const InviteAcceptancePage: React.FC = () => {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token')?.trim() || '', []);
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'complete'>('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token.length < 32) { setState('invalid'); return; }
    let mounted = true;
    authApi.inspectInvite(token)
      .then((result) => { if (mounted) setState(result.valid ? 'ready' : 'invalid'); })
      .catch(() => { if (mounted) setState('invalid'); });
    return () => { mounted = false; };
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 12) { setError('Use a password with at least 12 characters.'); return; }
    if (password !== confirmation) { setError('The passwords do not match.'); return; }
    setSubmitting(true); setError(null);
    try {
      await authApi.acceptInvite(token, password);
      setState('complete');
      setPassword(''); setConfirmation('');
    } catch (cause: any) {
      setError(cause?.message || 'This invitation is no longer valid.');
      setState('invalid');
    } finally { setSubmitting(false); }
  };

  const invalid = state === 'invalid';
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:grid sm:place-items-center sm:p-8">
    <section className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/30">
      <div className="h-1.5 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" />
      <div className="p-6 sm:p-8">
        <FirmLogo variant="badge" size="md" showText responsive={false} subtext="Secure staff onboarding" />
        {state === 'checking' && <div className="grid min-h-48 place-items-center text-sm text-slate-400"><Loader2 className="h-6 w-6 animate-spin text-amber-500" aria-label="Checking invitation" /></div>}
        {invalid && <div className="mt-8 rounded-xl border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-200" role="alert"><AlertCircle className="mr-2 inline h-4 w-4" />This invitation is invalid, expired, replaced, or has already been used. Ask a firm administrator to issue a new invitation.</div>}
        {state === 'complete' && <div className="mt-8 space-y-5"><div className="rounded-xl border border-emerald-800/70 bg-emerald-950/30 p-4 text-sm text-emerald-100" role="status"><CheckCircle2 className="mr-2 inline h-4 w-4" />Your account is active. Sign in with the password you just created.</div><button type="button" onClick={() => window.location.assign('/')} className="admin-btn-primary min-h-11 w-full justify-center">Continue to sign in</button></div>}
        {state === 'ready' && <form className="mt-8 space-y-5" onSubmit={submit}>
          <div><h1 className="text-xl font-semibold">Create your firm password</h1><p className="mt-2 text-sm leading-6 text-slate-400">This invitation can be used once. Your administrator has assigned your firm roles and branch before activation.</p></div>
          {error && <div className="rounded-xl border border-rose-900/70 bg-rose-950/30 p-3 text-xs text-rose-200" role="alert">{error}</div>}
          <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required className="admin-input mt-2 min-h-11 w-full" /></label>
          <label className="block text-sm font-medium">Confirm password<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} required className="admin-input mt-2 min-h-11 w-full" /></label>
          <button type="submit" disabled={submitting} className="admin-btn-primary min-h-11 w-full justify-center disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Activate account</button>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />Password creation activates your account but does not sign you in automatically.</p>
        </form>}
      </div>
    </section>
  </main>;
};
