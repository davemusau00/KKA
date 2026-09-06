import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  ShieldAlert,
  CheckSquare,
  FileUp,
  Loader2,
  Info,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Matter, PracticeAreaWorkflow, WorkflowStageConfig } from '../../../types';
import { validateStageTransition } from '../../../utils/stageGate';

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
    completeTask,
    createDocument,
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
  const [partnerOverride, setPartnerOverride] = useState<boolean>(false);
  const [resolvingTaskId, setResolvingTaskId] = useState<string | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const targetStageConfig: WorkflowStageConfig | undefined = currentWf?.stages.find(
    (s) => s.id === targetStageId
  );

  // Gate evaluation — reactive (re-evaluates on tasks/documents change)
  const matterTasks = tasks.filter((t) => t.matterId === matter.id);
  const matterDocs = documents.filter((d) => d.matterId === matter.id);

  const gate = validateStageTransition(
    matter,
    currentStageConfig,
    matterTasks,
    matterDocs
  );

  const canSubmit = gate.canAdvance || partnerOverride;
  const isPartner =
    currentUser.roles.includes('managing_partner') ||
    currentUser.roles.includes('senior_partner');

  const handleAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const checklistItems = [
      ...gate.blockingTasks.map((t) => ({ text: `Task: ${t.title}`, completed: t.status === 'completed' })),
      ...((currentStageConfig?.requiredDocuments || currentStageConfig?.requiredDocumentTypes || []).map((d) => ({
        text: `Document: ${d}`,
        completed: !gate.missingDocuments.includes(d),
      }))),
    ];

    const result = advanceMatterStageExpanded(matter.id, targetStageId, newOwnerId, handoffNotes, {
      generateStandardTasks: generateTasks,
      handoffChecklistCompleted: gate.canAdvance,
      criticalNextAction: `Execute Stage ${targetStageId}: ${targetStageConfig?.name || 'In Progress'}`,
      checklistItems: checklistItems.length > 0 ? checklistItems : [{ text: 'Standard stage gate verification', completed: true }],
      supervisorSignOff: isPartner
        ? {
            supervisorId: currentUser.id,
            signatureNote: partnerOverride ? 'Partner Stage Gate Override Approved' : 'Stage Gate Validated & Sign-off Approved',
            signedAt: new Date().toISOString(),
          }
        : undefined,
    });
    if (result.success) {
      onClose();
    }
  };

  const handleResolveTask = async (taskId: string) => {
    setResolvingTaskId(taskId);
    await new Promise((r) => setTimeout(r, 300)); // brief feedback pulse
    completeTask(taskId, true);
    setResolvingTaskId(null);
  };

  const handleUploadDoc = async (docType: string) => {
    setUploadingDocType(docType);
    await new Promise((r) => setTimeout(r, 500));
    // Create a placeholder document record to satisfy the gate requirement
    createDocument({
      matterId: matter.id,
      title: docType,
      category: 'Correspondence',
      documentType: docType,
      confidentialityLevel: 'standard',
      ownerUserId: currentUser.id,
    });
    setUploadingDocType(null);
  };

  const blockedByTasks = gate.blockingTasks.length > 0;
  const blockedByDocs = gate.missingDocuments.length > 0;
  const blockedByApprovals = gate.missingApprovals.length > 0;
  const isBlocked = !gate.canAdvance;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase text-amber-700 dark:text-amber-500 font-bold">
              Stage Transition &amp; Work Handover Engine
            </span>
            <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
              Advance Matter: {matter.internalReference}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono text-sm w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAdvance} className="space-y-6">
          {/* Current vs Target Stage Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500">Current Active Stage</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-mono">
                  {currentStageNum}
                </span>
                <span>{currentStageConfig?.name || `Stage ${currentStageNum}`}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Supervising Partner: <strong className="text-slate-700 dark:text-slate-300 font-mono">{matter.supervisingUserId}</strong>
              </div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4">
              <span className="text-[10px] uppercase font-mono text-amber-700 dark:text-amber-500 font-semibold">
                Destination Stage
              </span>
              <select
                value={targetStageId}
                onChange={(e) => setTargetStageId(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-600/60 rounded text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none"
              >
                {currentWf?.stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    Stage {st.id}: {st.name} (Target: {st.targetDurationDays}d)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ═══ STAGE GATE SECTION ═══ */}
          <div className="space-y-3">
            <h3 className="font-mono uppercase font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Stage Gate &amp; Prerequisite Enforcement</span>
              {isBlocked && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-[10px] font-bold animate-pulse">
                  BLOCKED
                </span>
              )}
              {!isBlocked && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                  CLEARED
                </span>
              )}
            </h3>

            {/* Hard blockers — blocking tasks (INTERACTIVE) */}
            {blockedByTasks && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/70 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px] mb-1">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {gate.blockingTasks.length} Incomplete Task{gate.blockingTasks.length > 1 ? 's' : ''} — Stage Blocked
                  <span className="ml-auto text-rose-400/60 font-normal">Click to resolve →</span>
                </div>
                {gate.blockingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 bg-rose-950/60 border border-rose-800/50 rounded-lg px-2.5 py-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-rose-200 font-medium truncate">{t.title}</div>
                      {t.description && (
                        <div className="text-rose-400/70 text-[10px] truncate">{t.description}</div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 shrink-0">
                      {t.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResolveTask(t.id)}
                      disabled={resolvingTaskId === t.id}
                      title="Mark this task as complete"
                      className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 text-[10px] font-bold transition shrink-0 disabled:opacity-60"
                    >
                      {resolvingTaskId === t.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckSquare className="w-3 h-3" />
                      )}
                      {resolvingTaskId === t.id ? 'Resolving…' : 'Mark Done'}
                    </button>
                  </div>
                ))}
                <div className="flex items-start gap-1.5 text-rose-400/70 text-[10px] mt-1 pl-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Marking a task done immediately re-evaluates this gate. Partner override available if you cannot resolve.</span>
                </div>
              </div>
            )}

            {/* Hard blockers — missing documents (INTERACTIVE) */}
            {blockedByDocs && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/70 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px] mb-1">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  {gate.missingDocuments.length} Required Document{gate.missingDocuments.length > 1 ? 's' : ''} Missing
                  <span className="ml-auto text-rose-400/60 font-normal">Click to attach →</span>
                </div>
                {gate.missingDocuments.map((docType) => (
                  <div
                    key={docType}
                    className="flex items-center gap-2 bg-rose-950/60 border border-rose-800/50 rounded-lg px-2.5 py-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-mono text-rose-200 flex-1">{docType}</span>
                    <button
                      type="button"
                      onClick={() => handleUploadDoc(docType)}
                      disabled={uploadingDocType === docType}
                      title="Attach this document"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-800/80 hover:bg-blue-700 text-blue-200 text-[10px] font-bold transition shrink-0 disabled:opacity-60"
                    >
                      {uploadingDocType === docType ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <FileUp className="w-3 h-3" />
                      )}
                      {uploadingDocType === docType ? 'Attaching…' : 'Attach Doc'}
                    </button>
                  </div>
                ))}
                <div className="flex items-start gap-1.5 text-rose-400/70 text-[10px] mt-1 pl-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Attaching a document placeholder allows the gate to clear. Upload the actual file from the Documents tab afterwards.</span>
                </div>
              </div>
            )}

            {/* Hard blockers — missing approvals */}
            {blockedByApprovals && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/70 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px]">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  Approval Required
                </div>
                {gate.missingApprovals.map((msg, i) => (
                  <div key={i} className="text-rose-300/80 ml-5">{msg}</div>
                ))}
              </div>
            )}

            {/* Warnings (amber, non-blocking) */}
            {gate.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {gate.warnings.length} Warning{gate.warnings.length > 1 ? 's' : ''} (transition permitted)
                </div>
                {gate.warnings.map((w, i) => (
                  <div key={i} className="text-amber-300/80 ml-5 text-[11px]">{w}</div>
                ))}
              </div>
            )}

            {/* All clear */}
            {gate.canAdvance && gate.warnings.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                All prerequisites met — stage transition is cleared to proceed.
              </div>
            )}

            {gate.canAdvance && gate.warnings.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Gate cleared (with warnings) — you may proceed.
              </div>
            )}

            {/* Summary stats */}
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Stage Tasks Completed:</span>
                <span className={`font-mono font-semibold ${gate.blockingTasks.length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {matterTasks.filter((t) => t.stageId === currentStageNum && (t.status === 'completed' || t.status === 'cancelled')).length}
                  {' / '}
                  {matterTasks.filter((t) => t.stageId === currentStageNum).length} Completed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Stage Documents Attached:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{matterDocs.length} Total</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Target Stage SLA:</span>
                <span className="font-mono text-blue-700 dark:text-blue-400">
                  {targetStageConfig?.targetDurationDays || 14} Days (Benchmark)
                </span>
              </div>
            </div>

            {/* Partner override — only visible to managing/senior partner when blocked */}
            {!gate.canAdvance && isPartner && (
              <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl bg-amber-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-700/50">
                <input
                  type="checkbox"
                  checked={partnerOverride}
                  onChange={(e) => setPartnerOverride(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 mt-0.5"
                />
                <span className="text-amber-800 dark:text-amber-300/90 text-[11px]">
                  <strong className="text-amber-900 dark:text-amber-300">Partner Override:</strong> I confirm I have reviewed the incomplete prerequisites and authorise this stage advance on supervisory authority. This action will be logged.
                </span>
              </label>
            )}

            {!gate.canAdvance && !isPartner && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Stage advance is blocked. Resolve the items above or request a partner override.
              </div>
            )}
          </div>

          {/* New Stage Assignee & Handoff Notes */}
          <div className="space-y-4">
            <h3 className="font-mono uppercase font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Stage Worker Delegation &amp; Handoff Notes</span>
            </h3>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Assign Stage Lead / Responsible Worker *
              </label>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
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
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                Handoff Instructions / Critical Next Actions *
              </label>
              <textarea
                rows={3}
                required
                value={handoffNotes}
                onChange={(e) => setHandoffNotes(e.target.value)}
                placeholder="e.g. Police abstract secured. Please proceed to request medicolegal examination from Dr. Patel and prepare notice of intention to sue."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateTasks}
                onChange={(e) => setGenerateTasks(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Auto-generate standard checklist tasks for Stage {targetStageId} ({targetStageConfig?.name})
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-5 py-2 font-semibold rounded-lg shadow transition flex items-center gap-1.5 ${
                canSubmit
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
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
