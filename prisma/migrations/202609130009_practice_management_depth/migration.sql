ALTER TABLE "Meeting" ADD COLUMN "recurrenceRule" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "recurrenceUntil" TIMESTAMP(3);
ALTER TABLE "MeetingAction" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'OPEN';
ALTER TABLE "MeetingAction" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "MeetingAction" ADD COLUMN "completedById" TEXT;

CREATE TABLE "ProjectMilestone" (
 "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "dueAt" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'OPEN', "completedAt" TIMESTAMP(3), "ownerUserId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectMilestone_projectId_status_dueAt_idx" ON "ProjectMilestone"("projectId", "status", "dueAt");
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "ProjectSpend" (
 "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "description" TEXT NOT NULL, "amount" DECIMAL(18,2) NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL, "source" TEXT NOT NULL DEFAULT 'MANUAL', "financeReference" TEXT, "recordedById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ProjectSpend_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectSpend_projectId_occurredAt_idx" ON "ProjectSpend"("projectId", "occurredAt");
ALTER TABLE "ProjectSpend" ADD CONSTRAINT "ProjectSpend_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "ProjectMatterLink" (
 "projectId" TEXT NOT NULL, "matterId" TEXT NOT NULL, "linkedById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ProjectMatterLink_pkey" PRIMARY KEY ("projectId", "matterId")
);
ALTER TABLE "ProjectMatterLink" ADD CONSTRAINT "ProjectMatterLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMatterLink" ADD CONSTRAINT "ProjectMatterLink_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "ProjectDocumentLink" (
 "projectId" TEXT NOT NULL, "documentId" TEXT NOT NULL, "linkedById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ProjectDocumentLink_pkey" PRIMARY KEY ("projectId", "documentId")
);
ALTER TABLE "ProjectDocumentLink" ADD CONSTRAINT "ProjectDocumentLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InternalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDocumentLink" ADD CONSTRAINT "ProjectDocumentLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
