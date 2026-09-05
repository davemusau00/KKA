import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  BranchId,
  UserProfile,
  Client,
  IntakeLead,
  IntakePartyInput,
  ConflictCheckRecord,
  ConflictMatch,
  IntakeKycRetainer,
  Matter,
  MatterParty,
  CourtProceeding,
  WorkflowStageDefinition,
  PracticeAreaWorkflow,
  WorkflowStageConfig,
  Task,
  Deadline,
  CalendarEvent,
  LegalDocument,
  DocumentVersion,
  CommunicationChannel,
  ChannelMessage,
  ExpenseRecord,
  FinancialAccount,
  PaymentReceipt,
  SystemNotification,
  AuditEvent,
  OfflineMutation,
  CourtEventStatus,
  TimeEntry,
  ApiSettingsConfig,
  FirmSettingsConfig,
  RoleId,
  PermissionKey,
  IncidentEvidenceData,
  MedicalCaseData,
  MedicalReportRequest,
  LiabilityQuantumData,
  ClaimNegotiationData,
  NegotiationLedgerItem,
  PleadingsBundleData,
  CourtFilingPackage,
  ServiceQueueItem,
  PreTrialComplianceData,
  HearingBriefData,
  JudgmentAwardData,
  RecoveryExecutionData,
  SettlementDistributionData,
  MatterClosureAuditData,
} from '../types';
import {
  SEED_BRANCHES,
  SEED_USERS,
  WORKFLOW_STAGES_PI,
  SEED_CLIENTS,
  SEED_INTAKES,
  SEED_MATTERS,
  SEED_PARTIES,
  SEED_PROCEEDINGS,
  SEED_TASKS,
  SEED_DEADLINES,
  SEED_CALENDAR_EVENTS,
  SEED_DOCUMENTS,
  SEED_CHANNELS,
  SEED_MESSAGES,
  SEED_ACCOUNTS,
  SEED_EXPENSES,
  SEED_PAYMENTS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
  SEED_TIME_ENTRIES,
  DEFAULT_API_SETTINGS,
} from '../data/seedData';
import {
  SEED_INCIDENT_EVIDENCE,
  SEED_MEDICAL_CASES,
  SEED_LIABILITY_QUANTUM,
  SEED_CLAIM_NEGOTIATION,
  SEED_PLEADINGS_BUNDLES,
  SEED_COURT_FILING_PACKAGES,
  SEED_SERVICE_QUEUE,
  SEED_PRE_TRIAL_COMPLIANCE,
  SEED_HEARING_BRIEFS,
  SEED_JUDGMENT_AWARDS,
  SEED_RECOVERY_EXECUTION,
  SEED_SETTLEMENT_DISTRIBUTIONS,
  SEED_CLOSURE_AUDITS,
} from '../data/legalWorkflowsSeedData';
import {
  INITIAL_ROLES,
  ALL_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  getEffectivePermissions,
} from '../data/rbacData';
import {
  SEED_PRACTICE_WORKFLOWS,
  WORKFLOW_STAGES_PI_CONFIG,
} from '../data/workflowEngineData';
import { DEFAULT_FIRM_SETTINGS } from '../data/settingsData';
import { evaluateTaskDependencies, canUpdateTaskStatus } from '../utils/taskDependencies';

export interface ActiveTimerState {
  matterId: string;
  activityType: TimeEntry['activityType'];
  startTimestamp: number;
  accumulatedSeconds: number;
  hourlyRate: number;
  isRunning: boolean;
}

interface AppContextType {
  // Navigation & session state
  activeWorkspace: string;
  setActiveWorkspace: (ws: string) => void;
  selectedMatterId: string | null;
  setSelectedMatterId: (id: string | null) => void;
  selectedMatterTab: string;
  setSelectedMatterTab: (tab: string) => void;
  
  // Personas & Branch Context
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  currentBranchFilter: 'all' | BranchId;
  setCurrentBranchFilter: (branch: 'all' | BranchId) => void;
  
  // RBAC
  rolePermissionsMap: Record<RoleId, PermissionKey[]>;
  updateRolePermissions: (role: RoleId, permissions: PermissionKey[]) => void;
  resetRolePermissionsToDefault: () => void;
  updateUserRoles: (userId: string, newRoles: RoleId[]) => void;
  hasUserPermission: (permission: PermissionKey) => boolean;
  hasUserAnyPermission: (permissions: PermissionKey[]) => boolean;
  effectivePermissions: Set<PermissionKey>;

  // Offline & Sync
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  mutationQueue: OfflineMutation[];
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
  
  // Integrations state
  googleConnected: boolean;
  setGoogleConnected: (connected: boolean) => void;
  whatsappEnabled: boolean;
  setWhatsappEnabled: (enabled: boolean) => void;
  emailDigestEnabled: boolean;
  setEmailDigestEnabled: (enabled: boolean) => void;

  // Search & Global Command Palette
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isQuickCreateOpen: boolean;
  setIsQuickCreateOpen: (open: boolean) => void;
  isSyncCenterOpen: boolean;
  setIsSyncCenterOpen: (open: boolean) => void;
  
  // Data Collections
  branches: typeof SEED_BRANCHES;
  users: UserProfile[];
  clients: Client[];
  intakes: IntakeLead[];
  matters: Matter[];
  parties: MatterParty[];
  proceedings: CourtProceeding[];
  workflowStages: WorkflowStageDefinition[];
  practiceWorkflows: PracticeAreaWorkflow[];
  tasks: Task[];
  deadlines: Deadline[];
  calendarEvents: CalendarEvent[];
  documents: LegalDocument[];
  channels: CommunicationChannel[];
  messages: ChannelMessage[];
  expenses: ExpenseRecord[];
  accounts: FinancialAccount[];
  payments: PaymentReceipt[];
  notifications: SystemNotification[];
  auditLogs: AuditEvent[];
  timeEntries: TimeEntry[];
  apiSettings: ApiSettingsConfig;
  firmSettings: FirmSettingsConfig;
  activeTimer: ActiveTimerState | null;

  // Domain Legal Workflows State Collections
  incidentEvidence: Record<string, IncidentEvidenceData>;
  medicalCases: Record<string, MedicalCaseData>;
  liabilityQuantums: Record<string, LiabilityQuantumData>;
  claimNegotiations: Record<string, ClaimNegotiationData>;
  pleadingsBundles: Record<string, PleadingsBundleData>;
  courtFilingPackages: CourtFilingPackage[];
  serviceQueue: ServiceQueueItem[];
  preTrialCompliances: Record<string, PreTrialComplianceData>;
  hearingBriefs: Record<string, HearingBriefData>;
  judgmentAwards: Record<string, JudgmentAwardData>;
  recoveryExecutions: Record<string, RecoveryExecutionData>;
  settlementDistributions: Record<string, SettlementDistributionData>;
  closureAudits: Record<string, MatterClosureAuditData>;

  // Intake & Conflict Workflow Functions
  createIntakeLead: (lead: Omit<IntakeLead, 'id' | 'createdAt' | 'disposition'>) => IntakeLead;
  updateIntakeLead: (id: string, updates: Partial<IntakeLead>) => void;
  runConflictSearch: (intakeId?: string, query?: string, candidateParties?: IntakePartyInput[]) => ConflictCheckRecord;
  recordConflictClearance: (intakeId: string, status: 'clear' | 'overridden_approved', notes?: string, partnerId?: string) => void;
  updateIntakeKycRetainer: (intakeId: string, kyc: Partial<IntakeKycRetainer>) => void;
  convertIntakeWithWorkflow: (
    intakeId: string,
    options?: {
      supervisingUserId?: string;
      stageOwnerId?: string;
      courtClerkId?: string;
      financeContactId?: string;
      initialAction?: string;
    }
  ) => Matter;

  // Workflow Engine functions
  createPracticeWorkflow: (workflow: Omit<PracticeAreaWorkflow, 'id' | 'createdAt' | 'updatedAt'>) => PracticeAreaWorkflow;
  updatePracticeWorkflow: (id: string, updates: Partial<PracticeAreaWorkflow>) => void;
  deletePracticeWorkflow: (id: string) => void;
  addStageToWorkflow: (workflowId: string, stage: WorkflowStageConfig) => void;
  updateStageInWorkflow: (workflowId: string, stageId: number, updates: Partial<WorkflowStageConfig>) => void;
  deleteStageFromWorkflow: (workflowId: string, stageId: number) => void;

  // Operational Functions
  createMatter: (data: Partial<Matter> & { clientDisplayName: string; clientPhone: string; clientNationalId: string }) => Matter;
  updateMatter: (id: string, updates: Partial<Matter>) => void;
  advanceMatterStage: (matterId: string, toStageId: number, newOwnerId: string, handoffNotes: string) => void;
  advanceMatterStageExpanded: (
    matterId: string,
    toStageId: number,
    newOwnerId: string,
    handoffNotes: string,
    options?: { generateStandardTasks?: boolean; handoffChecklistCompleted?: boolean }
  ) => { success: boolean; error?: string };
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  convertIntakeToMatter: (intakeId: string) => void;

  // Domain Sub-Workflows Mutators
  updateIncidentEvidence: (matterId: string, updates: Partial<IncidentEvidenceData>) => void;
  updateMedicalCase: (matterId: string, updates: Partial<MedicalCaseData>) => void;
  updateMedicalReportRequest: (matterId: string, requestId: string, updates: Partial<MedicalReportRequest>) => void;
  updateLiabilityQuantum: (matterId: string, updates: Partial<LiabilityQuantumData>) => void;
  updateClaimNegotiation: (matterId: string, updates: Partial<ClaimNegotiationData>) => void;
  addNegotiationEntry: (matterId: string, entry: Omit<NegotiationLedgerItem, 'id'>) => void;
  approveSettlementOffer: (matterId: string, recommendedAmount: number, clientAuthorized: boolean, partnerApproved: boolean) => void;
  updatePleadingsBundle: (matterId: string, updates: Partial<PleadingsBundleData>) => void;
  
  // Court Filing & Service Queue
  createCourtFilingPackage: (pkg: Omit<CourtFilingPackage, 'id'>) => CourtFilingPackage;
  updateCourtFilingPackage: (id: string, updates: Partial<CourtFilingPackage>) => void;
  createServiceQueueItem: (item: Omit<ServiceQueueItem, 'id'>) => ServiceQueueItem;
  updateServiceQueueItem: (id: string, updates: Partial<ServiceQueueItem>) => void;
  addServiceAttempt: (id: string, attempt: { attemptNo: number; date: string; outcome: string; notes: string }) => void;

  // Pre-Trial & Hearing
  updatePreTrialCompliance: (matterId: string, updates: Partial<PreTrialComplianceData>) => void;
  updateHearingBrief: (matterId: string, updates: Partial<HearingBriefData>) => void;
  propagateCourtOutcomeDetailed: (
    matterId: string,
    outcomeData: {
      outcomeType: 'ruling_delivered' | 'judgment_delivered' | 'hearing_conducted' | 'adjourned' | 'directions_given' | 'mention_held';
      ordersSummary: string;
      nextDate?: string;
      nextEventType?: string;
      directions?: string;
      costsAwardedKes?: number;
      tasksToCreate?: { title: string; assignedTo: string; dueDays: number }[];
      sendSms?: boolean;
      smsText?: string;
    }
  ) => void;

  // Judgment, Recovery, Settlement, Closure
  updateJudgmentAward: (matterId: string, updates: Partial<JudgmentAwardData>) => void;
  triggerRecoveryFromJudgment: (matterId: string) => void;
  updateRecoveryExecution: (matterId: string, updates: Partial<RecoveryExecutionData>) => void;
  updateSettlementDistribution: (matterId: string, updates: Partial<SettlementDistributionData>) => void;
  disburseClientSettlement: (matterId: string, paymentMethod: 'M-Pesa B2C' | 'Bank Wire' | 'Cheque', ref: string) => void;
  updateClosureAudit: (matterId: string, updates: Partial<MatterClosureAuditData>) => void;
  finalizeMatterClosureWizard: (matterId: string, audit: MatterClosureAuditData) => void;

  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>, force?: boolean) => { success: boolean; error?: string };
  completeTask: (id: string, force?: boolean) => { success: boolean; error?: string };
  createCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  recordCourtOutcome: (eventId: string, status: CourtEventStatus, outcomeNotes: string, nextHearingDate?: string) => void;
  uploadDocumentVersion: (documentId: string, file: { name: string; size: number; mimeType?: string; changeSummary?: string; contentSnippet?: string }, notes?: string) => void;
  submitDocumentForReview: (documentId: string, versionId: string, reviewNotes?: string) => void;
  approveDocumentVersion: (documentId: string, versionId: string, comment?: string) => void;
  rejectDocumentVersion: (documentId: string, versionId: string, reason: string) => void;
  signDocumentVersion: (documentId: string, versionId: string, signatureHash?: string) => void;
  revertDocumentToVersion: (documentId: string, targetVersionId: string, revertNotes?: string) => DocumentVersion | null;
  markDocumentFiled: (documentId: string, versionId: string, filingRef: string) => void;
  createExpenseRequest: (expense: Omit<ExpenseRecord, 'id' | 'createdAt' | 'status'>) => ExpenseRecord;
  approveExpense: (expenseId: string) => void;
  disburseExpense: (expenseId: string, paymentSource: 'Petty Cash' | 'Office Bank Account') => void;
  recordPaymentReceipt: (receipt: Omit<PaymentReceipt, 'id' | 'createdAt'>) => PaymentReceipt;
  recordTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'isBilled'>) => TimeEntry;
  startTimer: (matterId: string, activityType: TimeEntry['activityType'], hourlyRate?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndLogTimer: (notes?: string) => TimeEntry | null;
  discardTimer: () => void;
  updateApiSettings: (settings: Partial<ApiSettingsConfig>) => void;
  updateFirmSettings: (settings: Partial<FirmSettingsConfig>) => void;
  sendMessage: (channelId: string, text: string, mentions?: string[], attachments?: { name: string; size: string }[]) => void;
  convertMessageToTask: (messageId: string, title: string, assigneeId: string, dueAt: string, priority: Task['priority']) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  resetToDemoData: () => void;
  resetDataToDefault: () => void;
  notify: (recipientId: string, title: string, message: string, category?: SystemNotification['category'], matterId?: string, urgency?: SystemNotification['urgency']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kklaw_os_state_v1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [activeWorkspace, setActiveWorkspace] = useState<string>('dashboard');
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [selectedMatterTab, setSelectedMatterTab] = useState<string>('overview');

  // Persona & Branch
  const [currentUser, setCurrentUser] = useState<UserProfile>(SEED_USERS[0]); // Senior Partner
  const [currentBranchFilter, setCurrentBranchFilter] = useState<'all' | BranchId>('all');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(true);
  const [mutationQueue, setMutationQueue] = useState<OfflineMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Integrations
  const [googleConnected, setGoogleConnected] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);

  // Core Data Collections
  const [branches] = useState<typeof SEED_BRANCHES>(SEED_BRANCHES);
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : SEED_USERS;
  });
  const [workflowStages] = useState<WorkflowStageDefinition[]>(WORKFLOW_STAGES_PI);

  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<RoleId, PermissionKey[]>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_role_permissions`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const initial: Record<RoleId, PermissionKey[]> = {
      managing_partner: [...INITIAL_ROLES.managing_partner.defaultPermissions],
      senior_partner: [...INITIAL_ROLES.senior_partner.defaultPermissions],
      advocate: [...INITIAL_ROLES.advocate.defaultPermissions],
      paralegal: [...INITIAL_ROLES.paralegal.defaultPermissions],
      administrator: [...INITIAL_ROLES.administrator.defaultPermissions],
      court_clerk: [...INITIAL_ROLES.court_clerk.defaultPermissions],
      finance_officer: [...INITIAL_ROLES.finance_officer.defaultPermissions],
      technical_admin: [...INITIAL_ROLES.technical_admin.defaultPermissions],
    };
    return initial;
  });

  const [practiceWorkflows, setPracticeWorkflows] = useState<PracticeAreaWorkflow[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_practice_workflows`);
    return saved ? JSON.parse(saved) : SEED_PRACTICE_WORKFLOWS;
  });

  const [firmSettings, setFirmSettings] = useState<FirmSettingsConfig>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_firm_settings`);
    return saved ? JSON.parse(saved) : DEFAULT_FIRM_SETTINGS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_clients`);
    return saved ? JSON.parse(saved) : SEED_CLIENTS;
  });

  const [intakes, setIntakes] = useState<IntakeLead[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_intakes`);
    return saved ? JSON.parse(saved) : SEED_INTAKES;
  });

  const [matters, setMatters] = useState<Matter[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_matters`);
    return saved ? JSON.parse(saved) : SEED_MATTERS;
  });

  const [parties, setParties] = useState<MatterParty[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_parties`);
    return saved ? JSON.parse(saved) : SEED_PARTIES;
  });

  const [proceedings, setProceedings] = useState<CourtProceeding[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_proceedings`);
    return saved ? JSON.parse(saved) : SEED_PROCEEDINGS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_tasks`);
    return saved ? JSON.parse(saved) : SEED_TASKS;
  });

  const [deadlines, setDeadlines] = useState<Deadline[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_deadlines`);
    return saved ? JSON.parse(saved) : SEED_DEADLINES;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_events`);
    return saved ? JSON.parse(saved) : SEED_CALENDAR_EVENTS;
  });

  const [documents, setDocuments] = useState<LegalDocument[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_documents`);
    return saved ? JSON.parse(saved) : SEED_DOCUMENTS;
  });

  const [channels, setChannels] = useState<CommunicationChannel[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_channels`);
    return saved ? JSON.parse(saved) : SEED_CHANNELS;
  });

  const [messages, setMessages] = useState<ChannelMessage[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_messages`);
    return saved ? JSON.parse(saved) : SEED_MESSAGES;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : SEED_EXPENSES;
  });

  const [accounts, setAccounts] = useState<FinancialAccount[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_accounts`);
    return saved ? JSON.parse(saved) : SEED_ACCOUNTS;
  });

  const [payments, setPayments] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : SEED_PAYMENTS;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
  });

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_time_entries`);
    return saved ? JSON.parse(saved) : SEED_TIME_ENTRIES;
  });

  const [apiSettings, setApiSettings] = useState<ApiSettingsConfig>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_api_settings`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_API_SETTINGS,
          ...parsed,
          google: {
            ...DEFAULT_API_SETTINGS.google,
            ...(parsed.google || parsed.googleWorkspace || {}),
          },
          whatsapp: {
            ...DEFAULT_API_SETTINGS.whatsapp,
            ...(parsed.whatsapp || {}),
          },
          judiciaryCts: {
            ...DEFAULT_API_SETTINGS.judiciaryCts,
            ...(parsed.judiciaryCts || {}),
          },
          mpesaDaraja: {
            ...DEFAULT_API_SETTINGS.mpesaDaraja,
            ...(parsed.mpesaDaraja || {}),
          },
          africasTalkingSms: {
            ...DEFAULT_API_SETTINGS.africasTalkingSms,
            ...(parsed.africasTalkingSms || {}),
          },
        };
      } catch {
        return DEFAULT_API_SETTINGS;
      }
    }
    return DEFAULT_API_SETTINGS;
  });

  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_active_timer`);
    return saved ? JSON.parse(saved) : null;
  });

  // Domain legal workflow states
  const [incidentEvidence, setIncidentEvidence] = useState<Record<string, IncidentEvidenceData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_incident_evidence`);
    return saved ? JSON.parse(saved) : SEED_INCIDENT_EVIDENCE;
  });

  const [medicalCases, setMedicalCases] = useState<Record<string, MedicalCaseData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_medical_cases`);
    return saved ? JSON.parse(saved) : SEED_MEDICAL_CASES;
  });

  const [liabilityQuantums, setLiabilityQuantums] = useState<Record<string, LiabilityQuantumData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_liability_quantum`);
    return saved ? JSON.parse(saved) : SEED_LIABILITY_QUANTUM;
  });

  const [claimNegotiations, setClaimNegotiations] = useState<Record<string, ClaimNegotiationData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_claim_negotiations`);
    return saved ? JSON.parse(saved) : SEED_CLAIM_NEGOTIATION;
  });

  const [pleadingsBundles, setPleadingsBundles] = useState<Record<string, PleadingsBundleData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pleadings_bundles`);
    return saved ? JSON.parse(saved) : SEED_PLEADINGS_BUNDLES;
  });

  const [courtFilingPackages, setCourtFilingPackages] = useState<CourtFilingPackage[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_court_filings`);
    return saved ? JSON.parse(saved) : SEED_COURT_FILING_PACKAGES;
  });

  const [serviceQueue, setServiceQueue] = useState<ServiceQueueItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_service_queue`);
    return saved ? JSON.parse(saved) : SEED_SERVICE_QUEUE;
  });

  const [preTrialCompliances, setPreTrialCompliances] = useState<Record<string, PreTrialComplianceData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pretrial_compliance`);
    return saved ? JSON.parse(saved) : SEED_PRE_TRIAL_COMPLIANCE;
  });

  const [hearingBriefs, setHearingBriefs] = useState<Record<string, HearingBriefData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_hearing_briefs`);
    return saved ? JSON.parse(saved) : SEED_HEARING_BRIEFS;
  });

  const [judgmentAwards, setJudgmentAwards] = useState<Record<string, JudgmentAwardData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_judgment_awards`);
    return saved ? JSON.parse(saved) : SEED_JUDGMENT_AWARDS;
  });

  const [recoveryExecutions, setRecoveryExecutions] = useState<Record<string, RecoveryExecutionData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_recovery_executions`);
    return saved ? JSON.parse(saved) : SEED_RECOVERY_EXECUTION;
  });

  const [settlementDistributions, setSettlementDistributions] = useState<Record<string, SettlementDistributionData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settlement_distributions`);
    return saved ? JSON.parse(saved) : SEED_SETTLEMENT_DISTRIBUTIONS;
  });

  const [closureAudits, setClosureAudits] = useState<Record<string, MatterClosureAuditData>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_closure_audits`);
    return saved ? JSON.parse(saved) : SEED_CLOSURE_AUDITS;
  });

  // Local storage auto-sync
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_role_permissions`, JSON.stringify(rolePermissionsMap));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_practice_workflows`, JSON.stringify(practiceWorkflows));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_firm_settings`, JSON.stringify(firmSettings));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_clients`, JSON.stringify(clients));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_intakes`, JSON.stringify(intakes));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_matters`, JSON.stringify(matters));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_parties`, JSON.stringify(parties));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_proceedings`, JSON.stringify(proceedings));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_deadlines`, JSON.stringify(deadlines));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_events`, JSON.stringify(calendarEvents));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_documents`, JSON.stringify(documents));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_channels`, JSON.stringify(channels));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_messages`, JSON.stringify(messages));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_accounts`, JSON.stringify(accounts));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_time_entries`, JSON.stringify(timeEntries));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_api_settings`, JSON.stringify(apiSettings));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_incident_evidence`, JSON.stringify(incidentEvidence));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_medical_cases`, JSON.stringify(medicalCases));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_liability_quantum`, JSON.stringify(liabilityQuantums));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_claim_negotiations`, JSON.stringify(claimNegotiations));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_pleadings_bundles`, JSON.stringify(pleadingsBundles));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_court_filings`, JSON.stringify(courtFilingPackages));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_service_queue`, JSON.stringify(serviceQueue));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_pretrial_compliance`, JSON.stringify(preTrialCompliances));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_hearing_briefs`, JSON.stringify(hearingBriefs));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_judgment_awards`, JSON.stringify(judgmentAwards));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_recovery_executions`, JSON.stringify(recoveryExecutions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_settlement_distributions`, JSON.stringify(settlementDistributions));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_closure_audits`, JSON.stringify(closureAudits));
    if (activeTimer) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_active_timer`, JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_active_timer`);
    }
  }, [
    users,
    rolePermissionsMap,
    practiceWorkflows,
    firmSettings,
    clients,
    intakes,
    matters,
    parties,
    proceedings,
    tasks,
    deadlines,
    calendarEvents,
    documents,
    channels,
    messages,
    expenses,
    accounts,
    payments,
    notifications,
    auditLogs,
    timeEntries,
    apiSettings,
    incidentEvidence,
    medicalCases,
    liabilityQuantums,
    claimNegotiations,
    pleadingsBundles,
    courtFilingPackages,
    serviceQueue,
    preTrialCompliances,
    hearingBriefs,
    judgmentAwards,
    recoveryExecutions,
    settlementDistributions,
    closureAudits,
    activeTimer,
  ]);

  // Global keyboard shortcuts (Cmd+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Operational Logging helper
  const logAudit = useCallback((action: string, entityType: AuditEvent['entityType'], entityId: string, matterId?: string, metadata: Record<string, unknown> = {}) => {
    const newLog: AuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorUserId: currentUser.id,
      action,
      entityType,
      entityId,
      matterId,
      timestamp: new Date().toISOString(),
      metadata,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, [currentUser.id]);

  // Push Notification helper
  const notify = useCallback((recipientId: string, title: string, message: string, category: SystemNotification['category'], matterId?: string, urgency: SystemNotification['urgency'] = 'normal') => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientUserId: recipientId,
      category,
      title,
      message,
      matterId,
      isRead: false,
      createdAt: new Date().toISOString(),
      urgency,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // Queue offline mutation helper
  const queueMutation = useCallback((entityType: OfflineMutation['entityType'], operation: OfflineMutation['operation'], payload: Record<string, unknown>) => {
    const newMutation: OfflineMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setMutationQueue((prev) => [...prev, newMutation]);
  }, []);

  // Trigger sync of offline mutations
  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    // Simulate server synchronization
    await new Promise((resolve) => setTimeout(resolve, 900));
    setMutationQueue((prev) => prev.map((m) => ({ ...m, status: 'synced' })));
    setTimeout(() => {
      setMutationQueue([]);
      setIsSyncing(false);
    }, 400);
  }, []);

  // Matter Creation
  const createMatter = useCallback((data: Partial<Matter> & { clientDisplayName: string; clientPhone: string; clientNationalId: string }) => {
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const nextSeq = (matters.length + 1).toString().padStart(5, '0');
    const internalReference = `KKC/PI/${currentYear}/${nextSeq}`;

    let clientId = data.clientId;
    if (!clientId) {
      // Auto-create client if not existing
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        clientType: 'person',
        displayName: data.clientDisplayName,
        idNumber: data.clientNationalId || 'N/A',
        phone: data.clientPhone,
        email: `${data.clientDisplayName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        status: 'active',
        preferredContactMethod: 'phone',
        createdAt: now,
        updatedAt: now,
      };
      setClients((prev) => [newClient, ...prev]);
      clientId = newClient.id;
    }

    const newMatter: Matter = {
      id: `mat-${Date.now()}`,
      internalReference,
      title: data.title || `${data.clientDisplayName} v. Registered Owner & Driver`,
      clientId,
      practiceArea: data.practiceArea || 'Personal Injury',
      matterType: data.matterType || 'Road Traffic Accident (RTA) Personal Injury',
      workflowTemplateId: 'wf-pi-rta',
      originatingBranchId: data.originatingBranchId || currentUser.homeBranchId,
      responsibleBranchId: data.responsibleBranchId || currentUser.homeBranchId,
      supervisingUserId: data.supervisingUserId || 'usr-partner',
      currentStageId: 1, // Lead / Referral
      openedAt: now,
      status: 'active',
      priority: data.priority || 'medium',
      summary: data.summary || 'Newly opened personal injury claim.',
      nextAction: 'Complete intake checklist and verify incident police abstract.',
      courtProceedingIds: [],
      assignedUserIds: [currentUser.id, data.supervisingUserId || 'usr-partner'],
      lastActivityAt: now,
    };

    setMatters((prev) => [newMatter, ...prev]);

    // Create automatic initial task
    const initialTask: Task = {
      id: `tsk-${Date.now()}`,
      title: `Complete intake checklist for ${newMatter.internalReference}`,
      description: 'Collect identification copy, signed retainer agreement, and occurrence book / police details.',
      matterId: newMatter.id,
      stageId: 1,
      assignedTo: currentUser.id,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [initialTask, ...prev]);

    // Create dedicated matter channel
    const matterChannel: CommunicationChannel = {
      id: `chn-${newMatter.id}`,
      type: 'matter',
      name: `${newMatter.internalReference}: ${newMatter.title.substring(0, 30)}...`,
      description: `Matter communication log for ${newMatter.internalReference}`,
      matterId: newMatter.id,
      memberUserIds: [currentUser.id, 'usr-partner'],
    };
    setChannels((prev) => [...prev, matterChannel]);

    logAudit('matter.created', 'matter', newMatter.id, newMatter.id, { internalReference, title: newMatter.title });
    notify(data.supervisingUserId || 'usr-partner', 'New Matter Opened', `${currentUser.fullName} opened matter ${internalReference}`, 'assignment', newMatter.id);

    if (!isOnline) {
      queueMutation('task', 'create', { matterId: newMatter.id, title: initialTask.title });
    }

    return newMatter;
  }, [matters.length, currentUser, isOnline, logAudit, notify, queueMutation]);

  // Update Matter
  const updateMatter = useCallback((id: string, updates: Partial<Matter>) => {
    setMatters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, lastActivityAt: new Date().toISOString() } : m))
    );
    logAudit('matter.updated', 'matter', id, id, updates);
  }, [logAudit]);

  // Advance Stage with Handoff
  const advanceMatterStage = useCallback((matterId: string, toStageId: number, newOwnerId: string, handoffNotes: string) => {
    const targetMatter = matters.find((m) => m.id === matterId);
    if (!targetMatter) return;

    const fromStageId = targetMatter.currentStageId;
    const now = new Date().toISOString();

    // Match workflow stage configuration from practiceWorkflows
    const targetWf = practiceWorkflows.find(
      (w) => w.practiceArea.toLowerCase() === targetMatter.practiceArea.toLowerCase()
    ) || practiceWorkflows[0];
    const targetStageConfig = targetWf?.stages.find((s) => s.id === toStageId);
    const stageName = targetStageConfig?.name || WORKFLOW_STAGES_PI.find((s) => s.id === toStageId)?.name || 'Next Stage';

    setMatters((prev) =>
      prev.map((m) =>
        m.id === matterId
          ? {
              ...m,
              currentStageId: toStageId,
              supervisingUserId: newOwnerId,
              assignedUserIds: Array.from(new Set([...m.assignedUserIds, newOwnerId])),
              lastActivityAt: now,
              nextAction: `Stage ${toStageId}: ${stageName} in progress.`,
            }
          : m
      )
    );

    // Create primary stage handoff task for new owner
    const handoffTask: Task = {
      id: `tsk-${Date.now()}`,
      title: `Execute Stage ${toStageId}: ${stageName}`,
      description: `Handoff notes from ${currentUser.fullName}: ${handoffNotes}`,
      matterId,
      stageId: toStageId,
      assignedTo: newOwnerId,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + (targetStageConfig?.targetDurationDays || 7) * 86400000).toISOString(),
      createdAt: now,
      updatedAt: now,
      dependsOnTaskIds: [],
    };

    const newTasksToAdd: Task[] = [handoffTask];

    // Automatically provision stage-specific tasks defined in workflow template
    if (targetStageConfig?.autoCreateTasks && targetStageConfig.autoCreateTasks.length > 0) {
      targetStageConfig.autoCreateTasks.forEach((tpl, idx) => {
        // Resolve assignee: if role matches newOwner or default to newOwnerId
        const autoTask: Task = {
          id: `tsk-auto-${Date.now()}-${idx + 1}`,
          title: tpl.title,
          description: `Auto-generated workflow checklist task for Stage ${toStageId} (${stageName}). Role: ${tpl.role}`,
          matterId,
          stageId: toStageId,
          assignedTo: newOwnerId,
          createdBy: currentUser.id,
          priority: tpl.priority,
          status: 'todo',
          dueAt: new Date(Date.now() + tpl.dueInDays * 86400000).toISOString(),
          createdAt: now,
          updatedAt: now,
          dependsOnTaskIds: idx > 0 ? [handoffTask.id] : [],
        };
        newTasksToAdd.push(autoTask);
      });
    }

    setTasks((prev) => [...newTasksToAdd, ...prev]);

    logAudit('matter.stage_changed', 'handoff', matterId, matterId, {
      fromStage: fromStageId,
      toStage: toStageId,
      newOwner: newOwnerId,
      notes: handoffNotes,
      autoTasksCreated: newTasksToAdd.length,
    });

    notify(
      newOwnerId,
      `Matter Reassigned (Stage ${toStageId})`,
      `${currentUser.fullName} transferred ${targetMatter.internalReference} (${stageName}) to you. Notes: ${handoffNotes}`,
      'assignment',
      matterId,
      'urgent'
    );
  }, [matters, practiceWorkflows, currentUser, logAudit, notify]);

  // Intake & Conflict Workflow Functions
  const createIntakeLead = useCallback((leadData: Omit<IntakeLead, 'id' | 'createdAt' | 'disposition'>): IntakeLead => {
    const now = new Date().toISOString();
    const newIntake: IntakeLead = {
      ...leadData,
      id: `intake-${Date.now()}`,
      disposition: 'inquiry',
      potentialParties: leadData.potentialParties || [],
      createdAt: now,
    };

    // Perform initial automatic conflict search
    const candidateParties: IntakePartyInput[] = [
      {
        id: `pt-${Date.now()}-1`,
        name: newIntake.clientName,
        role: 'plaintiff',
        idOrRegNumber: newIntake.nationalId,
        phone: newIntake.phone,
        email: newIntake.email,
      },
      ...(newIntake.potentialParties || []),
    ];

    const matches: ConflictMatch[] = [];
    candidateParties.forEach((cand) => {
      const q = cand.name.trim().toLowerCase();
      if (!q || q.length < 3) return;

      // 1. Check against clients
      clients.forEach((c) => {
        if (c.displayName.toLowerCase().includes(q)) {
          matches.push({
            id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            partyName: cand.name,
            matchedEntity: c.displayName,
            matchedRole: 'Existing Client',
            matchType: 'exact_name',
            severity: 'high',
            details: `Name closely matches active client record: ${c.displayName} (${c.idNumber || 'No ID'}).`,
          });
        }
      });

      // 2. Check against matter parties (especially adverse parties)
      parties.forEach((p) => {
        if (p.name.toLowerCase().includes(q) || (p.organizationName && p.organizationName.toLowerCase().includes(q))) {
          const matchedMatter = matters.find((m) => m.id === p.matterId);
          const isAdverse = p.partyType === 'defendant' || p.partyType === 'insurer' || p.partyType === 'advocate_opposing';
          matches.push({
            id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            partyName: cand.name,
            matchedEntity: p.name,
            matchedMatterId: p.matterId,
            matchedMatterRef: matchedMatter?.internalReference,
            matchedMatterTitle: matchedMatter?.title,
            matchedRole: p.partyType,
            matchType: isAdverse ? 'adverse_party' : 'exact_name',
            severity: isAdverse ? 'critical' : 'high',
            details: `Matched ${p.partyType} in Matter ${matchedMatter?.internalReference || p.matterId} (${matchedMatter?.title || ''}).`,
          });
        }
      });
    });

    const conflictRecord: ConflictCheckRecord = {
      id: `conf-${Date.now()}`,
      intakeId: newIntake.id,
      checkedByUserId: currentUser.id,
      checkedAt: now,
      status: matches.length > 0 ? (matches.some((m) => m.severity === 'critical') ? 'conflict_detected' : 'possible_match') : 'clear',
      partiesSearched: candidateParties.map((p) => p.name),
      matchesFound: matches,
    };

    newIntake.conflictCheck = conflictRecord;
    setIntakes((prev) => [newIntake, ...prev]);
    logAudit('intake.created', 'client', newIntake.id, undefined, {
      clientName: newIntake.clientName,
      conflictStatus: conflictRecord.status,
    });

    if (conflictRecord.status !== 'clear') {
      notify(
        'usr-partner',
        'Potential Conflict Detected on Intake',
        `Intake "${newIntake.clientName}" triggered ${matches.length} conflict match(es). Partner review required.`,
        'system',
        undefined,
        'urgent'
      );
    }

    return newIntake;
  }, [clients, parties, matters, currentUser.id, logAudit, notify]);

  const updateIntakeLead = useCallback((id: string, updates: Partial<IntakeLead>) => {
    setIntakes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const runConflictSearch = useCallback((intakeId?: string, query?: string, candidateParties?: IntakePartyInput[]): ConflictCheckRecord => {
    const now = new Date().toISOString();
    const searchParties: { name: string; idOrReg?: string; phone?: string; role?: string }[] = [];

    if (candidateParties && candidateParties.length > 0) {
      candidateParties.forEach((p) => searchParties.push({ name: p.name, idOrReg: p.idOrRegNumber, phone: p.phone, role: p.role }));
    }
    if (query && query.trim()) {
      searchParties.push({ name: query.trim() });
    }

    const matches: ConflictMatch[] = [];

    searchParties.forEach((item) => {
      const qName = item.name.toLowerCase().trim();
      if (!qName || qName.length < 2) return;

      // Scan clients
      clients.forEach((c) => {
        if (c.displayName.toLowerCase().includes(qName)) {
          matches.push({
            id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            partyName: item.name,
            matchedEntity: c.displayName,
            matchedRole: 'Active Client',
            matchType: 'exact_name',
            severity: 'high',
            details: `Matches client record (${c.phone}, ID: ${c.idNumber}). Retained on ${c.createdAt.slice(0, 10)}.`,
          });
        }
      });

      // Scan matter parties
      parties.forEach((p) => {
        const matchName = p.name.toLowerCase().includes(qName) || (p.organizationName && p.organizationName.toLowerCase().includes(qName));
        if (matchName) {
          const mat = matters.find((m) => m.id === p.matterId);
          const isAdverse = ['defendant', 'insurer', 'advocate_opposing'].includes(p.partyType);
          matches.push({
            id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            partyName: item.name,
            matchedEntity: p.name,
            matchedMatterId: p.matterId,
            matchedMatterRef: mat?.internalReference,
            matchedMatterTitle: mat?.title,
            matchedRole: p.partyType,
            matchType: isAdverse ? 'adverse_party' : 'exact_name',
            severity: isAdverse ? 'critical' : 'high',
            details: `Entity is recorded as ${p.partyType.toUpperCase()} in active matter ${mat?.internalReference || ''} (${mat?.title || ''}).`,
          });
        }
      });

      // Scan vehicles in incident evidence
      Object.entries(incidentEvidence).forEach(([matId, evData]) => {
        const typedEv = evData as IncidentEvidenceData;
        typedEv?.vehicles?.forEach((v) => {
          if (
            v.registrationNumber.toLowerCase().replace(/\s+/g, '').includes(qName.replace(/\s+/g, '')) ||
            v.ownerName.toLowerCase().includes(qName) ||
            v.insuranceCompany.toLowerCase().includes(qName)
          ) {
            const mat = matters.find((m) => m.id === matId);
            matches.push({
              id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              partyName: item.name,
              matchedEntity: `${v.registrationNumber} - ${v.ownerName} (${v.insuranceCompany})`,
              matchedMatterId: matId,
              matchedMatterRef: mat?.internalReference,
              matchedMatterTitle: mat?.title,
              matchedRole: 'Vehicle / Insured in PI Matter',
              matchType: 'vehicle_reg',
              severity: 'high',
              details: `Matched vehicle ${v.registrationNumber} registered to ${v.ownerName} under policy ${v.policyNumber}.`,
            });
          }
        });
      });
    });

    const record: ConflictCheckRecord = {
      id: `conf-${Date.now()}`,
      intakeId,
      checkedByUserId: currentUser.id,
      checkedAt: now,
      status: matches.length === 0 ? 'clear' : matches.some((m) => m.severity === 'critical') ? 'conflict_detected' : 'possible_match',
      partiesSearched: searchParties.map((p) => p.name),
      matchesFound: matches,
    };

    if (intakeId) {
      setIntakes((prev) =>
        prev.map((i) => (i.id === intakeId ? { ...i, conflictCheck: record } : i))
      );
    }

    return record;
  }, [clients, parties, matters, incidentEvidence, currentUser.id]);

  const recordConflictClearance = useCallback((intakeId: string, status: 'clear' | 'overridden_approved', notes?: string, partnerId?: string) => {
    const now = new Date().toISOString();
    setIntakes((prev) =>
      prev.map((i) => {
        if (i.id !== intakeId) return i;
        const updatedCheck: ConflictCheckRecord = {
          ...(i.conflictCheck || {
            id: `conf-${Date.now()}`,
            checkedByUserId: currentUser.id,
            checkedAt: now,
            partiesSearched: [i.clientName],
            matchesFound: [],
          }),
          status,
          clearanceNotes: notes,
          clearedByPartnerId: partnerId || currentUser.id,
          clearedAt: now,
        };
        return {
          ...i,
          conflictCheck: updatedCheck,
        };
      })
    );
    logAudit('intake.conflict_cleared', 'client', intakeId, undefined, { status, notes });
  }, [currentUser.id, logAudit]);

  const updateIntakeKycRetainer = useCallback((intakeId: string, kycUpdates: Partial<IntakeKycRetainer>) => {
    setIntakes((prev) =>
      prev.map((i) => {
        if (i.id !== intakeId) return i;
        const currentKyc: IntakeKycRetainer = i.kycRetainer || {
          idDocumentType: 'National ID',
          idNumber: i.nationalId || '',
          idVerified: false,
          kycDocuments: [],
          warrantToActSigned: false,
          retainerAgreementSigned: false,
          retainerAgreedAmount: 50000,
          retainerDepositPaid: false,
          termsAccepted: false,
          partnerApproval: 'pending',
        };
        return {
          ...i,
          kycRetainer: {
            ...currentKyc,
            ...kycUpdates,
          },
        };
      })
    );
  }, []);

  const convertIntakeWithWorkflow = useCallback((
    intakeId: string,
    options?: {
      supervisingUserId?: string;
      stageOwnerId?: string;
      courtClerkId?: string;
      financeContactId?: string;
      initialAction?: string;
    }
  ): Matter => {
    const lead = intakes.find((i) => i.id === intakeId);
    if (!lead) throw new Error('Intake lead not found');

    const now = new Date().toISOString();

    // 1. Create client
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      clientType: 'person',
      displayName: lead.clientName,
      idNumber: lead.nationalId || lead.kycRetainer?.idNumber || 'Pending ID Capture',
      phone: lead.phone,
      email: lead.email || `${lead.clientName.toLowerCase().replace(/\s+/g, '.')}@client.ke`,
      preferredContactMethod: 'phone',
      status: 'active',
      notes: `Converted from prospective lead (${lead.source}). Incident: ${lead.briefDescription}`,
      createdAt: now,
      updatedAt: now,
    };
    setClients((prev) => [newClient, ...prev]);

    // 2. Open Matter with structured staffing roles
    const currentYear = new Date().getFullYear();
    const nextSeq = (matters.length + 1).toString().padStart(5, '0');
    const internalReference = `KKC/PI/${currentYear}/${nextSeq}`;

    const supUserId = options?.supervisingUserId || 'usr-partner';
    const stageWorkerId = options?.stageOwnerId || currentUser.id;
    const courtClerkId = options?.courtClerkId || 'usr-clerk';
    const financeContactId = options?.financeContactId || 'usr-finance';

    const newMatter: Matter = {
      id: `mat-${Date.now()}`,
      internalReference,
      title: `${lead.clientName} v. Registered Owner & Insurer`,
      clientId: newClient.id,
      practiceArea: 'Personal Injury',
      matterType: 'Road Traffic Accident (RTA) Personal Injury',
      workflowTemplateId: 'wf-pi-rta',
      originatingBranchId: currentUser.homeBranchId,
      responsibleBranchId: currentUser.homeBranchId,
      supervisingUserId: supUserId,
      currentStageOwnerId: stageWorkerId,
      courtClerkId,
      financeContactId,
      currentStageId: 2, // Intake & Acceptance
      openedAt: now,
      status: 'active',
      priority: 'high',
      summary: lead.briefDescription,
      nextAction: options?.initialAction || 'Execute Retainer Agreement and Warrant to Act.',
      courtProceedingIds: [],
      assignedUserIds: Array.from(new Set([supUserId, stageWorkerId, courtClerkId, financeContactId])),
      lastActivityAt: now,
    };
    setMatters((prev) => [newMatter, ...prev]);

    // 3. Populate initial Matter Parties
    const initialParties: MatterParty[] = [
      {
        id: `mpt-${Date.now()}-1`,
        matterId: newMatter.id,
        partyType: 'plaintiff',
        name: lead.clientName,
        phone: lead.phone,
        email: lead.email,
        roleDescription: 'Claimant / Injured Pedestrian',
      },
    ];

    if (lead.potentialParties && lead.potentialParties.length > 0) {
      lead.potentialParties.forEach((pp, idx) => {
        initialParties.push({
          id: `mpt-${Date.now()}-${idx + 2}`,
          matterId: newMatter.id,
          partyType: pp.role === 'defendant' ? 'defendant' : pp.role === 'insurer' ? 'insurer' : 'third_party',
          name: pp.name,
          phone: pp.phone,
          email: pp.email,
          roleDescription: pp.notes || `${pp.role.toUpperCase()} captured during initial intake`,
        });
      });
    }
    setParties((prev) => [...initialParties, ...prev]);

    // 4. Initialize Sub-Workflow seed files for this matter
    setIncidentEvidence((prev) => ({
      ...prev,
      [newMatter.id]: {
        incident: {
          date: lead.incidentDate,
          time: '10:00 AM',
          location: lead.incidentLocation || 'Nairobi Area',
          description: lead.briefDescription,
          obNumber: 'OB Pending',
          policeStation: 'Pending Police Abstract',
          investigatingOfficer: 'Pending Assignment',
        },
        vehicles: [],
        witnesses: [],
        exhibits: [],
      },
    }));

    setMedicalCases((prev) => ({
      ...prev,
      [newMatter.id]: {
        injuries: [],
        medicalProviders: [],
        treatmentEpisodes: [],
        p3Form: {
          issuedByDoctor: 'Pending Police Surgeon',
          policeStationRef: 'Pending',
          dateExamined: now.slice(0, 10),
          degreeOfHarm: 'Harm',
          status: 'requested',
        },
        imagingAndRecords: [],
        medicalReportRequests: [],
      },
    }));

    setLiabilityQuantums((prev) => ({
      ...prev,
      [newMatter.id]: {
        liability: {
          claimantPercent: 100,
          defendantPercent: 0,
          contributoryNegligenceAlleged: false,
          supportingEvidence: [],
          weaknesses: [],
          advocateOpinion: 'Initial intake assessment pending investigation.',
        },
        damages: {
          generalDamages: 0,
          specialDamages: [],
          futureMedicalExpenses: 0,
          lossOfEarnings: 0,
          lossOfEarningCapacity: 0,
          otherHeads: [],
          totalEstimatedClaimValue: 0,
        },
      },
    }));

    // 5. Create Matter Collaboration Channel
    const newChannel: CommunicationChannel = {
      id: `chn-${Date.now()}`,
      matterId: newMatter.id,
      name: `#${internalReference.replace(/\//g, '-')}-general`,
      description: `Operational Channel for ${lead.clientName} PI Claim`,
      type: 'matter',
      memberUserIds: [supUserId, stageWorkerId, courtClerkId, financeContactId],
    };
    setChannels((prev) => [newChannel, ...prev]);

    const welcomeMsg: ChannelMessage = {
      id: `msg-${Date.now()}`,
      channelId: newChannel.id,
      senderId: 'usr-admin',
      text: `✨ Matter ${internalReference} officially opened by ${currentUser.fullName}. Supervisor: ${supUserId}, Current Stage Lead: ${stageWorkerId}. All stage transitions and operational briefs will post here.`,
      createdAt: now,
    };
    setMessages((prev) => [welcomeMsg, ...prev]);

    // 6. Create initial Stage 2 tasks
    const initTasks: Task[] = [
      {
        id: `tsk-init-${Date.now()}-1`,
        title: 'Sign Warrant to Act & Client Retainer Agreement',
        description: 'Ensure client signs formal Warrant to Act and executes advocate-client fee agreement.',
        matterId: newMatter.id,
        stageId: 2,
        assignedTo: stageWorkerId,
        createdBy: currentUser.id,
        priority: 'high',
        status: 'todo',
        dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
        dependsOnTaskIds: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `tsk-init-${Date.now()}-2`,
        title: 'Apply for Certified Police Abstract & P3 Form',
        description: 'Dispatch clerk to traffic police station to obtain certified abstract with sketch map.',
        matterId: newMatter.id,
        stageId: 3,
        assignedTo: courtClerkId,
        createdBy: currentUser.id,
        priority: 'high',
        status: 'todo',
        dueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        dependsOnTaskIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
    setTasks((prev) => [...initTasks, ...prev]);

    // 7. Update intake disposition
    setIntakes((prev) =>
      prev.map((i) =>
        i.id === intakeId
          ? {
              ...i,
              disposition: 'converted',
              convertedMatterId: newMatter.id,
              convertedClientId: newClient.id,
            }
          : i
      )
    );

    logAudit('intake.converted_with_workflow', 'matter', newMatter.id, newMatter.id, {
      internalReference,
      clientName: lead.clientName,
      supervisingUserId: supUserId,
      currentStageOwnerId: stageWorkerId,
    });

    notify(
      supUserId,
      'New Matter Opened & Assigned',
      `${currentUser.fullName} opened ${internalReference} (${lead.clientName}). You are the Supervising Partner.`,
      'assignment',
      newMatter.id,
      'urgent'
    );

    return newMatter;
  }, [intakes, matters.length, currentUser, logAudit, notify]);

  // Stage Transition Expanded Workflow
  const advanceMatterStageExpanded = useCallback((
    matterId: string,
    toStageId: number,
    newOwnerId: string,
    handoffNotes: string,
    options?: { generateStandardTasks?: boolean; handoffChecklistCompleted?: boolean }
  ): { success: boolean; error?: string } => {
    const targetMatter = matters.find((m) => m.id === matterId);
    if (!targetMatter) return { success: false, error: 'Matter not found' };

    const fromStageId = targetMatter.currentStageId;
    const now = new Date().toISOString();

    const currentWf = practiceWorkflows.find((w) => w.id === targetMatter.workflowTemplateId) || practiceWorkflows[0];
    const targetStageConfig = currentWf?.stages.find((s) => s.stageId === toStageId);
    const stageName = targetStageConfig?.name || `Stage ${toStageId}`;

    // Update matter stage while keeping supervising partner intact
    setMatters((prev) =>
      prev.map((m) => {
        if (m.id !== matterId) return m;
        return {
          ...m,
          currentStageId: toStageId,
          currentStageOwnerId: newOwnerId,
          nextAction: `[Stage ${toStageId}: ${stageName}] ${handoffNotes || 'Stage active'}`,
          lastActivityAt: now,
          assignedUserIds: Array.from(new Set([...m.assignedUserIds, newOwnerId, m.supervisingUserId])),
        };
      })
    );

    // Create Handoff acknowledgment task
    const handoffTask: Task = {
      id: `tsk-handoff-${Date.now()}`,
      title: `Handoff Review: Stage ${fromStageId} → ${toStageId} (${stageName})`,
      description: `Stage transfer handoff notes from ${currentUser.fullName}: "${handoffNotes}"`,
      matterId,
      stageId: toStageId,
      assignedTo: newOwnerId,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      createdAt: now,
      updatedAt: now,
      dependsOnTaskIds: [],
    };

    const newTasksToAdd: Task[] = [handoffTask];

    if (options?.generateStandardTasks !== false && targetStageConfig?.autoCreateTasks && targetStageConfig.autoCreateTasks.length > 0) {
      targetStageConfig.autoCreateTasks.forEach((tpl, idx) => {
        const autoTask: Task = {
          id: `tsk-auto-${Date.now()}-${idx + 1}`,
          title: tpl.title,
          description: `Auto-generated checklist task for Stage ${toStageId} (${stageName}).`,
          matterId,
          stageId: toStageId,
          assignedTo: newOwnerId,
          createdBy: currentUser.id,
          priority: tpl.priority,
          status: 'todo',
          dueAt: new Date(Date.now() + tpl.dueInDays * 86400000).toISOString(),
          createdAt: now,
          updatedAt: now,
          dependsOnTaskIds: idx > 0 ? [handoffTask.id] : [],
        };
        newTasksToAdd.push(autoTask);
      });
    }

    setTasks((prev) => [...newTasksToAdd, ...prev]);

    logAudit('matter.stage_advanced', 'handoff', matterId, matterId, {
      fromStage: fromStageId,
      toStage: toStageId,
      newOwner: newOwnerId,
      handoffNotes,
      autoTasksCreated: newTasksToAdd.length,
    });

    notify(
      newOwnerId,
      `Matter Stage Advanced (${stageName})`,
      `${currentUser.fullName} transferred ${targetMatter.internalReference} to you for Stage ${toStageId}. Notes: ${handoffNotes}`,
      'assignment',
      matterId,
      'urgent'
    );

    return { success: true };
  }, [matters, practiceWorkflows, currentUser, logAudit, notify]);

  // Sub-Workflow State Mutators
  const updateIncidentEvidence = useCallback((matterId: string, updates: Partial<IncidentEvidenceData>) => {
    setIncidentEvidence((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { incident: { date: '', time: '', location: '', description: '', obNumber: '', policeStation: '', investigatingOfficer: '' }, vehicles: [], witnesses: [], exhibits: [] }),
        ...updates,
      },
    }));
    logAudit('evidence.updated', 'matter', matterId, matterId);
  }, [logAudit]);

  const updateMedicalCase = useCallback((matterId: string, updates: Partial<MedicalCaseData>) => {
    setMedicalCases((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { injuries: [], medicalProviders: [], treatmentEpisodes: [], p3Form: { issuedByDoctor: '', policeStationRef: '', dateExamined: '', degreeOfHarm: 'Harm', status: 'requested' }, imagingAndRecords: [], medicalReportRequests: [] }),
        ...updates,
      },
    }));
    logAudit('medical.updated', 'matter', matterId, matterId);
  }, [logAudit]);

  const updateMedicalReportRequest = useCallback((matterId: string, requestId: string, updates: Partial<MedicalReportRequest>) => {
    setMedicalCases((prev) => {
      const current = prev[matterId];
      if (!current) return prev;
      return {
        ...prev,
        [matterId]: {
          ...current,
          medicalReportRequests: current.medicalReportRequests.map((r) =>
            r.id === requestId ? { ...r, ...updates } : r
          ),
        },
      };
    });
  }, []);

  const updateLiabilityQuantum = useCallback((matterId: string, updates: Partial<LiabilityQuantumData>) => {
    setLiabilityQuantums((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { liability: { claimantPercent: 100, defendantPercent: 0, contributoryNegligenceAlleged: false, supportingEvidence: [], weaknesses: [], advocateOpinion: '' }, damages: { generalDamages: 0, specialDamages: [], futureMedicalExpenses: 0, lossOfEarnings: 0, lossOfEarningCapacity: 0, otherHeads: [], totalEstimatedClaimValue: 0 } }),
        ...updates,
      },
    }));
    logAudit('liability.updated', 'matter', matterId, matterId);
  }, [logAudit]);

  const updateClaimNegotiation = useCallback((matterId: string, updates: Partial<ClaimNegotiationData>) => {
    setClaimNegotiations((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { insurer: { name: '', policyNumber: '', claimReference: '', status: 'notice_sent' }, negotiationLedger: [], settlementApproval: { recommendedAmount: 0, clientAuthorized: false, partnerApproved: false, dischargeVoucherSigned: false } }),
        ...updates,
      },
    }));
    logAudit('claim.updated', 'matter', matterId, matterId);
  }, [logAudit]);

  const addNegotiationEntry = useCallback((matterId: string, entry: Omit<NegotiationLedgerItem, 'id'>) => {
    const newEntry: NegotiationLedgerItem = {
      ...entry,
      id: `neg-${Date.now()}`,
    };
    setClaimNegotiations((prev) => {
      const cur = prev[matterId];
      if (!cur) return prev;
      return {
        ...prev,
        [matterId]: {
          ...cur,
          negotiationLedger: [newEntry, ...(cur.negotiationLedger || [])],
        },
      };
    });
    logAudit('claim.negotiation_logged', 'matter', matterId, matterId, { party: entry.party, offer: entry.offerAmount || entry.counterOfferAmount });
  }, [logAudit]);

  const approveSettlementOffer = useCallback((matterId: string, recommendedAmount: number, clientAuthorized: boolean, partnerApproved: boolean) => {
    const now = new Date().toISOString();
    setClaimNegotiations((prev) => {
      const cur = prev[matterId];
      if (!cur) return prev;
      return {
        ...prev,
        [matterId]: {
          ...cur,
          settlementApproval: {
            ...cur.settlementApproval,
            recommendedAmount,
            clientAuthorized,
            clientAuthorityDate: clientAuthorized ? now : undefined,
            partnerApproved,
            partnerApprovedByUserId: partnerApproved ? currentUser.id : undefined,
            partnerApprovedDate: partnerApproved ? now : undefined,
            acceptedAt: clientAuthorized && partnerApproved ? now : undefined,
          },
        },
      };
    });
    notify('usr-partner', 'Settlement Offer Authorized', `Settlement amount KES ${recommendedAmount.toLocaleString()} authorized for matter ${matterId}`, 'system', matterId);
  }, [currentUser.id, notify]);

  const updatePleadingsBundle = useCallback((matterId: string, updates: Partial<PleadingsBundleData>) => {
    setPleadingsBundles((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { id: `pb-${Date.now()}`, matterId, plaintStatus: 'draft', verifyingAffidavitStatus: 'draft', witnessStatements: [], listOfWitnesses: false, listOfDocuments: false, supportingDocumentsAttached: false, bundleReviewStatus: 'draft', readyForFilingPackage: false }),
        ...updates,
      },
    }));
  }, []);

  // Court Filing & Service Queue
  const createCourtFilingPackage = useCallback((pkgData: Omit<CourtFilingPackage, 'id'>): CourtFilingPackage => {
    const newPkg: CourtFilingPackage = {
      ...pkgData,
      id: `cfp-${Date.now()}`,
    };
    setCourtFilingPackages((prev) => [newPkg, ...prev]);
    logAudit('court.filing_created', 'matter', newPkg.matterId, newPkg.matterId, { courtStation: newPkg.courtStation });
    return newPkg;
  }, [logAudit]);

  const updateCourtFilingPackage = useCallback((id: string, updates: Partial<CourtFilingPackage>) => {
    setCourtFilingPackages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const createServiceQueueItem = useCallback((itemData: Omit<ServiceQueueItem, 'id'>): ServiceQueueItem => {
    const newItem: ServiceQueueItem = {
      ...itemData,
      id: `sq-${Date.now()}`,
    };
    setServiceQueue((prev) => [newItem, ...prev]);
    logAudit('service.item_created', 'matter', newItem.matterId, newItem.matterId, { partyToServe: newItem.partyToServe });
    return newItem;
  }, [logAudit]);

  const updateServiceQueueItem = useCallback((id: string, updates: Partial<ServiceQueueItem>) => {
    setServiceQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const addServiceAttempt = useCallback((id: string, attempt: { attemptNo: number; date: string; outcome: string; notes: string }) => {
    setServiceQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, attempts: [...item.attempts, attempt], status: 'attempted' } : item))
    );
  }, []);

  // Pre-Trial & Hearing
  const updatePreTrialCompliance = useCallback((matterId: string, updates: Partial<PreTrialComplianceData>) => {
    setPreTrialCompliances((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { matterId, listOfWitnesses: false, witnessStatements: false, listOfDocuments: false, documentBundle: false, agreedIssues: false, preTrialQuestionnaire: false, expertDocuments: false, courtDirections: '', complianceDeadline: '', isCompliant: false }),
        ...updates,
      },
    }));
  }, []);

  const updateHearingBrief = useCallback((matterId: string, updates: Partial<HearingBriefData>) => {
    setHearingBriefs((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { matterId, courtName: '', hearingDate: '', assignedAdvocateId: currentUser.id, witnesses: [], documents: [], issues: { liability: '', quantum: '' }, opposingCounsel: '', advocateNotes: '', isReadyForHearing: false }),
        ...updates,
      },
    }));
  }, [currentUser.id]);

  // Propagate Comprehensive Court Outcome
  const propagateCourtOutcomeDetailed = useCallback((
    matterId: string,
    outcomeData: {
      outcomeType: 'ruling_delivered' | 'judgment_delivered' | 'hearing_conducted' | 'adjourned' | 'directions_given' | 'mention_held';
      ordersSummary: string;
      nextDate?: string;
      nextEventType?: string;
      directions?: string;
      costsAwardedKes?: number;
      tasksToCreate?: { title: string; assignedTo: string; dueDays: number }[];
      sendSms?: boolean;
      smsText?: string;
    }
  ) => {
    const now = new Date().toISOString();
    const matter = matters.find((m) => m.id === matterId);

    // 1. If next date provided, create calendar event
    if (outcomeData.nextDate) {
      const newEv: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: `${matter?.internalReference || 'Court Event'}: ${outcomeData.nextEventType || 'Mention / Directions'}`,
        eventType: 'court',
        matterId,
        startAt: `${outcomeData.nextDate}T09:00:00Z`,
        endAt: `${outcomeData.nextDate}T10:30:00Z`,
        location: 'Milimani Law Courts, Court 4',
        courtStatus: 'scheduled',
        assignedUserId: matter?.currentStageOwnerId || currentUser.id,
        organizerId: currentUser.id,
        attendanceNotes: `Scheduled following court order: ${outcomeData.ordersSummary}`,
      };
      setCalendarEvents((prev) => [newEv, ...prev]);
    }

    // 2. Create automated tasks
    if (outcomeData.tasksToCreate && outcomeData.tasksToCreate.length > 0) {
      const generatedTasks: Task[] = outcomeData.tasksToCreate.map((t, idx) => ({
        id: `tsk-outcome-${Date.now()}-${idx + 1}`,
        title: t.title,
        description: `Generated from Court Order on ${now.slice(0, 10)}: "${outcomeData.ordersSummary}"`,
        matterId,
        stageId: matter?.currentStageId || 10,
        assignedTo: t.assignedTo || currentUser.id,
        createdBy: currentUser.id,
        priority: 'high',
        status: 'todo',
        dueAt: new Date(Date.now() + t.dueDays * 86400000).toISOString(),
        dependsOnTaskIds: [],
        createdAt: now,
        updatedAt: now,
      }));
      setTasks((prev) => [...generatedTasks, ...prev]);
    }

    // 3. If SMS is enabled, log notification
    if (outcomeData.sendSms && matter) {
      notify(
        matter.clientId,
        'Client SMS Sent via Africa\'s Talking',
        outcomeData.smsText || `Court update on ${matter.internalReference}: ${outcomeData.ordersSummary}`,
        'system',
        matterId
      );
    }

    logAudit('court.outcome_propagated', 'matter', matterId, matterId, {
      outcomeType: outcomeData.outcomeType,
      ordersSummary: outcomeData.ordersSummary,
      nextDate: outcomeData.nextDate,
    });

    notify(
      currentUser.id,
      'Court Outcome Propagated',
      `Court orders recorded. Calendar, tasks, and audit logs synchronized for ${matter?.internalReference}.`,
      'system',
      matterId
    );
  }, [matters, currentUser, logAudit, notify]);

  // Judgment, Recovery, Settlement, Closure
  const updateJudgmentAward = useCallback((matterId: string, updates: Partial<JudgmentAwardData>) => {
    setJudgmentAwards((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { matterId, judgmentDate: '', liabilityClaimantPercent: 100, liabilityDefendantPercent: 0, generalDamages: 0, specialDamages: 0, futureMedical: 0, costsAwarded: 0, interestRatePercent: 12, interestFromDate: '', totalAward: 0, paymentDeadline: '', appealDeadline: '', appealRecommended: false, recoveryTriggered: false }),
        ...updates,
      },
    }));
  }, []);

  const triggerRecoveryFromJudgment = useCallback((matterId: string) => {
    setJudgmentAwards((prev) => {
      const cur = prev[matterId];
      if (!cur) return prev;
      return {
        ...prev,
        [matterId]: { ...cur, recoveryTriggered: true },
      };
    });

    setRecoveryExecutions((prev) => ({
      ...prev,
      [matterId]: {
        matterId,
        decreeExtracted: true,
        certificateOfCosts: false,
        billOfCosts: true,
        billAmount: 250000,
        taxationComplete: false,
        taxedAmount: 0,
        insurerDemandSent: true,
        demandSentDate: new Date().toISOString().slice(0, 10),
        paymentPromiseReceived: false,
        executionWarrantsIssued: false,
        garnisheeProceedings: false,
        auctioneerInstructed: false,
        paymentReceived: false,
        paymentReceivedAmount: 0,
        status: 'insurer_demand',
      },
    }));

    notify('usr-clerk', 'Recovery Workflow Initiated', `Statutory 30-day demand served under Sec 10 for matter ${matterId}. Extract decree and file Party & Party Bill of Costs.`, 'assignment', matterId, 'urgent');
  }, [notify]);

  const updateRecoveryExecution = useCallback((matterId: string, updates: Partial<RecoveryExecutionData>) => {
    setRecoveryExecutions((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { matterId, decreeExtracted: false, certificateOfCosts: false, billOfCosts: false, billAmount: 0, taxationComplete: false, taxedAmount: 0, insurerDemandSent: false, paymentPromiseReceived: false, executionWarrantsIssued: false, garnisheeProceedings: false, auctioneerInstructed: false, paymentReceived: false, paymentReceivedAmount: 0, status: 'pending_decree' }),
        ...updates,
      },
    }));
  }, []);

  const updateSettlementDistribution = useCallback((matterId: string, updates: Partial<SettlementDistributionData>) => {
    setSettlementDistributions((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { matterId, grossSettlementAmount: 0, fundsReceivedDate: '', account: 'Client Trust Account', outstandingDisbursements: [], totalDisbursements: 0, professionalFees: 0, vatOnFees: 0, otherDeductions: [], netClientAmount: 0, settlementStatementProduced: false, clientApprovalStatus: 'pending', paymentMethod: 'M-Pesa B2C' }),
        ...updates,
      },
    }));
  }, []);

  const disburseClientSettlement = useCallback((matterId: string, paymentMethod: 'M-Pesa B2C' | 'Bank Wire' | 'Cheque', ref: string) => {
    const now = new Date().toISOString();
    setSettlementDistributions((prev) => {
      const cur = prev[matterId];
      if (!cur) return prev;
      return {
        ...prev,
        [matterId]: {
          ...cur,
          clientApprovalStatus: 'disbursed',
          paymentMethod,
          paymentReference: ref,
          disbursedAt: now,
        },
      };
    });
    logAudit('finance.settlement_disbursed', 'matter', matterId, matterId, { paymentMethod, ref });
    notify('usr-partner', 'Client Settlement Disbursed', `Settlement funds successfully disbursed to client for matter ${matterId} via ${paymentMethod} (Ref: ${ref}).`, 'system', matterId);
  }, [logAudit, notify]);

  const updateClosureAudit = useCallback((matterId: string, updates: Partial<MatterClosureAuditData>) => {
    setClosureAudits((prev) => ({
      ...prev,
      [matterId]: {
        ...(prev[matterId] || { matterId, isJudgmentSettlementComplete: false, isClientFundsReconciled: false, isOutstandingExpensesResolved: false, isFinalPaymentMade: false, isClientInformedAndDischarged: false, areAllDocumentsFiled: false, physicalFileLocation: '', closingNote: '', supervisorApproved: false }),
        ...updates,
      },
    }));
  }, []);

  const finalizeMatterClosureWizard = useCallback((matterId: string, audit: MatterClosureAuditData) => {
    const now = new Date().toISOString();
    setClosureAudits((prev) => ({
      ...prev,
      [matterId]: {
        ...audit,
        supervisorApproved: true,
        approvedByUserId: currentUser.id,
        approvedAt: now,
        archivedAt: now,
      },
    }));

    setMatters((prev) =>
      prev.map((m) => (m.id === matterId ? { ...m, status: 'closed', closedAt: now, closureReason: audit.closingNote } : m))
    );

    logAudit('matter.closed_and_archived', 'matter', matterId, matterId, {
      location: audit.physicalFileLocation,
      closingNote: audit.closingNote,
    });

    notify(
      'usr-partner',
      'Matter Successfully Closed & Archived',
      `Matter ${matterId} has satisfied all 6 closing criteria and is archived in ${audit.physicalFileLocation}.`,
      'system',
      matterId
    );
  }, [currentUser.id, logAudit, notify]);

  // Client operations
  const createClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setClients((prev) => [newClient, ...prev]);
    logAudit('client.created', 'client', newClient.id, undefined, { name: newClient.displayName });
    return newClient;
  }, [logAudit]);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  // Convert Intake to Matter
  const convertIntakeToMatter = useCallback((intakeId: string) => {
    const lead = intakes.find((i) => i.id === intakeId);
    if (!lead) return;

    const now = new Date().toISOString();
    // 1. Create client
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      clientType: 'person',
      displayName: lead.clientName,
      idNumber: 'Pending ID Capture',
      phone: lead.phone,
      email: lead.email || `${lead.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      preferredContactMethod: 'phone',
      status: 'active',
      notes: `Converted from prospective lead (${lead.source}). Incident: ${lead.briefDescription}`,
      createdAt: now,
      updatedAt: now,
    };
    setClients((prev) => [newClient, ...prev]);

    // 2. Open Matter
    const currentYear = new Date().getFullYear();
    const nextSeq = (matters.length + 1).toString().padStart(5, '0');
    const internalReference = `KKC/PI/${currentYear}/${nextSeq}`;

    const newMatter: Matter = {
      id: `mat-${Date.now()}`,
      internalReference,
      title: `${lead.clientName} v. Registered Owner & Insurer`,
      clientId: newClient.id,
      practiceArea: 'Personal Injury',
      matterType: 'Road Traffic Accident (RTA) Personal Injury',
      workflowTemplateId: 'wf-pi-rta',
      originatingBranchId: currentUser.homeBranchId,
      responsibleBranchId: currentUser.homeBranchId,
      supervisingUserId: currentUser.id,
      currentStageId: 2, // Intake / Acceptance
      openedAt: now,
      status: 'active',
      priority: 'high',
      summary: lead.briefDescription,
      nextAction: 'Execute Retainer Agreement and Warrant to Act.',
      courtProceedingIds: [],
      assignedUserIds: [currentUser.id, 'usr-partner'],
      lastActivityAt: now,
    };
    setMatters((prev) => [newMatter, ...prev]);

    // 3. Mark intake as converted
    setIntakes((prev) =>
      prev.map((i) =>
        i.id === intakeId
          ? { ...i, disposition: 'converted', convertedMatterId: newMatter.id, convertedClientId: newClient.id }
          : i
      )
    );

    logAudit('intake.converted', 'matter', newMatter.id, newMatter.id, {
      intakeId,
      internalReference,
      clientName: lead.clientName,
    });
    notify('usr-partner', 'Intake Converted to Matter', `${currentUser.fullName} converted intake ${lead.clientName} to ${internalReference}`, 'assignment', newMatter.id);
  }, [intakes, matters.length, currentUser, logAudit, notify]);

  // Task Operations
  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `tsk-${Date.now()}`,
      dependsOnTaskIds: taskData.dependsOnTaskIds || [],
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [newTask, ...prev]);
    logAudit('task.created', 'task', newTask.id, newTask.matterId, { title: newTask.title });

    if (newTask.assignedTo !== currentUser.id) {
      notify(newTask.assignedTo, 'New Task Assigned', `${currentUser.fullName} assigned you: "${newTask.title}"`, 'assignment', newTask.matterId);
    }

    if (!isOnline) {
      queueMutation('task', 'create', newTask as unknown as Record<string, unknown>);
    }

    return newTask;
  }, [currentUser, logAudit, notify, isOnline, queueMutation]);

  const updateTask = useCallback((id: string, updates: Partial<Task>, force: boolean = false): { success: boolean; error?: string } => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return { success: false, error: 'Task not found' };

    // Enforce dependency gate if moving to in_progress or completed
    if (!force && updates.status && (updates.status === 'in_progress' || updates.status === 'completed')) {
      const depCheck = canUpdateTaskStatus(currentTask, updates.status, tasks);
      if (!depCheck.allowed) {
        notify(
          currentUser.id,
          'Task Dependency Blocked',
          depCheck.reason || 'Prerequisite tasks must be completed before updating status.',
          'deadline',
          currentTask.matterId,
          'urgent'
        );
        return { success: false, error: depCheck.reason };
      }
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    if (!isOnline) {
      queueMutation('task', 'update', { id, ...updates });
    }
    return { success: true };
  }, [tasks, currentUser.id, notify, isOnline, queueMutation]);

  const completeTask = useCallback((id: string, force: boolean = false): { success: boolean; error?: string } => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return { success: false, error: 'Task not found' };

    if (!force) {
      const depCheck = canUpdateTaskStatus(currentTask, 'completed', tasks);
      if (!depCheck.allowed) {
        notify(
          currentUser.id,
          'Task Dependency Blocked',
          depCheck.reason || 'Cannot complete task while prerequisite tasks remain incomplete.',
          'deadline',
          currentTask.matterId,
          'urgent'
        );
        return { success: false, error: depCheck.reason };
      }
    }

    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'completed', completedAt: now, updatedAt: now } : t))
    );
    logAudit('task.completed', 'task', id);
    if (!isOnline) {
      queueMutation('task', 'update', { id, status: 'completed', completedAt: now });
    }
    return { success: true };
  }, [tasks, currentUser.id, logAudit, notify, isOnline, queueMutation]);

  // Calendar Operations
  const createCalendarEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      syncState: googleConnected ? 'synced' : 'pending',
    };
    setCalendarEvents((prev) => [newEvent, ...prev]);
    logAudit('calendar.event_created', 'court_event', newEvent.id, newEvent.matterId, { title: newEvent.title });

    if (newEvent.eventType === 'court') {
      notify(
        newEvent.assignedUserId,
        'Court Date Diarized',
        `Hearing scheduled: "${newEvent.title}" on ${new Date(newEvent.startAt).toLocaleDateString()}`,
        'court_event',
        newEvent.matterId,
        'urgent'
      );
    }
    return newEvent;
  }, [googleConnected, logAudit, notify]);

  const recordCourtOutcome = useCallback((eventId: string, status: CourtEventStatus, outcomeNotes: string, nextHearingDate?: string) => {
    setCalendarEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              courtStatus: status,
              courtOutcome: outcomeNotes,
              nextCourtDate: nextHearingDate,
            }
          : e
      )
    );

    const event = calendarEvents.find((e) => e.id === eventId);
    if (event?.matterId) {
      logAudit('court.outcome_recorded', 'court_event', eventId, event.matterId, { status, outcomeNotes, nextHearingDate });

      // Automatically diarize the next date if provided!
      if (nextHearingDate) {
        const nextDateEvent: CalendarEvent = {
          id: `evt-${Date.now()}`,
          matterId: event.matterId,
          title: `Next Court Mention/Hearing (${event.title})`,
          eventType: 'court',
          startAt: `${nextHearingDate}T09:00:00Z`,
          endAt: `${nextHearingDate}T11:00:00Z`,
          location: event.location,
          assignedUserId: event.assignedUserId,
          organizerId: currentUser.id,
          courtProceedingId: event.courtProceedingId,
          courtStatus: 'scheduled',
          notes: `Diarized following outcome: ${outcomeNotes}`,
          syncState: 'synced',
        };
        setCalendarEvents((prev) => [...prev, nextDateEvent]);
        notify(event.assignedUserId, 'Next Court Date Diarized', `Next appearance recorded for ${nextHearingDate}`, 'court_event', event.matterId);
      }
    }
  }, [calendarEvents, currentUser.id, logAudit, notify]);

  // Document Management & Comprehensive Versioning Flow
  const uploadDocumentVersion = useCallback(
    (
      documentId: string,
      file: { name: string; size: number; mimeType?: string; changeSummary?: string; contentSnippet?: string },
      notes?: string
    ) => {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id !== documentId) return doc;
          const nextVerNum = doc.versions.length + 1;
          const newVersion: DocumentVersion = {
            id: `ver-${doc.id}-${nextVerNum}`,
            documentId: doc.id,
            versionNumber: nextVerNum,
            storagePath: `matters/${doc.matterId}/documents/${doc.id}/v${nextVerNum}_${file.name}`,
            originalFilename: file.name,
            mimeType: file.mimeType || 'application/pdf',
            fileSizeBytes: file.size,
            checksum: `sha256_${Math.random().toString(36).substring(2, 10)}`,
            uploadedBy: currentUser.id,
            createdAt: new Date().toISOString(),
            status: 'draft',
            notes: notes || 'New version created in working draft status.',
            changeSummary: file.changeSummary || `Version ${nextVerNum} amendments and updates.`,
            contentSnippet: file.contentSnippet || 'Document content draft updated with revised pleadings and verification clauses.',
          };
          return {
            ...doc,
            currentVersionId: newVersion.id,
            updatedAt: new Date().toISOString(),
            versions: [...doc.versions, newVersion],
          };
        })
      );
      logAudit('document.version_uploaded', 'document', documentId, undefined, { filename: file.name });
      notify(currentUser.id, 'New Document Version Created', `Version created for document. You can now submit it for review.`, 'document_review');
    },
    [currentUser.id, logAudit, notify]
  );

  const submitDocumentForReview = useCallback((documentId: string, versionId: string, reviewNotes?: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          updatedAt: new Date().toISOString(),
          versions: doc.versions.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  status: 'in_review' as const,
                  notes: reviewNotes || 'Submitted for senior advocate review and verification.',
                }
              : v
          ),
        };
      })
    );
    logAudit('document.submitted_review', 'document', documentId, undefined, { versionId, reviewNotes });
    notify(
      'usr-adv-1',
      'Document Submitted for Review',
      `${currentUser.fullName} submitted a document version for formal legal review.`,
      'document_review'
    );
  }, [currentUser.fullName, logAudit, notify]);

  const approveDocumentVersion = useCallback((documentId: string, versionId: string, comment?: string) => {
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          updatedAt: now,
          versions: doc.versions.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  status: 'approved' as const,
                  reviewedBy: currentUser.id,
                  reviewedAt: now,
                  reviewComment: comment || 'Approved by reviewing counsel.',
                }
              : v
          ),
        };
      })
    );
    logAudit('document.approved', 'document', documentId, undefined, { versionId, comment });
    notify(currentUser.id, 'Document Approved', 'Document version has been approved and is ready for signing or court filing.', 'document_review');
  }, [currentUser.id, logAudit, notify]);

  const rejectDocumentVersion = useCallback((documentId: string, versionId: string, reason: string) => {
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          updatedAt: now,
          versions: doc.versions.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  status: 'rejected' as const,
                  reviewedBy: currentUser.id,
                  reviewedAt: now,
                  reviewComment: reason,
                }
              : v
          ),
        };
      })
    );
    logAudit('document.rejected', 'document', documentId, undefined, { versionId, reason });
    notify(currentUser.id, 'Document Amendments Requested', `Document was rejected/needs amendment: ${reason}`, 'document_review', undefined, 'urgent');
  }, [currentUser.id, logAudit, notify]);

  const signDocumentVersion = useCallback((documentId: string, versionId: string, signatureHash?: string) => {
    const now = new Date().toISOString();
    const hash = signatureHash || `LSK-SIG-${currentUser.barNumber || 'ADVOCATE'}-${Date.now().toString(36).toUpperCase()}`;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          updatedAt: now,
          versions: doc.versions.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  status: 'signed' as const,
                  signedBy: currentUser.id,
                  signedAt: now,
                  signatureHash: hash,
                }
              : v
          ),
        };
      })
    );
    logAudit('document.signed', 'document', documentId, undefined, { versionId, signatureHash: hash });
    notify(currentUser.id, 'Document Digitally Signed', `Signed under advocate seal ${hash}. Ready for e-filing.`, 'document_review');
  }, [currentUser.barNumber, currentUser.id, logAudit, notify]);

  const revertDocumentToVersion = useCallback(
    (documentId: string, targetVersionId: string, revertNotes?: string): DocumentVersion | null => {
      let createdVersion: DocumentVersion | null = null;
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id !== documentId) return doc;
          const targetVersion = doc.versions.find((v) => v.id === targetVersionId);
          if (!targetVersion) return doc;

          const nextVerNum = doc.versions.length + 1;
          const now = new Date().toISOString();
          createdVersion = {
            id: `ver-${doc.id}-${nextVerNum}`,
            documentId: doc.id,
            versionNumber: nextVerNum,
            storagePath: `matters/${doc.matterId}/documents/${doc.id}/v${nextVerNum}_reverted_from_v${targetVersion.versionNumber}.pdf`,
            originalFilename: targetVersion.originalFilename,
            mimeType: targetVersion.mimeType,
            fileSizeBytes: targetVersion.fileSizeBytes,
            checksum: targetVersion.checksum,
            uploadedBy: currentUser.id,
            createdAt: now,
            status: 'draft',
            notes: revertNotes || `Rollback restored from Version ${targetVersion.versionNumber}`,
            changeSummary: `Reverted to content from Version ${targetVersion.versionNumber}: ${targetVersion.changeSummary || ''}`,
            contentSnippet: targetVersion.contentSnippet,
            revertedFromVersionNumber: targetVersion.versionNumber,
          };

          return {
            ...doc,
            currentVersionId: createdVersion.id,
            updatedAt: now,
            versions: [...doc.versions, createdVersion],
          };
        })
      );

      if (createdVersion) {
        logAudit('document.reverted', 'document', documentId, undefined, { targetVersionId, revertNotes });
        notify(
          currentUser.id,
          'Document Version Restored',
          `Restored Version ${(createdVersion as DocumentVersion).versionNumber} from historical snapshot.`,
          'document_review'
        );
      }
      return createdVersion;
    },
    [currentUser.id, logAudit, notify]
  );

  const markDocumentFiled = useCallback((documentId: string, versionId: string, filingRef: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          versions: doc.versions.map((v) => (v.id === versionId ? { ...v, status: 'filed' as const, courtFilingRef: filingRef } : v)),
        };
      })
    );
    logAudit('document.filed', 'document', documentId, undefined, { versionId, filingRef });
    notify(currentUser.id, 'Court Filing Confirmed', `Judiciary CTS confirmation reference: ${filingRef}`, 'court_event');
  }, [currentUser.id, logAudit, notify]);

  // Workflow Engine Management Functions
  const createPracticeWorkflow = useCallback(
    (wfData: Omit<PracticeAreaWorkflow, 'id' | 'createdAt' | 'updatedAt'>): PracticeAreaWorkflow => {
      const now = new Date().toISOString();
      const newWf: PracticeAreaWorkflow = {
        ...wfData,
        id: `wf-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setPracticeWorkflows((prev) => [...prev, newWf]);
      logAudit('workflow.created', 'system', newWf.id, undefined, { name: newWf.name });
      return newWf;
    },
    [logAudit]
  );

  const updatePracticeWorkflow = useCallback((id: string, updates: Partial<PracticeAreaWorkflow>) => {
    setPracticeWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w))
    );
    logAudit('workflow.updated', 'system', id, undefined, updates);
  }, [logAudit]);

  const deletePracticeWorkflow = useCallback((id: string) => {
    setPracticeWorkflows((prev) => prev.filter((w) => w.id !== id));
    logAudit('workflow.deleted', 'system', id);
  }, [logAudit]);

  const addStageToWorkflow = useCallback((workflowId: string, stage: WorkflowStageConfig) => {
    setPracticeWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== workflowId) return w;
        return {
          ...w,
          updatedAt: new Date().toISOString(),
          stages: [...w.stages, stage],
        };
      })
    );
    logAudit('workflow.stage_added', 'system', workflowId, undefined, { stageName: stage.name });
  }, [logAudit]);

  const updateStageInWorkflow = useCallback((workflowId: string, stageId: number, updates: Partial<WorkflowStageConfig>) => {
    setPracticeWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== workflowId) return w;
        return {
          ...w,
          updatedAt: new Date().toISOString(),
          stages: w.stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s)),
        };
      })
    );
  }, []);

  const deleteStageFromWorkflow = useCallback((workflowId: string, stageId: number) => {
    setPracticeWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== workflowId) return w;
        return {
          ...w,
          updatedAt: new Date().toISOString(),
          stages: w.stages.filter((s) => s.id !== stageId),
        };
      })
    );
  }, []);

  // RBAC Management Functions
  const updateUserRoles = useCallback((userId: string, newRoles: RoleId[]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles: newRoles, role: newRoles[0] || u.role } : u))
    );
    setCurrentUser((prev) =>
      prev.id === userId ? { ...prev, roles: newRoles, role: newRoles[0] || prev.role } : prev
    );
    logAudit('admin.user_roles_updated', 'system', userId, undefined, { newRoles });
  }, [logAudit]);

  const updateRolePermissions = useCallback((role: RoleId, permissions: PermissionKey[]) => {
    setRolePermissionsMap((prev) => ({
      ...prev,
      [role]: permissions,
    }));
    logAudit('admin.role_permissions_updated', 'system', role, undefined, { role, permissionsCount: permissions.length });
  }, [logAudit]);

  const resetRolePermissionsToDefault = useCallback(() => {
    const initial: Record<RoleId, PermissionKey[]> = {
      managing_partner: [...INITIAL_ROLES.managing_partner.defaultPermissions],
      senior_partner: [...INITIAL_ROLES.senior_partner.defaultPermissions],
      advocate: [...INITIAL_ROLES.advocate.defaultPermissions],
      paralegal: [...INITIAL_ROLES.paralegal.defaultPermissions],
      administrator: [...INITIAL_ROLES.administrator.defaultPermissions],
      court_clerk: [...INITIAL_ROLES.court_clerk.defaultPermissions],
      finance_officer: [...INITIAL_ROLES.finance_officer.defaultPermissions],
      technical_admin: [...INITIAL_ROLES.technical_admin.defaultPermissions],
    };
    setRolePermissionsMap(initial);
    logAudit('admin.role_permissions_reset', 'system', 'all');
  }, [logAudit]);

  const hasUserPermission = useCallback(
    (permission: PermissionKey): boolean => {
      return hasPermission(currentUser, permission, rolePermissionsMap);
    },
    [currentUser, rolePermissionsMap]
  );

  const hasUserAnyPermission = useCallback(
    (permissions: PermissionKey[]): boolean => {
      return hasAnyPermission(currentUser, permissions, rolePermissionsMap);
    },
    [currentUser, rolePermissionsMap]
  );

  const effectivePermissions = getEffectivePermissions(currentUser, rolePermissionsMap);

  // Platform Settings Management
  const updateFirmSettings = useCallback((updates: Partial<FirmSettingsConfig>) => {
    setFirmSettings((prev) => ({
      ...prev,
      ...updates,
    }));
    logAudit('admin.firm_settings_updated', 'system', 'firm_settings');
    notify(currentUser.id, 'Firm Settings Updated', 'Firm profile, financial policies, and rules updated.', 'system');
  }, [currentUser.id, logAudit, notify]);

  // Finance Operations
  const createExpenseRequest = useCallback((expenseData: Omit<ExpenseRecord, 'id' | 'createdAt' | 'status'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      requestedByUserId: currentUser.id,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    logAudit('finance.expense_requested', 'expense', newExpense.id, newExpense.matterId, {
      amount: newExpense.amount,
      category: newExpense.categoryId,
    });
    notify(
      'usr-partner',
      'Expense Approval Required',
      `${currentUser.fullName} requested KES ${newExpense.amount.toLocaleString()} for ${newExpense.description}`,
      'expense_approval',
      newExpense.matterId,
      'urgent'
    );
    return newExpense;
  }, [currentUser, logAudit, notify]);

  const approveExpense = useCallback((expenseId: string) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === expenseId ? { ...exp, status: 'approved', approvedByUserId: currentUser.id } : exp))
    );
    logAudit('finance.expense_approved', 'expense', expenseId);
    const exp = expenses.find((e) => e.id === expenseId);
    if (exp?.requestedByUserId) {
      notify(exp.requestedByUserId, 'Expense Approved', `Requisition for KES ${exp.amount.toLocaleString()} was approved.`, 'expense_approval', exp.matterId);
    }
  }, [currentUser.id, expenses, logAudit, notify]);

  const disburseExpense = useCallback((expenseId: string, paymentSource: 'Petty Cash' | 'Office Bank Account') => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId
          ? {
              ...exp,
              status: 'disbursed',
              disbursedByUserId: currentUser.id,
              paymentSource,
            }
          : exp
      )
    );

    // Deduct from account balance
    const exp = expenses.find((e) => e.id === expenseId);
    if (exp) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (paymentSource === 'Petty Cash' && acc.type === 'petty_cash') {
            return { ...acc, balance: acc.balance - exp.amount };
          }
          if (paymentSource === 'Office Bank Account' && acc.type === 'office') {
            return { ...acc, balance: acc.balance - exp.amount };
          }
          return acc;
        })
      );
      logAudit('finance.expense_disbursed', 'expense', expenseId, exp.matterId, { amount: exp.amount, source: paymentSource });
    }
  }, [currentUser.id, expenses, logAudit]);

  const recordPaymentReceipt = useCallback((receiptData: Omit<PaymentReceipt, 'id' | 'createdAt'>) => {
    const newReceipt: PaymentReceipt = {
      ...receiptData,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [newReceipt, ...prev]);

    // Credit account balance
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === newReceipt.accountId ? { ...acc, balance: acc.balance + newReceipt.amount } : acc))
    );

    logAudit('finance.payment_received', 'expense', newReceipt.id, newReceipt.matterId, {
      amount: newReceipt.amount,
      ref: newReceipt.referenceNumber,
    });
    return newReceipt;
  }, [logAudit]);

  // Communications & Messages
  const sendMessage = useCallback((channelId: string, text: string, mentions: string[] = [], attachments: { name: string; size: string }[] = []) => {
    const newMessage: ChannelMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      text,
      createdAt: new Date().toISOString(),
      mentions,
      attachments,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Send notifications to mentioned users
    mentions.forEach((userId) => {
      notify(userId, 'Mentioned in Channel', `${currentUser.fullName} mentioned you: "${text.substring(0, 60)}..."`, 'task_mention');
    });

    if (!isOnline) {
      queueMutation('message', 'create', { channelId, text, senderId: currentUser.id });
    }
  }, [currentUser, isOnline, notify, queueMutation]);

  const convertMessageToTask = useCallback((messageId: string, title: string, assigneeId: string, dueAt: string, priority: Task['priority']) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const channel = channels.find((c) => c.id === msg.channelId);
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      title,
      description: `Created from message by ${SEED_USERS.find((u) => u.id === msg.senderId)?.fullName || 'Staff'}:\n\n"${msg.text}"`,
      matterId: channel?.matterId,
      assignedTo: assigneeId,
      createdBy: currentUser.id,
      priority,
      status: 'todo',
      dueAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);

    // Mark message as converted
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, convertedToTaskId: newTask.id } : m))
    );

    notify(assigneeId, 'Task Created from Message', `${currentUser.fullName} converted a discussion item into a task for you: "${title}"`, 'assignment', channel?.matterId);
    logAudit('task.created_from_message', 'task', newTask.id, channel?.matterId, { messageId, title });
  }, [messages, channels, currentUser, notify, logAudit]);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  // Time tracking & billing
  const startTimer = useCallback((matterId: string, activityType: TimeEntry['activityType'], hourlyRate: number = 15000) => {
    const newTimer: ActiveTimerState = {
      matterId,
      activityType,
      startTimestamp: Date.now(),
      accumulatedSeconds: 0,
      hourlyRate,
      isRunning: true,
    };
    setActiveTimer(newTimer);
  }, []);

  const pauseTimer = useCallback(() => {
    setActiveTimer((prev) => {
      if (!prev || !prev.isRunning) return prev;
      const elapsed = Math.round((Date.now() - prev.startTimestamp) / 1000);
      return {
        ...prev,
        accumulatedSeconds: prev.accumulatedSeconds + elapsed,
        isRunning: false,
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setActiveTimer((prev) => {
      if (!prev || prev.isRunning) return prev;
      return {
        ...prev,
        startTimestamp: Date.now(),
        isRunning: true,
      };
    });
  }, []);

  const stopAndLogTimer = useCallback((notes: string = '') => {
    if (!activeTimer) return null;
    const additional = activeTimer.isRunning ? Math.round((Date.now() - activeTimer.startTimestamp) / 1000) : 0;
    const totalSeconds = Math.max(30, activeTimer.accumulatedSeconds + additional);
    const hours = totalSeconds / 3600;
    const totalAmount = Math.max(500, Math.round(hours * activeTimer.hourlyRate));

    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      matterId: activeTimer.matterId,
      lawyerUserId: currentUser.id,
      activityType: activeTimer.activityType,
      durationSeconds: totalSeconds,
      hourlyRate: activeTimer.hourlyRate,
      totalAmount,
      notes: notes || `${activeTimer.activityType} recorded via precision timer`,
      isBilled: false,
      createdAt: new Date().toISOString(),
    };

    setTimeEntries((prev) => [newEntry, ...prev]);
    setActiveTimer(null);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_active_timer`);

    logAudit('finance.time_recorded', 'matter', activeTimer.matterId, activeTimer.matterId, {
      durationSeconds: totalSeconds,
      totalAmount,
      activity: activeTimer.activityType,
    });

    notify(
      currentUser.id,
      'Billable Time Logged',
      `Logged ${(totalSeconds / 60).toFixed(1)} mins (KES ${totalAmount.toLocaleString()}) to Finance Ledger.`,
      'system',
      activeTimer.matterId
    );

    return newEntry;
  }, [activeTimer, currentUser.id, logAudit, notify]);

  const discardTimer = useCallback(() => {
    setActiveTimer(null);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_active_timer`);
  }, []);

  const recordTimeEntry = useCallback((entryData: Omit<TimeEntry, 'id' | 'createdAt' | 'isBilled'>) => {
    const newEntry: TimeEntry = {
      ...entryData,
      id: `time-${Date.now()}`,
      isBilled: false,
      createdAt: new Date().toISOString(),
    };
    setTimeEntries((prev) => [newEntry, ...prev]);
    logAudit('finance.time_recorded', 'matter', entryData.matterId, entryData.matterId, {
      amount: entryData.totalAmount,
    });
    return newEntry;
  }, [logAudit]);

  const updateApiSettings = useCallback((newSettings: Partial<ApiSettingsConfig>) => {
    setApiSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
      };
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_api_settings`, JSON.stringify(updated));
      return updated;
    });
    notify(currentUser.id, 'API Configurations Updated', 'External service credentials and webhooks updated successfully.', 'system');
  }, [currentUser.id, notify]);

  // Demo state reset
  const resetToDemoData = useCallback(() => {
    localStorage.clear();
    setUsers(SEED_USERS);
    setPracticeWorkflows(SEED_PRACTICE_WORKFLOWS);
    setFirmSettings(DEFAULT_FIRM_SETTINGS);
    const initial: Record<RoleId, PermissionKey[]> = {
      managing_partner: [...INITIAL_ROLES.managing_partner.defaultPermissions],
      senior_partner: [...INITIAL_ROLES.senior_partner.defaultPermissions],
      advocate: [...INITIAL_ROLES.advocate.defaultPermissions],
      paralegal: [...INITIAL_ROLES.paralegal.defaultPermissions],
      administrator: [...INITIAL_ROLES.administrator.defaultPermissions],
      court_clerk: [...INITIAL_ROLES.court_clerk.defaultPermissions],
      finance_officer: [...INITIAL_ROLES.finance_officer.defaultPermissions],
      technical_admin: [...INITIAL_ROLES.technical_admin.defaultPermissions],
    };
    setRolePermissionsMap(initial);
    setClients(SEED_CLIENTS);
    setIntakes(SEED_INTAKES);
    setMatters(SEED_MATTERS);
    setParties(SEED_PARTIES);
    setProceedings(SEED_PROCEEDINGS);
    setTasks(SEED_TASKS);
    setDeadlines(SEED_DEADLINES);
    setCalendarEvents(SEED_CALENDAR_EVENTS);
    setDocuments(SEED_DOCUMENTS);
    setChannels(SEED_CHANNELS);
    setMessages(SEED_MESSAGES);
    setExpenses(SEED_EXPENSES);
    setAccounts(SEED_ACCOUNTS);
    setPayments(SEED_PAYMENTS);
    setNotifications(SEED_NOTIFICATIONS);
    setAuditLogs(SEED_AUDIT_LOGS);
    setTimeEntries(SEED_TIME_ENTRIES);
    setApiSettings(DEFAULT_API_SETTINGS);
    setActiveTimer(null);
    setMutationQueue([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        selectedMatterId,
        setSelectedMatterId,
        selectedMatterTab,
        setSelectedMatterTab,
        currentUser,
        setCurrentUser,
        currentBranchFilter,
        setCurrentBranchFilter,
        isOnline,
        setIsOnline,
        mutationQueue,
        isSyncing,
        triggerSync,
        googleConnected,
        setGoogleConnected,
        whatsappEnabled,
        setWhatsappEnabled,
        emailDigestEnabled,
        setEmailDigestEnabled,
        isSearchOpen,
        setIsSearchOpen,
        isQuickCreateOpen,
        setIsQuickCreateOpen,
        isSyncCenterOpen,
        setIsSyncCenterOpen,
        branches,
        users,
        clients,
        intakes,
        matters,
        parties,
        proceedings,
        workflowStages,
        practiceWorkflows,
        firmSettings,
        rolePermissionsMap,
        effectivePermissions,
        tasks,
        deadlines,
        calendarEvents,
        documents,
        channels,
        messages,
        expenses,
        accounts,
        payments,
        notifications,
        auditLogs,
        timeEntries,
        apiSettings,
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopAndLogTimer,
        discardTimer,
        recordTimeEntry,
        updateApiSettings,
        updateFirmSettings,
        createPracticeWorkflow,
        updatePracticeWorkflow,
        deletePracticeWorkflow,
        addStageToWorkflow,
        updateStageInWorkflow,
        deleteStageFromWorkflow,
        updateUserRoles,
        updateRolePermissions,
        resetRolePermissionsToDefault,
        hasUserPermission,
        hasUserAnyPermission,
        createMatter,
        updateMatter,
        advanceMatterStage,
        // Domain legal workflows state
        incidentEvidence,
        medicalCases,
        liabilityQuantums,
        claimNegotiations,
        pleadingsBundles,
        courtFilingPackages,
        serviceQueue,
        preTrialCompliances,
        hearingBriefs,
        judgmentAwards,
        recoveryExecutions,
        settlementDistributions,
        closureAudits,
        // Domain workflow methods
        createIntakeLead,
        updateIntakeLead,
        runConflictSearch,
        recordConflictClearance,
        updateIntakeKycRetainer,
        convertIntakeWithWorkflow,
        advanceMatterStageExpanded,
        updateIncidentEvidence,
        updateMedicalCase,
        updateMedicalReportRequest,
        updateLiabilityQuantum,
        updateClaimNegotiation,
        addNegotiationEntry,
        approveSettlementOffer,
        updatePleadingsBundle,
        createCourtFilingPackage,
        updateCourtFilingPackage,
        createServiceQueueItem,
        updateServiceQueueItem,
        addServiceAttempt,
        updatePreTrialCompliance,
        updateHearingBrief,
        propagateCourtOutcomeDetailed,
        updateJudgmentAward,
        triggerRecoveryFromJudgment,
        updateRecoveryExecution,
        updateSettlementDistribution,
        disburseClientSettlement,
        updateClosureAudit,
        finalizeMatterClosureWizard,
        createClient,
        updateClient,
        convertIntakeToMatter,
        createTask,
        updateTask,
        completeTask,
        createCalendarEvent,
        recordCourtOutcome,
        uploadDocumentVersion,
        submitDocumentForReview,
        approveDocumentVersion,
        rejectDocumentVersion,
        signDocumentVersion,
        revertDocumentToVersion,
        markDocumentFiled,
        createExpenseRequest,
        approveExpense,
        disburseExpense,
        recordPaymentReceipt,
        sendMessage,
        convertMessageToTask,
        markNotificationRead,
        clearAllNotifications,
        resetToDemoData,
        resetDataToDefault: resetToDemoData,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
