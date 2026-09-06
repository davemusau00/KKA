-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SettingScope" AS ENUM ('SYSTEM', 'FIRM', 'LEGAL_ENTITY', 'BRANCH', 'DEPARTMENT', 'PRACTICE_AREA', 'MATTER_TYPE', 'WORKFLOW_TEMPLATE', 'ROLE', 'TEAM', 'USER', 'CLIENT', 'MATTER', 'DOCUMENT_TEMPLATE', 'INTEGRATION_CONNECTION', 'PORTAL_PROFILE');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'ENUM', 'JSON', 'SECRET', 'ASSET', 'DURATION');

-- CreateEnum
CREATE TYPE "SettingSensitivity" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET');

-- CreateEnum
CREATE TYPE "SettingLifecycle" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'SCHEDULED', 'ACTIVE', 'SUPERSEDED', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IntegrationKind" AS ENUM ('SMTP', 'IMAP', 'GOOGLE_WORKSPACE', 'MICROSOFT_365', 'WHATSAPP_CLOUD', 'SMS_AFRICAS_TALKING', 'MPESA_DARAJA', 'JUDICIARY', 'S3_STORAGE', 'WEBHOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('UNCONFIGURED', 'CONFIGURED', 'TESTING', 'HEALTHY', 'DEGRADED', 'FAILED', 'DISABLED', 'NOT_IMPLEMENTED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "MatterStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatterPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'WAITING_EXTERNAL', 'WAITING_REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('COURT', 'CLIENT_MEETING', 'INTERNAL_MEETING', 'MEDICAL', 'FILING', 'DEADLINE', 'TASK_BLOCK', 'OTHER');

-- CreateEnum
CREATE TYPE "CalendarEditPolicy" AS ENUM ('FREE', 'CONFIRM', 'REASON_REQUIRED', 'APPROVAL_REQUIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SIGNED', 'FILED', 'SERVED', 'REJECTED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentConfidentiality" AS ENUM ('STANDARD', 'RESTRICTED', 'PARTNER_ONLY', 'SEALED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FundType" AS ENUM ('OFFICE', 'CLIENT', 'PETTY_CASH', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "AccountClass" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'RECONCILED', 'VOID');

-- CreateEnum
CREATE TYPE "FeeNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'SETTLED_FROM_TRUST', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'PROVIDER_ACCEPTED', 'SENT', 'DELIVERED', 'READ', 'BOUNCED', 'COMPLAINED', 'DEFERRED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "MarkAssetType" AS ENUM ('FIRM_SEAL', 'BRANCH_SEAL', 'LOGO', 'RECEIVED_STAMP', 'PAID_STAMP', 'APPROVED_STAMP', 'CERTIFIED_COPY_STAMP', 'CONFIDENTIAL_STAMP', 'DRAFT_STAMP', 'COPY_STAMP', 'INTERNAL_REVIEW_STAMP', 'CUSTOM_OPERATIONAL_MARK');

-- CreateEnum
CREATE TYPE "MarkApplicationStatus" AS ENUM ('PENDING', 'APPLIED', 'FAILED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SigningTransactionStatus" AS ENUM ('CREATED', 'PENDING_AUTH', 'PENDING_APPROVAL', 'SIGNED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_STOCK', 'ASSIGNED', 'REPAIR', 'RETIRED', 'LOST');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "locale" TEXT NOT NULL DEFAULT 'en-KE',
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalEntity" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "kraPin" TEXT,
    "vatRegistration" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'KES',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "legalEntityId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "postalAddress" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "defaultCourtStation" TEXT,
    "numberingPrefix" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "managerId" TEXT,
    "costCentre" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "managerId" TEXT,
    "practiceArea" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "homeBranchId" TEXT,
    "departmentId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "jobTitle" TEXT,
    "admissionNumber" TEXT,
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "locale" TEXT NOT NULL DEFAULT 'en-KE',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranch" (
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBranch_pkey" PRIMARY KEY ("userId","branchId")
);

-- CreateTable
CREATE TABLE "UserTeam" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTeam_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "SettingDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "valueType" "SettingValueType" NOT NULL,
    "allowedScopes" "SettingScope"[],
    "defaultValue" JSONB,
    "validationSchema" JSONB,
    "mergeStrategy" TEXT NOT NULL DEFAULT 'replace',
    "sensitivity" "SettingSensitivity" NOT NULL DEFAULT 'INTERNAL',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresReason" BOOLEAN NOT NULL DEFAULT false,
    "effectiveDatingSupported" BOOLEAN NOT NULL DEFAULT false,
    "restartRequired" BOOLEAN NOT NULL DEFAULT false,
    "featureDependencyKeys" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettingDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingValue" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "firmId" TEXT,
    "branchId" TEXT,
    "roleId" TEXT,
    "userId" TEXT,
    "departmentId" TEXT,
    "teamId" TEXT,
    "scopeType" "SettingScope" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "value" JSONB,
    "secretRefId" TEXT,
    "lifecycle" "SettingLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "changeReason" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretRecord" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,
    "keyVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),

    CONSTRAINT "SecretRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "kind" "IntegrationKind" NOT NULL,
    "name" TEXT NOT NULL,
    "scopeType" "SettingScope" NOT NULL DEFAULT 'FIRM',
    "scopeId" TEXT NOT NULL,
    "publicConfig" JSONB NOT NULL,
    "secretRefId" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'UNCONFIGURED',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastTestAt" TIMESTAMP(3),
    "lastHealthyAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL DEFAULT '__GLOBAL__',
    "entityType" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 0,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "pattern" TEXT NOT NULL DEFAULT '{firm}/{practice}/{year}/{seq:5}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "clientNumber" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PERSON',
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "idNumber" TEXT,
    "kraPin" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "email" TEXT,
    "postalAddress" TEXT,
    "physicalAddress" TEXT,
    "preferredContactMethod" TEXT DEFAULT 'PHONE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intake" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "clientId" TEXT,
    "intakeNumber" TEXT,
    "source" TEXT,
    "referrerName" TEXT,
    "clientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nationalId" TEXT,
    "incidentDate" TIMESTAMP(3),
    "incidentLocation" TEXT,
    "briefDescription" TEXT NOT NULL,
    "practiceArea" TEXT NOT NULL,
    "matterType" TEXT,
    "assignedOwnerId" TEXT,
    "disposition" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "convertedMatterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeParty" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "idOrRegNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "insuranceCompany" TEXT,
    "policyOrClaimNumber" TEXT,
    "notes" TEXT,

    CONSTRAINT "IntakeParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictCheck" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT,
    "matterId" TEXT,
    "checkedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "partiesSearched" JSONB NOT NULL,
    "matchesFound" JSONB NOT NULL,
    "clearanceNotes" TEXT,
    "clearedByPartnerId" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "ConflictCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycRecord" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "idDocumentType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycDocumentIds" TEXT[],
    "warrantToActSigned" BOOLEAN NOT NULL DEFAULT false,
    "retainerAgreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "retainerAgreedAmount" DECIMAL(18,2),
    "retainerDepositPaid" BOOLEAN NOT NULL DEFAULT false,
    "depositReceiptRef" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "partnerApproval" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matter" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "legalEntityId" TEXT,
    "clientId" TEXT NOT NULL,
    "internalReference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "practiceArea" TEXT NOT NULL,
    "matterType" TEXT NOT NULL,
    "workflowVersionId" TEXT,
    "originatingBranchId" TEXT NOT NULL,
    "responsibleBranchId" TEXT NOT NULL,
    "supervisingUserId" TEXT NOT NULL,
    "currentStageOwnerId" TEXT,
    "courtClerkId" TEXT,
    "financeContactId" TEXT,
    "currentStageId" INTEGER NOT NULL DEFAULT 1,
    "priority" "MatterPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MatterStatus" NOT NULL DEFAULT 'ACTIVE',
    "summary" TEXT,
    "nextAction" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterAssignment" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "roleKey" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterAccess" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    "teamId" TEXT,
    "access" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterParty" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "partyType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationName" TEXT,
    "idNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "roleDescription" TEXT,
    "notes" TEXT,

    CONSTRAINT "MatterParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "practiceArea" TEXT NOT NULL,
    "matterType" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "WorkflowVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStage" (
    "id" TEXT NOT NULL,
    "workflowVersionId" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDurationDays" INTEGER NOT NULL DEFAULT 0,
    "responsibleRoleKeys" TEXT[],
    "assignmentStrategy" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalRoleKey" TEXT,
    "allowedNextStageCodes" TEXT[],
    "requiredTaskTitles" TEXT[],
    "requiredDocumentTypes" TEXT[],
    "checklistItems" TEXT[],
    "autoCreateTasks" JSONB,
    "notificationRules" JSONB,
    "portalMilestone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterStageInstance" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "workflowStageId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completionNote" TEXT,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterStageInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatterStageChecklistItem" (
    "id" TEXT NOT NULL,
    "stageInstanceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "MatterStageChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHandoff" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "fromStageNumber" INTEGER NOT NULL,
    "toStageNumber" INTEGER NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "handoffNotes" TEXT NOT NULL,
    "criticalNextAction" TEXT,
    "supervisorSignOffJson" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHandoffItem" (
    "id" TEXT NOT NULL,
    "handoffId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StageHandoffItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "matterId" TEXT,
    "stageNumber" INTEGER,
    "calendarEventId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reviewerId" TEXT,
    "priority" "MatterPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "startAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3) NOT NULL,
    "officialDeadlineAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "recurrenceRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("taskId","dependsOnId")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "deadlineType" TEXT NOT NULL,
    "officialDueAt" TIMESTAMP(3) NOT NULL,
    "internalTargetAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "courtProceedingId" TEXT,
    "taskId" TEXT,
    "deadlineId" TEXT,
    "title" TEXT NOT NULL,
    "eventType" "CalendarEventType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "virtualMeetingUrl" TEXT,
    "organizerId" TEXT NOT NULL,
    "assignedUserId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "editPolicy" "CalendarEditPolicy" NOT NULL DEFAULT 'CONFIRM',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "reminderPolicyId" TEXT,
    "externalGoogleEventId" TEXT,
    "externalMicrosoftEventId" TEXT,
    "syncState" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarParticipant" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "responseStatus" TEXT,

    CONSTRAINT "CalendarParticipant_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "CalendarRevision" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "oldStartAt" TIMESTAMP(3) NOT NULL,
    "oldEndAt" TIMESTAMP(3) NOT NULL,
    "newStartAt" TIMESTAMP(3) NOT NULL,
    "newEndAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "source" TEXT,
    "supportingDocumentId" TEXT,
    "changedById" TEXT NOT NULL,
    "approvalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtProceeding" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "courtName" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "division" TEXT,
    "caseNumber" TEXT NOT NULL,
    "proceedingType" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3),
    "judgeOrMagistrate" TEXT,
    "opposingCounsel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtProceeding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtFilingPackage" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "proceedingId" TEXT,
    "courtStation" TEXT NOT NULL,
    "division" TEXT,
    "caseType" TEXT,
    "plaintiff" TEXT,
    "defendants" JSONB,
    "courtAssessmentAmount" DECIMAL(18,2),
    "feeRequisitionApproved" BOOLEAN NOT NULL DEFAULT false,
    "receiptDocumentId" TEXT,
    "receiptNumber" TEXT,
    "ctsReference" TEXT,
    "courtCaseNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY_TO_FILE',
    "assignedClerkId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtFilingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "proceedingId" TEXT,
    "documentId" TEXT,
    "partyName" TEXT NOT NULL,
    "partyAddress" TEXT,
    "processServerName" TEXT,
    "assignedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "serviceDate" TIMESTAMP(3),
    "serviceMethod" TEXT,
    "affidavitDocumentId" TEXT,
    "affidavitStatus" TEXT NOT NULL DEFAULT 'AWAITED',
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAttempt" (
    "id" TEXT NOT NULL,
    "serviceRecordId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ServiceAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "confidentialityLevel" "DocumentConfidentiality" NOT NULL DEFAULT 'STANDARD',
    "portalVisible" BOOLEAN NOT NULL DEFAULT false,
    "ownerUserId" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "retentionClass" TEXT,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageDriver" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "changeSummary" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "courtFilingRef" TEXT,
    "courtFiledAt" TIMESTAMP(3),
    "revertedFromVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentReview" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecision",
    "comment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDocument" (
    "taskId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'RELATED',

    CONSTRAINT "TaskDocument_pkey" PRIMARY KEY ("taskId","documentId")
);

-- CreateTable
CREATE TABLE "CalendarEventDocument" (
    "eventId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "requirementKey" TEXT,
    "satisfiesRequirement" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CalendarEventDocument_pkey" PRIMARY KEY ("eventId","documentId")
);

-- CreateTable
CREATE TABLE "FirmMarkAsset" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "displayName" TEXT NOT NULL,
    "type" "MarkAssetType" NOT NULL,
    "description" TEXT,
    "intendedUse" TEXT,
    "permittedRoleKeys" TEXT[],
    "permittedUserIds" TEXT[],
    "allowedDocumentTypes" TEXT[],
    "allowedMatterTypes" TEXT[],
    "canApplyAutomatically" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalRoleKeys" TEXT[],
    "minScale" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "maxScale" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "minOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "maxOpacity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minRotationDegrees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxRotationDegrees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmMarkAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmMarkAssetVersion" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "widthPx" INTEGER,
    "heightPx" INTEGER,
    "dpi" DOUBLE PRECISION,
    "transparentReady" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirmMarkAssetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalDisplayName" TEXT NOT NULL,
    "postNominals" TEXT,
    "jobTitle" TEXT,
    "admissionNumber" TEXT,
    "typedSignatureAllowed" BOOLEAN NOT NULL DEFAULT false,
    "defaultExecutionBlockId" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureAssetVersion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureAssetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionBlockTemplate" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "documentTypes" TEXT[],
    "signerRoleKeys" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionBlockTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionBlockTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionBlockTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPlacementPreset" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pageSelection" TEXT NOT NULL DEFAULT 'LAST',
    "anchorType" TEXT NOT NULL DEFAULT 'PAGE',
    "anchorName" TEXT,
    "xPoints" DOUBLE PRECISION,
    "yPoints" DOUBLE PRECISION,
    "widthPoints" DOUBLE PRECISION,
    "heightPoints" DOUBLE PRECISION,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "zOrder" INTEGER NOT NULL DEFAULT 0,
    "constraints" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPlacementPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentMarkPolicy" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentTypes" TEXT[],
    "matterTypes" TEXT[],
    "allowedMarkAssetTypes" "MarkAssetType"[],
    "requiresReviewComplete" BOOLEAN NOT NULL DEFAULT true,
    "requiresReauth" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalRoleKeys" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentMarkPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentMarkApplication" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "inputVersionId" TEXT NOT NULL,
    "outputVersionId" TEXT,
    "markAssetId" TEXT NOT NULL,
    "markAssetVersionId" TEXT NOT NULL,
    "placementPresetId" TEXT,
    "executionBlockVersionId" TEXT,
    "requestedById" TEXT NOT NULL,
    "signerUserId" TEXT,
    "approvedById" TEXT,
    "status" "MarkApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "placementResolved" JSONB,
    "inputChecksum" TEXT NOT NULL,
    "outputChecksum" TEXT,
    "reason" TEXT,
    "providerTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentMarkApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureDelegation" (
    "id" TEXT NOT NULL,
    "delegatorProfileId" TEXT NOT NULL,
    "delegateUserId" TEXT NOT NULL,
    "allowedActions" TEXT[],
    "allowedMatterTypes" TEXT[],
    "allowedDocumentTypes" TEXT[],
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvalRequestId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SigningProviderConnection" (
    "id" TEXT NOT NULL,
    "integrationConnectionId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "publicConfig" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SigningProviderConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SigningTransaction" (
    "id" TEXT NOT NULL,
    "providerConnectionId" TEXT,
    "documentId" TEXT NOT NULL,
    "inputVersionId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "signerUserId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "documentHash" TEXT NOT NULL,
    "status" "SigningTransactionStatus" NOT NULL DEFAULT 'CREATED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SigningTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationChannel" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "branchId" TEXT,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMembership" (
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMembership_pkey" PRIMARY KEY ("channelId","userId")
);

-- CreateTable
CREATE TABLE "ChannelMessage" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "replyToId" TEXT,
    "convertedTaskId" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "documentId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderIdentity" (
    "id" TEXT NOT NULL,
    "integrationConnectionId" TEXT NOT NULL,
    "scopeType" "SettingScope" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "replyTo" TEXT,
    "signatureHtml" TEXT,
    "confidentialityDisclaimer" TEXT,
    "brandingProfile" JSONB,
    "allowedRoleKeys" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundMailbox" (
    "id" TEXT NOT NULL,
    "integrationConnectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
    "readOnly" BOOLEAN NOT NULL DEFAULT true,
    "initialSyncDays" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundMailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "senderIdentityId" TEXT,
    "direction" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "internetMessageId" TEXT,
    "inReplyTo" TEXT,
    "referencesHeader" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "fromAddress" TEXT NOT NULL,
    "matterId" TEXT,
    "clientId" TEXT,
    "intakeId" TEXT,
    "triageConfidence" DOUBLE PRECISION,
    "triageStatus" TEXT NOT NULL DEFAULT 'UNASSIGNED',
    "queuedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailRecipient" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "displayName" TEXT,

    CONSTRAINT "MailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "documentId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "checksumSha256" TEXT,

    CONSTRAINT "MailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailDeliveryEvent" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "providerEventId" TEXT,
    "detail" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "matterId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPolicy" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "conditions" JSONB,
    "recipients" JSONB NOT NULL,
    "channels" JSONB NOT NULL,
    "escalation" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountClass" "AccountClass" NOT NULL,
    "fundType" "FundType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "bankName" TEXT,
    "accountNumberMasked" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "matterId" TEXT,
    "clientId" TEXT,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "postedAt" TIMESTAMP(3),
    "postedById" TEXT,
    "reversedEntryId" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "matterId" TEXT,
    "clientId" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "clientId" TEXT,
    "accountId" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "payerName" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "allocatedToFees" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "allocatedToDisbursements" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRequest" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "branchId" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "paymentSource" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "disbursedById" TEXT,
    "receiptDocumentId" TEXT,
    "journalEntryId" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "reconciledAt" TIMESTAMP(3),
    "reconciliationNotes" TEXT,

    CONSTRAINT "ExpenseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeNote" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "feeNoteNumber" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "FeeNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "professionalFeesSubtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "disbursementsSubtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(8,4) NOT NULL DEFAULT 0.16,
    "vatAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grossTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "trustFundsApplied" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netBalanceDue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "aroScaleReference" TEXT,
    "signatoryUserId" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeNoteItem" (
    "id" TEXT NOT NULL,
    "feeNoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "timeEntryId" TEXT,
    "expenseId" TEXT,

    CONSTRAINT "FeeNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "lawyerUserId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL,
    "hourlyRate" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "feeNoteItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "statementOpeningBalance" DECIMAL(18,2) NOT NULL,
    "statementClosingBalance" DECIMAL(18,2) NOT NULL,
    "ledgerClosingBalance" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "completedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "sourceDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "journalEntryId" TEXT,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requiredRoleKeys" TEXT[],
    "assignedUserIds" TEXT[],
    "payload" JSONB,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "decidedById" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryContact" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "organizationName" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "county" TEXT,
    "specialization" TEXT,
    "identifiers" JSONB,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectoryContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "firmId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "matterId" TEXT,
    "clientId" TEXT,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB NOT NULL,
    "previousHash" TEXT,
    "eventHash" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerKey" TEXT NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "schedule" JSONB,
    "retryPolicy" JSONB,
    "failureEscalation" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "triggerEvent" JSONB NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "fieldType" TEXT NOT NULL,
    "requiredRule" JSONB,
    "validation" JSONB,
    "defaultValue" JSONB,
    "options" JSONB,
    "conditionalVisibility" JSONB,
    "readPermissionKeys" TEXT[],
    "writePermissionKeys" TEXT[],
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "reportable" BOOLEAN NOT NULL DEFAULT false,
    "mergeField" BOOLEAN NOT NULL DEFAULT false,
    "sensitivity" TEXT NOT NULL DEFAULT 'INTERNAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "matterId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormDefinition" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "scopeType" "SettingScope" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormVersion" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "pdfSnapshotDocumentId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiClient" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "permissionKeys" TEXT[],
    "allowedCidrs" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretRefId" TEXT,
    "eventKeys" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalProject" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ownerUserId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "budget" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "projectId" TEXT,
    "matterId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "agenda" JSONB,
    "minutes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceStatus" TEXT,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("meetingId","userId")
);

-- CreateTable
CREATE TABLE "MeetingDecision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAction" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "taskId" TEXT,
    "text" TEXT NOT NULL,
    "assigneeId" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "managerUserId" TEXT,
    "leavePolicyKey" TEXT,
    "cpdsRequiredAnnual" DECIMAL(8,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(8,2) NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'DRAFT',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CpdRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(8,2) NOT NULL,
    "certificateDocumentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CpdRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kraPin" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "vendorId" TEXT,
    "requisitionNo" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "requisitionId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'APPROVED',
    "orderedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "branchId" TEXT,
    "assetTag" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(18,2),
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
    "warrantyEndsAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "conditionOnIssue" TEXT,
    "conditionOnReturn" TEXT,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "practiceArea" TEXT,
    "tags" TEXT[],
    "documentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "ownerUserId" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalAccessGrant" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "matterId" TEXT,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "permissions" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalInjuryCase" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3),
    "incidentTime" TEXT,
    "incidentLocation" TEXT,
    "accidentNarrative" TEXT,
    "obNumber" TEXT,
    "policeStation" TEXT,
    "investigatingOfficer" TEXT,
    "investigatingPhone" TEXT,
    "roadConditions" TEXT,
    "vehicleRegistrationPrimary" TEXT,
    "insurerClaimReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalInjuryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiVehicle" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "makeModel" TEXT,
    "ownerName" TEXT,
    "driverName" TEXT,
    "driverLicenseNo" TEXT,
    "insuranceCompany" TEXT,
    "policyNumber" TEXT,
    "ntsaSearchObtained" BOOLEAN NOT NULL DEFAULT false,
    "ntsaSearchRef" TEXT,
    "notes" TEXT,

    CONSTRAINT "PiVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiWitness" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "statementRequested" BOOLEAN NOT NULL DEFAULT false,
    "statementReceived" BOOLEAN NOT NULL DEFAULT false,
    "statementDate" TIMESTAMP(3),
    "keyObservations" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiWitness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiEvidenceItem" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "documentId" TEXT,
    "obtainedAt" TIMESTAMP(3),
    "obtainedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiEvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiInjury" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "bodyPart" TEXT,
    "permanentEffects" TEXT,
    "disabilityPercent" DECIMAL(8,3),

    CONSTRAINT "PiInjury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiTreatmentEpisode" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "doctorName" TEXT,
    "admissionDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "treatmentSummary" TEXT,
    "costAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "receiptNumber" TEXT,
    "receiptDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiTreatmentEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiMedicalReportRequest" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "specialty" TEXT,
    "facility" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "appointmentDate" TIMESTAMP(3),
    "examinedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "permanentDisabilityPercent" DECIMAL(8,3),
    "futureTreatmentEstimate" DECIMAL(18,2),
    "futureTreatmentNotes" TEXT,
    "reportDocumentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiMedicalReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiLiabilityAssessment" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "claimantPercent" DECIMAL(8,3) NOT NULL DEFAULT 0,
    "defendantPercent" DECIMAL(8,3) NOT NULL DEFAULT 100,
    "contributoryNegligence" BOOLEAN NOT NULL DEFAULT false,
    "contributoryNotes" TEXT,
    "supportingEvidence" JSONB,
    "weaknesses" JSONB,
    "advocateOpinion" TEXT,
    "generalDamages" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "generalDamagesJustification" TEXT,
    "futureMedicalExpenses" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lossOfEarnings" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lossOfEarningCapacity" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDamages" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "assessedById" TEXT,
    "assessedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiLiabilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiSpecialDamage" (
    "id" TEXT NOT NULL,
    "liabilityAssessmentId" TEXT NOT NULL,
    "head" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "evidenced" BOOLEAN NOT NULL DEFAULT false,
    "receiptReference" TEXT,
    "evidenceDocumentId" TEXT,
    "notes" TEXT,

    CONSTRAINT "PiSpecialDamage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiNegotiationEntry" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "party" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(18,2),
    "status" TEXT,
    "notes" TEXT,
    "documentId" TEXT,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "PiNegotiationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiHearingBrief" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "courtEventId" TEXT,
    "issues" JSONB,
    "witnesses" JSONB,
    "documentChecklist" JSONB,
    "opposingPosition" TEXT,
    "settlementPosition" TEXT,
    "advocateNotes" TEXT,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "readyAt" TIMESTAMP(3),
    "readyById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiHearingBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiJudgmentAward" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "judgmentDate" TIMESTAMP(3),
    "liabilityPercent" DECIMAL(8,3),
    "generalDamages" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "specialDamages" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "futureMedical" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "costsAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAward" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentDeadline" TIMESTAMP(3),
    "appealDeadline" TIMESTAMP(3),
    "appealRecommended" BOOLEAN NOT NULL DEFAULT false,
    "judgmentDocumentId" TEXT,
    "decreeDocumentId" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiJudgmentAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiRecoveryAction" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(18,2),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "counterparty" TEXT,
    "reference" TEXT,
    "documentId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiRecoveryAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiSettlementDistribution" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "clientFundsReceived" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "professionalFees" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "disbursements" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netClientAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "clientApproved" BOOLEAN NOT NULL DEFAULT false,
    "partnerApproved" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "settlementStatementDocumentId" TEXT,
    "dischargeDocumentId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiSettlementDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiSettlementDeduction" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "sourceEntityId" TEXT,

    CONSTRAINT "PiSettlementDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiClosureRecord" (
    "id" TEXT NOT NULL,
    "personalInjuryId" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "closingNote" TEXT,
    "financeReconciled" BOOLEAN NOT NULL DEFAULT false,
    "documentsComplete" BOOLEAN NOT NULL DEFAULT false,
    "clientInformed" BOOLEAN NOT NULL DEFAULT false,
    "supervisorApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiClosureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "practiceArea" TEXT,
    "matterType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "WorkflowVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceStoragePath" TEXT,
    "sourceMimeType" TEXT,
    "mergeSchema" JSONB,
    "content" TEXT,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemJobRecord" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "jobId" TEXT,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'QUEUED',
    "payloadHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemJobRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalEntity_firmId_idx" ON "LegalEntity"("firmId");

-- CreateIndex
CREATE INDEX "Branch_firmId_active_idx" ON "Branch"("firmId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_firmId_code_key" ON "Branch"("firmId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_firmId_code_key" ON "Department"("firmId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Team_firmId_code_key" ON "Team"("firmId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_tokenHash_key" ON "UserInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "UserInvite_userId_expiresAt_idx" ON "UserInvite"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_firmId_key_key" ON "Role"("firmId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SettingDefinition_key_key" ON "SettingDefinition"("key");

-- CreateIndex
CREATE INDEX "SettingValue_definitionId_scopeType_scopeId_lifecycle_idx" ON "SettingValue"("definitionId", "scopeType", "scopeId", "lifecycle");

-- CreateIndex
CREATE INDEX "SettingValue_firmId_idx" ON "SettingValue"("firmId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_firmId_kind_status_idx" ON "IntegrationConnection"("firmId", "kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_firmId_name_key" ON "IntegrationConnection"("firmId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_firmId_branchId_entityType_year_key" ON "NumberSequence"("firmId", "branchId", "entityType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientNumber_key" ON "Client"("clientNumber");

-- CreateIndex
CREATE INDEX "Client_firmId_displayName_idx" ON "Client"("firmId", "displayName");

-- CreateIndex
CREATE INDEX "Client_firmId_phone_idx" ON "Client"("firmId", "phone");

-- CreateIndex
CREATE INDEX "Client_firmId_idNumber_idx" ON "Client"("firmId", "idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Intake_intakeNumber_key" ON "Intake"("intakeNumber");

-- CreateIndex
CREATE INDEX "Intake_firmId_disposition_createdAt_idx" ON "Intake"("firmId", "disposition", "createdAt");

-- CreateIndex
CREATE INDEX "Intake_firmId_phone_idx" ON "Intake"("firmId", "phone");

-- CreateIndex
CREATE INDEX "ConflictCheck_intakeId_checkedAt_idx" ON "ConflictCheck"("intakeId", "checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Matter_internalReference_key" ON "Matter"("internalReference");

-- CreateIndex
CREATE INDEX "Matter_firmId_status_practiceArea_idx" ON "Matter"("firmId", "status", "practiceArea");

-- CreateIndex
CREATE INDEX "Matter_responsibleBranchId_status_idx" ON "Matter"("responsibleBranchId", "status");

-- CreateIndex
CREATE INDEX "Matter_currentStageOwnerId_status_idx" ON "Matter"("currentStageOwnerId", "status");

-- CreateIndex
CREATE INDEX "Matter_lastActivityAt_idx" ON "Matter"("lastActivityAt");

-- CreateIndex
CREATE INDEX "MatterAssignment_matterId_roleKey_endsAt_idx" ON "MatterAssignment"("matterId", "roleKey", "endsAt");

-- CreateIndex
CREATE INDEX "MatterAccess_matterId_idx" ON "MatterAccess"("matterId");

-- CreateIndex
CREATE INDEX "MatterParty_matterId_partyType_idx" ON "MatterParty"("matterId", "partyType");

-- CreateIndex
CREATE INDEX "MatterParty_name_idx" ON "MatterParty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_firmId_practiceArea_matterType_name_key" ON "WorkflowTemplate"("firmId", "practiceArea", "matterType", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowVersion_templateId_version_key" ON "WorkflowVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStage_workflowVersionId_stageNumber_key" ON "WorkflowStage"("workflowVersionId", "stageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStage_workflowVersionId_code_key" ON "WorkflowStage"("workflowVersionId", "code");

-- CreateIndex
CREATE INDEX "MatterStageInstance_matterId_enteredAt_idx" ON "MatterStageInstance"("matterId", "enteredAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatterStageChecklistItem_stageInstanceId_key_key" ON "MatterStageChecklistItem"("stageInstanceId", "key");

-- CreateIndex
CREATE INDEX "StageHandoff_matterId_createdAt_idx" ON "StageHandoff"("matterId", "createdAt");

-- CreateIndex
CREATE INDEX "StageHandoff_toUserId_acknowledgedAt_idx" ON "StageHandoff"("toUserId", "acknowledgedAt");

-- CreateIndex
CREATE INDEX "Task_assignedToId_status_dueAt_idx" ON "Task"("assignedToId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Task_matterId_status_idx" ON "Task"("matterId", "status");

-- CreateIndex
CREATE INDEX "Deadline_matterId_officialDueAt_idx" ON "Deadline"("matterId", "officialDueAt");

-- CreateIndex
CREATE INDEX "Deadline_officialDueAt_completedAt_idx" ON "Deadline"("officialDueAt", "completedAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_assignedUserId_startAt_endAt_idx" ON "CalendarEvent"("assignedUserId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_matterId_startAt_idx" ON "CalendarEvent"("matterId", "startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventType_startAt_idx" ON "CalendarEvent"("eventType", "startAt");

-- CreateIndex
CREATE INDEX "CalendarRevision_eventId_createdAt_idx" ON "CalendarRevision"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "CourtProceeding_caseNumber_idx" ON "CourtProceeding"("caseNumber");

-- CreateIndex
CREATE INDEX "CourtProceeding_matterId_status_idx" ON "CourtProceeding"("matterId", "status");

-- CreateIndex
CREATE INDEX "CourtFilingPackage_matterId_status_idx" ON "CourtFilingPackage"("matterId", "status");

-- CreateIndex
CREATE INDEX "ServiceRecord_matterId_status_idx" ON "ServiceRecord"("matterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAttempt_serviceRecordId_attemptNo_key" ON "ServiceAttempt"("serviceRecordId", "attemptNo");

-- CreateIndex
CREATE INDEX "Document_matterId_category_idx" ON "Document"("matterId", "category");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE INDEX "DocumentVersion_checksumSha256_idx" ON "DocumentVersion"("checksumSha256");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "FirmMarkAsset_firmId_type_active_idx" ON "FirmMarkAsset"("firmId", "type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "FirmMarkAssetVersion_assetId_version_key" ON "FirmMarkAssetVersion"("assetId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureProfile_userId_key" ON "SignatureProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureAssetVersion_profileId_version_key" ON "SignatureAssetVersion"("profileId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionBlockTemplateVersion_templateId_version_key" ON "ExecutionBlockTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "DocumentMarkApplication_documentId_createdAt_idx" ON "DocumentMarkApplication"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationChannel_matterId_idx" ON "CommunicationChannel"("matterId");

-- CreateIndex
CREATE INDEX "ChannelMessage_channelId_createdAt_idx" ON "ChannelMessage"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "MailMessage_matterId_createdAt_idx" ON "MailMessage"("matterId", "createdAt");

-- CreateIndex
CREATE INDEX "MailMessage_triageStatus_createdAt_idx" ON "MailMessage"("triageStatus", "createdAt");

-- CreateIndex
CREATE INDEX "MailMessage_internetMessageId_idx" ON "MailMessage"("internetMessageId");

-- CreateIndex
CREATE INDEX "MailDeliveryEvent_messageId_occurredAt_idx" ON "MailDeliveryEvent"("messageId", "occurredAt");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_readAt_createdAt_idx" ON "Notification"("recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_channel_createdAt_idx" ON "NotificationDelivery"("status", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerAccount_firmId_fundType_active_idx" ON "LedgerAccount"("firmId", "fundType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_firmId_code_key" ON "LedgerAccount"("firmId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_reference_key" ON "JournalEntry"("reference");

-- CreateIndex
CREATE INDEX "JournalEntry_matterId_transactionDate_idx" ON "JournalEntry"("matterId", "transactionDate");

-- CreateIndex
CREATE INDEX "JournalEntry_clientId_transactionDate_idx" ON "JournalEntry"("clientId", "transactionDate");

-- CreateIndex
CREATE INDEX "JournalEntry_status_transactionDate_idx" ON "JournalEntry"("status", "transactionDate");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_createdAt_idx" ON "JournalLine"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalLine_matterId_createdAt_idx" ON "JournalLine"("matterId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalLine_clientId_createdAt_idx" ON "JournalLine"("clientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_receiptNumber_key" ON "PaymentReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "PaymentReceipt_matterId_receivedAt_idx" ON "PaymentReceipt"("matterId", "receivedAt");

-- CreateIndex
CREATE INDEX "PaymentReceipt_clientId_receivedAt_idx" ON "PaymentReceipt"("clientId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseRequest_expenseNumber_key" ON "ExpenseRequest"("expenseNumber");

-- CreateIndex
CREATE INDEX "ExpenseRequest_matterId_status_idx" ON "ExpenseRequest"("matterId", "status");

-- CreateIndex
CREATE INDEX "ExpenseRequest_branchId_status_idx" ON "ExpenseRequest"("branchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FeeNote_feeNoteNumber_key" ON "FeeNote"("feeNoteNumber");

-- CreateIndex
CREATE INDEX "FeeNote_matterId_status_idx" ON "FeeNote"("matterId", "status");

-- CreateIndex
CREATE INDEX "TimeEntry_matterId_createdAt_idx" ON "TimeEntry"("matterId", "createdAt");

-- CreateIndex
CREATE INDEX "TimeEntry_lawyerUserId_createdAt_idx" ON "TimeEntry"("lawyerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_type_createdAt_idx" ON "ApprovalRequest"("status", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entityType_entityId_idx" ON "ApprovalRequest"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DirectoryContact_firmId_type_displayName_idx" ON "DirectoryContact"("firmId", "type", "displayName");

-- CreateIndex
CREATE INDEX "AuditEvent_matterId_occurredAt_idx" ON "AuditEvent"("matterId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_occurredAt_idx" ON "AuditEvent"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_occurredAt_idx" ON "AuditEvent"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "AutomationRule_firmId_triggerKey_enabled_idx" ON "AutomationRule"("firmId", "triggerKey", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRun_idempotencyKey_key" ON "AutomationRun"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_firmId_entityType_key_key" ON "CustomFieldDefinition"("firmId", "entityType", "key");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_fieldId_entityType_entityId_key" ON "CustomFieldValue"("fieldId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "FormDefinition_firmId_key_key" ON "FormDefinition"("firmId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "FormVersion_formId_version_key" ON "FormVersion"("formId", "version");

-- CreateIndex
CREATE INDEX "FormSubmission_entityType_entityId_idx" ON "FormSubmission"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ApiClient_clientId_key" ON "ApiClient"("clientId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextAttemptAt_idx" ON "WebhookDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "InternalProject_firmId_status_idx" ON "InternalProject"("firmId", "status");

-- CreateIndex
CREATE INDEX "Meeting_matterId_startsAt_idx" ON "Meeting"("matterId", "startsAt");

-- CreateIndex
CREATE INDEX "Meeting_projectId_startsAt_idx" ON "Meeting"("projectId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_employeeNumber_key" ON "EmployeeProfile"("employeeNumber");

-- CreateIndex
CREATE INDEX "LeaveRequest_userId_status_idx" ON "LeaveRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "CpdRecord_userId_occurredOn_idx" ON "CpdRecord"("userId", "occurredOn");

-- CreateIndex
CREATE INDEX "Vendor_firmId_name_idx" ON "Vendor"("firmId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_requisitionNo_key" ON "PurchaseRequisition"("requisitionNo");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNo_key" ON "PurchaseOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");

-- CreateIndex
CREATE INDEX "KnowledgeItem_firmId_type_status_idx" ON "KnowledgeItem"("firmId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PortalAccessGrant_tokenHash_key" ON "PortalAccessGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "PortalAccessGrant_clientId_status_idx" ON "PortalAccessGrant"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalInjuryCase_matterId_key" ON "PersonalInjuryCase"("matterId");

-- CreateIndex
CREATE INDEX "PiVehicle_registrationNo_idx" ON "PiVehicle"("registrationNo");

-- CreateIndex
CREATE INDEX "PiEvidenceItem_personalInjuryId_category_idx" ON "PiEvidenceItem"("personalInjuryId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "PiLiabilityAssessment_personalInjuryId_key" ON "PiLiabilityAssessment"("personalInjuryId");

-- CreateIndex
CREATE INDEX "PiNegotiationEntry_personalInjuryId_occurredAt_idx" ON "PiNegotiationEntry"("personalInjuryId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "PiHearingBrief_personalInjuryId_key" ON "PiHearingBrief"("personalInjuryId");

-- CreateIndex
CREATE UNIQUE INDEX "PiJudgmentAward_personalInjuryId_key" ON "PiJudgmentAward"("personalInjuryId");

-- CreateIndex
CREATE INDEX "PiRecoveryAction_personalInjuryId_status_idx" ON "PiRecoveryAction"("personalInjuryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PiSettlementDistribution_personalInjuryId_key" ON "PiSettlementDistribution"("personalInjuryId");

-- CreateIndex
CREATE UNIQUE INDEX "PiClosureRecord_personalInjuryId_key" ON "PiClosureRecord"("personalInjuryId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_firmId_category_active_idx" ON "DocumentTemplate"("firmId", "category", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_firmId_key_key" ON "DocumentTemplate"("firmId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplateVersion_templateId_version_key" ON "DocumentTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "SystemJobRecord_queue_status_createdAt_idx" ON "SystemJobRecord"("queue", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "LegalEntity" ADD CONSTRAINT "LegalEntity_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "LegalEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeBranchId_fkey" FOREIGN KEY ("homeBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "SettingDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_secretRefId_fkey" FOREIGN KEY ("secretRefId") REFERENCES "SecretRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingValue" ADD CONSTRAINT "SettingValue_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_secretRefId_fkey" FOREIGN KEY ("secretRefId") REFERENCES "SecretRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeParty" ADD CONSTRAINT "IntakeParty_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictCheck" ADD CONSTRAINT "ConflictCheck_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycRecord" ADD CONSTRAINT "KycRecord_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "LegalEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_originatingBranchId_fkey" FOREIGN KEY ("originatingBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_responsibleBranchId_fkey" FOREIGN KEY ("responsibleBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_supervisingUserId_fkey" FOREIGN KEY ("supervisingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_currentStageOwnerId_fkey" FOREIGN KEY ("currentStageOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAssignment" ADD CONSTRAINT "MatterAssignment_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAssignment" ADD CONSTRAINT "MatterAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAssignment" ADD CONSTRAINT "MatterAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterAccess" ADD CONSTRAINT "MatterAccess_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterParty" ADD CONSTRAINT "MatterParty_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterStageInstance" ADD CONSTRAINT "MatterStageInstance_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterStageInstance" ADD CONSTRAINT "MatterStageInstance_workflowStageId_fkey" FOREIGN KEY ("workflowStageId") REFERENCES "WorkflowStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterStageChecklistItem" ADD CONSTRAINT "MatterStageChecklistItem_stageInstanceId_fkey" FOREIGN KEY ("stageInstanceId") REFERENCES "MatterStageInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHandoff" ADD CONSTRAINT "StageHandoff_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHandoffItem" ADD CONSTRAINT "StageHandoffItem_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "StageHandoff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarParticipant" ADD CONSTRAINT "CalendarParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarRevision" ADD CONSTRAINT "CalendarRevision_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtProceeding" ADD CONSTRAINT "CourtProceeding_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtFilingPackage" ADD CONSTRAINT "CourtFilingPackage_proceedingId_fkey" FOREIGN KEY ("proceedingId") REFERENCES "CourtProceeding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_proceedingId_fkey" FOREIGN KEY ("proceedingId") REFERENCES "CourtProceeding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttempt" ADD CONSTRAINT "ServiceAttempt_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDocument" ADD CONSTRAINT "TaskDocument_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDocument" ADD CONSTRAINT "TaskDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventDocument" ADD CONSTRAINT "CalendarEventDocument_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventDocument" ADD CONSTRAINT "CalendarEventDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmMarkAssetVersion" ADD CONSTRAINT "FirmMarkAssetVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FirmMarkAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureProfile" ADD CONSTRAINT "SignatureProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAssetVersion" ADD CONSTRAINT "SignatureAssetVersion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SignatureProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionBlockTemplateVersion" ADD CONSTRAINT "ExecutionBlockTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExecutionBlockTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_inputVersionId_fkey" FOREIGN KEY ("inputVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_outputVersionId_fkey" FOREIGN KEY ("outputVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_markAssetId_fkey" FOREIGN KEY ("markAssetId") REFERENCES "FirmMarkAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_markAssetVersionId_fkey" FOREIGN KEY ("markAssetVersionId") REFERENCES "FirmMarkAssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_placementPresetId_fkey" FOREIGN KEY ("placementPresetId") REFERENCES "DocumentPlacementPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_executionBlockVersionId_fkey" FOREIGN KEY ("executionBlockVersionId") REFERENCES "ExecutionBlockTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureDelegation" ADD CONSTRAINT "SignatureDelegation_delegatorProfileId_fkey" FOREIGN KEY ("delegatorProfileId") REFERENCES "SignatureProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureDelegation" ADD CONSTRAINT "SignatureDelegation_delegateUserId_fkey" FOREIGN KEY ("delegateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigningProviderConnection" ADD CONSTRAINT "SigningProviderConnection_integrationConnectionId_fkey" FOREIGN KEY ("integrationConnectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigningTransaction" ADD CONSTRAINT "SigningTransaction_providerConnectionId_fkey" FOREIGN KEY ("providerConnectionId") REFERENCES "SigningProviderConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationChannel" ADD CONSTRAINT "CommunicationChannel_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMembership" ADD CONSTRAINT "ChannelMembership_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "CommunicationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "CommunicationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChannelMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderIdentity" ADD CONSTRAINT "SenderIdentity_integrationConnectionId_fkey" FOREIGN KEY ("integrationConnectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundMailbox" ADD CONSTRAINT "InboundMailbox_integrationConnectionId_fkey" FOREIGN KEY ("integrationConnectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_senderIdentityId_fkey" FOREIGN KEY ("senderIdentityId") REFERENCES "SenderIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailRecipient" ADD CONSTRAINT "MailRecipient_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAttachment" ADD CONSTRAINT "MailAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailDeliveryEvent" ADD CONSTRAINT "MailDeliveryEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequest" ADD CONSTRAINT "ExpenseRequest_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeNote" ADD CONSTRAINT "FeeNote_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeNoteItem" ADD CONSTRAINT "FeeNoteItem_feeNoteId_fkey" FOREIGN KEY ("feeNoteId") REFERENCES "FeeNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectoryContact" ADD CONSTRAINT "DirectoryContact_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormVersion" ADD CONSTRAINT "FormVersion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "FormDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "FormVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalProject" ADD CONSTRAINT "InternalProject_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAction" ADD CONSTRAINT "MeetingAction_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalInjuryCase" ADD CONSTRAINT "PersonalInjuryCase_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiVehicle" ADD CONSTRAINT "PiVehicle_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiWitness" ADD CONSTRAINT "PiWitness_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiEvidenceItem" ADD CONSTRAINT "PiEvidenceItem_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiInjury" ADD CONSTRAINT "PiInjury_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiTreatmentEpisode" ADD CONSTRAINT "PiTreatmentEpisode_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiMedicalReportRequest" ADD CONSTRAINT "PiMedicalReportRequest_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiLiabilityAssessment" ADD CONSTRAINT "PiLiabilityAssessment_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiSpecialDamage" ADD CONSTRAINT "PiSpecialDamage_liabilityAssessmentId_fkey" FOREIGN KEY ("liabilityAssessmentId") REFERENCES "PiLiabilityAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiNegotiationEntry" ADD CONSTRAINT "PiNegotiationEntry_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiHearingBrief" ADD CONSTRAINT "PiHearingBrief_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiJudgmentAward" ADD CONSTRAINT "PiJudgmentAward_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiRecoveryAction" ADD CONSTRAINT "PiRecoveryAction_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiSettlementDistribution" ADD CONSTRAINT "PiSettlementDistribution_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiSettlementDeduction" ADD CONSTRAINT "PiSettlementDeduction_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "PiSettlementDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiClosureRecord" ADD CONSTRAINT "PiClosureRecord_personalInjuryId_fkey" FOREIGN KEY ("personalInjuryId") REFERENCES "PersonalInjuryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplateVersion" ADD CONSTRAINT "DocumentTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
