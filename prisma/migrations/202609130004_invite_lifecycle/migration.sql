ALTER TABLE "UserInvite"
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "supersededAt" TIMESTAMP(3),
  ADD COLUMN "deliveryStatus" TEXT NOT NULL DEFAULT 'UNCONFIGURED',
  ADD COLUMN "deliveryAttemptedAt" TIMESTAMP(3);

CREATE INDEX "UserInvite_userId_acceptedAt_revokedAt_supersededAt_idx"
  ON "UserInvite"("userId", "acceptedAt", "revokedAt", "supersededAt");
