import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Layers,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Download,
  Eye,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { PleadingsBundleData, Matter } from '../../../types';

interface PleadingsBundleWorkspaceProps {
  matter: Matter;
}

export const PleadingsBundleWorkspace: React.FC<PleadingsBundleWorkspaceProps> = ({ matter }) => {
  const { pleadingsBundles, updatePleadingsBundle } = useApp();

  const data: PleadingsBundleData = pleadingsBundles[matter.id] || {
    id: `plb-${matter.id}`,
    matterId: matter.id,
    plaintStatus: 'under_review',
    verifyingAffidavitStatus: 'draft',
    witnessStatements: [
      { id: 'ws-1', witnessName: 'John Mwangi Kimani (Plaintiff)', status: 'draft' },
      { id: 'ws-2', witnessName: 'Boniface Kiprotich (Eyewitness)', status: 'reviewed' },
    ],
    listOfWitnesses: true,
    listOfDocuments: true,
    supportingDocumentsAttached: true,
    bundleReviewStatus: 'draft',
    readyForFilingPackage: false,
  };

  const [localData, setLocalData] = useState<PleadingsBundleData>(data);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New witness statement form
  const [showWitnessForm, setShowWitnessForm] = useState(false);
  const [newWitnessName, setNewWitnessName] = useState('');

  const handleSave = () => {
    updatePleadingsBundle(matter.id, localData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddWitness = () => {
    if (!newWitnessName.trim()) return;
    const newWs = {
      id: `ws-${Date.now()}`,
      witnessName: newWitnessName.trim(),
      status: 'draft' as const,
    };
    setLocalData((prev) => ({
      ...prev,
      witnessStatements: [...prev.witnessStatements, newWs],
    }));
    setNewWitnessName('');
    setShowWitnessForm(false);
  };

  const handleRemoveWitness = (id: string) => {
    setLocalData((prev) => ({
      ...prev,
      witnessStatements: prev.witnessStatements.filter((ws) => ws.id !== id),
    }));
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
              Stage 7: Pleadings Drafting, Verification &amp; Bundle
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Civil Plaint, Affidavits, Witness Statements &amp; Documentary Bundle
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Bundle Synced
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Pleadings Bundle</span>
          </button>
        </div>
      </div>

      {/* Grid: Primary Pleadings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plaint & Verifying Affidavit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Core Civil Plaint &amp; Verifying Affidavit</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block text-xs">Civil Plaint</span>
                <span className="text-[10px] text-slate-500">Order 4 Rule 1 CPR 2010</span>
              </div>
              <select
                value={localData.plaintStatus}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    plaintStatus: e.target.value as PleadingsBundleData['plaintStatus'],
                  })
                }
                className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs"
              >
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="signed">Signed by Advocate</option>
              </select>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block text-xs">Verifying Affidavit</span>
                <span className="text-[10px] text-slate-500">Sworn by Plaintiff before Commissioner</span>
              </div>
              <select
                value={localData.verifyingAffidavitStatus}
                onChange={(e) =>
                  setLocalData({
                    ...localData,
                    verifyingAffidavitStatus: e.target.value as PleadingsBundleData['verifyingAffidavitStatus'],
                  })
                }
                className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs"
              >
                <option value="draft">Draft</option>
                <option value="sworn">Sworn</option>
                <option value="signed">Signed &amp; Stamped</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bundle Inclusions & Checklists */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Statutory Inclusions &amp; Exhibits</span>
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={localData.listOfWitnesses}
                onChange={(e) =>
                  setLocalData({ ...localData, listOfWitnesses: e.target.checked })
                }
                className="rounded bg-slate-900 border-slate-700 text-emerald-500"
              />
              <span className="font-medium text-slate-200 text-xs">List of Witnesses (CPR Order 3 Rule 2)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={localData.listOfDocuments}
                onChange={(e) =>
                  setLocalData({ ...localData, listOfDocuments: e.target.checked })
                }
                className="rounded bg-slate-900 border-slate-700 text-emerald-500"
              />
              <span className="font-medium text-slate-200 text-xs">List of Documents (Itemized Schedule)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={localData.supportingDocumentsAttached}
                onChange={(e) =>
                  setLocalData({ ...localData, supportingDocumentsAttached: e.target.checked })
                }
                className="rounded bg-slate-900 border-slate-700 text-emerald-500"
              />
              <span className="font-medium text-slate-200 text-xs">Documentary Exhibits Attached &amp; Paginated</span>
            </label>
          </div>
        </div>
      </div>

      {/* Witness Statements */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Signed Witness Statements</span>
          </h3>

          <button
            onClick={() => setShowWitnessForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Witness Statement</span>
          </button>
        </div>

        {/* Modal: New Statement */}
        {showWitnessForm && (
          <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
            <div className="font-bold text-slate-200 text-xs">Add Witness Statement</div>
            <div>
              <label className="block text-slate-400 mb-1">Witness Name &amp; Role *</label>
              <input
                type="text"
                placeholder="e.g. John Mwangi Kimani (Plaintiff)"
                value={newWitnessName}
                onChange={(e) => setNewWitnessName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWitnessForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWitness}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
              >
                Add Statement
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {localData.witnessStatements.map((ws) => (
            <div
              key={ws.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
            >
              <span className="font-medium text-slate-200 text-xs">{ws.witnessName}</span>

              <div className="flex items-center gap-3">
                <select
                  value={ws.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as 'draft' | 'reviewed' | 'approved';
                    setLocalData({
                      ...localData,
                      witnessStatements: localData.witnessStatements.map((item) =>
                        item.id === ws.id ? { ...item, status: newStatus } : item
                      ),
                    });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                >
                  <option value="draft">Draft</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved &amp; Signed</option>
                </select>

                <button
                  onClick={() => handleRemoveWitness(ws.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review & Filing Readiness */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>4. Quality Audit &amp; Packaging</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 mb-1">Bundle Review Status</label>
            <select
              value={localData.bundleReviewStatus}
              onChange={(e) =>
                setLocalData({
                  ...localData,
                  bundleReviewStatus: e.target.value as PleadingsBundleData['bundleReviewStatus'],
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
            >
              <option value="draft">Draft</option>
              <option value="submitted_for_review">Submitted for Review</option>
              <option value="advocate_approved">Advocate Approved</option>
              <option value="partner_approved">Partner Approved</option>
              <option value="client_signed">Client Signed</option>
              <option value="ready_for_filing">Ready for Filing Package</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={localData.readyForFilingPackage}
                onChange={(e) =>
                  setLocalData({ ...localData, readyForFilingPackage: e.target.checked })
                }
                className="rounded bg-slate-950 border-slate-700 text-emerald-500"
              />
              <span className="font-semibold text-slate-200">Dispatch to Stage 8 (Court Filing Operations)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
