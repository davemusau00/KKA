import React, { useState } from 'react';
import {
  Scale,
  DollarSign,
  Calculator,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { LiabilityQuantumData, Matter, SpecialDamageItem } from '../../../types';

interface LiabilityQuantumWorkspaceProps {
  matter: Matter;
}

export const LiabilityQuantumWorkspace: React.FC<LiabilityQuantumWorkspaceProps> = ({ matter }) => {
  const { liabilityQuantums, updateLiabilityQuantum } = useApp();

  const data: LiabilityQuantumData = liabilityQuantums[matter.id] || {
    liability: {
      claimantPercent: 0,
      defendantPercent: 100,
      contributoryNegligenceAlleged: false,
      contributoryNotes: 'Client was passenger seated inside vehicle; zero negligence imputable.',
      supportingEvidence: ['Certified Police Abstract placing blame on 3rd party', 'Witness statement from passenger'],
      weaknesses: ['Speed calculation not formally certified by mechanical inspector'],
      advocateOpinion: 'Clear 100% liability against defendant insured under doctrine of res ipsa loquitur.',
    },
    damages: {
      generalDamages: 1200000,
      generalDamagesJustification: 'Compound fracture of right tibia/fibula with surgical fixation (HCCC 192/2021).',
      specialDamages: [
        { id: 'sp-1', head: 'Emergency Admission & Surgery (Avenue Hospital)', amount: 285400, receiptRef: 'REC-AVE-8819', isEvidenced: true },
        { id: 'sp-2', head: 'Police Abstract Fee & Search', amount: 3500, receiptRef: 'REV-NPS-019', isEvidenced: true },
        { id: 'sp-3', head: 'Orthopaedic Medicolegal Report (Dr. Patel)', amount: 25000, receiptRef: 'DRP-INV-2026', isEvidenced: true },
      ],
      futureMedicalExpenses: 180000,
      futureMedicalJustification: 'Hardware removal and arthroscopic debridement estimated at 12 months post-op.',
      lossOfEarnings: 150000,
      lossOfEarningsMonths: 3,
      monthlyEarningsBasis: 50000,
      lossOfEarningCapacity: 0,
      otherHeads: [],
      totalEstimatedClaimValue: 1843900,
    },
  };

  const [localData, setLocalData] = useState<LiabilityQuantumData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New special damage row
  const [showSpecialForm, setShowSpecialForm] = useState(false);
  const [specialItem, setSpecialItem] = useState({
    head: '',
    amount: 5000,
    receiptRef: '',
    isEvidenced: true,
  });

  // Calculate totals dynamically
  const totalSpecials = localData.damages.specialDamages.reduce(
    (acc, item) => acc + (Number(item.amount) || 0),
    0
  );
  const grossQuantum =
    (Number(localData.damages.generalDamages) || 0) +
    totalSpecials +
    (Number(localData.damages.futureMedicalExpenses) || 0) +
    (Number(localData.damages.lossOfEarnings) || 0);

  const netQuantum = Math.round(
    grossQuantum * ((Number(localData.liability.defendantPercent) || 100) / 100)
  );

  const handleSave = () => {
    const updated: LiabilityQuantumData = {
      ...localData,
      damages: {
        ...localData.damages,
        totalEstimatedClaimValue: netQuantum,
      },
    };
    updateLiabilityQuantum(matter.id, updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddSpecial = () => {
    if (!specialItem.head.trim()) return;
    const newItem: SpecialDamageItem = {
      id: `sp-${Date.now()}`,
      head: specialItem.head,
      amount: Number(specialItem.amount) || 0,
      receiptRef: specialItem.receiptRef || 'On File',
      isEvidenced: specialItem.isEvidenced,
    };
    setLocalData((prev) => ({
      ...prev,
      damages: {
        ...prev.damages,
        specialDamages: [...prev.damages.specialDamages, newItem],
      },
    }));
    setSpecialItem({
      head: '',
      amount: 5000,
      receiptRef: '',
      isEvidenced: true,
    });
    setShowSpecialForm(false);
  };

  const handleRemoveSpecial = (id: string) => {
    setLocalData((prev) => ({
      ...prev,
      damages: {
        ...prev.damages,
        specialDamages: prev.damages.specialDamages.filter((item) => item.id !== id),
      },
    }));
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
              Stage 5: Liability Apportionment &amp; Quantum Assessment
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Liability Evaluation, Judicial Precedent &amp; Damages Calculation
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Quantum Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Quantum Assessment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">General Damages</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            KES {(localData.damages.generalDamages || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Pain, suffering &amp; loss of amenities</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Special Damages (Proved)</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            KES {totalSpecials.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">{localData.damages.specialDamages.length} receipts logged</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Gross Claim Valuation</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            KES {grossQuantum.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">100% liability value</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Net Realizable Claim</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            KES {netQuantum.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">At {localData.liability.defendantPercent}% defendant liability</span>
        </div>
      </div>

      {/* Grid: Liability Apportionment & General Damages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liability Apportionment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Liability Apportionment &amp; Contributory Negligence</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Defendant Liability (%) *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={localData.liability.defendantPercent}
                  onChange={(e) => {
                    const def = Number(e.target.value);
                    setLocalData({
                      ...localData,
                      liability: {
                        ...localData.liability,
                        defendantPercent: def,
                        claimantPercent: 100 - def,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Plaintiff Contributory (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={localData.liability.claimantPercent}
                  onChange={(e) => {
                    const pl = Number(e.target.value);
                    setLocalData({
                      ...localData,
                      liability: {
                        ...localData.liability,
                        claimantPercent: pl,
                        defendantPercent: 100 - pl,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Advocate Legal Opinion on Liability</label>
              <textarea
                rows={3}
                value={localData.liability.advocateOpinion}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    liability: { ...localData.liability, advocateOpinion: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>

        {/* General Damages & Future Heads */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. General Damages &amp; Future Medical Estimates</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">General Damages Estimate (KES)</label>
                <input
                  type="number"
                  value={localData.damages.generalDamages}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      damages: {
                        ...localData.damages,
                        generalDamages: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Future Medical Expenses (KES)</label>
                <input
                  type="number"
                  value={localData.damages.futureMedicalExpenses}
                  onChange={(e) =>
                    setLocalData({
                      ...localData,
                      damages: {
                        ...localData.damages,
                        futureMedicalExpenses: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Case Precedents &amp; Quantum Authorities</label>
              <textarea
                rows={3}
                value={localData.damages.generalDamagesJustification || ''}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    damages: {
                      ...localData.damages,
                      generalDamagesJustification: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Special Damages Itemized Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Itemized Special Damages (Specifically Pleaded &amp; Proved)</span>
          </h3>

          <button
            onClick={() => setShowSpecialForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Special Damage Receipt</span>
          </button>
        </div>

        {/* Modal: New Special Damage */}
        {showSpecialForm && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
            <div className="font-bold text-slate-200 text-xs">Add Itemized Receipt</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Expense Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Physiotherapy Sessions (10 sessions)"
                  value={specialItem.head}
                  onChange={(e) => setSpecialItem({ ...specialItem, head: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  value={specialItem.amount}
                  onChange={(e) => setSpecialItem({ ...specialItem, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSpecialForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSpecial}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg"
              >
                Add Item
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {localData.damages.specialDamages.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <span className="font-medium text-slate-200 text-xs">{item.head}</span>
                <span className="text-[10px] font-mono text-slate-500 block">Receipt: {item.receiptRef}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-100 text-xs">
                  KES {(item.amount || 0).toLocaleString()}
                </span>
                <button
                  onClick={() => handleRemoveSpecial(item.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
