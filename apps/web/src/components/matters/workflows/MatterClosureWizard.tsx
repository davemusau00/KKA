import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  ShieldCheck,
  Send,
  BookOpen,
  Calendar,
  Box,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { runtimeConfig } from '../../../config/runtime';
import { MatterClosureAuditData, Matter } from '../../../types';

interface MatterClosureWizardProps {
  matter: Matter;
}

export const MatterClosureWizard: React.FC<MatterClosureWizardProps> = ({ matter }) => {
  const { closureAudits, updateClosureAudit, finalizeMatterClosureWizard, currentUser } = useApp();

  const data: MatterClosureAuditData = closureAudits[matter.id] || {
    matterId: matter.id,
    isJudgmentSettlementComplete: true,
    isClientFundsReconciled: true,
    isOutstandingExpensesResolved: true,
    isFinalPaymentMade: true,
    isClientInformedAndDischarged: true,
    areAllDocumentsFiled: true,
    physicalFileLocation: 'Kagunda Archive Repository - Shelf 3B (BOX-2026-NRB-042)',
    closingNote: 'Matter successfully resolved via High Court decree and Directline settlement. All funds disbursed and file securely archived for 7-year statutory retention.',
    supervisorApproved: true,
    approvedByUserId: currentUser.id,
    approvedAt: new Date().toISOString(),
    archivedAt: new Date().toISOString(),
  };

  const safeData: MatterClosureAuditData = runtimeConfig.enableDemoMode ? data : {
    matterId: matter.id, isJudgmentSettlementComplete: false, isClientFundsReconciled: false, isOutstandingExpensesResolved: false,
    isFinalPaymentMade: false, isClientInformedAndDischarged: false, areAllDocumentsFiled: false, physicalFileLocation: '', closingNote: '', supervisorApproved: false,
  };
  const [localData, setLocalData] = useState<MatterClosureAuditData>(safeData);
  const [closedSuccess, setClosedSuccess] = useState(false);

  const canClose =
    localData.isJudgmentSettlementComplete &&
    localData.isClientFundsReconciled &&
    localData.isOutstandingExpensesResolved &&
    localData.isFinalPaymentMade &&
    localData.isClientInformedAndDischarged &&
    localData.areAllDocumentsFiled &&
    Boolean(localData.physicalFileLocation);

  const handleExecuteClosure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canClose || !runtimeConfig.enableDemoMode) return;

    finalizeMatterClosureWizard(matter.id, localData);
    setClosedSuccess(true);
  };

  return (
    <div className="space-y-6 text-xs">
      {!runtimeConfig.enableDemoMode && <p role="status" className="border border-amber-800 bg-amber-950/30 text-amber-200 rounded-lg p-3">No server closure record is connected. Completion, reconciliation, approval, and archive status are not assumed.</p>}
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
              Stage 16: Matter Closure &amp; Archive Management
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Trust Reconciliation, Physical Archive &amp; 7-Year Retention Compliance
          </h2>
        </div>

        {closedSuccess && (
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Matter Formally Closed &amp; Archived
          </span>
        )}
      </div>

      <form onSubmit={handleExecuteClosure} className="space-y-6">
        {/* Verification Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Statutory Closure Audit Checklist</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Judgment or settlement fully satisfied', key: 'isJudgmentSettlementComplete' as const },
              { label: 'Client Trust Account balance is zero (reconciled)', key: 'isClientFundsReconciled' as const },
              { label: 'All disbursements & third-party expenses resolved', key: 'isOutstandingExpensesResolved' as const },
              { label: 'Final net disbursement paid to client', key: 'isFinalPaymentMade' as const },
              { label: 'Client informed and discharge voucher signed', key: 'isClientInformedAndDischarged' as const },
              { label: 'All pleadings & court orders archived in file', key: 'areAllDocumentsFiled' as const },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(localData[item.key])}
                  onChange={(e) => setLocalData({ ...localData, [item.key]: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Physical Archive & Retention Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physical Archive Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="font-mono font-bold text-slate-700 dark:text-slate-200 uppercase text-xs flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Physical Storage &amp; Archive Location</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Physical Archive File Location / Shelf Code *</label>
                <input
                  type="text"
                  required
                  value={localData.physicalFileLocation}
                  onChange={(e) => setLocalData({ ...localData, physicalFileLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Supervising Advocate Approval</label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-xs flex items-center justify-between">
                  <span>Authorized by: {currentUser.fullName}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Retention & Feedback */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="font-mono font-bold text-slate-700 dark:text-slate-200 uppercase text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>7-Year Statutory Retention Expiry</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Scheduled Physical &amp; Digital Destruction Date:</span>
                <div className="font-mono text-amber-700 dark:text-amber-400 font-bold text-sm">
                  {new Date(Date.now() + 7 * 365 * 86400000).toISOString().slice(0, 10)}
                </div>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">In accordance with Law Society of Kenya retention bylaws.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Notes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <label className="block text-slate-600 dark:text-slate-400 font-medium">Final Advocate Closing Memorandum</label>
          <textarea
            rows={2}
            value={localData.closingNote || ''}
            onChange={(e) => setLocalData({ ...localData, closingNote: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {!canClose && (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Complete all checklist requirements and assign physical location to seal matter.
            </span>
          )}

          <div className="ml-auto">
            <button
              type="submit"
              disabled={!canClose}
              className={`px-6 py-2.5 rounded-xl font-semibold shadow flex items-center gap-2 transition ${
                canClose
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Formally Seal &amp; Archive Matter</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
