ALTER TABLE "CourtFilingPackage"
  ADD COLUMN "documentId" TEXT,
  ADD COLUMN "documentVersionId" TEXT,
  ADD COLUMN "filingMethod" TEXT,
  ADD COLUMN "courtReceiptDocumentId" TEXT,
  ADD COLUMN "paymentReceiptId" TEXT,
  ADD COLUMN "filingReference" TEXT,
  ADD COLUMN "submittedById" TEXT,
  ADD COLUMN "verifiedById" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "failureReason" TEXT;

ALTER TABLE "ServiceRecord"
  ADD COLUMN "partyContact" TEXT,
  ADD COLUMN "substituteServiceOrderDocumentId" TEXT,
  ADD COLUMN "returnedService" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "nextAction" TEXT,
  ADD COLUMN "nextDeadlineId" TEXT;

ALTER TABLE "ServiceAttempt"
  ADD COLUMN "serviceAddress" TEXT,
  ADD COLUMN "affidavitDocumentId" TEXT,
  ADD COLUMN "returnedService" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "failureReason" TEXT;
