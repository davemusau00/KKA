import { z } from "zod";
export * from './document-workflows';

export const SettingScopeSchema = z.enum([
  "SYSTEM", "FIRM", "LEGAL_ENTITY", "BRANCH", "DEPARTMENT", "PRACTICE_AREA",
  "MATTER_TYPE", "WORKFLOW_TEMPLATE", "ROLE", "TEAM", "USER", "CLIENT",
  "MATTER", "DOCUMENT_TEMPLATE", "INTEGRATION_CONNECTION", "PORTAL_PROFILE"
]);

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256)
});

export const AcceptInviteSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(12).max(256)
});

export const InviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(200),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(120).optional(),
  homeBranchId: z.string().optional(),
  roleKeys: z.array(z.string().min(1)).min(1)
});

export const CreateBranchSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(24).regex(/^[A-Za-z0-9_-]+$/),
  address: z.string().max(500).optional(),
  postalAddress: z.string().max(300).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  defaultCourtStation: z.string().max(300).optional(),
  numberingPrefix: z.string().max(30).optional()
});

export const CreateClientSchema = z.object({
  type: z.enum(["PERSON", "ORGANIZATION"]).default("PERSON"),
  displayName: z.string().min(2).max(250),
  legalName: z.string().max(250).optional(),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  idNumber: z.string().max(100).optional(),
  kraPin: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  alternatePhone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  postalAddress: z.string().max(300).optional(),
  physicalAddress: z.string().max(500).optional(),
  preferredContactMethod: z.enum(["PHONE", "WHATSAPP", "EMAIL", "POSTAL"]).optional(),
  notes: z.string().max(5000).optional()
});

export const CreateIntakeSchema = z.object({
  source: z.string().max(250).optional(),
  referrerName: z.string().max(250).optional(),
  clientName: z.string().min(2).max(250),
  phone: z.string().min(5).max(50),
  email: z.string().email().optional(),
  nationalId: z.string().max(100).optional(),
  incidentDate: z.string().datetime().optional(),
  incidentLocation: z.string().max(500).optional(),
  briefDescription: z.string().min(3).max(10000),
  practiceArea: z.string().min(2).max(120),
  matterType: z.string().max(200).optional(),
  assignedOwnerId: z.string().optional()
});

export const IntakePartySchema = z.object({
  name: z.string().min(2).max(250),
  role: z.string().min(2).max(100),
  idOrRegNumber: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  insuranceCompany: z.string().max(250).optional(),
  policyOrClaimNumber: z.string().max(100).optional(),
  notes: z.string().max(3000).optional()
});

export const ConvertIntakeSchema = z.object({
  supervisingUserId: z.string(),
  responsibleBranchId: z.string(),
  originatingBranchId: z.string(),
  legalEntityId: z.string().optional(),
  workflowVersionId: z.string().optional(),
  stageOwnerId: z.string().optional(),
  courtClerkId: z.string().optional(),
  financeContactId: z.string().optional(),
  initialAction: z.string().max(1000).optional()
});

export const CreateMatterSchema = z.object({
  clientId: z.string(),
  legalEntityId: z.string().optional(),
  title: z.string().min(2).max(300),
  practiceArea: z.string().min(2).max(120),
  practiceCode: z.string().min(2).max(20),
  matterType: z.string().min(2).max(200),
  workflowVersionId: z.string().optional(),
  originatingBranchId: z.string(),
  responsibleBranchId: z.string(),
  supervisingUserId: z.string(),
  currentStageOwnerId: z.string().optional(),
  courtClerkId: z.string().optional(),
  financeContactId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  summary: z.string().max(10000).optional(),
  nextAction: z.string().max(1000).optional()
});

export const StageTransitionSchema = z.object({
  toStageNumber: z.number().int().positive(),
  newOwnerUserId: z.string(),
  handoffNotes: z.string().min(3).max(5000),
  criticalNextAction: z.string().max(1500).optional(),
  checklistItems: z.array(z.object({
    key: z.string(),
    label: z.string(),
    completed: z.boolean()
  })).optional(),
  override: z.boolean().default(false),
  overrideReason: z.string().max(3000).optional()
});

export const CreateTaskSchema = z.object({
  matterId: z.string().optional(),
  stageNumber: z.number().int().positive().optional(),
  title: z.string().min(2).max(300),
  description: z.string().max(10000).optional(),
  assignedToId: z.string(),
  reviewerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  startAt: z.string().datetime().optional(),
  dueAt: z.string().datetime(),
  officialDeadlineAt: z.string().datetime().optional(),
  dependencyIds: z.array(z.string()).default([])
});

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(["TODO","IN_PROGRESS","BLOCKED","WAITING_EXTERNAL","WAITING_REVIEW","COMPLETED","CANCELLED"]),
  blockedReason: z.string().max(2000).optional(),
  force: z.boolean().default(false),
  forceReason: z.string().max(2000).optional()
});

export const CreateCalendarEventSchema = z.object({
  matterId: z.string().optional(),
  courtProceedingId: z.string().optional(),
  taskId: z.string().optional(),
  deadlineId: z.string().optional(),
  title: z.string().min(2).max(300),
  eventType: z.enum(["COURT","CLIENT_MEETING","INTERNAL_MEETING","MEDICAL","FILING","DEADLINE","TASK_BLOCK","OTHER"]),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().default("Africa/Nairobi"),
  allDay: z.boolean().default(false),
  location: z.string().max(500).optional(),
  virtualMeetingUrl: z.string().url().optional(),
  assignedUserId: z.string(),
  participantUserIds: z.array(z.string()).default([]),
  sourceType: z.string().default("MANUAL"),
  editPolicy: z.enum(["FREE","CONFIRM","REASON_REQUIRED","APPROVAL_REQUIRED","LOCKED"]).default("CONFIRM"),
  notes: z.string().max(10000).optional()
});

export const RescheduleCalendarEventSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().max(3000).optional(),
  source: z.string().max(500).optional(),
  supportingDocumentId: z.string().optional()
});

export const CreateDocumentSchema = z.object({
  matterId: z.string(),
  title: z.string().min(2).max(300),
  category: z.string().min(2).max(120),
  documentType: z.string().min(2).max(180),
  confidentialityLevel: z.enum(["STANDARD","RESTRICTED","PARTNER_ONLY","SEALED"]).default("STANDARD")
});

export const CreateExpenseSchema = z.object({
  matterId: z.string().optional(),
  branchId: z.string(),
  category: z.string().min(2).max(100),
  description: z.string().min(2).max(2000),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default("KES"),
  paymentSource: z.string().min(2).max(120)
});

export const RecordReceiptSchema = z.object({
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  accountId: z.string(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default("KES"),
  payerName: z.string().min(2).max(250),
  paymentMethod: z.string().min(2).max(80),
  referenceNumber: z.string().min(2).max(120),
  description: z.string().min(2).max(1000),
  receivedAt: z.string().datetime()
});

export const JournalLineSchema = z.object({
  accountId: z.string(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  memo: z.string().max(1000).optional()
}).refine(v => (v.debit > 0) !== (v.credit > 0), {
  message: "Each journal line must contain either a debit or a credit, not both."
});

export const PostJournalSchema = z.object({
  branchId: z.string().optional(),
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  description: z.string().min(2).max(1000),
  transactionDate: z.string().datetime(),
  sourceType: z.string().max(100).optional(),
  sourceId: z.string().optional(),
  lines: z.array(JournalLineSchema).min(2)
});

export const SettingWriteSchema = z.object({
  scopeType: SettingScopeSchema,
  scopeId: z.string().min(1),
  value: z.unknown().optional(),
  secretValue: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  changeReason: z.string().max(3000).optional()
});

export const IntegrationConnectionSchema = z.object({
  kind: z.enum([
    "SMTP","IMAP","GOOGLE_WORKSPACE","MICROSOFT_365","WHATSAPP_CLOUD",
    "SMS_AFRICAS_TALKING","MPESA_DARAJA","JUDICIARY","S3_STORAGE","WEBHOOK","OTHER"
  ]),
  name: z.string().min(2).max(120),
  scopeType: SettingScopeSchema.default("FIRM"),
  scopeId: z.string().min(1),
  publicConfig: z.record(z.string(), z.unknown()).default({}),
  secret: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().default(false)
});

export const CreateMarkAssetSchema = z.object({
  displayName: z.string().min(2).max(200),
  type: z.enum([
    "FIRM_SEAL","BRANCH_SEAL","LOGO","RECEIVED_STAMP","PAID_STAMP","APPROVED_STAMP",
    "CERTIFIED_COPY_STAMP","CONFIDENTIAL_STAMP","DRAFT_STAMP","COPY_STAMP",
    "INTERNAL_REVIEW_STAMP","CUSTOM_OPERATIONAL_MARK"
  ]),
  branchId: z.string().optional(),
  description: z.string().max(2000).optional(),
  intendedUse: z.string().max(2000).optional(),
  permittedRoleKeys: z.array(z.string()).default([]),
  permittedUserIds: z.array(z.string()).default([]),
  allowedDocumentTypes: z.array(z.string()).default([]),
  allowedMatterTypes: z.array(z.string()).default([]),
  canApplyAutomatically: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  approvalRoleKeys: z.array(z.string()).default([])
});

export const ApplyMarkSchema = z.object({
  documentId: z.string(),
  inputVersionId: z.string(),
  markAssetId: z.string(),
  markAssetVersionId: z.string(),
  placementPresetId: z.string().optional(),
  executionBlockVersionId: z.string().optional(),
  signerUserId: z.string().optional(),
  reason: z.string().max(2000).optional(),
  elevationToken: z.string().optional()
});

export const CreateMeetingSchema = z.object({
  projectId: z.string().optional(),
  matterId: z.string().optional(),
  title: z.string().min(2).max(300),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  agenda: z.unknown().optional(),
  participantUserIds: z.array(z.string()).default([])
});

export const CreateKnowledgeItemSchema = z.object({
  type: z.string().min(2).max(100),
  title: z.string().min(2).max(300),
  summary: z.string().max(5000).optional(),
  practiceArea: z.string().max(120).optional(),
  tags: z.array(z.string()).default([]),
  documentId: z.string().optional()
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateMatterInput = z.infer<typeof CreateMatterSchema>;
export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;
