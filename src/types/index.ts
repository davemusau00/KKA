export type BranchId = 'branch-nairobi' | 'branch-two';

export interface Branch {
  id: BranchId;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export type RoleId = 
  | 'senior_partner'
  | 'advocate'
  | 'paralegal'
  | 'administrator'
  | 'court_clerk'
  | 'finance_officer'
  | 'technical_admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: RoleId;
  homeBranchId: BranchId;
  additionalBranchIds?: BranchId[];
  isActive: boolean;
  avatarUrl?: string;
  barNumber?: string;
}

export type PermissionKey =
  | 'matter.read'
  | 'matter.create'
  | 'matter.update'
  | 'matter.assign'
  | 'matter.close'
  | 'document.read'
  | 'document.upload'
  | 'document.approve'
  | 'finance.expense.create'
  | 'finance.expense.approve'
  | 'finance.client_money.read'
  | 'calendar.manage'
  | 'admin.users.manage'
  | 'reports.firm.read';

export type ClientType = 'person' | 'organization';
export type ClientStatus = 'active' | 'former' | 'prospect' | 'blacklisted';

export interface Client {
  id: string;
  clientType: ClientType;
  displayName: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;
  idNumber: string; // National ID or Company Reg Number
  phone: string;
  alternatePhone?: string;
  email: string;
  postalAddress?: string;
  physicalAddress?: string;
  preferredContactMethod: 'phone' | 'whatsapp' | 'email' | 'postal';
  status: ClientStatus;
  notes?: string;
  nextOfKin?: {
    name: string;
    relationship: string;
    phone: string;
  };
  occupation?: string;
  employer?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export type IntakeStatus = 
  | 'new'
  | 'contacting'
  | 'awaiting_information'
  | 'under_review'
  | 'accepted'
  | 'declined'
  | 'duplicate'
  | 'converted';

export interface IntakeLead {
  id: string;
  source: string; // e.g., 'Referral - Dr. Mwangi', 'Walk-in', 'Police Abstract contact'
  referrerName?: string;
  clientName: string;
  phone: string;
  email?: string;
  incidentDate: string;
  incidentLocation?: string;
  briefDescription: string;
  practiceArea: string;
  assignedIntakeOwnerId: string;
  disposition: IntakeStatus;
  notes?: string;
  convertedMatterId?: string;
  convertedClientId?: string;
  createdAt: string;
}

export type PracticeArea = 'Personal Injury' | 'Commercial' | 'Conveyancing' | 'Family';
export type MatterStatus = 'draft' | 'active' | 'on_hold' | 'closed' | 'archived';
export type MatterPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskPriority = MatterPriority;
export type ClientRecord = Client;
export type IntakeRecord = IntakeLead;

export interface Matter {
  id: string;
  internalReference: string; // e.g. "KKC/PI/2026/00427"
  title: string;
  clientId: string;
  practiceArea: 'Personal Injury' | 'Commercial' | 'Conveyancing' | 'Family';
  matterType: string; // e.g. "Road Traffic Accident (RTA) Personal Injury"
  workflowTemplateId: string;
  originatingBranchId: BranchId;
  responsibleBranchId: BranchId;
  supervisingUserId: string; // Advocate or Senior Partner
  currentStageId: number; // 1 to 19 for PI
  openedAt: string;
  status: MatterStatus;
  priority: MatterPriority;
  summary: string;
  nextAction: string;
  closedAt?: string;
  closureReason?: string;
  courtProceedingIds: string[];
  assignedUserIds: string[];
  lastActivityAt: string; // for stalled detection
}

export type PartyType = 
  | 'plaintiff'
  | 'defendant'
  | 'insurer'
  | 'advocate_opposing'
  | 'witness'
  | 'doctor'
  | 'police_station'
  | 'employer'
  | 'third_party';

export interface MatterParty {
  id: string;
  matterId: string;
  partyType: PartyType;
  name: string;
  organizationName?: string;
  phone?: string;
  email?: string;
  roleDescription: string;
  notes?: string;
}

export interface CourtProceeding {
  id: string;
  matterId: string;
  courtName: string; // e.g. "Milimani Chief Magistrate's Commercial Court"
  station: string; // e.g. "Nairobi"
  division: string; // e.g. "Civil & Accident"
  caseNumber: string; // e.g. "Demo MCCC E1234/2026"
  proceedingType: 'plaint' | 'appeal' | 'miscellaneous' | 'tribunal';
  filedAt: string;
  judgeOrMagistrate?: string;
  opposingCounsel?: string;
  notes?: string;
  status: 'active' | 'concluded' | 'stayed';
}

export interface WorkflowStageDefinition {
  id: number;
  name: string;
  description: string;
  targetDurationDays: number;
  defaultRole: RoleId;
  requiredDocumentTypes: string[];
  checklistItems: string[];
}

export interface StageHandoff {
  id: string;
  matterId: string;
  fromStageId: number;
  toStageId: number;
  fromUserId: string;
  toUserId: string;
  handoffNotes: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export type TaskStatus = 
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'waiting_external'
  | 'waiting_review'
  | 'completed'
  | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  matterId?: string;
  stageId?: number;
  calendarEventId?: string;
  documentId?: string;
  assignedTo: string; // userId
  createdBy: string; // userId
  reviewerId?: string;
  priority: MatterPriority;
  status: TaskStatus;
  startAt?: string;
  dueAt: string;
  officialDeadlineAt?: string; // statutory limitation or court deadline (immutable on reschedule)
  completedAt?: string;
  blockedReason?: string;
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Deadline {
  id: string;
  matterId: string;
  title: string;
  deadlineType: 'statutory_limitation' | 'court_directions' | 'demand_response' | 'submissions';
  officialDueAt: string;
  source: string; // e.g. "Civil Procedure Rules / Notice of Intention to Sue"
  riskLevel: 'medium' | 'high' | 'critical';
  notes?: string;
  completedAt?: string;
}

export type CalendarEventType = 
  | 'court'
  | 'client_meeting'
  | 'internal_meeting'
  | 'medical'
  | 'filing'
  | 'deadline'
  | 'other';

export type CourtEventStatus = 'scheduled' | 'attended' | 'adjourned' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  matterId?: string;
  title: string;
  eventType: CalendarEventType;
  startAt: string; // ISO string
  endAt: string;
  allDay?: boolean;
  location: string;
  virtualMeetingUrl?: string;
  assignedUserId: string;
  organizerId: string;
  courtProceedingId?: string;
  notes?: string;
  linkedDocumentIds?: string[];
  courtStatus?: CourtEventStatus;
  attendanceNotes?: string;
  courtOutcome?: string;
  nextCourtDate?: string;
  externalGoogleEventId?: string;
  syncState?: 'synced' | 'pending' | 'failed';
}

export type DocumentStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'signed'
  | 'filed'
  | 'served'
  | 'superseded'
  | 'archived';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  checksum: string;
  uploadedBy: string; // userId
  createdAt: string;
  status: DocumentStatus;
  notes?: string;
  courtFilingRef?: string;
}

export interface LegalDocument {
  id: string;
  matterId: string;
  title: string;
  category: 'Pleadings' | 'Medical' | 'Police & Evidence' | 'Correspondence' | 'Court Receipts' | 'Identification';
  documentType: string; // e.g. "Plaint", "Verifying Affidavit", "Medical Report", "Police Abstract"
  confidentialityLevel: 'standard' | 'restricted' | 'partner_only';
  currentVersionId: string;
  ownerUserId: string;
  versions: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

export type CommunicationChannelType = 'firm' | 'branch' | 'team' | 'matter';

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  createdAt: string;
  replyToId?: string;
  mentions?: string[]; // userIds
  attachments?: {
    name: string;
    size: string;
    url?: string;
  }[];
  convertedToTaskId?: string;
}

export interface CommunicationChannel {
  id: string;
  type: CommunicationChannelType;
  name: string;
  description?: string;
  branchId?: BranchId;
  matterId?: string;
  isPrivate?: boolean;
  memberUserIds: string[];
}

export type ExpenseCategory = 
  | 'filing_fees'
  | 'court_fees'
  | 'process_server'
  | 'transport_fare'
  | 'medical_report_fees'
  | 'police_abstract_fee'
  | 'printing_copying'
  | 'search_fees'
  | 'courier'
  | 'witness_facilitation'
  | 'office_supplies'
  | 'other';

export type ExpenseStatus = 
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'reconciled'
  | 'void';

export interface ExpenseRecord {
  id: string;
  matterId?: string;
  branchId: BranchId;
  categoryId: ExpenseCategory;
  amount: number;
  currency: 'KES';
  spentAt: string;
  description: string;
  paidByUserId: string;
  requestedByUserId?: string;
  approvedByUserId?: string;
  disbursedByUserId?: string;
  paymentSource: 'Petty Cash' | 'Office Bank Account' | 'Advocate Direct' | 'M-Pesa Till';
  receiptDocumentId?: string;
  receiptFileName?: string;
  status: ExpenseStatus;
  reconciliationNotes?: string;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'office' | 'client' | 'petty_cash' | 'bank' | 'mobile_money';
  branchId?: BranchId;
  currency: 'KES';
  balance: number;
  accountNumber: string;
}

export interface PaymentReceipt {
  id: string;
  matterId?: string;
  clientId?: string;
  amount: number;
  currency: 'KES';
  receivedAt: string;
  payerName: string;
  paymentMethod: 'M-Pesa' | 'Bank Transfer' | 'Cash' | 'Cheque';
  referenceNumber: string; // e.g. M-Pesa transaction code "QHB7382K9X"
  accountId: string; // Client Trust vs Office
  description: string;
  allocatedToDisbursements: number;
  allocatedToFees: number;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  recipientUserId: string;
  category: 'assignment' | 'deadline' | 'court_event' | 'task_mention' | 'document_review' | 'expense_approval' | 'system';
  title: string;
  message: string;
  matterId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  urgency: 'normal' | 'urgent' | 'critical';
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  action: string;
  entityType: 'matter' | 'task' | 'document' | 'court_event' | 'expense' | 'handoff' | 'client';
  entityId: string;
  matterId?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface OfflineMutation {
  id: string;
  entityType: 'task' | 'matter_note' | 'expense_draft' | 'message' | 'court_outcome';
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  lastError?: string;
}

export interface TimeEntry {
  id: string;
  matterId: string;
  lawyerUserId: string;
  activityType: 'Court Attendance' | 'Pleadings Drafting' | 'Client Consultation' | 'Document Review' | 'Legal Research' | 'Negotiation';
  durationSeconds: number;
  hourlyRate: number;
  totalAmount: number;
  notes: string;
  isBilled: boolean;
  createdAt: string;
}

export interface ApiSettingsConfig {
  google: {
    clientId: string;
    clientEmail: string;
    syncCourtCalendar: boolean;
    autoGenerateMeetLinks: boolean;
    calendarId: string;
    isConnected: boolean;
    lastSyncTimestamp?: string;
  };
  whatsapp: {
    wabaAccountId: string;
    phoneNumberId: string;
    accessToken: string;
    webhookSecret: string;
    enableHearingReminders: boolean;
    enableMilestoneAlerts: boolean;
    isConnected: boolean;
  };
  judiciaryCts: {
    portalUrl: string;
    apiToken: string;
    courtStationCode: string;
    autoPollMentions: boolean;
    enableBarcodeVerification: boolean;
    isConnected: boolean;
  };
  mpesaDaraja: {
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
    environment: 'sandbox' | 'production';
    b2cSecurityCredential: string;
    isConnected: boolean;
  };
  africasTalkingSms: {
    username: string;
    apiKey: string;
    senderId: string;
    enableSmsReminders: boolean;
    isConnected: boolean;
  };
}

