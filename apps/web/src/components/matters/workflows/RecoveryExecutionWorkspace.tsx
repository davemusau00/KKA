import React, { useState } from 'react';
import {
  ShieldAlert,
  Gavel,
  Landmark,
  Building,
  CheckCircle2,
  AlertTriangle,
  Save,
  Clock,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { RecoveryExecutionData, Matter } from '../../../types';

interface RecoveryExecutionWorkspaceProps {
  matter: Matter;
}

export const RecoveryExecutionWorkspace: React.FC<RecoveryExecutionWorkspaceProps> = ({ matter }) => {
  const { recoveryExecutions, updateRecoveryExecution } = useApp();

  const data: RecoveryExecutionData = recoveryExecutions[matter.id] || {
    matterId: matter.id,
    decreeExtracted: true,
    certificateOfCosts: true,
    billOfCosts: true,
    billAmount: 185000,
    taxationComplete: true,
    taxedAmount: 165000,
    insurerDemandSent: true,
    demandSentDate: matter.openedAt.slice(0, 10),
    paymentPromiseReceived: true,
    paymentPromiseNotes: 'Insurer claims committee approved full payment via direct RTGS transfer.',
    executionWarrantsIssued: false,
    garnisheeProceedings: false,
    auctioneerInstructed: false,
    auctioneerName: 'Keysian Auctioneers (Licensed Class B)',
    paymentReceived: true,
    paymentReceivedAmount: 1741000,
    status: 'fully_recovered',
  };

  const [localData, setLocalData] = useState<RecoveryExecutionData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    updateRecoveryExecution(matter.id, localData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-[10px]">
              Stage 14: Decreetal Recovery &amp; Execution
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Taxation of Costs, Section 10 Demand &amp; Enforcement
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recovery Synced
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Recovery File</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Decree &amp; Bill</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            KES {localData.taxedAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Taxed party-and-party costs</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Recovered Amount</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            KES {localData.paymentReceivedAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Client trust account</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Payment Status</span>
          <div className={`text-lg font-bold font-mono mt-1 ${localData.paymentReceived ? 'text-emerald-400' : 'text-amber-400'}`}>
            {localData.paymentReceived ? 'Funds Received' : 'Awaiting Payment'}
          </div>
          <span className="text-[10px] text-slate-500">
            {localData.paymentPromiseReceived ? 'Settlement promised' : 'Enforcement active'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Recovery Stage</span>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-1 capitalize">
            {localData.status.replace('_', ' ')}
          </div>
          <span className="text-[10px] text-slate-500">Enforcement workflow state</span>
        </div>
      </div>

      {/* Grid: Taxation & Insurer Statutory Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxation of Costs & Decree Extraction */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Decree Extraction &amp; Party-and-Party Bill of Costs</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={localData.decreeExtracted}
                  onChange={(e) =>
                    setLocalData({ ...localData, decreeExtracted: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <span>Certified Decree Extracted</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={localData.certificateOfCosts}
                  onChange={(e) =>
                    setLocalData({ ...localData, certificateOfCosts: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <span>Certificate of Costs Issued</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Bill of Costs Filed (KES)</label>
                <input
                  type="number"
                  value={localData.billAmount}
                  onChange={(e) =>
                    setLocalData({ ...localData, billAmount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Taxed Costs Amount (KES)</label>
                <input
                  type="number"
                  value={localData.taxedAmount}
                  onChange={(e) =>
                    setLocalData({ ...localData, taxedAmount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold text-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statutory Demand & Payment Tracking */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Insurer Demand &amp; Settlement Tracking</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Demand Sent Date</label>
                <input
                  type="date"
                  value={localData.demandSentDate || ''}
                  onChange={(e) =>
                    setLocalData({ ...localData, demandSentDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Recovery Status</label>
                <select
                  value={localData.status}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      status: e.target.value as RecoveryExecutionData['status'],
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold"
                >
                  <option value="pending_decree">Pending Decree</option>
                  <option value="bill_of_costs">Bill of Costs</option>
                  <option value="insurer_demand">Insurer Demand</option>
                  <option value="execution_active">Execution Active</option>
                  <option value="garnishee">Garnishee</option>
                  <option value="fully_recovered">Fully Recovered</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Payment Promise / Undertaking Notes</label>
              <textarea
                rows={2}
                value={localData.paymentPromiseNotes || ''}
                onChange={(e) =>
                  setLocalData({ ...localData, paymentPromiseNotes: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
