const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

const poBlock = `model PurchaseOrder {
  id            String         @id @default(cuid())
  firmId        String
  branchId      String
  projectId     String?
  vendorId      String
  orderNo       String         @unique
  requisitionId String?        @unique
  description   String
  amount        Decimal        @db.Decimal(18, 2)
  status        PurchaseStatus @default(APPROVED)
  orderedAt     DateTime?
  receivedAt    DateTime?
  createdById   String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  vendor   Vendor           @relation(fields: [vendorId], references: [id], onDelete: Restrict)
  receipts PurchaseReceipt[]
  project  InternalProject? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([projectId, status])
}`;

content = content.replace(/model PurchaseOrder \{[\s\S]*?\n\}/, poBlock);
fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Fixed PurchaseOrder definition successfully');
