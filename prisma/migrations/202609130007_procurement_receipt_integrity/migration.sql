-- Additive procurement/custody integrity: no reset is required for existing local data.
ALTER TABLE "PurchaseRequisition" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "PurchaseRequisition_firmId_idempotencyKey_key"
  ON "PurchaseRequisition"("firmId", "idempotencyKey");

CREATE UNIQUE INDEX "PurchaseOrder_requisitionId_key"
  ON "PurchaseOrder"("requisitionId");

CREATE TABLE "PurchaseReceipt" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "deliveryReference" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "receivedById" TEXT NOT NULL,
  "partial" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PurchaseReceipt_firmId_idempotencyKey_key"
  ON "PurchaseReceipt"("firmId", "idempotencyKey");
CREATE INDEX "PurchaseReceipt_purchaseOrderId_receivedAt_idx"
  ON "PurchaseReceipt"("purchaseOrderId", "receivedAt");
CREATE UNIQUE INDEX "AssetAssignment_one_open_assignment_per_asset"
  ON "AssetAssignment"("assetId") WHERE "returnedAt" IS NULL;

ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_purchaseOrderId_fkey"
  FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
