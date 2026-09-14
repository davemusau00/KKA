-- CreateTable
CREATE TABLE "MeetingSeries" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recurrenceRule" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "projectId" TEXT,
    "matterId" TEXT,
    "organizerId" TEXT NOT NULL,
    "agendaTemplate" JSONB,
    "defaultAttendeeIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "rollingHorizonDays" INTEGER NOT NULL DEFAULT 90,
    "lastGeneratedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingSeries_pkey" PRIMARY KEY ("id")
);

-- AlterTable Meeting
ALTER TABLE "Meeting" ADD COLUMN "seriesId" TEXT,
ADD COLUMN "seriesOccurrenceStart" TIMESTAMP(3);

-- AlterTable ExpenseRequest
ALTER TABLE "ExpenseRequest" ADD COLUMN "projectId" TEXT;

-- AlterTable PurchaseRequisition
ALTER TABLE "PurchaseRequisition" ADD COLUMN "projectId" TEXT;

-- AlterTable PurchaseOrder
ALTER TABLE "PurchaseOrder" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE INDEX "MeetingSeries_firmId_isActive_idx" ON "MeetingSeries"("firmId", "isActive");
CREATE INDEX "MeetingSeries_projectId_idx" ON "MeetingSeries"("projectId");
CREATE INDEX "MeetingSeries_matterId_idx" ON "MeetingSeries"("matterId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_seriesId_seriesOccurrenceStart_key" ON "Meeting"("seriesId", "seriesOccurrenceStart");
CREATE INDEX "Meeting_seriesId_idx" ON "Meeting"("seriesId");

-- CreateIndex
CREATE INDEX "ExpenseRequest_projectId_status_idx" ON "ExpenseRequest"("projectId", "status");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_projectId_status_idx" ON "PurchaseRequisition"("projectId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_projectId_status_idx" ON "PurchaseOrder"("projectId", "status");

-- AddForeignKey
ALTER TABLE "MeetingSeries" ADD CONSTRAINT "MeetingSeries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSeries" ADD CONSTRAINT "MeetingSeries_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "MeetingSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequest" ADD CONSTRAINT "ExpenseRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
