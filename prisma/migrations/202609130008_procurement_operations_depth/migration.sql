ALTER TABLE "PurchaseRequisition" ADD COLUMN "categoryId" TEXT;

CREATE TABLE "PurchaseCategory" (
  "id" TEXT NOT NULL, "firmId" TEXT NOT NULL, "key" TEXT NOT NULL, "name" TEXT NOT NULL,
  "approvalThreshold" DECIMAL(18,2), "financeAccountCode" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PurchaseCategory_firmId_key_key" ON "PurchaseCategory"("firmId", "key");
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PurchaseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "VendorDocument" (
  "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "category" TEXT NOT NULL, "title" TEXT NOT NULL,
  "storageState" TEXT NOT NULL DEFAULT 'MANUAL', "externalReference" TEXT, "expiresAt" TIMESTAMP(3), "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VendorDocument_vendorId_expiresAt_idx" ON "VendorDocument"("vendorId", "expiresAt");
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VendorQuote" (
  "id" TEXT NOT NULL, "requisitionId" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "reference" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'KES', "validUntil" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'RECEIVED', "notes" TEXT, "recordedById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorQuote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VendorQuote_requisitionId_vendorId_reference_key" ON "VendorQuote"("requisitionId", "vendorId", "reference");
CREATE INDEX "VendorQuote_requisitionId_status_idx" ON "VendorQuote"("requisitionId", "status");
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorQuote" ADD CONSTRAINT "VendorQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AssetMaintenance" (
  "id" TEXT NOT NULL, "assetId" TEXT NOT NULL, "vendorId" TEXT, "type" TEXT NOT NULL, "description" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3), "cost" DECIMAL(18,2), "externalReference" TEXT, "notes" TEXT, "recordedById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssetMaintenance_assetId_status_openedAt_idx" ON "AssetMaintenance"("assetId", "status", "openedAt");
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
