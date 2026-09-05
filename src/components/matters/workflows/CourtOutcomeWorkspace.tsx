import React, { useState } from 'react';
import {
  Gavel,
  Calendar,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter, CalendarEventType } from '../../../types';

interface CourtOutcomeWorkspaceProps {
  matter: Matter;
}

export const CourtOutcomeWorkspace: React.FC<CourtOutcomeWorkspaceProps> = ({ matter }) => {
  const { propagateCourtOutcomeDetailed, currentUser, clients } = useApp();

  const client = clients.find((c) => c.id === matter.clientId);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [outcomeType, setOutcomeType] = useState<
    'ruling_delivered' | 'judgment_delivered' | 'hearing_conducted' | 'adjourned' | 'directions_given' | 'mention_held'
  >('hearing_conducted');
  const [judgeName, setJudgeName] = useState<string>('Hon. P. Mutua (Chief Magistrate)');
  const [ordersSummary, setOrdersSummary] = useState<string>(
    'Plaintiff closed their case after calling PW1, PW2 and PW3. Defense to open case on the next trial date.'
  );
  const [nextDate, setNextDate] = useState<string>(
    new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10)
  );
  const [nextEventType, setNextEventType] = useState<string>('Court Hearing');
  const [clientSmsText, setClientSmsText] = useState<string>(
    `Dear ${client?.displayName || 'Client'}, your court hearing for matter ${matter.internalReference} has concluded today. Next court date is set for ${nextDate} for Defense hearing.`
  );

  const [tasksToGenerate, setTasksToGenerate] = useState<Array<{ title: string; assignedTo: string; dueDays: number }>>([
    { title: `Prepare trial transcript & witness notes from hearing on ${date}`, assignedTo: currentUser.id, dueDays: 7 },
    { title: `File updated authority list before ${nextDate}`, assignedTo: matter.currentStageOwnerId || currentUser.id, dueDays: 14 },
  ]);

  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleAddTask = () => {
    setTasksToGenerate((prev) => [...prev, { title: '', assignedTo: currentUser.id, dueDays: 7 }]);
  };

  const handleRemoveTask = (index: number) => {
    setTasksToGenerate((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    propagateCourtOutcomeDetailed(matter.id, {
      outcomeType,
      ordersSummary,
      nextDate,
      nextEventType,
      tasksToCreate: tasksToGenerate.filter((t) => t.title.trim()),
      sendSms: true,
      smsText: clientSmsText,
    });
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold uppercase text-[10px]">
              Stage 12: Court Outcome &amp; Automated Propagation
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              Matter: {matter.internalReference}
            </span>
          </div>
          <h2 className="text-base font-serif font-bold text-slate-100 mt-1">
            Record Court Orders, Calendar Event &amp; Client SMS Notification
          </h2>
        </div>

        {submittedSuccess && (
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Orders Propagated to Calendar, Tasks &amp; Comms
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Court Session Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Gavel className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Court Session Details &amp; Judicial Orders</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Session Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Outcome / Proceeding Type *</label>
              <select
                value={outcomeType}
                onChange={(e) => setOutcomeType(e.target.value as typeof outcomeType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-semibold"
              >
                <option value="mention_held">Mention (Directions / Compliance)</option>
                <option value="hearing_conducted">Hearing (Examination of Witnesses)</option>
                <option value="ruling_delivered">Interlocutory Ruling</option>
                <option value="judgment_delivered">Final Judgment Delivery</option>
                <option value="adjourned">Adjournment by Court / Counsel</option>
                <option value="directions_given">Directions Given by Court</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Presiding Judge / Magistrate</label>
              <input
                type="text"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Summary of Court Orders &amp; Directives *</label>
            <textarea
              rows={3}
              required
              value={ordersSummary}
              onChange={(e) => setOrdersSummary(e.target.value)}
              placeholder="e.g. Court ordered defendant to file formal witness statements within 14 days. Mention for confirmation on 24th March."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Next Date & Calendar Event */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Next Court Hearing Date (Auto-Schedules in Firm Calendar)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Next Court Date *</label>
              <input
                type="date"
                required
                value={nextDate}
                onChange={(e) => {
                  setNextDate(e.target.value);
                  setClientSmsText(
                    `Dear ${client?.displayName || 'Client'}, your court hearing for matter ${matter.internalReference} has concluded today. Next court date is set for ${e.target.value} for directions/hearing.`
                  );
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold text-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Next Event Nature</label>
              <select
                value={nextEventType}
                onChange={(e) => setNextEventType(e.target.value as CalendarEventType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
              >
                <option value="court">Court Mention / Hearing</option>
                <option value="deadline">Filing Deadline</option>
                <option value="client_meeting">Pre-Trial Client Briefing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Automatic Tasks & Client SMS Notification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>3. Automated Action Tasks</span>
              </h3>
              <button
                type="button"
                onClick={handleAddTask}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
              >
                + Add Task
              </button>
            </div>

            <div className="space-y-2">
              {tasksToGenerate.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTasksToGenerate((prev) =>
                        prev.map((t, i) => (i === idx ? { ...t, title: val } : t))
                      );
                    }}
                    placeholder="Task description..."
                    className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SMS Notification */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-mono font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Africa's Talking SMS Dispatch to Client</span>
            </h3>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">
                Recipient: {client?.displayName} ({client?.phone || '+254 7...'})
              </span>
              <textarea
                rows={3}
                value={clientSmsText}
                onChange={(e) => setClientSmsText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow flex items-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>Propagate Orders &amp; Dispatch SMS Update</span>
          </button>
        </div>
      </form>
    </div>
  );
};
