ALTER TABLE "Deadline"
  ADD COLUMN "sourceEventId" TEXT,
  ADD COLUMN "sourceDocumentId" TEXT,
  ADD COLUMN "legalRuleCode" TEXT,
  ADD COLUMN "calculationMethod" TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "calculationAnchorAt" TIMESTAMP(3),
  ADD COLUMN "calculationDays" INTEGER,
  ADD COLUMN "excludedDates" JSONB,
  ADD COLUMN "courtOrderOverride" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "courtOrderDocumentId" TEXT,
  ADD COLUMN "reminderSchedule" JSONB,
  ADD COLUMN "responsibleUserId" TEXT,
  ADD COLUMN "escalationUserId" TEXT,
  ADD COLUMN "stayPeriods" JSONB,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lastRecalculatedAt" TIMESTAMP(3);

CREATE TABLE "DeadlineRevision" (
    "id" TEXT NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "priorOfficialDueAt" TIMESTAMP(3),
    "nextOfficialDueAt" TIMESTAMP(3),
    "priorInternalTargetAt" TIMESTAMP(3),
    "nextInternalTargetAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "reason" TEXT,
    "legalRuleCode" TEXT,
    "courtOrderDocumentId" TEXT,
    "calculationSnapshot" JSONB,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadlineRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeadlineRevision_deadlineId_revisionNumber_key" ON "DeadlineRevision"("deadlineId", "revisionNumber");
CREATE INDEX "DeadlineRevision_deadlineId_createdAt_idx" ON "DeadlineRevision"("deadlineId", "createdAt");
CREATE INDEX "Deadline_responsibleUserId_status_officialDueAt_idx" ON "Deadline"("responsibleUserId", "status", "officialDueAt");

ALTER TABLE "DeadlineRevision"
  ADD CONSTRAINT "DeadlineRevision_deadlineId_fkey"
  FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
