import React, { useState } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  BookOpen,
  Shield,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter } from '../../../types';

interface Props {
  matter: Matter;
}

interface PleadingItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'filed' | 'not_applicable';
  filedDate: string;
  notes: string;
}

export const DefencePleadingsWorkspace: React.FC<Props> = ({ matter }) => {
  const { currentUser, tasks, createTask } = useApp();

  const [pleadings, setPleadings] = useState<PleadingItem[]>([
    { id: 'p1', title: 'Statement of Defence', description: 'Defendant\'s formal denial and defence to the plaint', status: 'pending', filedDate: '', notes: '' },
    { id: 'p2', title: 'Defence Verifying Affidavit', description: 'Affidavit verifying the facts in the defence', status: 'pending', filedDate: '', notes: '' },
    { id: 'p3', title: 'Preliminary Objection', description: 'Any preliminary objections to jurisdiction or form of pleadings', status: 'not_applicable', filedDate: '', notes: '' },
    { id: 'p4', title: 'Reply to Defence', description: 'Plaintiff\'s reply addressing defendant\'s defence', status: 'pending', filedDate: '', notes: '' },
    { id: 'p5', title: 'Rejoinder (if any)', description: 'Defendant\'s rejoinder to the reply', status: 'not_applicable', filedDate: '', notes: '' },
  ]);

  const [pleadingsClosedDate, setPleadingsClosedDate] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [taskCreated, setTaskCreated] = useState(false);

  const stageTasks = tasks.filter(
    (t) => t.matterId === matter.id && t.stageId === 11
  );

  const updatePleading = (id: string, field: keyof PleadingItem, value: string) => {
    setPleadings((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const allFiled = pleadings
    .filter((p) => p.status !== 'not_applicable')
    .every((p) => p.status === 'filed');

  const statusBadge = (status: PleadingItem['status']) => {
    switch (status) {
      case 'filed': return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'pending': return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'not_applicable': return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const handleCreateCloseTask = () => {
    createTask({
      title: 'Confirm Pleadings Closed — Defence Stage Complete',
      description: `Pleadings have been exchanged. Confirm closure to advance to Pre-Trial. Notes: ${closureNotes}`,
      matterId: matter.id,
      stageId: 11,
      assignedTo: matter.supervisingUserId,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    });
    setTaskCreated(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-800/60 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-blue-400 tracking-widest">
              Stage 11 · Personal Injury Workflow
            </div>
            <h3 className="font-serif font-bold text-base text-slate-100">
              Defence / Pleadings Close
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Track the filing of defence, replies, and pleadings closure before proceeding to pre-trial.
            </p>
          </div>
          <div className="ml-auto">
            {allFiled ? (
              <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border bg-emerald-950 text-emerald-300 border-emerald-800 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Pleadings Complete
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border bg-amber-950 text-amber-300 border-amber-800 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                Pleadings Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pleadings Tracker */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Pleadings Register
        </h4>
        <div className="space-y-3">
          {pleadings.map((p) => (
            <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">{p.title}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{p.description}</div>
                </div>
                <select
                  value={p.status}
                  onChange={(e) => updatePleading(p.id, 'status', e.target.value as PleadingItem['status'])}
                  className={`text-[10px] px-2 py-0.5 rounded border font-mono outline-none shrink-0 ${statusBadge(p.status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="filed">Filed</option>
                  <option value="not_applicable">N/A</option>
                </select>
              </div>
              {p.status !== 'not_applicable' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Filed Date</label>
                    <input
                      type="date"
                      value={p.filedDate}
                      onChange={(e) => updatePleading(p.id, 'filedDate', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 outline-none text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Notes</label>
                    <input
                      type="text"
                      value={p.notes}
                      onChange={(e) => updatePleading(p.id, 'notes', e.target.value)}
                      placeholder="Registry ref, etc."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 outline-none text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pleadings Close Confirmation */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Pleadings Closure
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Pleadings Closed Date</label>
            <input
              type="date"
              value={pleadingsClosedDate}
              onChange={(e) => setPleadingsClosedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs"
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-400 mb-1 text-[11px]">Closure Notes</label>
          <textarea
            rows={2}
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            placeholder="e.g. All pleadings exchanged. PO dismissed. Ready for pre-trial directions."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-xs resize-none"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCreateCloseTask}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs transition flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Pleadings Closed
          </button>
          {taskCreated && (
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
            <Users className="w-4 h-4 text-blue-400" />
            Stage 11 Tasks ({stageTasks.length})
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
