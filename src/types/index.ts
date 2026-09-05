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
  | 'managing_partner'
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
  role: RoleId; // Primary display role
  roles: RoleId[]; // Multi-role support (union of permissions)
  homeBranchId: BranchId;
  additionalBranchIds?: BranchId[];
  isActive: boolean;
  avatarUrl?: string;
  barNumber?: string;
}

export type PermissionKey =
  // Module Access Permissions
  | 'module.dashboard'
  | 'module.matters'
  | 'module.clients'
  | 'module.tasks'
  | 'module.calendar'
  | 'module.documents'
  | 'module.comms'
  | 'module.finance'
  | 'module.reports'
  | 'module.admin'
  | 'module.integrations'
  | 'module.settings'
  // Matter Permissions
  | 'matter.view'
  | 'matter.create'
  | 'matter.edit'
  | 'matter.delete'
  | 'matter.stage_advance'
  | 'matter.settlement_approve'
  // Task Permissions
  | 'task.view'
  | 'task.create'
  | 'task.edit'
  | 'task.complete'
  | 'task.delete'
  // Document Permissions
  | 'document.view'
  | 'document.upload'
  | 'document.review_submit'
  | 'document.approve'
  | 'document.sign'
  | 'document.file'
  | 'document.revert'
  | 'document.delete'
  // Finance Permissions
  | 'finance.view'
  | 'finance.expense_create'
  | 'finance.expense_approve'
  | 'finance.expense_disburse'
  | 'finance.trust_ledger'
  | 'finance.billing_manage'
  // Administration Permissions
  | 'admin.users_manage'
  | 'admin.roles_manage'
  | 'admin.workflows_manage'
  | 'admin.branches_manage'
  | 'admin.settings_manage'
  | 'admin.audit_view'
  // Legacy Aliases
  | 'matter.read'
  | 'matter.update'
  | 'matter.assign'
  | 'matter.close'
  | 'document.read'
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
  | 'inquiry'
  | 'contacting'
  | 'awaiting_information'
  | 'under_review'
  | 'conflict_cleared'
  | 'conflict_blocked'
  | 'kyc_pending'
  | 'retained'
  | 'accepted'
  | 'declined'
  | 'duplicate'
  | 'converted';

export interface IntakePartyInput {
  id: string;
  name: string;
  role: 'plaintiff' | 'defendant' | 'insurer' | 'witness' | 'opposing_counsel' | 'employer' | 'other';
  idOrRegNumber?: string;
  phone?: string;
  email?: string;
  insuranceCompany?: string;
  policyOrClaimNumber?: string;
  notes?: string;
}

export interface ConflictMatch {
  id: string;
  partyName: string;
  matchedEntity: string;
  matchedMatterId?: string;
  matchedMatterRef?: string;
  matchedMatterTitle?: string;
  matchedRole: string;
  matchType: 'exact_name' | 'id_number' | 'phone' | 'vehicle_reg' | 'adverse_party';
  severity: 'low' | 'high' | 'critical';
  details: string;
}

export interface ConflictCheckRecord {
  id: string;
  intakeId?: string;
  matterId?: string;
  checkedByUserId: string;
  checkedAt: string;
  status: 'clear' | 'possible_match' | 'conflict_detected' | 'overridden_approved';
  partiesSearched: string[];
  matchesFound: ConflictMatch[];
  clearanceNotes?: string;
  clearedByPartnerId?: string;
  clearedAt?: string;
}

export interface IntakeKycRetainer {
  idDocumentType: 'National ID' | 'Passport' | 'Alien Card' | 'Certificate of Incorporation';
  idNumber: string;
  idVerified: boolean;
  kycDocuments: string[];
  warrantToActSigned: boolean;
  retainerAgreementSigned: boolean;
  retainerAgreedAmount: number;
  retainerDepositPaid: boolean;
  depositReceiptRef?: string;
  termsAccepted: boolean;
  partnerApproval: 'pending' | 'approved' | 'declined';
  approvedByUserId?: string;
  approvedAt?: string;
}

export interface IntakeLead {
  id: string;
  source: string; // e.g., 'Referral - Dr. Mwangi', 'Walk-in', 'Police Abstract contact'
  referrerName?: string;
  clientName: string;
  phone: string;
  email?: string;
  nationalId?: string;
  incidentDate: string;
  incidentLocation?: string;
  briefDescription: string;
  practiceArea: string;
  assignedIntakeOwnerId: string;
  disposition: IntakeStatus;
  notes?: string;
  convertedMatterId?: string;
  convertedClientId?: string;
  potentialParties?: IntakePartyInput[];
  conflictCheck?: ConflictCheckRecord;
  kycRetainer?: IntakeKycRetainer;
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
  supervisingUserId: string; // Advocate or Senior Partner (retains supervisory governance)
  currentStageOwnerId?: string; // Current active stage worker/owner
  courtClerkId?: string; // Assigned Court Clerk
  financeContactId?: string; // Assigned Finance Officer
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

export interface WorkflowStageConfig {
  id: number;
  name: string;
  description: string;
  targetDurationDays: number;
  responsibleRoles?: RoleId[];
  assignedStaffIds?: string[];
  requiredTasks?: string[];
  requiredDocuments?: string[];
  requiredDocumentTypes?: string[];
  checklistItems?: string[];
  requiresApproval?: boolean;
  approvalRole?: RoleId;
  autoCreateTasks?: {
    title: string;
    role: RoleId;
    dueInDays: number;
    priority: MatterPriority;
  }[];
}

export interface PracticeAreaWorkflow {
  id: string;
  practiceArea: string; // e.g. "Personal Injury (Motor Accident)", "Commercial Litigation", "Conveyancing & Land"
  name: string;
  description: string;
  isDefault: boolean;
  stages: WorkflowStageConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStageDefinition extends WorkflowStageConfig {
  defaultRole: RoleId; // alias for backwards compatibility
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
  dependsOnTaskIds?: string[]; // Prerequisite task IDs that must be completed first
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
  | 'in_review'
  | 'approved'
  | 'signed'
  | 'filed'
  | 'served'
  | 'rejected'
  | 'superseded'
  | 'archived'
  | 'review'; // backwards compatibility alias

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
  changeSummary?: string; // Short description of changes made in this version
  contentSnippet?: string; // Full or preview text of this version for diff & inspection
  reviewedBy?: string; // userId
  reviewedAt?: string;
  reviewComment?: string;
  signedBy?: string; // userId
  signedAt?: string;
  signatureHash?: string;
  courtFilingRef?: string;
  courtFiledAt?: string;
  revertedFromVersionNumber?: number; // if created by reverting to a previous version
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

export interface FirmSettingsConfig {
  firmProfile: {
    firmName: string;
    firmTagline: string;
    lskFirmRegistrationNo: string;
    kraPin: string;
    vatRegistrationNo: string;
    headOfficeAddress: string;
    physicalBuilding: string;
    floorAndWing: string;
    city: string;
    postalAddress: string;
    primaryPhone: string;
    hotlinePhone: string;
    primaryEmail: string;
    billingEmail: string;
    websiteUrl: string;
  };
  courtRules: {
    defaultCourtStation: string;
    statutoryLimitationWarningDays: number;
    filingDeadlineNoticeHours: number;
    enableJudiciarySync: boolean;
    autoPollMentions: boolean;
    enforceCourtHolidays: boolean;
    strictCourtAttireDressCodeNotice: boolean;
  };
  financePolicies: {
    currencyCode: string;
    hourlyRates: {
      senior_partner: number;
      advocate: number;
      paralegal: number;
    };
    maxPettyCashDisbursementWithoutPartner: number;
    clientTrustAccountBank: string;
    clientTrustAccountNumber: string;
    officeOperationsAccountBank: string;
    officeOperationsAccountNumber: string;
    defaultMpesaPaybill: string;
    defaultMpesaAccountRef: string;
    vatRatePercent: number;
  };
  documentPolicies: {
    mandatoryAdvocateSignOff: boolean;
    enableWatermarkOnDrafts: boolean;
    watermarkText: string;
    maxUploadFileSizeBytes: number;
    allowedMimeTypes: string[];
    archivalRetentionYears: number;
    enforceCourtBarcodeSeal: boolean;
  };
  security: {
    twoFactorEnforced: boolean;
    sessionTimeoutMinutes: number;
    ipWhitelistingEnabled: boolean;
    allowedIpRanges: string[];
    strictAuditLogging: boolean;
  };
}

// ==========================================
// 3. EVIDENCE & INVESTIGATION TYPES
// ==========================================
export interface VehicleRecord {
  id: string;
  registrationNumber: string;
  makeModel: string;
  ownerName: string;
  driverName: string;
  driverLicenseNo?: string;
  insuranceCompany: string;
  policyNumber: string;
  ntsaSearchObtained: boolean;
  ntsaSearchRef?: string;
  notes?: string;
}

export interface WitnessRecord {
  id: string;
  name: string;
  contact: string;
  statementRequested: boolean;
  statementReceived: boolean;
  statementDate?: string;
  keyObservations: string;
  documentId?: string;
}

export interface IncidentExhibit {
  id: string;
  title: string;
  category: 'Police Abstract' | 'Scene Photos' | 'Vehicle Photos' | 'CCTV' | 'Receipts' | 'Other Exhibit';
  documentId?: string;
  dateObtained: string;
  obtainedBy: string;
  notes?: string;
}

export interface IncidentEvidenceData {
  incident: {
    date: string;
    time: string;
    location: string;
    description: string;
    obNumber: string;
    policeStation: string;
    investigatingOfficer: string;
    officerPhone?: string;
    roadConditions?: string;
  };
  vehicles: VehicleRecord[];
  witnesses: WitnessRecord[];
  exhibits: IncidentExhibit[];
}

// ==========================================
// 4. MEDICAL CASE MANAGEMENT TYPES
// ==========================================
export interface InjuryRecord {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  bodyPart: string;
  permanentEffects?: string;
}

export interface MedicalProvider {
  id: string;
  facilityName: string;
  doctorName: string;
  specialty: string;
  contact: string;
}

export interface TreatmentEpisode {
  id: string;
  facilityName: string;
  admissionDate?: string;
  dischargeDate?: string;
  treatmentSummary: string;
  costAmount: number;
  receiptNumber?: string;
}

export type MedicalReportStatus =
  | 'requested'
  | 'paid'
  | 'appointment_scheduled'
  | 'examined'
  | 'awaiting_report'
  | 'received'
  | 'reviewed'
  | 'supplementary_required'
  | 'complete';

export interface MedicalReportRequest {
  id: string;
  doctorName: string;
  specialty: string;
  facility: string;
  requestedAt: string;
  feeAmount: number;
  status: MedicalReportStatus;
  appointmentDate?: string;
  permanentDisabilityPercent?: number;
  futureTreatmentEstimate?: number;
  futureTreatmentNotes?: string;
  reportDocumentId?: string;
  notes?: string;
}

export interface MedicalCaseData {
  injuries: InjuryRecord[];
  medicalProviders: MedicalProvider[];
  treatmentEpisodes: TreatmentEpisode[];
  p3Form: {
    issuedByDoctor: string;
    policeStationRef: string;
    dateExamined: string;
    degreeOfHarm: 'Harm' | 'Grievous Harm' | 'Maim' | 'Dangerous Harm';
    status: 'requested' | 'received' | 'certified';
    documentId?: string;
  };
  imagingAndRecords: { id: string; title: string; facility: string; reportDate: string; findings: string }[];
  medicalReportRequests: MedicalReportRequest[];
  permanentDisabilityOverallPercent?: number;
  futureTreatmentEstimateTotal?: number;
  totalMedicalExpensesIncurred?: number;
}

// ==========================================
// 5. LIABILITY & QUANTUM TYPES
// ==========================================
export interface SpecialDamageItem {
  id: string;
  head: string;
  amount: number;
  receiptRef?: string;
  isEvidenced: boolean;
  evidenceDocId?: string;
}

export interface LiabilityQuantumData {
  liability: {
    claimantPercent: number;
    defendantPercent: number;
    contributoryNegligenceAlleged: boolean;
    contributoryNotes?: string;
    supportingEvidence: string[];
    weaknesses: string[];
    advocateOpinion: string;
  };
  damages: {
    generalDamages: number;
    generalDamagesJustification?: string;
    specialDamages: SpecialDamageItem[];
    futureMedicalExpenses: number;
    futureMedicalJustification?: string;
    lossOfEarnings: number;
    lossOfEarningsMonths?: number;
    monthlyEarningsBasis?: number;
    lossOfEarningCapacity: number;
    otherHeads: { id: string; title: string; amount: number; notes: string }[];
    totalEstimatedClaimValue: number;
  };
}

// ==========================================
// 6. CLAIM & NEGOTIATION TYPES
// ==========================================
export interface NegotiationLedgerItem {
  id: string;
  date: string;
  party: 'insurer' | 'firm';
  offerAmount?: number;
  counterOfferAmount?: number;
  status: 'sent' | 'received' | 'rejected' | 'considering' | 'countered' | 'accepted';
  notes: string;
}

export interface ClaimNegotiationData {
  insurer: {
    name: string;
    policyNumber: string;
    claimReference: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    demandSentDate?: string;
    noticeSentDate?: string;
    deliveryProofRef?: string;
    responseDeadline?: string;
    responseReceivedDate?: string;
    status: 'notice_sent' | 'demand_sent' | 'negotiating' | 'settlement_proposed' | 'settled' | 'repudiated';
  };
  negotiationLedger: NegotiationLedgerItem[];
  settlementApproval: {
    recommendedAmount: number;
    clientAuthorized: boolean;
    clientAuthorityDate?: string;
    partnerApproved: boolean;
    partnerApprovedByUserId?: string;
    partnerApprovedDate?: string;
    acceptedAt?: string;
    dischargeVoucherSigned: boolean;
  };
}

// ==========================================
// 7. PLEADINGS BUNDLE & REVIEW TYPES
// ==========================================
export interface PleadingsBundleData {
  id: string;
  matterId: string;
  plaintStatus: 'draft' | 'under_review' | 'approved' | 'signed';
  verifyingAffidavitStatus: 'draft' | 'sworn' | 'signed';
  witnessStatements: { id: string; witnessName: string; status: 'draft' | 'reviewed' | 'approved' }[];
  listOfWitnesses: boolean;
  listOfDocuments: boolean;
  supportingDocumentsAttached: boolean;
  bundleReviewStatus: 'draft' | 'submitted_for_review' | 'advocate_approved' | 'partner_approved' | 'client_signed' | 'ready_for_filing';
  reviewedByAdvocateId?: string;
  approvedByPartnerId?: string;
  clientSignedAt?: string;
  readyForFilingPackage: boolean;
}

// ==========================================
// 8. COURT FILING OPERATIONS TYPES
// ==========================================
export interface CourtFilingPackage {
  id: string;
  matterId: string;
  matterRef: string;
  courtStation: string;
  division: string;
  caseType: string;
  plaintiff: string;
  defendants: string[];
  documents: { title: string; type: string; isReady: boolean; isStamped?: boolean }[];
  courtAssessmentKes: number;
  feeRequisitionApproved: boolean;
  receiptUploaded: boolean;
  receiptNumber?: string;
  ctsReference?: string;
  courtCaseNumber?: string;
  stampedDocsUploaded: boolean;
  assignedClerkId: string;
  status: 'ready_to_file' | 'requisition_pending' | 'submitted_cts' | 'stamped_filed' | 'rejected_by_registry';
  submittedAt?: string;
  filedAt?: string;
}

// ==========================================
// 9. SUMMONS & SERVICE QUEUE TYPES
// ==========================================
export interface ServiceQueueItem {
  id: string;
  matterId: string;
  matterRef: string;
  documentTitle: string;
  partyToServe: string;
  partyAddress: string;
  processServerName: string;
  assignedDate: string;
  dueDate: string;
  attempts: { attemptNo: number; date: string; outcome: string; notes: string }[];
  serviceDate?: string;
  serviceMethod: 'Personal Service' | 'Substituted Service' | 'Advocate on Record' | 'Registered Mail';
  affidavitOfServiceStatus: 'awaited' | 'received' | 'filed';
  status: 'requested' | 'assigned' | 'attempted' | 'served' | 'failed' | 'affidavit_received' | 'filed';
}

// ==========================================
// 10. PRE-TRIAL COMPLIANCE TYPES
// ==========================================
export interface PreTrialComplianceData {
  matterId: string;
  listOfWitnesses: boolean;
  witnessStatements: boolean;
  listOfDocuments: boolean;
  documentBundle: boolean;
  agreedIssues: boolean;
  preTrialQuestionnaire: boolean;
  expertDocuments: boolean;
  courtDirections: string;
  complianceDeadline: string;
  isCompliant: boolean;
}

// ==========================================
// 11. HEARING BRIEF TYPES
// ==========================================
export interface HearingBriefData {
  matterId: string;
  courtName: string;
  hearingDate: string;
  assignedAdvocateId: string;
  witnesses: { name: string; role: string; status: 'confirmed' | 'unconfirmed' | 'subpoenaed' }[];
  documents: { name: string; isReady: boolean }[];
  issues: { liability: string; quantum: string };
  opposingCounsel: string;
  currentSettlementOffer?: string;
  advocateNotes: string;
  isReadyForHearing: boolean;
}

// ==========================================
// 12. JUDGMENT & AWARD TYPES
// ==========================================
export interface JudgmentAwardData {
  matterId: string;
  judgmentDate: string;
  liabilityClaimantPercent: number;
  liabilityDefendantPercent: number;
  generalDamages: number;
  specialDamages: number;
  futureMedical: number;
  costsAwarded: number;
  interestRatePercent: number;
  interestFromDate: string;
  totalAward: number;
  paymentDeadline: string;
  appealDeadline: string;
  appealRecommended: boolean;
  appealJustification?: string;
  recoveryTriggered: boolean;
}

// ==========================================
// 13. RECOVERY & EXECUTION TYPES
// ==========================================
export interface RecoveryExecutionData {
  matterId: string;
  decreeExtracted: boolean;
  certificateOfCosts: boolean;
  billOfCosts: boolean;
  billAmount: number;
  taxationComplete: boolean;
  taxedAmount: number;
  insurerDemandSent: boolean;
  demandSentDate?: string;
  paymentPromiseReceived: boolean;
  paymentPromiseNotes?: string;
  executionWarrantsIssued: boolean;
  garnisheeProceedings: boolean;
  auctioneerInstructed: boolean;
  auctioneerName?: string;
  paymentReceived: boolean;
  paymentReceivedAmount: number;
  status: 'pending_decree' | 'bill_of_costs' | 'insurer_demand' | 'execution_active' | 'garnishee' | 'fully_recovered';
}

// ==========================================
// 14. SETTLEMENT & DISTRIBUTION STATEMENT
// ==========================================
export interface SettlementDistributionData {
  matterId: string;
  grossSettlementAmount: number;
  fundsReceivedDate: string;
  account: string;
  outstandingDisbursements: { id: string; head: string; amount: number; voucherRef: string }[];
  totalDisbursements: number;
  professionalFees: number;
  vatOnFees: number;
  otherDeductions: { id: string; title: string; amount: number }[];
  netClientAmount: number;
  settlementStatementProduced: boolean;
  clientApprovalStatus: 'pending' | 'approved' | 'disbursed';
  clientApprovedAt?: string;
  paymentMethod: 'M-Pesa B2C' | 'Bank Wire' | 'Cheque';
  paymentReference?: string;
  disbursedAt?: string;
}

// ==========================================
// 15. CLOSURE WIZARD AUDIT
// ==========================================
export interface MatterClosureAuditData {
  matterId: string;
  isJudgmentSettlementComplete: boolean;
  isClientFundsReconciled: boolean;
  isOutstandingExpensesResolved: boolean;
  isFinalPaymentMade: boolean;
  isClientInformedAndDischarged: boolean;
  areAllDocumentsFiled: boolean;
  physicalFileLocation: string;
  closingNote: string;
  supervisorApproved: boolean;
  approvedByUserId?: string;
  approvedAt?: string;
  archivedAt?: string;
}


