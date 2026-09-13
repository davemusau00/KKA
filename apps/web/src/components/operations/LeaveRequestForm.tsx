import React, { useEffect, useState } from 'react';
import type { LeavePreview } from '@contracts';
import { operationsApi, type LeavePolicyDto } from '../../lib/api/operations.api';

export function LeaveRequestForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [policies, setPolicies] = useState<LeavePolicyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ policyKey: '', startsOn: '', endsOn: '', reason: '' });
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [preview, setPreview] = useState<LeavePreview | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const inputClass = 'mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100';
  useEffect(() => {
    let active = true;
    operationsApi.employeeLeavePolicies().then(rows => { if (active) setPolicies(rows); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load leave policies'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setPreview(null); setError('');
    if (!form.policyKey || !form.startsOn || !form.endsOn) { setPreviewing(false); return; }
    setPreviewing(true);
    operationsApi.previewLeave({ policyKey: form.policyKey, startsOn: form.startsOn, endsOn: form.endsOn })
      .then(result => { if (active) setPreview(result); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to calculate leave'); })
      .finally(() => { if (active) setPreviewing(false); });
    return () => { active = false; };
  }, [form.policyKey, form.startsOn, form.endsOn]);
  const change = (field: keyof typeof form, value: string) => {
    setForm(previous => ({ ...previous, [field]: value })); setKey(crypto.randomUUID());
    if (field !== 'reason') setPreview(null);
  };
  return <form className="space-y-3" onSubmit={async event => {
    event.preventDefault(); if (!preview?.sufficient || saving) return;
    setSaving(true); setError('');
    try {
      await operationsApi.requestLeave({ ...form, idempotencyKey: key, reason: form.reason || undefined });
      setForm({ policyKey: '', startsOn: '', endsOn: '', reason: '' }); setKey(crypto.randomUUID()); setPreview(null);
      await onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to submit leave. Retry with the same details.'); }
    finally { setSaving(false); }
  }}>
    <fieldset disabled={saving || loading} className="space-y-3">
      <label className="block text-xs text-slate-400">Leave policy<select required className={inputClass} value={form.policyKey} onChange={e => change('policyKey', e.target.value)}><option value="">{loading ? 'Loading policies…' : 'Choose a policy'}</option>{policies.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}</select></label>
      {!loading && !policies.length && <p className="text-sm text-slate-400">HR must configure a leave policy before requests can be submitted.</p>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-400">Starts<input required type="date" className={inputClass} value={form.startsOn} onChange={e => change('startsOn', e.target.value)} /></label><label className="text-xs text-slate-400">Ends<input required type="date" min={form.startsOn} className={inputClass} value={form.endsOn} onChange={e => change('endsOn', e.target.value)} /></label></div>
      <label className="block text-xs text-slate-400">Reason<textarea className={inputClass} value={form.reason} onChange={e => change('reason', e.target.value)} /></label>
    </fieldset>
    {previewing && <p role="status" className="text-sm text-slate-400">Calculating leave…</p>}
    {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    {preview && <div className="rounded-xl border border-slate-700 p-3 text-sm">
      <h3 className="mb-2 font-semibold">{preview.days} chargeable day(s)</h3>
      <dl className="grid grid-cols-2 gap-2 text-slate-300">{[
        ['Opening carryover', preview.position.openingDays], ['Accrued entitlement', preview.position.accruedDays], ['Adjustments', preview.position.adjustmentDays], ['Approved leave', preview.position.usedDays], ['Available', preview.position.availableDays], ['Pending requests', preview.position.pendingDays], ['Projected before this request', preview.position.projectedAvailableDays], ['After this request', preview.projectedAfterRequest],
      ].map(([label, value]) => <React.Fragment key={label}><dt>{label}</dt><dd className="text-right tabular-nums">{value}</dd></React.Fragment>)}</dl>
      <p className="mt-2 text-xs text-slate-400">Accrual calculated through {preview.position.asOf}. Approval rechecks your balance.</p>
      {preview.position.unclassifiedRequestIds.length > 0 ? <p className="mt-2 text-amber-300">HR must reconcile historical leave before new requests can be charged.</p> : !preview.sufficient && <p className="mt-2 text-amber-300">This request exceeds the policy balance limit.</p>}
    </div>}
    <button disabled={saving || previewing || !preview?.sufficient} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Submitting…' : 'Submit leave request'}</button>
  </form>;
}
