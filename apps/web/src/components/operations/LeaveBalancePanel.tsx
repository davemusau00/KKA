import React, { useEffect, useState } from 'react';
import type { LeavePosition } from '@contracts';
import { operationsApi } from '../../lib/api/operations.api';

export function LeaveBalancePanel({ userId, policyKey }: { userId: string; policyKey: string | null | undefined }) {
  const [position, setPosition] = useState<LeavePosition | null>(null), [error, setError] = useState('');
  const [correction, setCorrection] = useState({ openingDays: '', adjustmentDays: '', notes: '' });
  const [saving, setSaving] = useState(false), [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setPosition(null); setError('');
    if (!policyKey) return;
    operationsApi.calculatedLeaveBalance(userId, policyKey, new Date().getFullYear())
      .then(value => { if (active) setPosition(value); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load leave balance'); });
    return () => { active = false; };
  }, [userId, policyKey, revision]);
  useEffect(() => { setCorrection({ openingDays: '', adjustmentDays: '', notes: '' }); }, [userId, policyKey]);
  return <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><h3 className="mb-2 font-semibold text-slate-200">Calculated leave balance</h3>
    {!policyKey ? <p>Assign a leave policy to this employee.</p> : error ? <p role="alert" className="text-amber-300">{error}</p> : !position ? <p role="status">Loading balance…</p> : <>
      <p className="mb-2 text-slate-400">{position.policyKey} · {position.year} · as of {position.asOf}</p>
      <dl className="grid grid-cols-2 gap-2">{[['Opening carryover', position.openingDays], ['Accrued', position.accruedDays], ['Adjustments', position.adjustmentDays], ['Approved usage', position.usedDays], ['Pending', position.pendingDays], ['Available', position.availableDays], ['Projected available', position.projectedAvailableDays]].map(([label, value]) => <React.Fragment key={label}><dt>{label}</dt><dd className="text-right">{value}</dd></React.Fragment>)}</dl>
      {!!position.unclassifiedRequestIds.length && <p className="mt-2 text-amber-300">Historical requests require policy review; this balance is incomplete.</p>}
      <details className="mt-4 border-t border-slate-800 pt-3"><summary className="cursor-pointer">Record carryover or an adjustment</summary>
        <form className="mt-3 space-y-3" onSubmit={async event => {
          event.preventDefault(); if (!policyKey || saving) return;
          setSaving(true); setError('');
          try {
            await operationsApi.saveLeaveBalance(userId, { policyKey, year: position.year, notes: correction.notes,
              ...(correction.openingDays === '' ? {} : { openingDays: Number(correction.openingDays) }),
              ...(correction.adjustmentDays === '' ? {} : { adjustmentDays: Number(correction.adjustmentDays) }) });
            setCorrection({ openingDays: '', adjustmentDays: '', notes: '' }); setRevision(value => value + 1);
          } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save balance correction'); }
          finally { setSaving(false); }
        }}>
          <p className="text-slate-400">Enter the replacement total for a field; leave it blank to keep its value. Approved usage and accrual are calculated automatically.</p>
          <label className="block">Opening carryover total<input type="number" min="0" max="366" step="0.01" disabled={saving} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 p-2" value={correction.openingDays} onChange={e => setCorrection({ ...correction, openingDays: e.target.value })} /></label>
          <label className="block">Adjustment total<input type="number" min="-366" max="366" step="0.01" disabled={saving} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 p-2" value={correction.adjustmentDays} onChange={e => setCorrection({ ...correction, adjustmentDays: e.target.value })} /></label>
          <label className="block">Correction reason<textarea required minLength={3} disabled={saving} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 p-2" value={correction.notes} onChange={e => setCorrection({ ...correction, notes: e.target.value })} /></label>
          <button disabled={saving || (correction.openingDays === '' && correction.adjustmentDays === '')} className="rounded border border-slate-600 px-3 py-2">{saving ? 'Saving…' : 'Save audited correction'}</button>
        </form>
      </details>
    </>}
  </div>;
}
