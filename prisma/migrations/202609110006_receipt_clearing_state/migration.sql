ALTER TABLE "PaymentReceipt"
  ADD COLUMN "clearedAt" TIMESTAMP(3),
  ADD COLUMN "clearingReference" TEXT;
