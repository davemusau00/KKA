const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. In Matter model, add meetingSeries MeetingSeries[] after meetings Meeting[]
if (!schema.includes('meetingSeries MeetingSeries[]')) {
  schema = schema.replace(
    /(\s+meetings\s+Meeting\[\])/,
    '$1\r\n  meetingSeries MeetingSeries[]'
  );
}

// 2. In InternalProject model, add relations after meetings Meeting[]
if (!schema.includes('meetingSeries MeetingSeries[]\r\n  expenseRequests')) {
  schema = schema.replace(
    /(\s+meetings Meeting\[\])/,
    '$1\r\n  meetingSeries MeetingSeries[]\r\n  expenseRequests ExpenseRequest[]\r\n  purchaseRequisitions PurchaseRequisition[]\r\n  purchaseOrders PurchaseOrder[]'
  );
}

// 3. Define MeetingSeries model before model Meeting
const meetingSeriesModel = `
model MeetingSeries {
  id                 String    @id @default(cuid())
  firmId             String
  title              String
  description        String?
  recurrenceRule     String
  startsAt           DateTime
  durationMinutes    Int       @default(60)
  location           String?
  projectId          String?
  matterId           String?
  organizerId        String
  agendaTemplate     Json?
  defaultAttendeeIds String[]
  rollingHorizonDays Int       @default(90)
  lastGeneratedUntil DateTime?
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  project            InternalProject? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  matter             Matter?          @relation(fields: [matterId], references: [id], onDelete: SetNull)
  meetings           Meeting[]

  @@index([firmId, isActive])
  @@index([projectId])
  @@index([matterId])
}
`;

if (!schema.includes('model MeetingSeries {')) {
  schema = schema.replace(
    /model Meeting \{/,
    `${meetingSeriesModel.trim()}\r\n\r\nmodel Meeting {`
  );
}

// 4. Update Meeting model to include series fields
if (!schema.includes('seriesId String?')) {
  schema = schema.replace(
    /organizerId String\r?\n\s*recurrenceRule String\?/,
    `organizerId String\r\n  seriesId String?\r\n  seriesOccurrenceStart DateTime?\r\n  recurrenceRule String?`
  );
  schema = schema.replace(
    /matter\s+Matter\?\s+@relation\(fields: \[matterId\], references: \[id\], onDelete: SetNull\)/,
    `matter       Matter?              @relation(fields: [matterId], references: [id], onDelete: SetNull)\r\n  series       MeetingSeries?       @relation(fields: [seriesId], references: [id], onDelete: Cascade)`
  );
  schema = schema.replace(
    /@@index\(\[projectId, startsAt\]\)/,
    `@@index([projectId, startsAt])\r\n  @@unique([seriesId, seriesOccurrenceStart])\r\n  @@index([seriesId])`
  );
}

// 5. Update ExpenseRequest to include projectId
if (!schema.includes('projectId           String?')) {
  schema = schema.replace(
    /matterId\s+String\?\r?\n\s*branchId\s+String/,
    `matterId            String?\r\n  projectId           String?\r\n  branchId            String`
  );
  schema = schema.replace(
    /matter Matter\? @relation\(fields: \[matterId\], references: \[id\], onDelete: SetNull\)/,
    `matter Matter? @relation(fields: [matterId], references: [id], onDelete: SetNull)\r\n  project InternalProject? @relation(fields: [projectId], references: [id], onDelete: SetNull)`
  );
  schema = schema.replace(
    /@@index\(\[branchId, status\]\)/,
    `@@index([branchId, status])\r\n  @@index([projectId, status])`
  );
}

// 6. Update PurchaseRequisition to include projectId
if (!schema.includes('projectId     String?')) {
  schema = schema.replace(
    /branchId\s+String\r?\n\s*vendorId\s+String\?/,
    `branchId      String\r\n  projectId     String?\r\n  vendorId      String?`
  );
  schema = schema.replace(
    /quotes VendorQuote\[\]/,
    `quotes VendorQuote[]\r\n  project InternalProject? @relation(fields: [projectId], references: [id], onDelete: SetNull)`
  );
  schema = schema.replace(
    /@@unique\(\[firmId, idempotencyKey\]\)/,
    `@@unique([firmId, idempotencyKey])\r\n  @@index([projectId, status])`
  );
}

// 7. Update PurchaseOrder to include projectId
if (!schema.includes('projectId     String?')) {
  schema = schema.replace(
    /branchId\s+String\r?\n\s*vendorId\s+String/,
    `branchId      String\r\n  projectId     String?\r\n  vendorId      String`
  );
  schema = schema.replace(
    /receipts PurchaseReceipt\[\]/,
    `receipts PurchaseReceipt[]\r\n  project InternalProject? @relation(fields: [projectId], references: [id], onDelete: SetNull)`
  );
  schema = schema.replace(
    /model PurchaseOrder \{([\s\S]*?)\}/,
    (match) => match.includes('@@index([projectId, status])') ? match : match.replace(/\}$/, '  @@index([projectId, status])\r\n}')
  );
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Successfully updated prisma/schema.prisma with MeetingSeries and Project relations');
