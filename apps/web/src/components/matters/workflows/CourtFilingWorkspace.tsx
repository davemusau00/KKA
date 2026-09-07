import React, { useState } from 'react';
import {
  Building2,
  FileCheck,
  CreditCard,
  Hash,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Save,
  Send,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { runtimeConfig } from '../../../config/runtime';
import { useApp } from '../../../context/AppContext';
import { CourtFilingPackage, Matter } from '../../../types';

interface CourtFilingWorkspaceProps {
  matter: Matter;
}

export const CourtFilingWorkspace: React.FC<CourtFilingWorkspaceProps> = ({ matter }) => {
  const { courtFilingPackages, createCourtFilingPackage, updateCourtFilingPackage, users } = useApp();

  const existingFiling = courtFilingPackages.find((f) => f.matterId === matter.id);

  const [localFiling, setLocalFiling] = useState<CourtFilingPackage>(
    existingFiling || {
      id: `cfp-${matter.id}`,
      matterId: matter.id,
      matterRef: matter.internalReference,
      courtStation: '',
      division: '',
      caseType: '',
      plaintiff: '',
      defendants: [],
      documents: [],
      courtAssessmentKes: 0,
      feeRequisitionApproved: false,
      receiptUploaded: false,
      stampedDocsUploaded: false,
      assignedClerkId: '',
      status: 'ready_to_file',
    }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (!runtimeConfig.enableDemoMode) return;
    if (existingFiling) {
      updateCourtFilingPackage(localFiling.id, localFiling);
    } else {
      createCourtFilingPackage(localFiling);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };


  return (
    <div className="space-y-6 text-xs">
      {!runtimeConfig.enableDemoMode && <p role="status">Filing record changes are unavailable until this workspace is connected to the server. No court submission is made here.</p>}
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-400 font-bold uppercase text-[10px]">
              Stage 8: Court Filing &amp; Case Number Generation
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Judiciary Case Tracking System (CTS) e-Filing &amp; Assessment
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Demo filing updated
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!runtimeConfig.enableDemoMode}
            title="This filing editor is awaiting server-backed persistence."
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Filing Record</span>
          </button>
        </div>
      </div>

      {/* Case Number & CTS Identification Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Official Court Case Number</span>
          <div className="text-lg font-bold font-mono text-amber-400">
            {localFiling.courtCaseNumber || 'Pending E-Filing'}
          </div>
          <span className="text-[10px] text-slate-500">Judiciary Registry assigned number</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">CTS Tracking Ref</span>
          <div className="text-lg font-bold font-mono text-slate-100">
            {localFiling.ctsReference || 'Not Generated'}
          </div>
          <span className="text-[10px] text-slate-500">Judiciary portal e-filing reference</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Filing Package Status</span>
          <div className="text-lg font-bold font-mono text-emerald-400 uppercase">
            {existingFiling ? localFiling.status.replace(/_/g, ' ') : 'Not recorded'}
          </div>
          <span className="text-[10px] text-slate-500">Assigned Clerk: {localFiling.assignedClerkId}</span>
        </div>
      </div>

      {/* Grid 1: Court Station & Fee Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Station Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Judicial Court Station &amp; Division</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Court Station *</label>
              <select
                value={localFiling.courtStation}
                onChange={(e) => setLocalFiling({ ...localFiling, courtStation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="Milimani Chief Magistrate's Commercial Court">Milimani Chief Magistrate's Court (Nairobi)</option>
                <option value="Milimani High Court Civil Division">Milimani High Court Civil Division (Nairobi)</option>
                <option value="Mombasa High Court Civil Division">Mombasa High Court Civil Division</option>
                <option value="Nakuru Chief Magistrate's Court">Nakuru Chief Magistrate's Court</option>
                <option value="Kisumu High Court">Kisumu High Court</option>
                <option value="Thika Chief Magistrate's Court">Thika Chief Magistrate's Court</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Court Division</label>
                <input
                  type="text"
                  value={localFiling.division}
                  onChange={(e) => setLocalFiling({ ...localFiling, division: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Assigned Court Clerk</label>
                <select
                  value={localFiling.assignedClerkId}
                  onChange={(e) => setLocalFiling({ ...localFiling, assignedClerkId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.roles[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Court Assessment & Revenue Receipt */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Court Assessment Fee &amp; Judiciary Revenue Receipt</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Assessment Amount (KES)</label>
                <input
                  type="number"
                  value={localFiling.courtAssessmentKes}
                  onChange={(e) =>
                    setLocalFiling({ ...localFiling, courtAssessmentKes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Revenue Receipt Number</label>
                <input
                  type="text"
                  value={localFiling.receiptNumber || ''}
                  onChange={(e) => setLocalFiling({ ...localFiling, receiptNumber: e.target.value })}
                  placeholder="e.g. CTS-REV-2026-88194"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Payment Reference</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {localFiling.receiptNumber || 'Payment pending'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] uppercase font-bold">
                {localFiling.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar: CTS Execution */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-slate-300 font-bold block">Execute Judiciary Portal E-Filing</span>
          <span className="text-slate-500 text-[11px]">
            Electronic submission is unavailable. File through the authorized registry process and retain its receipt and documents.
          </span>
        </div>

        <button
          disabled title="Judiciary provider is unavailable; no submission will be sent."
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow flex items-center gap-2 transition"
        >
          <Send className="w-4 h-4" />
          <span>Electronic filing unavailable</span>
        </button>
      </div>
    </div>
  );
};
