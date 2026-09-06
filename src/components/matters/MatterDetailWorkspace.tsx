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
  Layers,
  Sparkles,
  Award,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { LegalDocument, Matter, Task, CalendarEvent, ExpenseRecord } from '../../types';

// Workflows & Stage-specific Components
import { StageTransitionModal } from './workflows/StageTransitionModal';
import { IncidentEvidenceWorkspace } from './workflows/IncidentEvidenceWorkspace';
import { MedicalManagementWorkspace } from './workflows/MedicalManagementWorkspace';
import { LiabilityQuantumWorkspace } from './workflows/LiabilityQuantumWorkspace';
import { ClaimNegotiationWorkspace } from './workflows/ClaimNegotiationWorkspace';
import { AuthorityToLitigateWorkspace } from './workflows/AuthorityToLitigateWorkspace';
import { PleadingsBundleWorkspace } from './workflows/PleadingsBundleWorkspace';
import { CourtFilingWorkspace } from './workflows/CourtFilingWorkspace';
import { ServiceQueueWorkspace } from './workflows/ServiceQueueWorkspace';
import { DefencePleadingsWorkspace } from './workflows/DefencePleadingsWorkspace';
import { PreTrialComplianceWorkspace } from './workflows/PreTrialComplianceWorkspace';
import { HearingPreparationWorkspace } from './workflows/HearingPreparationWorkspace';
import { CourtOutcomeWorkspace } from './workflows/CourtOutcomeWorkspace';
import { SubmissionsWorkspace } from './workflows/SubmissionsWorkspace';
import { JudgmentAwardWorkspace } from './workflows/JudgmentAwardWorkspace';
import { RecoveryExecutionWorkspace } from './workflows/RecoveryExecutionWorkspace';
import { SettlementDistributionWorkspace } from './workflows/SettlementDistributionWorkspace';
import { MatterClosureWizard } from './workflows/MatterClosureWizard';

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
    stageHandoffs,
    acknowledgeHandoff,
  } = useApp();

  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);

  // New task form inside matter
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(currentUser.id);
  const [taskDue, setTaskDue] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);

  // Stage advance modal
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedWorkflowStageView, setSelectedWorkflowStageView] = useState<number>(matter.currentStageId);
  const [showFullPipelineView, setShowFullPipelineView] = useState(false);

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
  const matterHandoffs = stageHandoffs.filter((h) => h.matterId === matter.id);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'workflow', label: `Workflow (Stage ${matter.currentStageId})` },
    { id: 'handoffs', label: `Handoffs (${matterHandoffs.length})` },
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
            {/* Stage Selector Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-500 font-bold uppercase text-[10px]">
                      Operational Legal Workspaces
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-800/80">
                      Active Stage: {matter.currentStageId} - {currentStageDef?.name}
                    </span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-slate-100 mt-1">
                    Stage-Specific Practice Workspaces &amp; Kenyan Litigation Compliance
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFullPipelineView(!showFullPipelineView)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showFullPipelineView ? 'Hide Pipeline Grid' : '19-Stage Pipeline'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowStageModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold shadow transition flex items-center gap-1.5"
                  >
                    <span>Advance Stage</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stage Quick Switcher Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 3, name: '3. Incident & Evidence' },
                  { id: 4, name: '4. Medical & Injury' },
                  { id: 5, name: '5. Liability & Quantum' },
                  { id: 6, name: '6. Insurer Negotiation' },
                  { id: 7, name: '7. Authority to Litigate' },
                  { id: 8, name: '8. Pleadings Drafting' },
                  { id: 9, name: '9. Court Filing & CTS' },
                  { id: 10, name: '10. Summons & Service' },
                  { id: 11, name: '11. Defence / Pleadings Close' },
                  { id: 12, name: '12. Pre-Trial Directions' },
                  { id: 13, name: '13. Hearing Preparation' },
                  { id: 14, name: '14. Hearing & Court Outcome' },
                  { id: 15, name: '15. Submissions' },
                  { id: 16, name: '16. Judgment & Decree' },
                  { id: 17, name: '17. Execution & Recovery' },
                  { id: 18, name: '18. Settlement Escrow' },
                  { id: 19, name: '19. Closure & Archive' },
                ].map((s) => {
                  const isCurrent = matter.currentStageId === s.id;
                  const isSelected = selectedWorkflowStageView === s.id;
                  const isPassed = matter.currentStageId > s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedWorkflowStageView(s.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-md'
                          : isCurrent
                          ? 'bg-amber-950/60 border border-amber-500 text-amber-300'
                          : isPassed
                          ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {isPassed && <span className="text-[10px]">✓</span>}
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional 19 Stages Full Pipeline Visualizer */}
            {showFullPipelineView && (
              <div className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-bold text-slate-100 text-sm">
                    Personal Injury 19-Stage Master Route Map &amp; Statutory SLA
                  </h4>
                  <span className="text-slate-400 text-xs font-mono">Kenyan Civil Procedure &amp; RTA Rules</span>
                </div>

                <div className="space-y-2">
                  {workflowStages.map((stage) => {
                    const isCurrent = stage.id === matter.currentStageId;
                    const isPassed = stage.id < matter.currentStageId;

                    return (
                      <div
                        key={stage.id}
                        onClick={() => {
                          setSelectedWorkflowStageView(stage.id);
                          setShowFullPipelineView(false);
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-950/30 border-amber-500 shadow-md'
                            : isPassed
                            ? 'bg-slate-900/60 border-emerald-900/40 text-slate-400 hover:border-slate-700'
                            : 'bg-slate-900/30 border-slate-800/60 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
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
                              <div className={`font-semibold text-xs ${isCurrent ? 'text-amber-300 font-bold' : 'text-slate-200'}`}>
                                Stage {stage.id}: {stage.name}
                              </div>
                              <div className="text-slate-400 text-[11px] mt-0.5">{stage.description}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              Target: {stage.targetDurationDays}d
                            </span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                              {stage.defaultRole}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DYNAMIC STAGE WORKSPACE RENDERING */}
            <div className="pt-2">
              {selectedWorkflowStageView === 3 && <IncidentEvidenceWorkspace matter={matter} />}
              {selectedWorkflowStageView === 4 && <MedicalManagementWorkspace matter={matter} />}
              {selectedWorkflowStageView === 5 && <LiabilityQuantumWorkspace matter={matter} />}
              {selectedWorkflowStageView === 6 && <ClaimNegotiationWorkspace matter={matter} />}
              {selectedWorkflowStageView === 7 && <AuthorityToLitigateWorkspace matter={matter} />}
              {selectedWorkflowStageView === 8 && <PleadingsBundleWorkspace matter={matter} />}
              {selectedWorkflowStageView === 9 && <CourtFilingWorkspace matter={matter} />}
              {selectedWorkflowStageView === 10 && <ServiceQueueWorkspace matter={matter} />}
              {selectedWorkflowStageView === 11 && <DefencePleadingsWorkspace matter={matter} />}
              {selectedWorkflowStageView === 12 && <PreTrialComplianceWorkspace matter={matter} />}
              {selectedWorkflowStageView === 13 && <HearingPreparationWorkspace matter={matter} />}
              {selectedWorkflowStageView === 14 && <CourtOutcomeWorkspace matter={matter} />}
              {selectedWorkflowStageView === 15 && <SubmissionsWorkspace matter={matter} />}
              {selectedWorkflowStageView === 16 && <JudgmentAwardWorkspace matter={matter} />}
              {selectedWorkflowStageView === 17 && <RecoveryExecutionWorkspace matter={matter} />}
              {selectedWorkflowStageView === 18 && <SettlementDistributionWorkspace matter={matter} />}
              {selectedWorkflowStageView === 19 && <MatterClosureWizard matter={matter} />}
              {![3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].includes(selectedWorkflowStageView) && (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                  <Shield className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="font-serif font-bold text-base text-slate-100">
                    Stage {selectedWorkflowStageView}: Standard Procedures
                  </h4>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Refer to the matter checklist, tasks, and communications for Stage {selectedWorkflowStageView} procedures.
                  </p>
                  <button
                    onClick={() => setSelectedWorkflowStageView(matter.currentStageId)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                  >
                    Return to Active Stage ({matter.currentStageId})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2.5: HANDOFFS & TRANSITION AUDIT */}
        {selectedMatterTab === 'handoffs' && (
          <div className="space-y-6 text-xs">
            {/* Header with KPI cards */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-500 font-bold uppercase text-[10px]">
                      Chain of Custody &amp; Operational Governance
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-800/80">
                      Active Matter Handoffs: {matterHandoffs.length}
                    </span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-slate-100 mt-1">
                    Stage Transitions, Inter-Departmental Delegation &amp; Acceptance Log
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Chronological audit trail of matter transfers across the 19-stage pipeline, stage gate checklists, and formal acknowledgments.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowStageModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold shadow transition flex items-center gap-1.5"
                  >
                    <span>Advance Next Stage</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Handoff Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Total Transitions</span>
                  <div className="text-lg font-mono font-bold text-slate-200">{matterHandoffs.length}</div>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono text-emerald-400">Acknowledged</span>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    {matterHandoffs.filter((h) => !!h.acknowledgedAt).length}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono text-amber-400">Pending Acceptance</span>
                  <div className="text-lg font-mono font-bold text-amber-400">
                    {matterHandoffs.filter((h) => !h.acknowledgedAt).length}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono text-blue-400">Supervising Partner</span>
                  <div className="text-xs font-semibold text-slate-300 truncate mt-1">
                    {users.find((u) => u.id === matter.supervisingUserId)?.fullName || matter.supervisingUserId}
                  </div>
                </div>
              </div>
            </div>

            {/* Handoff Timeline List */}
            {matterHandoffs.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="font-serif font-bold text-base text-slate-200">No Stage Transitions Recorded Yet</h4>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Initial matter intake established at Stage {matter.currentStageId}. Advance to subsequent litigation stages to record verified handoffs and delegate file responsibility.
                </p>
                <button
                  type="button"
                  onClick={() => setShowStageModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow transition"
                >
                  Advance Matter Stage
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {matterHandoffs.map((h, index) => {
                  const fromStageName = workflowStages.find((s) => s.id === h.fromStageId)?.name || `Stage ${h.fromStageId}`;
                  const toStageName = workflowStages.find((s) => s.id === h.toStageId)?.name || `Stage ${h.toStageId}`;
                  const fromUser = users.find((u) => u.id === h.fromUserId);
                  const toUser = users.find((u) => u.id === h.toUserId);
                  const ackUser = h.acknowledgedByUserId ? users.find((u) => u.id === h.acknowledgedByUserId) : null;
                  const isAcknowledged = !!h.acknowledgedAt;
                  const canAcknowledge =
                    !isAcknowledged &&
                    (h.toUserId === currentUser.id ||
                      currentUser.roles.includes('managing_partner') ||
                      currentUser.roles.includes('senior_partner') ||
                      currentUser.roles.includes('administrator'));

                  return (
                    <div
                      key={h.id}
                      className={`p-5 rounded-2xl border transition shadow-sm space-y-4 ${
                        isAcknowledged
                          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                          : 'bg-amber-950/20 border-amber-800/80 shadow-amber-950/20'
                      }`}
                    >
                      {/* Top Bar: Stages, Date, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                            Transition #{matterHandoffs.length - index}
                          </span>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                            <span className="px-2 py-0.5 rounded bg-slate-800/80 text-amber-300 font-mono text-[11px]">
                              Stage {h.fromStageId}: {fromStageName}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-700/80 text-amber-200 font-mono text-[11px]">
                              Stage {h.toStageId}: {toStageName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(h.createdAt).toLocaleString()}
                          </span>

                          {isAcknowledged ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Acknowledged
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 font-semibold text-[10px] flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Pending Acceptance
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Originator and Recipient Worker Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-mono text-slate-400">Transferring Worker</span>
                          <div className="flex items-center gap-2.5 mt-1">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                              {fromUser?.fullName ? fromUser.fullName.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-200 truncate">
                                {fromUser?.fullName || h.fromUserId}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {fromUser?.jobTitle || 'Legal Practitioner'} • {fromUser?.homeBranchId === 'branch-nairobi' ? 'Nairobi HQ' : 'Mombasa'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-mono text-amber-400">Incoming Stage Lead</span>
                          <div className="flex items-center gap-2.5 mt-1">
                            <div className="w-8 h-8 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0">
                              {toUser?.fullName ? toUser.fullName.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-amber-200 truncate">
                                {toUser?.fullName || h.toUserId}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {toUser?.jobTitle || 'Assigned Counsel'} • {toUser?.homeBranchId === 'branch-nairobi' ? 'Nairobi HQ' : 'Mombasa'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Handoff Notes & Instructions */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Handoff Instructions &amp; Action Notes</span>
                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 border-l-4 border-l-amber-500 text-slate-200 text-xs leading-relaxed">
                          {h.handoffNotes}
                        </div>
                      </div>

                      {/* Critical Next Action */}
                      {h.criticalNextAction && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span><strong>Critical Next Action:</strong> {h.criticalNextAction}</span>
                        </div>
                      )}

                      {/* Transition Checklist Verification */}
                      {h.checklistItems && h.checklistItems.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                            <span className="flex items-center gap-1.5 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              Stage Gate Checklist Verified Prior to Transfer
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {h.checklistItems.filter((i) => i.completed).length} / {h.checklistItems.length} Requirements Met
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {h.checklistItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                                {item.completed ? (
                                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                                ) : (
                                  <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500 shrink-0" />
                                )}
                                <span className={item.completed ? 'text-slate-300' : 'text-amber-400'}>
                                  {item.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supervisor Sign-Off If Present */}
                      {h.supervisorSignOff && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/50 text-[11px] text-emerald-300">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-bold">Partner Sign-off Verified:</span>{' '}
                              <span>{h.supervisorSignOff.signatureNote || 'Stage gate transition authorized'}</span>
                            </div>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400 shrink-0">
                            {new Date(h.supervisorSignOff.signedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {/* Acknowledgment Action / Status Bar */}
                      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {isAcknowledged ? (
                          <div className="flex items-center gap-2 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>
                              Accepted and acknowledged by{' '}
                              <strong>{ackUser?.fullName || 'Assigned Worker'}</strong> on{' '}
                              {new Date(h.acknowledgedAt!).toLocaleString()}.
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-400 text-xs">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>
                              Awaiting receipt acceptance from <strong>{toUser?.fullName || 'Incoming Stage Lead'}</strong>.
                            </span>
                          </div>
                        )}

                        {canAcknowledge && (
                          <button
                            type="button"
                            onClick={() => acknowledgeHandoff(h.id)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold shadow-lg flex items-center gap-2 transition shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Acknowledge Receipt &amp; Accept Responsibility</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

        {/* TAB: STAGE HANDOFFS & AUDIT */}
        {selectedMatterTab === 'handoffs' && (
          <div className="space-y-6 text-xs">
            {/* Header / Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/60 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono font-bold text-amber-500 tracking-widest">
                      Stage Governance &amp; Custody
                    </div>
                    <h3 className="font-serif font-bold text-base text-slate-100">
                      Stage Transfer &amp; Handover Audit Trail
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Immutable record of stage transitions, work briefs, delegated stage leads, and formal custody acknowledgments.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowStageModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow transition"
                  >
                    <span>Advance Stage</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Current Active Stage</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-400 flex items-center justify-center text-xs font-mono">
                      {matter.currentStageId}
                    </span>
                    <span>{workflowStages.find((s) => s.id === matter.currentStageId)?.name || `Stage ${matter.currentStageId}`}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Current Stage Lead</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    {users.find((u) => u.id === matter.currentStageOwnerId)?.fullName || matter.currentStageOwnerId || 'Unassigned'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Supervising Partner</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    {users.find((u) => u.id === matter.supervisingUserId)?.fullName || matter.supervisingUserId}
                  </div>
                </div>
              </div>
            </div>

            {/* Handoff Records Timeline */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
                <span>Chronological Handoff Log</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
                  {matterHandoffs.length} Transitions
                </span>
              </h4>

              {matterHandoffs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="font-semibold text-slate-300">No Stage Transitions Recorded Yet</div>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    When you advance this matter through its workflow stages, each handoff brief and delegate acceptance will log here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matterHandoffs.map((h, idx) => {
                    const fromUser = users.find((u) => u.id === h.fromUserId);
                    const toUser = users.find((u) => u.id === h.toUserId);
                    const fromStage = workflowStages.find((s) => s.id === h.fromStageId);
                    const toStage = workflowStages.find((s) => s.id === h.toStageId);
                    const isAcknowledged = !!h.acknowledgedAt;
                    const canAcknowledge =
                      !isAcknowledged &&
                      (currentUser.id === h.toUserId ||
                        currentUser.roles.includes('managing_partner') ||
                        currentUser.roles.includes('senior_partner'));

                    return (
                      <div
                        key={h.id}
                        className={`p-5 rounded-2xl border transition shadow-sm space-y-4 ${
                          isAcknowledged
                            ? 'bg-slate-900 border-slate-800'
                            : 'bg-amber-950/20 border-amber-700/80 shadow-amber-950/30 ring-1 ring-amber-600/30'
                        }`}
                      >
                        {/* Handoff Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
                              #{matterHandoffs.length - idx}
                            </span>
                            <div className="flex items-center gap-2 font-bold text-slate-200">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                                Stage {h.fromStageId} ({fromStage?.name || `Stage ${h.fromStageId}`})
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                                Stage {h.toStageId} ({toStage?.name || `Stage ${h.toStageId}`})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-mono text-[11px]">
                              {new Date(h.createdAt).toLocaleString()}
                            </span>
                            {isAcknowledged ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold text-[10px] flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Acknowledged</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-semibold text-[10px] flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>Pending Receipt</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Workers From / To */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                            <img
                              src={fromUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                            />
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase font-mono text-slate-500">Originating Stage Worker</div>
                              <div className="font-semibold text-slate-200 truncate">{fromUser?.fullName || h.fromUserId}</div>
                              <div className="text-[11px] text-slate-400 truncate">{fromUser?.jobTitle}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                            <img
                              src={toUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                            />
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase font-mono text-slate-500">Incoming Stage Lead</div>
                              <div className="font-semibold text-slate-200 truncate">{toUser?.fullName || h.toUserId}</div>
                              <div className="text-[11px] text-slate-400 truncate">{toUser?.jobTitle}</div>
                            </div>
                          </div>
                        </div>

                        {/* Handoff Brief */}
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="text-[10px] uppercase font-mono text-amber-500 font-bold">
                            Handoff Brief &amp; Critical Next Actions
                          </div>
                          <p className="text-slate-200 leading-relaxed text-xs whitespace-pre-line">
                            {h.handoffNotes}
                          </p>
                        </div>

                        {/* Acknowledgement Action / Status */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
                          {isAcknowledged ? (
                            <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>
                                Formally accepted on {new Date(h.acknowledgedAt!).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <div className="text-amber-400 flex items-center gap-1.5 font-mono text-[10px]">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Custody transfer awaiting acceptance by {toUser?.fullName || 'Assignee'}</span>
                            </div>
                          )}

                          {canAcknowledge && (
                            <button
                              onClick={() => acknowledgeHandoff(h.id)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow transition self-end sm:self-auto"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Acknowledge Receipt &amp; Accept Responsibility</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advance Stage Modal */}
      {showStageModal && (
        <StageTransitionModal
          matter={matter}
          onClose={() => setShowStageModal(false)}
        />
      )}
    </div>
  );
};
