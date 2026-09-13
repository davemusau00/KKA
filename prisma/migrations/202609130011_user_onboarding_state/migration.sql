CREATE TYPE "UserOnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "UserOnboardingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "onboardingVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "UserOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentStepKey" TEXT,
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "tourCompletedAt" TIMESTAMP(3),
    "manualViewedAt" TIMESTAMP(3),
    "dismissedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboardingState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserOnboardingState_userId_key" ON "UserOnboardingState"("userId");
CREATE INDEX "UserOnboardingState_status_dismissedUntil_idx" ON "UserOnboardingState"("status", "dismissedUntil");

ALTER TABLE "UserOnboardingState" ADD CONSTRAINT "UserOnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
