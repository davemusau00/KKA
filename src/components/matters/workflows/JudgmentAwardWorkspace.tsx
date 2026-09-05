import React, { useState } from 'react';
import {
  Gavel,
  Award,
  DollarSign,
  Scale,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Save,
  FileCheck,
  Download,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { JudgmentAwardData, Matter } from '../../../types';

interface JudgmentAwardWorkspaceProps {
  matter: Matter;
}

export const JudgmentAwardWorkspace: React.FC<JudgmentAwardWorkspaceProps> = ({ matter }) => {
  const { judgmentAwards, updateJudgmentAward } = useApp();

  const data: JudgmentAwardData = judgmentAwards[matter.id] || {
    matterId: matter.id,
    judgmentDate: new Date().toISOString().slice(0, 10),
    liabilityClaimantPercent: 20,
    liabilityDefendantPercent: 80,
    generalDamages: 1350000,
    specialDamages: 295000,
    futureMedical: 180000,
    costsAwarded: 185000,
    interestRatePercent: 14,
    interestFromDate: matter.openedAt.slice(0, 10),
    totalAward: 1556000,
    paymentDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    appealDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    appealRecommended: false,
    appealJustification: '',
    recoveryTriggered: true,
  };

  const [localData, setLocalData] = useState<JudgmentAwardData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Recalculate gross and net damages
  const gross =
    (Number(localData.generalDamages) || 0) +
    (Number(localData.specialDamages) || 0) +
    (Number(localData.futureMedical) || 0);

  const net = Math.round(gross * ((Number(localData.liabilityDefendantPercent) || 100) / 100));
  const totalPayableWithCosts = net + (Number(localData.costsAwarded) || 0);

  const handleSave = () => {
    const updated = {
      ...localData,
      totalAward: totalPayableWithCosts,
    };
    updateJudgmentAward(matter.id, updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
              Stage 13: Court Judgment, Award Assessment &amp; Decree
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Liability Apportionment, Damages Quantification &amp; Decree Extraction
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Award Recorded
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Judgment Assessment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Gross Damages Awarded</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            KES {gross.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">General + Special + Medical</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Liability Ratio</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {localData.liabilityDefendantPercent}% : {localData.liabilityClaimantPercent}%
          </div>
          <span className="text-[10px] text-slate-500">Defendant vs Plaintiff</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Net Principal Award</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            KES {net.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">After {localData.liabilityClaimantPercent}% contribution</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Total Decree Value</span>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
            KES {totalPayableWithCosts.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Net Award + Taxed Costs</span>
        </div>
      </div>

      {/* Section 1: Liability & Heads of Award */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liability Apportionment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Court Finding on Liability</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Defendant Liability (%) *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={localData.liabilityDefendantPercent}
                  onChange={(e) => {
                    const def = Number(e.target.value);
                    setLocalData({
                      ...localData,
                      liabilityDefendantPercent: def,
                      liabilityClaimantPercent: 100 - def,
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
                  value={localData.liabilityClaimantPercent}
                  onChange={(e) => {
                    const pl = Number(e.target.value);
                    setLocalData({
                      ...localData,
                      liabilityClaimantPercent: pl,
                      liabilityDefendantPercent: 100 - pl,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Judgment Date</label>
                <input
                  type="date"
                  value={localData.judgmentDate}
                  onChange={(e) => setLocalData({ ...localData, judgmentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  value={localData.interestRatePercent}
                  onChange={(e) =>
                    setLocalData({ ...localData, interestRatePercent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Heads of Damages Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Awarded Heads of Damages (KES)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">General Damages (Pain &amp; Suffering)</label>
              <input
                type="number"
                value={localData.generalDamages}
                onChange={(e) =>
                  setLocalData({ ...localData, generalDamages: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Special Damages (Proved)</label>
              <input
                type="number"
                value={localData.specialDamages}
                onChange={(e) =>
                  setLocalData({ ...localData, specialDamages: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Future Medical Expenses</label>
              <input
                type="number"
                value={localData.futureMedical}
                onChange={(e) =>
                  setLocalData({ ...localData, futureMedical: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Party &amp; Party Costs Awarded</label>
              <input
                type="number"
                value={localData.costsAwarded}
                onChange={(e) =>
                  setLocalData({ ...localData, costsAwarded: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
