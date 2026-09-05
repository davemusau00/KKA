import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  BranchId,
  UserProfile,
  Client,
  IntakeLead,
  Matter,
  MatterParty,
  CourtProceeding,
  WorkflowStageDefinition,
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
  activeTimer: ActiveTimerState | null;

  // Operational Functions
  createMatter: (data: Partial<Matter> & { clientDisplayName: string; clientPhone: string; clientNationalId: string }) => Matter;
  updateMatter: (id: string, updates: Partial<Matter>) => void;
  advanceMatterStage: (matterId: string, toStageId: number, newOwnerId: string, handoffNotes: string) => void;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  convertIntakeToMatter: (intakeId: string) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  createCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  recordCourtOutcome: (eventId: string, status: CourtEventStatus, outcomeNotes: string, nextHearingDate?: string) => void;
  uploadDocumentVersion: (documentId: string, file: { name: string; size: number; mimeType?: string }, notes?: string) => void;
  approveDocumentVersion: (documentId: string, versionId: string) => void;
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
  const [users] = useState<UserProfile[]>(SEED_USERS);
  const [workflowStages] = useState<WorkflowStageDefinition[]>(WORKFLOW_STAGES_PI);

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
    return saved ? JSON.parse(saved) : DEFAULT_API_SETTINGS;
  });

  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_active_timer`);
    return saved ? JSON.parse(saved) : null;
  });

  // Local storage auto-sync
  useEffect(() => {
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
    if (activeTimer) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_active_timer`, JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_active_timer`);
    }
  }, [clients, intakes, matters, parties, proceedings, tasks, deadlines, calendarEvents, documents, channels, messages, expenses, accounts, payments, notifications, auditLogs, timeEntries, apiSettings, activeTimer]);

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

    setMatters((prev) =>
      prev.map((m) =>
        m.id === matterId
          ? {
              ...m,
              currentStageId: toStageId,
              supervisingUserId: newOwnerId,
              assignedUserIds: Array.from(new Set([...m.assignedUserIds, newOwnerId])),
              lastActivityAt: now,
              nextAction: `Stage ${toStageId}: ${WORKFLOW_STAGES_PI.find((s) => s.id === toStageId)?.name || 'Next Stage'} in progress.`,
            }
          : m
      )
    );

    // Create stage handoff task for new owner
    const stageDef = WORKFLOW_STAGES_PI.find((s) => s.id === toStageId);
    const handoffTask: Task = {
      id: `tsk-${Date.now()}`,
      title: `Execute Stage ${toStageId} tasks (${stageDef?.name || 'Workflow'})`,
      description: `Handoff notes from ${currentUser.fullName}: ${handoffNotes}`,
      matterId,
      stageId: toStageId,
      assignedTo: newOwnerId,
      createdBy: currentUser.id,
      priority: 'high',
      status: 'todo',
      dueAt: new Date(Date.now() + (stageDef?.targetDurationDays || 7) * 86400000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [handoffTask, ...prev]);

    logAudit('matter.stage_changed', 'handoff', matterId, matterId, {
      fromStage: fromStageId,
      toStage: toStageId,
      newOwner: newOwnerId,
      notes: handoffNotes,
    });

    notify(
      newOwnerId,
      `Matter Reassigned (Stage ${toStageId})`,
      `${currentUser.fullName} transferred ${targetMatter.internalReference} to you. Notes: ${handoffNotes}`,
      'assignment',
      matterId,
      'urgent'
    );
  }, [matters, currentUser, logAudit, notify]);

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

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    if (!isOnline) {
      queueMutation('task', 'update', { id, ...updates });
    }
  }, [isOnline, queueMutation]);

  const completeTask = useCallback((id: string) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'completed', completedAt: now, updatedAt: now } : t))
    );
    logAudit('task.completed', 'task', id);
    if (!isOnline) {
      queueMutation('task', 'update', { id, status: 'completed', completedAt: now });
    }
  }, [logAudit, isOnline, queueMutation]);

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

  // Document Management
  const uploadDocumentVersion = useCallback((documentId: string, file: { name: string; size: number; mimeType?: string }, notes?: string) => {
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
          status: 'review',
          notes: notes || 'New version submitted for advocate review',
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
  }, [currentUser.id, logAudit]);

  const approveDocumentVersion = useCallback((documentId: string, versionId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          versions: doc.versions.map((v) => (v.id === versionId ? { ...v, status: 'approved' } : v)),
        };
      })
    );
    logAudit('document.approved', 'document', documentId, undefined, { versionId });
  }, [logAudit]);

  const markDocumentFiled = useCallback((documentId: string, versionId: string, filingRef: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          versions: doc.versions.map((v) => (v.id === versionId ? { ...v, status: 'filed', courtFilingRef: filingRef } : v)),
        };
      })
    );
    logAudit('document.filed', 'document', documentId, undefined, { versionId, filingRef });
  }, [logAudit]);

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
        createMatter,
        updateMatter,
        advanceMatterStage,
        createClient,
        updateClient,
        convertIntakeToMatter,
        createTask,
        updateTask,
        completeTask,
        createCalendarEvent,
        recordCourtOutcome,
        uploadDocumentVersion,
        approveDocumentVersion,
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
