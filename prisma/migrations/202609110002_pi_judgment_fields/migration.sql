ALTER TABLE "PiJudgmentAward"
  ADD COLUMN "liabilityClaimantPercent" DECIMAL(8,3),
  ADD COLUMN "liabilityDefendantPercent" DECIMAL(8,3),
  ADD COLUMN "appealJustification" TEXT,
  ADD COLUMN "interestRatePercent" DECIMAL(8,3),
  ADD COLUMN "interestFromDate" TIMESTAMP(3),
  ADD COLUMN "recoveryTriggered" BOOLEAN NOT NULL DEFAULT false;
