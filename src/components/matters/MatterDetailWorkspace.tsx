import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  FileText,
  MessageSquare,
  DollarSign,
  Users,
  Shield,
  Activity,
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
  Plus,
  Building2,
  Phone,
  Mail,
  Scale,
  Stethoscope,
  Car,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { LegalDocument, Matter, Task, CalendarEvent, ExpenseRecord } from '../../types';

interface Props {
  matter: Matter;
  onBack: () => void;
}

export const MatterDetailWorkspace: React.FC<Props> = ({ matter, onBack }) => {
  const {
    selectedMatterTab,
    setSelectedMatterTab,
    workflowStages,
    advanceMatterStage,
    updateMatter,
    tasks,
    calendarEvents,
    documents,
    messages,
    channels,
    sendMessage,
    convertMessageToTask,
    parties,
    proceedings,
    expenses,
    payments,
    auditLogs,
    users,
    currentUser,
    createTask,
    completeTask,
    recordCourtOutcome,
    uploadDocumentVersion,
    createExpenseRequest,
    isOnline,
  } = useApp();

  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);

  // New task form inside matter
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(currentUser.id);
  const [taskDue, setTaskDue] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);

  // Stage advance modal
  const [showStageModal, setShowStageModal] = useState(false);
  const [targetStageId, setTargetStageId] = useState(Math.min(matter.currentStageId + 1, 19));
  const [nextOwnerId, setNextOwnerId] = useState(currentUser.id);
  const [handoffNotes, setHandoffNotes] = useState('');

  // Court Outcome Modal
  const [selectedCourtEvent, setSelectedCourtEvent] = useState<CalendarEvent | null>(null);
  const [courtOutcomeText, setCourtOutcomeText] = useState('');
  const [courtStatusChoice, setCourtStatusChoice] = useState<'attended' | 'adjourned' | 'completed'>('attended');
  const [nextCourtDateInput, setNextCourtDateInput] = useState('');

  // Matter chat message input
  const [chatText, setChatText] = useState('');

  // Filter matter-scoped collections
  const matterTasks = tasks.filter((t) => t.matterId === matter.id);
  const matterEvents = calendarEvents.filter((e) => e.matterId === matter.id);
  const matterDocs = documents.filter((d) => d.matterId === matter.id);
  const matterParties = parties.filter((p) => p.matterId === matter.id);
  const matterProceedings = proceedings.filter((p) => p.matterId === matter.id);
  const matterExpenses = expenses.filter((e) => e.matterId === matter.id);
  const matterPayments = payments.filter((p) => p.matterId === matter.id);
  const matterAudit = auditLogs.filter((a) => a.matterId === matter.id);

  // Matter channel
  const matterChannel = channels.find((c) => c.matterId === matter.id) || channels[0];
  const matterMessages = messages.filter((m) => m.channelId === matterChannel.id);

  // Stage definition
  const currentStageDef = workflowStages.find((s) => s.id === matter.currentStageId);

  // Financial calculations
  const totalExpenses = matterExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalReceived = matterPayments.reduce((sum, p) => sum + p.amount, 0);
  const trustBalance = totalReceived - totalExpenses;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'workflow', label: `Workflow (Stage ${matter.currentStageId})` },
    { id: 'tasks', label: `Tasks (${matterTasks.length})` },
    { id: 'calendar', label: `Court & Dates (${matterEvents.length})` },
    { id: 'documents', label: `Documents (${matterDocs.length})` },
    { id: 'comms', label: `Channel (${matterMessages.length})` },
    { id: 'parties', label: `Parties (${matterParties.length})` },
    { id: 'court', label: `Proceedings (${matterProceedings.length})` },
    { id: 'medical', label: 'Medical & Evidence' },
    { id: 'finance', label: 'Finance & Ledger' },
    { id: 'timeline', label: 'Timeline & Audit' },
  ];

  const handleAdvanceStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    advanceMatterStage(matter.id, targetStageId, nextOwnerId, handoffNotes);
    setShowStageModal(false);
    setHandoffNotes('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    createTask({
      title: taskTitle,
      matterId: matter.id,
      stageId: matter.currentStageId,
      assignedTo: taskAssignee,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: `${taskDue}T17:00:00Z`,
    });
    setTaskTitle('');
    setShowNewTaskForm(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    sendMessage(matterChannel.id, chatText);
    setChatText('');
  };

  const handleSaveCourtOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourtEvent) return;
    recordCourtOutcome(selectedCourtEvent.id, courtStatusChoice, courtOutcomeText, nextCourtDateInput || undefined);
    setSelectedCourtEvent(null);
    setCourtOutcomeText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Persistent Matter Header (In accordance with Section 6 & 7) */}
      <div className="sticky top-0 z-20 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition mt-0.5"
              title="Back to matters list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm sm:text-base font-black text-amber-400">
                  {matter.internalReference}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-800/80">
                  Stage {matter.currentStageId}: {currentStageDef?.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {matter.originatingBranchId === 'branch-nairobi' ? 'Nairobi HQ' : 'Mombasa'}
                </span>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                  matter.priority === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {matter.priority} Priority
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-serif font-bold text-slate-100 mt-1">
                {matter.title}
              </h1>
            </div>
          </div>

          {/* Top Actions: Advance Stage, Close Matter */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowStageModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <span>Advance Stage</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto border-t border-slate-800/80 pt-2 no-scrollbar text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMatterTab(tab.id)}
              className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedMatterTab === tab.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab View Contents */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: OVERVIEW */}
        {selectedMatterTab === 'overview' && (
          <div className="space-y-6">
            {/* Next Action Callout Banner */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    Immediate Next Action
                  </div>
                  <div className="text-sm font-semibold text-slate-100 mt-0.5">{matter.nextAction}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMatterTab('tasks')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shrink-0 transition"
              >
                Go to Tasks
              </button>
            </div>

            {/* Matter Core Facts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Key Details Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800">
                  Case Master File
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-slate-400">Practice Area / Type:</div>
                    <div className="font-semibold text-slate-200">{matter.practiceArea} &bull; {matter.matterType}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Date Opened:</div>
                    <div className="font-mono text-slate-200">{new Date(matter.openedAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Supervising Advocate:</div>
                    <div className="font-semibold text-amber-400">
                      {users.find((u) => u.id === matter.supervisingUserId)?.fullName || 'Assigned Advocate'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Responsible Branch:</div>
                    <div className="text-slate-200">
                      {matter.responsibleBranchId === 'branch-nairobi' ? 'Nairobi Branch (HQ)' : 'Mombasa Branch'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Missing Documents & Stage Checklist */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Stage {matter.currentStageId} Checklist</span>
                  <span className="text-amber-400 font-mono">
                    {currentStageDef?.checklistItems.length || 0} items
                  </span>
                </h3>
                <div className="space-y-2">
                  {currentStageDef?.checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                      <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-[11px]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800">
                  Financial Ledger Snapshot
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Total Client Deposits:</span>
                    <span className="font-mono font-bold text-emerald-400">KES {totalReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Total Disbursements/Expenses:</span>
                    <span className="font-mono font-bold text-rose-400">KES {totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-sm bg-slate-950/50 p-2 rounded-lg">
                    <span className="text-slate-300">Client Trust Balance:</span>
                    <span className="font-mono text-amber-400">KES {trustBalance.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMatterTab('finance')}
                  className="w-full py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-center font-medium transition"
                >
                  Open Full Financial Ledger
                </button>
              </div>
            </div>

            {/* Case Summary Description */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Incident Narrative &amp; Facts of Case
              </h3>
              <p className="text-slate-300 leading-relaxed text-sm">{matter.summary}</p>
            </div>
          </div>
        )}

        {/* TAB 2: WORKFLOW & HANDOFFS */}
        {selectedMatterTab === 'workflow' && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  Personal Injury / RTA Standard 19-Stage Workflow
                </h3>
                <p className="text-slate-400">
                  Every stage tracks completion checklists, required documents, and role ownership handoffs.
                </p>
              </div>
              <button
                onClick={() => setShowStageModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition"
              >
                Handoff / Advance Stage
              </button>
            </div>

            {/* 19 Stages Visual Pipeline */}
            <div className="space-y-2">
              {workflowStages.map((stage) => {
                const isCurrent = stage.id === matter.currentStageId;
                const isPassed = stage.id < matter.currentStageId;

                return (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-amber-950/30 border-amber-500 shadow-md'
                        : isPassed
                        ? 'bg-slate-900/60 border-emerald-900/40 text-slate-400'
                        : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : isPassed
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPassed ? '✓' : stage.id}
                        </div>
                        <div>
                          <div className={`font-semibold text-sm ${isCurrent ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                            Stage {stage.id}: {stage.name}
                          </div>
                          <div className="text-slate-400 text-xs mt-0.5">{stage.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Target: {stage.targetDurationDays} days
                        </span>
                        <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          {stage.defaultRole}
                        </span>
                      </div>
                    </div>

                    {/* If current, show required checklist & docs */}
                    {isCurrent && (
                      <div className="mt-4 pt-3 border-t border-amber-800/40 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-amber-400 mb-1">Required Documents:</div>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                            {stage.requiredDocumentTypes.map((doc, i) => (
                              <li key={i}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold text-amber-400 mb-1">Stage Checklist:</div>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                            {stage.checklistItems.map((chk, i) => (
                              <li key={i}>{chk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TASKS & DEADLINES */}
        {selectedMatterTab === 'tasks' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Matter Tasks &amp; Preparation Deadlines
              </h3>
              <button
                onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>

            {/* Inline New Task Form */}
            {showNewTaskForm && (
              <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-200">New Task for this Matter</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Task title..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none"
                  />
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskForm(false)}
                    className="px-3 py-1 rounded bg-slate-800 text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {/* Task list */}
            <div className="space-y-2">
              {matterTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No tasks created for this matter yet.</div>
              ) : (
                matterTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => completeTask(t.id)}
                        className={`p-1.5 rounded-lg transition mt-0.5 ${
                          t.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <div>
                        <div className={`font-semibold text-sm ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.title}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-3">
                          <span>Assignee: {users.find((u) => u.id === t.assignedTo)?.fullName}</span>
                          <span>Due: {new Date(t.dueAt).toLocaleDateString()}</span>
                          {t.officialDeadlineAt && (
                            <span className="text-rose-400 font-mono">
                              Statutory Deadline: {new Date(t.officialDeadlineAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CALENDAR & COURT HEARINGS */}
        {selectedMatterTab === 'calendar' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Court Appearances &amp; Diarized Dates
              </h3>
            </div>

            <div className="space-y-3">
              {matterEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No court dates or events diarized.</div>
              ) : (
                matterEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{evt.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase font-mono">
                          {evt.eventType}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                          {evt.courtStatus || 'Scheduled'}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-1 flex items-center gap-4">
                        <span>📅 {new Date(evt.startAt).toLocaleString()}</span>
                        <span>📍 {evt.location}</span>
                      </div>
                      {evt.courtOutcome && (
                        <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          <strong className="text-amber-400">Court Outcome:</strong> {evt.courtOutcome}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCourtEvent(evt);
                          setCourtOutcomeText(evt.courtOutcome || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
                      >
                        Record Court Outcome
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Court Outcome Modal */}
            {selectedCourtEvent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <form onSubmit={handleSaveCourtOutcome} className="bg-slate-900 border border-slate-700 p-5 rounded-2xl w-full max-w-lg space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-100">
                    Record Court Hearing Outcome: {selectedCourtEvent.title}
                  </h3>
                  <div>
                    <label className="block text-slate-300 mb-1">Appearance Result / Status</label>
                    <select
                      value={courtStatusChoice}
                      onChange={(e) => setCourtStatusChoice(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                    >
                      <option value="attended">Attended &amp; Proceedings Recorded</option>
                      <option value="adjourned">Adjourned by Court / Consent</option>
                      <option value="completed">Concluded / Ruling Reserved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Judge Orders &amp; Outcome Notes</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Plaintiff cross-examined, court ordered parties to file closing submissions within 14 days..."
                      value={courtOutcomeText}
                      onChange={(e) => setCourtOutcomeText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Next Court Date (if ordered)</label>
                    <input
                      type="date"
                      value={nextCourtDateInput}
                      onChange={(e) => setNextCourtDateInput(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                    />
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      Automatically diarizes the next court appearance on the firm calendar.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCourtEvent(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
                    >
                      Save Outcome
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DOCUMENTS & VERSIONS */}
        {selectedMatterTab === 'documents' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Matter Documents &amp; Version History
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matterDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 cursor-pointer transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                        {doc.documentType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {doc.versions.length} version{doc.versions.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-200 mt-2">{doc.title}</div>
                    <div className="text-slate-400 text-xs mt-1">Category: {doc.category}</div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                    <span className="text-amber-400 hover:underline">View Document &amp; Versions →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Preview Modal */}
            {previewDoc && (
              <DocumentPreviewModal
                document={previewDoc}
                onClose={() => setPreviewDoc(null)}
              />
            )}
          </div>
        )}

        {/* TAB 6: CHANNEL & COMMUNICATIONS */}
        {selectedMatterTab === 'comms' && (
          <div className="space-y-4 text-xs h-[500px] flex flex-col">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-100">{matterChannel.name}</div>
                <div className="text-slate-400 text-[11px]">{matterChannel.description}</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Staff Thread
              </span>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              {matterMessages.map((msg) => {
                const sender = users.find((u) => u.id === msg.senderId);
                return (
                  <div key={msg.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{sender?.fullName || 'Staff'}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{msg.text}</p>

                    {/* Convert to Task Button */}
                    {!msg.convertedToTaskId && (
                      <button
                        onClick={() =>
                          convertMessageToTask(
                            msg.id,
                            `Follow up: ${msg.text.substring(0, 35)}...`,
                            currentUser.id,
                            new Date(Date.now() + 86400000).toISOString(),
                            'medium'
                          )
                        }
                        className="text-[10px] text-amber-400 hover:underline pt-1 inline-block"
                      >
                        + Convert Message to Task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type matter notes or mention @colleagues..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: PARTIES */}
        {selectedMatterTab === 'parties' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Matter Parties &amp; External Contacts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matterParties.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 text-sm">{p.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                      {p.partyType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-slate-400">{p.roleDescription}</div>
                  {p.phone && <div className="text-slate-300">📞 {p.phone}</div>}
                  {p.notes && <div className="text-slate-500 italic text-[11px]">{p.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: COURT PROCEEDINGS */}
        {selectedMatterTab === 'court' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Formal Court Proceedings
            </h3>
            {matterProceedings.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                No formal court suit filed yet (Pre-litigation stage).
              </div>
            ) : (
              matterProceedings.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-blue-400">{p.caseNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium uppercase">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">{p.courtName} &bull; {p.division}</div>
                  <div className="text-slate-400">Presiding: {p.judgeOrMagistrate}</div>
                  <div className="text-slate-400">Opposing Counsel: {p.opposingCounsel}</div>
                  {p.notes && <div className="p-2 bg-slate-950 rounded text-slate-300 text-[11px] mt-2">{p.notes}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 9: MEDICAL & EVIDENCE */}
        {selectedMatterTab === 'medical' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Personal Injury Evidence &amp; Medico-Legal Records
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-500" />
                  <span>Police &amp; NTSA Records</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Police Abstract obtained from Kasarani Traffic Base. Certified stamped copy in document vault. NTSA registered owner confirmed as Swift Shuttle SACCO Ltd.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-500" />
                  <span>Medical Examination &amp; Disability</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Dr. Ramesh Patel examination notes indicate 25% permanent partial disability resulting from compound right tibia fracture. Final medico-legal report awaited.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: FINANCE & LEDGER */}
        {selectedMatterTab === 'finance' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Total Client Funds Received:</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  KES {totalReceived.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Total Disbursements / Expenses:</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                  KES {totalExpenses.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Net Client Trust Balance:</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  KES {trustBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Matter Expenses Table */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider">
                  Disbursements &amp; Requisitions Log
                </h4>
              </div>
              <div className="space-y-2">
                {matterExpenses.length === 0 ? (
                  <div className="py-4 text-center text-slate-500">No expenses recorded for this matter.</div>
                ) : (
                  matterExpenses.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{e.description}</div>
                        <div className="text-slate-400 text-[11px]">
                          Category: {e.categoryId} &bull; Source: {e.paymentSource} &bull; Date: {new Date(e.spentAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-100">KES {e.amount.toLocaleString()}</div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                          {e.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: TIMELINE & AUDIT */}
        {selectedMatterTab === 'timeline' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Audit Trail &amp; Matter Event Timeline
            </h3>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {matterAudit.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-950" />
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 font-mono text-[11px] uppercase text-amber-400">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1 font-mono">
                      {JSON.stringify(log.metadata)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advance Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleAdvanceStageSubmit} className="bg-slate-900 border border-slate-700 p-5 rounded-2xl w-full max-w-lg space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-100">
              Advance Matter Stage: {matter.internalReference}
            </h3>
            <div>
              <label className="block text-slate-300 mb-1">Target Workflow Stage</label>
              <select
                value={targetStageId}
                onChange={(e) => setTargetStageId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
              >
                {workflowStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    Stage {s.id}: {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Assign New Stage Owner</label>
              <select
                value={nextOwnerId}
                onChange={(e) => setNextOwnerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.jobTitle})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Handoff Instructions &amp; Brief</label>
              <textarea
                rows={3}
                required
                placeholder="State completed stage outputs and handover tasks for new assignee..."
                value={handoffNotes}
                onChange={(e) => setHandoffNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStageModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Confirm Handoff
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
