CREATE TABLE "LedgerPeriodLock" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "lockedById" TEXT NOT NULL,
  "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerPeriodLock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LedgerPeriodLock_firmId_periodStart_periodEnd_key"
  ON "LedgerPeriodLock"("firmId", "periodStart", "periodEnd");

CREATE INDEX "LedgerPeriodLock_firmId_periodStart_periodEnd_idx"
  ON "LedgerPeriodLock"("firmId", "periodStart", "periodEnd");
