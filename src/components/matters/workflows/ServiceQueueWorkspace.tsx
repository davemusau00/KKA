import React, { useState } from 'react';
import {
  Send,
  UserCheck,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ServiceQueueItem, Matter } from '../../../types';

interface ServiceQueueWorkspaceProps {
  matter: Matter;
}

export const ServiceQueueWorkspace: React.FC<ServiceQueueWorkspaceProps> = ({ matter }) => {
  const { serviceQueue, createServiceQueueItem, updateServiceQueueItem, addServiceAttempt } = useApp();

  const existingItem = serviceQueue.find((s) => s.matterId === matter.id);

  const [localItem, setLocalItem] = useState<ServiceQueueItem>(
    existingItem || {
      id: `sq-${matter.id}`,
      matterId: matter.id,
      documentType: 'Summons to Enter Appearance & Plaint Bundle',
      targetPartyName: 'Swift Shuttle SACCO Limited & Directline Assurance Ltd',
      targetAddress: 'Directline Towers, Harambee Avenue, Nairobi',
      processServerUserId: 'Harrison Mutiso (Licensed Process Server PS/291)',
      deadlineDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      attempts: [
        {
          attemptNo: 1,
          date: matter.openedAt.slice(0, 10),
          outcome: 'Served Company Secretary',
          notes: 'Received and stamped by Legal Department, Directline Assurance.',
        },
      ],
      servedDate: matter.openedAt.slice(0, 10),
      status: 'filed',
      ctsFilingRef: 'CTS-SRV-2026-081',
    }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAttemptForm, setShowAttemptForm] = useState(false);
  const [newAttempt, setNewAttempt] = useState({
    date: new Date().toISOString().slice(0, 10),
    outcome: '',
    notes: '',
  });

  const handleSave = () => {
    if (existingItem) {
      updateServiceQueueItem(localItem.id, localItem);
    } else {
      createServiceQueueItem(localItem);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddAttempt = () => {
    if (!newAttempt.outcome.trim()) return;
    const nextNo = (localItem.attempts?.length || 0) + 1;
    const attemptObj = { attemptNo: nextNo, ...newAttempt };
    const updatedAttempts = [
      ...(localItem.attempts || []),
      attemptObj,
    ];
    setLocalItem((prev) => ({
      ...prev,
      attempts: updatedAttempts,
      status: newAttempt.outcome.toLowerCase().includes('served') ? 'served' : prev.status,
      servedDate: newAttempt.outcome.toLowerCase().includes('served') ? newAttempt.date : prev.servedDate,
    }));
    if (existingItem) {
      addServiceAttempt(localItem.id, attemptObj);
    }
    setNewAttempt({
      date: new Date().toISOString().slice(0, 10),
      outcome: '',
      notes: '',
    });
    setShowAttemptForm(false);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-[10px]">
              Stage 9: Summons &amp; Process Service Queue
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Summons Issuance, Process Server Assignment &amp; Affidavit of Service
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Service Synced
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Service Record</span>
          </button>
        </div>
      </div>

      {/* Grid 1: Process Server & Target Party */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Party to Serve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Defendant / Party to Serve</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Target Entity / Defendant Name *</label>
              <input
                type="text"
                value={localItem.partyToServe}
                onChange={(e) => setLocalItem({ ...localItem, partyToServe: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Physical Address / Business Location</label>
              <input
                type="text"
                value={localItem.partyAddress}
                onChange={(e) => setLocalItem({ ...localItem, partyAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Service Method</label>
                <select
                  value={localItem.serviceMethod}
                  onChange={(e) => setLocalItem({ ...localItem, serviceMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Personal Service">Personal Service on Company / Driver</option>
                  <option value="Registered Post">Registered Post (Section 10 Notice)</option>
                  <option value="Substituted Service">Substituted Service (Newspaper / WhatsApp)</option>
                  <option value="Affixed on Premises">Affixed on Known Residence</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Service Deadline Date</label>
                <input
                  type="date"
                  value={localItem.dueDate}
                  onChange={(e) => setLocalItem({ ...localItem, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Process Server & Affidavit of Service Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Process Server &amp; Affidavit of Service</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Licensed Process Server Name</label>
              <input
                type="text"
                value={localItem.processServerName}
                onChange={(e) => setLocalItem({ ...localItem, processServerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Affidavit of Service (AOS)</span>
                <span className="text-[10px] text-slate-500">
                  Sworn affidavit confirming physical service details under Order 5 CPC
                </span>
              </div>
              <select
                value={localItem.affidavitOfServiceStatus}
                onChange={(e) =>
                  setLocalItem({
                    ...localItem,
                    affidavitOfServiceStatus: e.target.value as ServiceQueueItem['affidavitOfServiceStatus'],
                  })
                }
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-xs"
              >
                <option value="pending">Pending Service</option>
                <option value="drafted">Drafted by Server</option>
                <option value="sworn">Sworn &amp; Commissioned</option>
                <option value="filed">Filed with Court Registry</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Actual Service Date</label>
                <input
                  type="date"
                  value={localItem.serviceDate || ''}
                  onChange={(e) => setLocalItem({ ...localItem, serviceDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Queue Status</label>
                <select
                  value={localItem.status}
                  onChange={(e) =>
                    setLocalItem({
                      ...localItem,
                      status: e.target.value as ServiceQueueItem['status'],
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold"
                >
                  <option value="assigned">Assigned to Process Server</option>
                  <option value="in_progress">Attempts in Progress</option>
                  <option value="served">Successfully Served</option>
                  <option value="filed">AOS Filed in Court</option>
                  <option value="failed">Failed / Address Trace Required</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Attempt Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Process Server Service Attempt Log ({localItem.attempts?.length || 0})</span>
          </h3>

          <button
            onClick={() => setShowAttemptForm(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg border border-slate-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Service Attempt</span>
          </button>
        </div>

        <div className="space-y-2">
          {localItem.attempts?.map((att) => (
            <div
              key={att.attemptNo}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-mono font-bold text-[10px]">
                  #{att.attemptNo}
                </span>
                <div>
                  <span className="font-bold text-slate-200 block">{att.outcome}</span>
                  <span className="text-slate-400 text-[11px]">{att.notes}</span>
                </div>
              </div>

              <span className="font-mono text-slate-400 text-[11px]">{att.date}</span>
            </div>
          ))}

          {(!localItem.attempts || localItem.attempts.length === 0) && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500">
              No service attempts logged yet.
            </div>
          )}
        </div>

        {showAttemptForm && (
          <div className="p-4 bg-slate-950 border border-amber-600/40 rounded-xl space-y-3">
            <span className="font-mono font-bold text-amber-400 uppercase text-[11px] block">
              + Record New Service Attempt
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-0.5">Attempt Date</label>
                <input
                  type="date"
                  value={newAttempt.date}
                  onChange={(e) => setNewAttempt({ ...newAttempt, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-0.5">Outcome Summary *</label>
                <input
                  type="text"
                  placeholder="e.g. Served Company Secretary at Nairobi Head Office"
                  value={newAttempt.outcome}
                  onChange={(e) => setNewAttempt({ ...newAttempt, outcome: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-0.5">Server Field Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Received by legal clerk Mr. Odhiambo who signed duplicate copy and stamped with official company stamp."
                value={newAttempt.notes}
                onChange={(e) => setNewAttempt({ ...newAttempt, notes: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAttemptForm(false)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAttempt}
                className="px-4 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded"
              >
                Save Attempt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
