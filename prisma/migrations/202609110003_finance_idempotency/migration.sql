CREATE UNIQUE INDEX "JournalEntry_firmId_sourceType_sourceId_key"
  ON "JournalEntry"("firmId", "sourceType", "sourceId");

CREATE UNIQUE INDEX "PaymentReceipt_firmId_referenceNumber_key"
  ON "PaymentReceipt"("firmId", "referenceNumber");
