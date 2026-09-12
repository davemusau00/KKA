CREATE TABLE "CourtOutcomeRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "directions" TEXT,
    "courtOrderDocumentId" TEXT,
    "nextEventId" TEXT,
    "deadlineId" TEXT,
    "deadlineEventId" TEXT,
    "taskId" TEXT,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourtOutcomeRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourtOutcomeRecord_eventId_key" ON "CourtOutcomeRecord"("eventId");
CREATE INDEX "CourtOutcomeRecord_recordedById_recordedAt_idx" ON "CourtOutcomeRecord"("recordedById", "recordedAt");

ALTER TABLE "CourtOutcomeRecord"
  ADD CONSTRAINT "CourtOutcomeRecord_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
