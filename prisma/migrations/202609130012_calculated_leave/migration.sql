ALTER TABLE "LeavePolicy"
  ADD COLUMN "accrualMode" TEXT NOT NULL DEFAULT 'FRONT_LOADED',
  ADD COLUMN "prorateNewEmployees" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "allowNegative" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "maximumNegativeDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN "workingDays" INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5]::INTEGER[],
  ADD COLUMN "excludedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LeaveRequest"
  ADD COLUMN "policyKey" TEXT,
  ADD COLUMN "chargeableDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "calculation" JSONB,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "LeaveRequest_userId_idempotencyKey_key" ON "LeaveRequest"("userId", "idempotencyKey");
-- Historical requests remain unclassified until reviewed; no policy is guessed.
