ALTER TABLE "EmployeeProfile"
  ADD COLUMN "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "probationEndsAt" TIMESTAMP(3),
  ADD COLUMN "offboardedAt" TIMESTAMP(3),
  ADD COLUMN "offboardingReason" TEXT;

CREATE TABLE "HrLifecycleChecklistItem" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lifecycle" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "completedAt" TIMESTAMP(3),
  "completedById" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrLifecycleChecklistItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HrLifecycleChecklistItem_firmId_userId_lifecycle_key_key" ON "HrLifecycleChecklistItem"("firmId", "userId", "lifecycle", "key");
CREATE INDEX "HrLifecycleChecklistItem_firmId_userId_lifecycle_status_idx" ON "HrLifecycleChecklistItem"("firmId", "userId", "lifecycle", "status");

CREATE TABLE "EmployeeAppraisal" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reviewerUserId" TEXT NOT NULL,
  "periodStartsAt" TIMESTAMP(3) NOT NULL,
  "periodEndsAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "rating" DECIMAL(4,2),
  "summary" TEXT,
  "developmentPlan" TEXT,
  "acknowledgedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeAppraisal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmployeeAppraisal_firmId_userId_periodEndsAt_idx" ON "EmployeeAppraisal"("firmId", "userId", "periodEndsAt");

CREATE TABLE "AdvocateCredential" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "admissionNumber" TEXT NOT NULL,
  "admissionDate" TIMESTAMP(3),
  "practicingCertificateNo" TEXT,
  "certificateExpiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdvocateCredential_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdvocateCredential_firmId_admissionNumber_key" ON "AdvocateCredential"("firmId", "admissionNumber");
CREATE INDEX "AdvocateCredential_firmId_userId_certificateExpiresAt_idx" ON "AdvocateCredential"("firmId", "userId", "certificateExpiresAt");

CREATE TABLE "LeavePolicy" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "annualEntitlementDays" DECIMAL(8,2) NOT NULL,
  "carryoverLimitDays" DECIMAL(8,2),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeavePolicy_firmId_key_key" ON "LeavePolicy"("firmId", "key");

CREATE TABLE "LeaveBalance" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "policyKey" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "openingDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "accruedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "usedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "adjustmentDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeaveBalance_firmId_userId_policyKey_year_key" ON "LeaveBalance"("firmId", "userId", "policyKey", "year");
CREATE INDEX "LeaveBalance_firmId_userId_year_idx" ON "LeaveBalance"("firmId", "userId", "year");

CREATE TABLE "HrRestrictedNote" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "visibleToUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrRestrictedNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HrRestrictedNote_firmId_userId_createdAt_idx" ON "HrRestrictedNote"("firmId", "userId", "createdAt");

CREATE TABLE "StaffDocument" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "storageState" TEXT NOT NULL DEFAULT 'MANUAL',
  "externalReference" TEXT,
  "expiresAt" TIMESTAMP(3),
  "recordedById" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StaffDocument_firmId_userId_expiresAt_idx" ON "StaffDocument"("firmId", "userId", "expiresAt");
