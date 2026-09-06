import React, { useState } from 'react';
import {
  Scale,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Send,
  Users,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter } from '../../../types';

interface Props {
  matter: Matter;
}

type AtlStatus = 'pending_review' | 'demand_sent' | 'awaiting_insurer_response' | 'authority_granted' | 'declined_settle';

export const AuthorityToLitigateWorkspace: React.FC<Props> = ({ matter }) => {
  const { currentUser, users, createTask, tasks } = useApp();

  const [atlStatus, setAtlStatus] = useState<AtlStatus>('pending_review');
  const [demandLetterDate, setDemandLetterDate] = useState('');
  const [demandAmount, setDemandAmount] = useState('');
  const [insurerResponse, setInsurerResponse] = useState('');
  const [insurerResponseDate, setInsurerResponseDate] = useState('');
  const [partnerNotes, setPartnerNotes] = useState('');
  const [authorityGrantedDate, setAuthorityGrantedDate] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const stageTasks = tasks.filter(
    (t) => t.matterId === matter.id && t.stageId === 7
  );
  const advocateUser = users.find((u) => u.id === matter.supervisingUserId);
  const stageOwner = users.find((u) => u.id === matter.currentStageOwnerId);

  const statusConfig: Record<AtlStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending_review: { label: 'Pending Partner Review', color: 'bg-amber-950 text-amber-300 border-amber-800', icon: <Clock className="w-3.5 h-3.5" /> },
    demand_sent: { label: 'Demand Letter / NIS Sent', color: 'bg-blue-950 text-blue-300 border-blue-800', icon: <Send className="w-3.5 h-3.5" /> },
    awaiting_insurer_response: { label: 'Awaiting Insurer Response', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: <Clock className="w-3.5 h-3.5" /> },
    authority_granted: { label: 'Authority to Litigate GRANTED', color: 'bg-emerald-950 text-emerald-300 border-emerald-800', icon: <BadgeCheck className="w-3.5 h-3.5" /> },
    declined_settle: { label: 'Pre-Litigation Settlement — Declined', color: 'bg-rose-950 text-rose-300 border-rose-800', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  };

  const handleCreateAtlTask = () => {
    createTask({
      title: 'Obtain Authority to Litigate — Partner Sign-Off',
      description: `Supervising partner must formally authorise filing suit on ${matter.internalReference}. Notes: ${partnerNotes}`,
      matterId: matter.id,
      stageId: 7,
      assignedTo: matter.supervisingUserId,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    });
    setIsSaved(true);
  };

  const cfg = statusConfig[atlStatus];

  return (
    <div className="space-y-5">
      {/* Stage Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-800/60 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/40 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-amber-500 tracking-widest">
                Stage 7 · Personal Injury Workflow
              </div>
              <h3 className="font-serif font-bold text-base text-slate-100">
                Authority to Litigate
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Internal partner sign-off required before filing suit. Includes demand / NIS window and pre-litigation settlement attempt.
              </p>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-semibold ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ATL Status Stepper */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
          ATL Progress Tracker
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(statusConfig) as AtlStatus[]).map((key) => {
            const s = statusConfig[key];
            const isActive = atlStatus === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAtlStatus(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition ${
                  isActive
                    ? s.color + ' shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{s.icon}</span>
                <span className="text-xs font-medium">{s.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Demand Letter / NIS Details */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
          <Send className="w-4 h-4 text-amber-400" />
          Demand Letter / Notice of Intention to Sue
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Date Sent</label>
            <input
              type="date"
              value={demandLetterDate}
              onChange={(e) => setDemandLetterDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Claimed Amount (KES)</label>
            <input
              type="text"
              value={demandAmount}
              onChange={(e) => setDemandAmount(e.target.value)}
              placeholder="e.g. 3,500,000"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Insurer / Defendant Response</label>
            <input
              type="text"
              value={insurerResponse}
              onChange={(e) => setInsurerResponse(e.target.value)}
              placeholder="e.g. Offered KES 800,000 — rejected"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Response Received Date</label>
            <input
              type="date"
              value={insurerResponseDate}
              onChange={(e) => setInsurerResponseDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Partner Authority Grant */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Partner Authority Sign-Off
        </h4>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
            {advocateUser?.fullName.charAt(0) ?? '?'}
          </div>
          <div>
            <div className="font-semibold text-slate-200 text-xs">{advocateUser?.fullName ?? matter.supervisingUserId}</div>
            <div className="text-slate-400 text-[11px]">{advocateUser?.jobTitle} — Supervising Partner</div>
          </div>
          <span className="ml-auto text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
            Sign-off Required
          </span>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 text-[11px]">Partner Notes / Conditions</label>
          <textarea
            rows={3}
            value={partnerNotes}
            onChange={(e) => setPartnerNotes(e.target.value)}
            placeholder="e.g. Proceed only after all medical reports received. Liability appears clear — RTA with police abstract."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-xs resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Authority Granted Date</label>
            <input
              type="date"
              value={authorityGrantedDate}
              onChange={(e) => setAuthorityGrantedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCreateAtlTask}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Create ATL Approval Task
          </button>
          {isSaved && (
            <span className="flex items-center gap-1 text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4" />
              Task created
            </span>
          )}
        </div>
      </div>

      {/* Stage Tasks */}
      {stageTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Stage 7 Tasks ({stageTasks.length})
          </h4>
          {stageTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800"
            >
              <span className={`text-xs font-medium ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {t.title}
              </span>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                t.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-amber-400'
              }`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
