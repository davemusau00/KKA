ALTER TABLE "Asset" ADD COLUMN "purchaseReceiptId" TEXT;
CREATE UNIQUE INDEX "Asset_purchaseReceiptId_key" ON "Asset"("purchaseReceiptId");
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_purchaseReceiptId_fkey" FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseRequest" ADD COLUMN "purchaseReceiptId" TEXT;
CREATE UNIQUE INDEX "ExpenseRequest_purchaseReceiptId_key" ON "ExpenseRequest"("purchaseReceiptId");
