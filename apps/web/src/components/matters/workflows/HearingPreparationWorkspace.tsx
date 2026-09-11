import React, { useState } from 'react';
import {
  Gavel,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  Save,
  Calendar,
  Layers,
  FileText,
  Building,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { runtimeConfig } from '../../../config/runtime';
import { HearingBriefData, Matter } from '../../../types';

interface HearingPreparationWorkspaceProps {
  matter: Matter;
}

export const HearingPreparationWorkspace: React.FC<HearingPreparationWorkspaceProps> = ({ matter }) => {
  const { hearingBriefs, updateHearingBrief } = useApp();

  const data: HearingBriefData = hearingBriefs[matter.id] || {
    matterId: matter.id,
    courtName: "Milimani Law Courts, Commercial Court 4",
    hearingDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    assignedAdvocateId: 'usr-partner',
    witnesses: [
      { name: 'John Mwangi Kimani', role: 'Plaintiff (Direct examination)', status: 'confirmed' },
      { name: 'Cpl. Peter Njoroge', role: 'Investigating Officer (Police Abstract)', status: 'confirmed' },
      { name: 'Dr. Ramesh Patel', role: 'Orthopaedic Surgeon (Medicolegal Report)', status: 'subpoenaed' },
    ],
    documents: [
      { name: 'Pleadings & Verifying Affidavit', isReady: true },
      { name: 'Police Abstract & Sketch Map', isReady: true },
      { name: 'Medical Reports & P3 Form', isReady: true },
    ],
    issues: {
      liability: 'Whether defendant driver operated motor vehicle recklessly and failed to brake.',
      quantum: 'General damages for compound tibia fracture and medical costs of KES 250,000.',
    },
    opposingCounsel: 'Kamau & Partners Advocates (Nairobi)',
    currentSettlementOffer: 'KES 800,000 without prejudice',
    advocateNotes: 'Cross-examine defendant driver on speed, braking distance, and lack of valid inspection.',
    isReadyForHearing: true,
  };

  const safeData: HearingBriefData = runtimeConfig.enableDemoMode ? data : {
    matterId: matter.id, courtName: '', hearingDate: '', assignedAdvocateId: '', witnesses: [], documents: [],
    issues: { liability: '', quantum: '' }, opposingCounsel: '', currentSettlementOffer: '', advocateNotes: '', isReadyForHearing: false,
  };
  const [localData, setLocalData] = useState<HearingBriefData>(safeData);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (!runtimeConfig.enableDemoMode) return;
    updateHearingBrief(matter.id, localData);
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
              Stage 11: Hearing Preparation &amp; Trial Brief
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Trial Hearing Brief, Witness Examination &amp; Issues
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Trial Brief Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!runtimeConfig.enableDemoMode}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Trial Brief</span>
          </button>
        </div>
      </div>

      {/* Hearing Schedule & Courtroom */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Trial Hearing Date</span>
          <div className="text-base font-bold font-mono text-amber-400">
            {localData.hearingDate}
          </div>
          <span className="text-[10px] text-slate-500">Live Courtroom Session</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Court Station</span>
          <div className="text-base font-bold text-slate-100 line-clamp-1">
            {localData.courtName}
          </div>
          <span className="text-[10px] text-slate-500">Opposing: {localData.opposingCounsel}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Trial Readiness Status</span>
          <div className="text-base font-bold font-mono text-emerald-400 uppercase">
            {localData.isReadyForHearing ? 'READY FOR TRIAL' : 'PREPARATION IN PROGRESS'}
          </div>
          <span className="text-[10px] text-slate-500">Witnesses prepped &amp; bundle verified</span>
        </div>
      </div>

      {/* Grid: Witness Order & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Witness Calling Order */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Witness Examination Sequence ({localData.witnesses?.length || 0})</span>
          </h3>

          <div className="space-y-2">
            {localData.witnesses?.map((w, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-2.5 text-slate-200"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-100">{w.name}</div>
                    <div className="text-slate-400 text-[11px]">{w.role}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Issues & Cross-Examination Strategy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Agreed Issues &amp; Trial Notes</span>
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-slate-400 block mb-1">Issue 1 (Liability):</span>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-300 text-xs">
                {localData.issues?.liability}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Issue 2 (Quantum):</span>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-300 text-xs">
                {localData.issues?.quantum}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Advocate Trial &amp; Cross-Examination Notes</label>
              <textarea
                rows={3}
                value={localData.advocateNotes || ''}
                onChange={(e) => setLocalData({ ...localData, advocateNotes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
