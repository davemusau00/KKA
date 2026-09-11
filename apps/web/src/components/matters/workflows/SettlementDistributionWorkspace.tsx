import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Calculator,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  Send,
  Download,
  CreditCard,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { runtimeConfig } from '../../../config/runtime';
import { apiClient } from '../../../lib/api/client';
import { SettlementDistributionData, Matter } from '../../../types';

interface SettlementDistributionWorkspaceProps {
  matter: Matter;
}

export const SettlementDistributionWorkspace: React.FC<SettlementDistributionWorkspaceProps> = ({ matter }) => {
  const { settlementDistributions, updateSettlementDistribution, disburseClientSettlement, clients } = useApp();

  const client = clients.find((c) => c.id === matter.clientId);

  const data: SettlementDistributionData = settlementDistributions[matter.id] || {
    matterId: matter.id,
    grossSettlementAmount: 0, fundsReceivedDate: '', account: 'Client Trust Account', outstandingDisbursements: [],
    totalDisbursements: 0, professionalFees: 0, vatOnFees: 0,
    otherDeductions: [],
    netClientAmount: 0, settlementStatementProduced: false, clientApprovalStatus: 'pending', paymentMethod: 'M-Pesa B2C',
  };

  const [localData, setLocalData] = useState<SettlementDistributionData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [serverPosition, setServerPosition] = useState<any>(null);
  const [positionLoading, setPositionLoading] = useState(!runtimeConfig.enableDemoMode);
  const [positionError, setPositionError] = useState('');

  useEffect(() => {
    if (runtimeConfig.enableDemoMode) return;
    let active = true;
    apiClient.get<any>(`/finance/matters/${matter.id}/settlement-position`)
      .then((position) => {
        if (!active) return;
        setServerPosition(position);
        setPositionError('');
      })
      .catch((error) => active && setPositionError(error?.message || 'Unable to load the server settlement position.'))
      .finally(() => active && setPositionLoading(false));
    return () => { active = false; };
  }, [matter.id]);

  // Dynamic fee & VAT calculations
  const gross = Number(localData.grossSettlementAmount) || 0;
  const calculatedFee = Number(localData.professionalFees) || Math.round(gross * 0.20);
  const vat = Number(localData.vatOnFees) || Math.round(calculatedFee * 0.16);
  const disbursements = localData.outstandingDisbursements.reduce((acc, d) => acc + d.amount, 0);
  const otherDed = localData.otherDeductions.reduce((acc, d) => acc + d.amount, 0);
  const netPayout = gross - (calculatedFee + vat + disbursements + otherDed);

  const handleSave = () => {
    if (!runtimeConfig.enableDemoMode) return;
    const updated: SettlementDistributionData = {
      ...localData,
      totalDisbursements: disbursements,
      professionalFees: calculatedFee,
      vatOnFees: vat,
      netClientAmount: netPayout,
    };
    updateSettlementDistribution(matter.id, updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDisburseNow = () => {
    if (!runtimeConfig.enableDemoMode) return;
    disburseClientSettlement(matter.id, localData.paymentMethod, localData.paymentReference || 'TX-DISBURSE-01');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-xs">
      {!runtimeConfig.enableDemoMode && <p role="status" className="border border-amber-800 bg-amber-950/30 text-amber-200 rounded-lg p-3">Server settlement evidence is read-only here. Approval, payout, and disbursement are not represented as complete until the ledger workflow is connected.</p>}
      {!runtimeConfig.enableDemoMode && positionLoading && <p role="status" className="text-slate-400">Loading server settlement position…</p>}
      {!runtimeConfig.enableDemoMode && positionError && <p role="alert" className="border border-rose-800 bg-rose-950/30 text-rose-200 rounded-lg p-3">{positionError}</p>}
      {!runtimeConfig.enableDemoMode && serverPosition && <div role="status" className="border border-sky-800 bg-sky-950/30 text-sky-200 rounded-lg p-3">Server evidence: recorded client funds KES {Number(serverPosition.recordedClientFunds || 0).toLocaleString()} · recorded fee notes KES {Number(serverPosition.recordedFeeNotes || 0).toLocaleString()} · reconciled disbursements KES {Number(serverPosition.reconciledDisbursements || 0).toLocaleString()} · proposed residual KES {Number(serverPosition.proposedResidual || 0).toLocaleString()}. This is not a payout confirmation.</div>}
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
              Stage 15: Client Trust Funds &amp; Settlement Distribution
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Trust Accounting, Legal Fees (ARO), Disbursements &amp; Client Payout
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ledger Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!runtimeConfig.enableDemoMode}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Distribution Ledger</span>
          </button>
        </div>
      </div>

      {/* Trust Ledger Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Gross Trust Funds Received</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            KES {gross.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">{runtimeConfig.enableDemoMode ? 'Demo funds source' : 'No server receipt loaded'}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Legal Fees + 16% VAT</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            KES {(calculatedFee + vat).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Fee: {calculatedFee.toLocaleString()} | VAT: {vat.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Disbursements Recovered</span>
          <div className="text-lg font-bold font-mono text-blue-400 mt-1">
            KES {disbursements.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">{localData.outstandingDisbursements.length} expenditure heads</span>
        </div>

        <div className="p-4 bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-600/40 rounded-xl">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Net Client Payout</span>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            KES {netPayout.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{runtimeConfig.enableDemoMode ? `Payable to ${client?.displayName || 'client'}` : 'Awaiting server ledger evidence'}</span>
        </div>
      </div>

      {/* Grid: Deductions Breakdown & Client Bank Account */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deductions Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Statutory Fees &amp; Expenses Breakdown</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Gross Funds Received (KES) *</label>
                <input
                  type="number"
                  value={localData.grossSettlementAmount}
                  onChange={(e) => setLocalData({ ...localData, grossSettlementAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Professional Fees (KES)</label>
                <input
                  type="number"
                  value={localData.professionalFees}
                  onChange={(e) =>
                    setLocalData({ ...localData, professionalFees: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Disbursements Breakdown</span>
              {localData.outstandingDisbursements.map((d, i) => (
                <div key={d.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">{d.head}</span>
                    <span className="text-slate-500 text-[10px] block font-mono">Ref: {d.voucherRef}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-300">KES {d.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Settlement Statement Produced</span>
                <span className="text-[10px] text-slate-500">Itemized statement ready for client signature</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localData.settlementStatementProduced}
                  onChange={(e) => setLocalData({ ...localData, settlementStatementProduced: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300 font-semibold text-xs">Generated</span>
              </label>
            </div>
          </div>
        </div>

        {/* Client Bank Details & Disbursement Verification */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>Disbursement Execution &amp; Transfer Proof</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Trust Holding Account</label>
              <input
                type="text"
                value={localData.account || ''}
                onChange={(e) => setLocalData({ ...localData, account: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <select
                  value={localData.paymentMethod}
                  onChange={(e) => setLocalData({ ...localData, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Bank Wire">Bank Wire / RTGS</option>
                  <option value="M-Pesa B2C">M-Pesa B2C Payout</option>
                  <option value="Cheque">Bankers Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Disbursement Ref</label>
                <input
                  type="text"
                  value={localData.paymentReference || ''}
                  onChange={(e) => setLocalData({ ...localData, paymentReference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-emerald-400 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Approval / Payout Status</label>
                <select
                  value={localData.clientApprovalStatus}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      clientApprovalStatus: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold uppercase"
                >
                  <option value="pending">Pending Client Approval</option>
                  <option value="approved">Approved by Client</option>
                  <option value="disbursed">Disbursed &amp; Reconciled</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
            onClick={handleDisburseNow}
            disabled={!runtimeConfig.enableDemoMode}
                  className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition"
                >
                  Execute Disburse
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
