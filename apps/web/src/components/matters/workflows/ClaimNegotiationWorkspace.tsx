import React, { useState } from 'react';
import {
  ShieldAlert,
  Send,
  DollarSign,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Building,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ClaimNegotiationData, Matter, NegotiationLedgerItem } from '../../../types';

interface ClaimNegotiationWorkspaceProps {
  matter: Matter;
}

export const ClaimNegotiationWorkspace: React.FC<ClaimNegotiationWorkspaceProps> = ({ matter }) => {
  const { claimNegotiations, updateClaimNegotiation } = useApp();

  const data: ClaimNegotiationData = claimNegotiations[matter.id] || {
    insurer: {
      name: 'Directline Assurance Ltd',
      policyNumber: 'POL-2026-99218',
      claimReference: 'CLM/2026/00912',
      contactPerson: 'Sarah Chepkemoi',
      contactPhone: '+254 711 029384',
      contactEmail: 'schepkemoi@directline.co.ke',
      noticeSentDate: matter.openedAt.slice(0, 10),
      demandSentDate: matter.openedAt.slice(0, 10),
      responseDeadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'negotiating',
    },
    negotiationLedger: [
      {
        id: 'neg-1',
        date: matter.openedAt.slice(0, 10),
        party: 'firm',
        offerAmount: 1850000,
        status: 'sent',
        notes: 'Initial formal demand dispatched following full quantum compilation.',
      },
      {
        id: 'neg-2',
        date: new Date().toISOString().slice(0, 10),
        party: 'insurer',
        offerAmount: 1200000,
        status: 'considering',
        notes: 'Counter-offer received from insurer claims committee.',
      },
    ],
    settlementApproval: {
      recommendedAmount: 1400000,
      clientAuthorized: true,
      clientAuthorityDate: new Date().toISOString().slice(0, 10),
      partnerApproved: true,
      partnerApprovedByUserId: 'usr-partner',
      partnerApprovedDate: new Date().toISOString().slice(0, 10),
      dischargeVoucherSigned: false,
    },
  };

  const [localData, setLocalData] = useState<ClaimNegotiationData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New negotiation entry state
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryForm, setEntryForm] = useState<{
    party: 'insurer' | 'firm';
    offerAmount: number;
    notes: string;
  }>({
    party: 'insurer',
    offerAmount: 1350000,
    notes: '',
  });

  const handleSave = () => {
    updateClaimNegotiation(matter.id, localData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddEntry = () => {
    const newEntry: NegotiationLedgerItem = {
      id: `neg-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      party: entryForm.party,
      offerAmount: entryForm.offerAmount,
      status: entryForm.party === 'firm' ? 'sent' : 'considering',
      notes: entryForm.notes || 'Offer recorded in negotiation ledger',
    };
    const updatedEntries = [...localData.negotiationLedger, newEntry];

    setLocalData((prev) => ({
      ...prev,
      negotiationLedger: updatedEntries,
    }));

    setEntryForm({
      party: 'insurer',
      offerAmount: 1350000,
      notes: '',
    });
    setShowEntryForm(false);
  };

  const handleRemoveEntry = (id: string) => {
    setLocalData((prev) => ({
      ...prev,
      negotiationLedger: prev.negotiationLedger.filter((e) => e.id !== id),
    }));
  };

  const latestInsurerOffer =
    [...localData.negotiationLedger]
      .reverse()
      .find((e) => e.party === 'insurer' && e.offerAmount)?.offerAmount || 1200000;

  const firmDemand =
    localData.negotiationLedger.find((e) => e.party === 'firm' && e.offerAmount)?.offerAmount || 1850000;

  const recommendedSettlement = localData.settlementApproval.recommendedAmount || 1400000;
  const gapAmount = recommendedSettlement - latestInsurerOffer;

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-[10px]">
              Stage 6: Insurer Demand &amp; Negotiation Ledger
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Statutory Notice, Demand Tracker &amp; Pre-Litigation Negotiations
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Claim Record</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Original Demand</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            KES {firmDemand.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Notice dispatched</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Insurer Current Offer</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            KES {latestInsurerOffer.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Latest counter-offer</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Target Bottom Line</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            KES {recommendedSettlement.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Client authorized</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Negotiation Gap</span>
          <div className={`text-lg font-bold font-mono mt-1 ${gapAmount <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            KES {Math.max(0, gapAmount).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">{gapAmount <= 0 ? 'Target Reached' : 'Distance to close'}</span>
        </div>
      </div>

      {/* Grid: Insurer Details & Statutory Notice Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insurer Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>Insurance Company &amp; Assigned Adjuster</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Insurance Underwriter *</label>
              <input
                type="text"
                value={localData.insurer.name}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    insurer: { ...localData.insurer, name: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Insurer Claim No.</label>
              <input
                type="text"
                value={localData.insurer.claimReference || ''}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    insurer: { ...localData.insurer, claimReference: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Claims Handler / Adjuster</label>
              <input
                type="text"
                value={localData.insurer.contactPerson || ''}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    insurer: { ...localData.insurer, contactPerson: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Adjuster Direct Phone</label>
              <input
                type="text"
                value={localData.insurer.contactPhone || ''}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    insurer: { ...localData.insurer, contactPhone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Statutory Notice of Intention to Sue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Statutory Notice &amp; Demand Letter Compliance</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Notice of Intention Date</label>
                <input
                  type="date"
                  value={localData.insurer.noticeSentDate || ''}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      insurer: { ...localData.insurer, noticeSentDate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Demand Response Deadline</label>
                <input
                  type="date"
                  value={localData.insurer.responseDeadline || ''}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      insurer: { ...localData.insurer, responseDeadline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Negotiation Posture</span>
                <span className="text-[10px] text-slate-500">Current claim stage status</span>
              </div>
              <select
                value={localData.insurer.status}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    insurer: {
                      ...localData.insurer,
                      status: e.target.value as ClaimNegotiationData['insurer']['status'],
                    },
                  })
                }
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs"
              >
                <option value="notice_sent">Statutory Notice Sent</option>
                <option value="demand_sent">Demand Dispatched</option>
                <option value="negotiating">Active Negotiation</option>
                <option value="settlement_proposed">Settlement Proposed</option>
                <option value="settled">Settled</option>
                <option value="repudiated">Repudiated / Proceed to Court</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation History Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Negotiation Ledger &amp; Counter-Offers</span>
          </h3>

          <button
            onClick={() => setShowEntryForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Offer / Counter-Offer</span>
          </button>
        </div>

        {/* Modal: New Offer */}
        {showEntryForm && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
            <div className="font-bold text-slate-200 text-xs">Record Proposal</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Offering Party</label>
                <select
                  value={entryForm.party}
                  onChange={(e) => setEntryForm({ ...entryForm, party: e.target.value as 'insurer' | 'firm' })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="insurer">Insurance Underwriter</option>
                  <option value="firm">Plaintiff Advocate (Firm)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  value={entryForm.offerAmount}
                  onChange={(e) => setEntryForm({ ...entryForm, offerAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Notes / Conditions</label>
              <input
                type="text"
                placeholder="e.g. Subject to medical board review and inclusive of party & party costs"
                value={entryForm.notes}
                onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEntryForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEntry}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
              >
                Add to Ledger
              </button>
            </div>
          </div>
        )}

        {/* Ledger Entries */}
        <div className="space-y-2">
          {localData.negotiationLedger.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      item.party === 'firm'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {item.party === 'firm' ? 'Firm Demand' : 'Insurer Offer'}
                  </span>
                  <span className="text-slate-400 text-xs">{item.date}</span>
                </div>
                <div className="text-slate-300 text-xs">{item.notes}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-slate-100">
                    KES {(item.offerAmount || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{item.status}</span>
                </div>
                <button
                  onClick={() => handleRemoveEntry(item.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
