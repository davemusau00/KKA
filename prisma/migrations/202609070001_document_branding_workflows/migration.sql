ALTER TABLE "DocumentMarkApplication" ALTER COLUMN "markAssetId" DROP NOT NULL;
ALTER TABLE "DocumentMarkApplication" ALTER COLUMN "markAssetVersionId" DROP NOT NULL;
ALTER TABLE "DocumentMarkApplication" ADD COLUMN "signatureAssetVersionId" TEXT, ADD COLUMN "operationId" TEXT;
ALTER TABLE "DocumentMarkApplication" ADD CONSTRAINT "DocumentMarkApplication_signatureAssetVersionId_fkey" FOREIGN KEY ("signatureAssetVersionId") REFERENCES "SignatureAssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "DocumentOperation" (
  "id" TEXT NOT NULL PRIMARY KEY, "firmId" TEXT NOT NULL, "actorId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL, "kind" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL, "payload" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "approvalRequestId" TEXT, "outputVersionId" TEXT, "outputDocxVersionId" TEXT,
  "error" TEXT, "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "DocumentOperation_firmId_idempotencyKey_key" ON "DocumentOperation"("firmId", "idempotencyKey");
CREATE UNIQUE INDEX "DocumentOperation_approvalRequestId_key" ON "DocumentOperation"("approvalRequestId");
CREATE INDEX "DocumentOperation_firmId_documentId_createdAt_idx" ON "DocumentOperation"("firmId", "documentId", "createdAt");
INSERT INTO "SettingDefinition" ("id", "key", "category", "label", "description", "valueType", "allowedScopes", "featureDependencyKeys", "updatedAt")
VALUES ('setting-firm-branding-logo', 'firm.branding.logo', 'branding', 'Firm logo', 'Selected public branding logo version', 'ASSET', ARRAY['FIRM']::"SettingScope"[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
