import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  BookOpen,
  Calendar,
  Layers,
  Scale,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { PreTrialComplianceData, Matter } from '../../../types';

interface PreTrialComplianceWorkspaceProps {
  matter: Matter;
}

export const PreTrialComplianceWorkspace: React.FC<PreTrialComplianceWorkspaceProps> = ({ matter }) => {
  const { preTrialCompliances, updatePreTrialCompliance } = useApp();

  const data: PreTrialComplianceData = preTrialCompliances[matter.id] || {
    matterId: matter.id,
    listOfWitnesses: true,
    witnessStatements: true,
    listOfDocuments: true,
    documentBundle: true,
    agreedIssues: true,
    preTrialQuestionnaire: true,
    expertDocuments: true,
    courtDirections: 'Defendants admit occurrence of accident but dispute quantum of damages. Trial set for 1 full day with all witness statements adopted.',
    complianceDeadline: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    isCompliant: true,
  };

  const [localData, setLocalData] = useState<PreTrialComplianceData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    updatePreTrialCompliance(matter.id, localData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const checklistItems = [
    { key: 'listOfWitnesses', label: 'List of Witnesses Exchanged & Filed' },
    { key: 'witnessStatements', label: 'Signed Witness Statements Exchanged' },
    { key: 'listOfDocuments', label: 'List of Documents Exchanged' },
    { key: 'documentBundle', label: 'Trial Document Bundle Paginated & Indexed' },
    { key: 'agreedIssues', label: 'Agreed Issues for Determination Drafted' },
    { key: 'preTrialQuestionnaire', label: 'Pre-Trial Questionnaire (Order 11 CPR) Completed' },
    { key: 'expertDocuments', label: 'Medical & Expert Reports Disclosed to Defense' },
  ];

  const complianceCount = checklistItems.filter(
    (item) => localData[item.key as keyof PreTrialComplianceData] === true
  ).length;

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-purple-400 font-bold uppercase text-[10px]">
              Stage 10: Pre-Trial Directions &amp; Order 11 Compliance
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Pre-Trial Questionnaire, Agreed Issues &amp; Compliance Certificate
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pre-Trial File Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Compliance Record</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Compliance Score</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {complianceCount} / {checklistItems.length} Checklist Items
          </div>
          <span className="text-[10px] text-slate-500">Order 11 CPR readiness</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Compliance Deadline</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            {localData.complianceDeadline}
          </div>
          <span className="text-[10px] text-slate-500">Court directions deadline</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Hearing Certification</span>
          <div
            className={`text-lg font-bold font-mono mt-1 ${
              localData.isCompliant ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {localData.isCompliant ? 'Certified Ready for Trial' : 'Compliance Pending'}
          </div>
          <span className="text-[10px] text-slate-500">
            {localData.isCompliant ? 'Pre-trial certificate sealed' : 'Exchange in progress'}
          </span>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Pre-Trial Conference Checklist &amp; Document Exchange</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklistItems.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition"
            >
              <input
                type="checkbox"
                checked={Boolean(localData[item.key as keyof PreTrialComplianceData])}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    [item.key]: e.target.checked,
                  })
                }
                className="rounded bg-slate-900 border-slate-700 text-purple-500"
              />
              <span className="font-medium text-slate-200 text-xs">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Directions Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>Court Directions &amp; Pre-Trial Orders</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-slate-400 mb-1">Pre-Trial Directions &amp; Minute of Conference</label>
            <textarea
              rows={3}
              value={localData.courtDirections}
              onChange={(e) => setLocalData({ ...localData, courtDirections: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={localData.isCompliant}
                onChange={(e) => setLocalData({ ...localData, isCompliant: e.target.checked })}
                className="rounded bg-slate-950 border-slate-700 text-emerald-500"
              />
              <span className="font-semibold text-slate-200">
                Mark as Fully Compliant and Ready for Stage 11 (Hearing Brief)
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
