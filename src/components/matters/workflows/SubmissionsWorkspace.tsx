import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  Send,
  Users,
  Calendar,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter } from '../../../types';

interface Props {
  matter: Matter;
}

type SubmissionStatus = 'pending' | 'drafted' | 'filed' | 'not_required';

interface SubmissionItem {
  id: string;
  party: string;
  title: string;
  status: SubmissionStatus;
  dueDate: string;
  filedDate: string;
  pageCount: string;
  notes: string;
}

export const SubmissionsWorkspace: React.FC<Props> = ({ matter }) => {
  const { currentUser, tasks, createTask } = useApp();

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([
    { id: 's1', party: 'Plaintiff', title: 'Written Submissions (Plaintiff)', status: 'pending', dueDate: '', filedDate: '', pageCount: '', notes: '' },
    { id: 's2', party: 'Defendant', title: 'Written Submissions (Defendant)', status: 'pending', dueDate: '', filedDate: '', pageCount: '', notes: '' },
    { id: 's3', party: 'Plaintiff', title: 'Reply to Defendant\'s Submissions', status: 'pending', dueDate: '', filedDate: '', pageCount: '', notes: '' },
    { id: 's4', party: 'Both', title: 'Oral Submissions (if ordered)', status: 'not_required', dueDate: '', filedDate: '', pageCount: '', notes: '' },
  ]);

  const [oralSubmissionsDate, setOralSubmissionsDate] = useState('');
  const [judgmentExpectedDate, setJudgmentExpectedDate] = useState('');
  const [judgmentDeadlineOrdered, setJudgmentDeadlineOrdered] = useState(false);
  const [generalNotes, setGeneralNotes] = useState('');
  const [taskCreated, setTaskCreated] = useState(false);

  const stageTasks = tasks.filter(
    (t) => t.matterId === matter.id && t.stageId === 15
  );

  const updateSubmission = (id: string, field: keyof SubmissionItem, value: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const allFiled = submissions
    .filter((s) => s.status !== 'not_required')
    .every((s) => s.status === 'filed');

  const statusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'filed': return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'drafted': return 'bg-blue-950 text-blue-400 border-blue-800';
      case 'pending': return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'not_required': return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const partyColor = (party: string) => {
    switch (party) {
      case 'Plaintiff': return 'bg-emerald-950/50 text-emerald-400';
      case 'Defendant': return 'bg-rose-950/50 text-rose-400';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const handleCreateSubmissionsTask = () => {
    createTask({
      title: 'File Written Submissions — Stage 15',
      description: `Prepare and file written submissions for ${matter.internalReference}. Notes: ${generalNotes}`,
      matterId: matter.id,
      stageId: 15,
      assignedTo: matter.supervisingUserId,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    });
    setTaskCreated(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-800/60 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-600/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-purple-400 tracking-widest">
              Stage 15 · Personal Injury Workflow
            </div>
            <h3 className="font-serif font-bold text-base text-slate-100">
              Submissions
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Track written and oral submissions by all parties before the court pronounces judgment.
            </p>
          </div>
          <div className="ml-auto">
            {allFiled ? (
              <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border bg-emerald-950 text-emerald-300 border-emerald-800 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                All Submissions Filed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border bg-amber-950 text-amber-300 border-amber-800 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                Submissions Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submissions Register */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          Submissions Register
        </h4>
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${partyColor(s.party)}`}>
                    {s.party}
                  </span>
                  <div className="font-semibold text-slate-200 text-xs">{s.title}</div>
                </div>
                <select
                  value={s.status}
                  onChange={(e) => updateSubmission(s.id, 'status', e.target.value as SubmissionStatus)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-mono outline-none shrink-0 ${statusBadge(s.status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="drafted">Drafted</option>
                  <option value="filed">Filed</option>
                  <option value="not_required">N/A</option>
                </select>
              </div>

              {s.status !== 'not_required' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Court Due Date</label>
                    <input
                      type="date"
                      value={s.dueDate}
                      onChange={(e) => updateSubmission(s.id, 'dueDate', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 outline-none text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Filed Date</label>
                    <input
                      type="date"
                      value={s.filedDate}
                      onChange={(e) => updateSubmission(s.id, 'filedDate', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 outline-none text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1">Pages</label>
                    <input
                      type="number"
                      value={s.pageCount}
                      onChange={(e) => updateSubmission(s.id, 'pageCount', e.target.value)}
                      placeholder="e.g. 24"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 outline-none text-[11px] font-mono"
                    />
                  </div>
                </div>
              )}
              {s.status !== 'not_required' && (
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Notes</label>
                  <input
                    type="text"
                    value={s.notes}
                    onChange={(e) => updateSubmission(s.id, 'notes', e.target.value)}
                    placeholder="Court directions, registry ref..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 outline-none text-[11px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Oral Submissions & Judgment Dates */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          Key Dates
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Oral Submissions Date (if ordered)</label>
            <input
              type="date"
              value={oralSubmissionsDate}
              onChange={(e) => setOralSubmissionsDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Judgment Expected Date</label>
            <input
              type="date"
              value={judgmentExpectedDate}
              onChange={(e) => setJudgmentExpectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none text-xs"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={judgmentDeadlineOrdered}
            onChange={(e) => setJudgmentDeadlineOrdered(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-purple-500"
          />
          <span className="text-xs text-slate-300">
            Court has given a specific judgment delivery date (create statutory deadline task)
          </span>
        </label>

        {judgmentDeadlineOrdered && judgmentExpectedDate && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-950/30 border border-purple-800/40">
            <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs text-purple-300">
              Judgment delivery ordered for {new Date(judgmentExpectedDate).toLocaleDateString('en-GB', { dateStyle: 'long' })}. Advocate must attend.
            </span>
          </div>
        )}

        <div>
          <label className="block text-slate-400 mb-1 text-[11px]">General Notes</label>
          <textarea
            rows={2}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="e.g. Oral submissions ordered for 3 advocates, 30 minutes each. Judgment date pending."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none text-xs resize-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCreateSubmissionsTask}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Create Submissions Task
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
            <Users className="w-4 h-4 text-purple-400" />
            Stage 15 Tasks ({stageTasks.length})
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
