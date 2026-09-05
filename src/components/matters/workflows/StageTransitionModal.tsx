import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  Users,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter, PracticeAreaWorkflow, WorkflowStageConfig } from '../../../types';

interface StageTransitionModalProps {
  matter: Matter;
  onClose: () => void;
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({ matter, onClose }) => {
  const {
    practiceWorkflows,
    users,
    tasks,
    documents,
    advanceMatterStageExpanded,
    currentUser,
  } = useApp();

  const currentWf: PracticeAreaWorkflow =
    practiceWorkflows.find((w) => w.id === matter.workflowTemplateId) || practiceWorkflows[0];

  const currentStageNum = matter.currentStageId;
  const currentStageConfig = currentWf?.stages.find((s) => s.id === currentStageNum);

  const [targetStageId, setTargetStageId] = useState<number>(
    Math.min(19, currentStageNum + 1)
  );
  const [newOwnerId, setNewOwnerId] = useState<string>(matter.currentStageOwnerId || currentUser.id);
  const [handoffNotes, setHandoffNotes] = useState<string>('');
  const [generateTasks, setGenerateTasks] = useState<boolean>(true);

  const targetStageConfig: WorkflowStageConfig | undefined = currentWf?.stages.find(
    (s) => s.id === targetStageId
  );

  // Validation Checks
  const stageTasks = tasks.filter((t) => t.matterId === matter.id && t.stageId === currentStageNum);
  const pendingStageTasks = stageTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const matterDocs = documents.filter((d) => d.matterId === matter.id);

  const handleAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const result = advanceMatterStageExpanded(matter.id, targetStageId, newOwnerId, handoffNotes, {
      generateStandardTasks: generateTasks,
      handoffChecklistCompleted: true,
    });
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase text-amber-500 font-bold">
              Stage Transition &amp; Work Handover Engine
            </span>
            <h2 className="text-lg font-serif font-bold text-slate-100">
              Advance Matter: {matter.internalReference}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 font-mono text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAdvance} className="space-y-6">
          {/* Current vs Target Stage Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500">Current Active Stage</span>
              <div className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-xs font-mono">
                  {currentStageNum}
                </span>
                <span>{currentStageConfig?.name || `Stage ${currentStageNum}`}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Supervising Partner: <strong className="text-slate-300 font-mono">{matter.supervisingUserId}</strong>
              </div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-4">
              <span className="text-[10px] uppercase font-mono text-amber-500 font-semibold">
                Destination Stage
              </span>
              <select
                value={targetStageId}
                onChange={(e) => setTargetStageId(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-600/60 rounded text-slate-100 text-xs font-semibold focus:outline-none"
              >
                {currentWf?.stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    Stage {st.id}: {st.name} (Target: {st.targetDurationDays}d)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prerequisite Check Matrix */}
          <div className="space-y-2">
            <h3 className="font-mono uppercase font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prerequisite Check &amp; Quality Audit</span>
            </h3>

            <div className="space-y-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              {/* Task check */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Stage Tasks Completed:</span>
                <span className={`font-mono font-semibold ${pendingStageTasks.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stageTasks.length - pendingStageTasks.length} / {stageTasks.length} Completed
                  {pendingStageTasks.length > 0 && ` (${pendingStageTasks.length} pending)`}
                </span>
              </div>

              {/* Document check */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Stage Documents Attached:</span>
                <span className="font-mono text-slate-200">
                  {matterDocs.length} Total Registered
                </span>
              </div>

              {/* Target stage duration */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Target Stage SLA:</span>
                <span className="font-mono text-blue-400">
                  {targetStageConfig?.targetDurationDays || 14} Days (Benchmark)
                </span>
              </div>
            </div>
          </div>

          {/* New Stage Assignee & Handoff Notes */}
          <div className="space-y-4">
            <h3 className="font-mono uppercase font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Stage Worker Delegation &amp; Handoff Notes</span>
            </h3>

            <div>
              <label className="block text-slate-400 mb-1">
                Assign Stage Lead / Responsible Worker *
              </label>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.roles.join(', ')} ({u.homeBranchId})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 block mt-1">
                Supervising Partner remains assigned across all stages for governance and approvals.
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Handoff Instructions / Critical Next Actions *
              </label>
              <textarea
                rows={3}
                required
                value={handoffNotes}
                onChange={(e) => setHandoffNotes(e.target.value)}
                placeholder="e.g. Police abstract secured. Please proceed to request medicolegal examination from Dr. Patel and prepare notice of intention to sue."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateTasks}
                onChange={(e) => setGenerateTasks(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 bg-slate-900 border-slate-700"
              />
              <span className="text-slate-300">
                Auto-generate standard checklist tasks for Stage {targetStageId} ({targetStageConfig?.name})
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow transition flex items-center gap-1.5"
            >
              <span>Execute Stage Advance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
