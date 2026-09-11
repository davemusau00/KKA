import React, { useEffect, useState } from 'react';
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
import { runtimeConfig } from '../../../config/runtime';
import { apiClient } from '../../../lib/api/client';
import { JudgmentAwardData, Matter } from '../../../types';

interface JudgmentAwardWorkspaceProps {
  matter: Matter;
}

export const JudgmentAwardWorkspace: React.FC<JudgmentAwardWorkspaceProps> = ({ matter }) => {
  const { judgmentAwards, updateJudgmentAward } = useApp();

  const data: JudgmentAwardData = judgmentAwards[matter.id] || {
    matterId: matter.id,
    judgmentDate: '', liabilityClaimantPercent: 0, liabilityDefendantPercent: 0,
    generalDamages: 0, specialDamages: 0, futureMedical: 0, costsAwarded: 0,
    interestRatePercent: 0, interestFromDate: '', totalAward: 0, paymentDeadline: '', appealDeadline: '',
    appealRecommended: false,
    appealJustification: '',
    recoveryTriggered: false,
  };

  const [localData, setLocalData] = useState<JudgmentAwardData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(!runtimeConfig.enableDemoMode);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (runtimeConfig.enableDemoMode) return;
    let active = true;
    setLoading(true);
    apiClient.get<any>(`/personal-injury/${matter.id}`)
      .then((profile) => {
        if (!active) return;
        const judgment = profile?.judgment;
        if (!judgment) {
          setLoadError('No judgment record exists for this matter.');
          return;
        }
        const value = (key: string, fallback = 0) => Number(judgment[key] ?? fallback);
        const persisted: JudgmentAwardData = {
          matterId: matter.id,
          judgmentDate: judgment.judgmentDate ? String(judgment.judgmentDate).slice(0, 10) : '',
          liabilityClaimantPercent: value('liabilityClaimantPercent', 100 - value('liabilityPercent')),
          liabilityDefendantPercent: value('liabilityDefendantPercent', value('liabilityPercent')),
          generalDamages: value('generalDamages'), specialDamages: value('specialDamages'),
          futureMedical: value('futureMedical'), costsAwarded: value('costsAwarded'),
          interestRatePercent: value('interestRatePercent'),
          interestFromDate: judgment.interestFromDate ? String(judgment.interestFromDate).slice(0, 10) : '',
          totalAward: value('totalAward'),
          paymentDeadline: judgment.paymentDeadline ? String(judgment.paymentDeadline).slice(0, 10) : '',
          appealDeadline: judgment.appealDeadline ? String(judgment.appealDeadline).slice(0, 10) : '',
          appealRecommended: Boolean(judgment.appealRecommended),
          appealJustification: judgment.appealJustification || '',
          recoveryTriggered: Boolean(judgment.recoveryTriggered),
        };
        setLocalData(persisted);
        setLoadError('');
      })
      .catch((error) => active && setLoadError(error?.message || 'Unable to load the server judgment record.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [matter.id]);

  // Recalculate gross and net damages
  const gross =
    (Number(localData.generalDamages) || 0) +
    (Number(localData.specialDamages) || 0) +
    (Number(localData.futureMedical) || 0);

  const net = Math.round(gross * (Number(localData.liabilityDefendantPercent) / 100));
  const totalPayableWithCosts = net + (Number(localData.costsAwarded) || 0);

  const handleSave = async () => {
    const updated = {
      ...localData,
      totalAward: totalPayableWithCosts,
    };
    try {
      if (runtimeConfig.enableDemoMode) {
        updateJudgmentAward(matter.id, updated);
      } else {
        const persisted = await apiClient.put<any>(`/personal-injury/${matter.id}/judgment`, {
          judgmentDate: updated.judgmentDate || undefined,
          liabilityClaimantPercent: updated.liabilityClaimantPercent,
          liabilityDefendantPercent: updated.liabilityDefendantPercent,
          generalDamages: updated.generalDamages,
          specialDamages: updated.specialDamages,
          futureMedical: updated.futureMedical,
          costsAwarded: updated.costsAwarded,
          interestRatePercent: updated.interestRatePercent,
          interestFromDate: updated.interestFromDate || undefined,
          totalAward: updated.totalAward,
          paymentDeadline: updated.paymentDeadline || undefined,
          appealDeadline: updated.appealDeadline || undefined,
          appealRecommended: updated.appealRecommended,
          appealJustification: updated.appealJustification,
          recoveryTriggered: updated.recoveryTriggered,
        });
        setLocalData({ ...updated, totalAward: Number(persisted.totalAward ?? updated.totalAward) });
        setLoadError('');
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error: any) {
      setLoadError(error?.message || 'Judgment record was not saved.');
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {!runtimeConfig.enableDemoMode && <p role="status" className="border border-amber-800 bg-amber-950/30 text-amber-200 rounded-lg p-3">This workspace reads and writes the server judgment record. An empty matter has no legal finding or award until an authorized user saves one.</p>}
      {loading && <p role="status" className="text-slate-400">Loading server judgment record…</p>}
      {loadError && <p role="alert" className="border border-rose-800 bg-rose-950/30 text-rose-200 rounded-lg p-3">{loadError}</p>}
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
            disabled={loading}
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
