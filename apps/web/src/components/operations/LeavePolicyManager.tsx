import React, { useEffect, useState } from 'react';
import type { CalculatedLeavePolicyInput } from '@contracts';
import { operationsApi, type LeavePolicyDto, type LeaveRequestDto } from '../../lib/api/operations.api';

type Policy = LeavePolicyDto & { accrualMode: 'FRONT_LOADED' | 'MONTHLY'; prorateNewEmployees: boolean; allowNegative: boolean; maximumNegativeDays: string | number; workingDays: number[]; excludedDates: string[] };
const empty: CalculatedLeavePolicyInput = { key: '', name: '', annualEntitlementDays: 0, carryoverLimitDays: null, active: true, accrualMode: 'FRONT_LOADED', prorateNewEmployees: true, allowNegative: false, maximumNegativeDays: 0, workingDays: [1, 2, 3, 4, 5], excludedDates: [] };
const field = 'mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100';

export function LeavePolicyManager({ requests, onSaved }: { requests: LeaveRequestDto[]; onSaved: () => Promise<void> }) {
  const [policies, setPolicies] = useState<Policy[]>([]), [form, setForm] = useState(empty);
  const [excluded, setExcluded] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [review, setReview] = useState({ id: '', policyKey: '', reason: '' });
  const load = async () => setPolicies(await operationsApi.leavePolicies() as Policy[]);
  useEffect(() => { void load().catch(cause => setError(String(cause.message || cause))); }, []);
  const action = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setMessage('');
    try { await work(); await load(); await onSaved(); setMessage(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save leave policy'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5">
    {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    <label className="block text-xs text-slate-400">Edit policy<select className={field} disabled={busy} value={policies.some(p => p.key === form.key) ? form.key : ''} onChange={e => {
      const selected = policies.find(p => p.key === e.target.value);
      if (!selected) { setForm(empty); setExcluded(''); return; }
      setForm({ key: selected.key, name: selected.name, annualEntitlementDays: Number(selected.annualEntitlementDays), carryoverLimitDays: selected.carryoverLimitDays == null ? null : Number(selected.carryoverLimitDays), active: selected.active, accrualMode: selected.accrualMode, prorateNewEmployees: selected.prorateNewEmployees, allowNegative: selected.allowNegative, maximumNegativeDays: Number(selected.maximumNegativeDays), workingDays: selected.workingDays, excludedDates: selected.excludedDates });
      setExcluded(selected.excludedDates.join('\n'));
    }}><option value="">New policy</option>{policies.map(p => <option key={p.key} value={p.key}>{p.name}{p.active ? '' : ' (inactive)'}</option>)}</select></label>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); void action(() => operationsApi.saveLeavePolicy({ ...form, excludedDates: excluded.split(/[\s,]+/).filter(Boolean) }), 'Leave policy saved.'); }}>
      <fieldset disabled={busy} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-400">Policy key<input required className={field} value={form.key} onChange={e => setForm({ ...form, key: e.target.value.toUpperCase() })} /></label><label className="text-xs text-slate-400">Name<input required className={field} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label></div>
        <p className="text-xs text-slate-400">Assign this policy key in the employee profile. Entitlement is calculated for the assigned policy.</p>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-400">Annual entitlement (days)<input required type="number" min="0" max="366" step="0.01" className={field} value={form.annualEntitlementDays} onChange={e => setForm({ ...form, annualEntitlementDays: Number(e.target.value) })} /></label><label className="text-xs text-slate-400">Carryover cap (blank for no cap)<input type="number" min="0" max="366" step="0.01" className={field} value={form.carryoverLimitDays ?? ''} onChange={e => setForm({ ...form, carryoverLimitDays: e.target.value === '' ? null : Number(e.target.value) })} /></label></div>
        <label className="block text-xs text-slate-400">Accrual<select className={field} value={form.accrualMode} onChange={e => setForm({ ...form, accrualMode: e.target.value as Policy['accrualMode'] })}><option value="FRONT_LOADED">Annual front-loaded</option><option value="MONTHLY">Completed calendar months</option></select></label>
        <div className="flex flex-wrap gap-3 text-xs text-slate-300"><label><input type="checkbox" checked={form.prorateNewEmployees} onChange={e => setForm({ ...form, prorateNewEmployees: e.target.checked })} /> Prorate new starters</label><label><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label><label><input type="checkbox" checked={form.allowNegative} onChange={e => setForm({ ...form, allowNegative: e.target.checked })} /> Allow negative balance</label></div>
        {form.allowNegative && <label className="block text-xs text-slate-400">Maximum negative days<input required type="number" min="0" max="366" step="0.01" className={field} value={form.maximumNegativeDays} onChange={e => setForm({ ...form, maximumNegativeDays: Number(e.target.value) })} /></label>}
        <fieldset className="text-xs text-slate-300"><legend className="mb-2">Chargeable weekdays</legend><div className="flex flex-wrap gap-3">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, day) => <label key={label}><input type="checkbox" checked={form.workingDays?.includes(day)} onChange={e => setForm({ ...form, workingDays: e.target.checked ? [...(form.workingDays ?? []), day] : form.workingDays?.filter(d => d !== day) })} /> {label}</label>)}</div></fieldset>
        <label className="block text-xs text-slate-400">Excluded dates (YYYY-MM-DD, one per line)<textarea className={field} rows={3} value={excluded} onChange={e => setExcluded(e.target.value)} /></label>
        <p className="text-xs text-slate-400">Enter the firm-approved holiday calendar. Changes apply to new requests; saved requests retain their original chargeable dates.</p>
        <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">Save policy</button>
      </fieldset>
    </form>
    {requests.some(r => !r.policyKey) && <form className="space-y-3 border-t border-slate-800 pt-4" onSubmit={e => {
      e.preventDefault(); const request = requests.find(r => r.id === review.id); if (!request) return;
      void action(() => operationsApi.reconcileLeavePolicy(request.id, { policyKey: review.policyKey, revision: request.revision, reason: review.reason }), 'Historical leave assigned to the reviewed policy.');
    }}><h3 className="font-semibold">Review historical leave</h3><p className="text-xs text-slate-400">Select the policy that should account for the existing recorded days. This preserves the original amount and records your review reason.</p><label className="block text-xs text-slate-400">Request<select required className={field} disabled={busy} value={review.id} onChange={e => setReview({ ...review, id: e.target.value })}><option value="">Choose historical request</option>{requests.filter(r => !r.policyKey).map(r => <option key={r.id} value={r.id}>{r.requester?.fullName} · {r.type} · {r.startsOn.slice(0, 10)} · {r.days} days</option>)}</select></label><label className="block text-xs text-slate-400">Policy<select required className={field} disabled={busy} value={review.policyKey} onChange={e => setReview({ ...review, policyKey: e.target.value })}><option value="">Choose reviewed policy</option>{policies.filter(p => p.active).map(p => <option key={p.key} value={p.key}>{p.name}</option>)}</select></label><label className="block text-xs text-slate-400">Review reason<textarea required minLength={3} className={field} disabled={busy} value={review.reason} onChange={e => setReview({ ...review, reason: e.target.value })} /></label><button disabled={busy} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">Record policy review</button></form>}
  </div>;
}
