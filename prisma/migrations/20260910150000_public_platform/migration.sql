-- KKA Public Digital Platform additive migration.
-- Designed for the existing KKA PostgreSQL schema. No existing KKA tables are dropped or rewritten.

CREATE TYPE "WebsiteContentStatus" AS ENUM ('DRAFT','IN_REVIEW','APPROVED','SCHEDULED','PUBLISHED','ARCHIVED');
CREATE TYPE "WebsitePublicationKind" AS ENUM ('ARTICLE','VIDEO');
CREATE TYPE "WebsiteLeadStatus" AS ENUM ('NEW','REVIEWING','CONTACTED','CONSULTATION_BOOKED','CONSULTED','QUALIFIED','INTAKE_STARTED','CONVERTED','DECLINED','DUPLICATE','NO_RESPONSE','CONFLICT','OUT_OF_SCOPE');
CREATE TYPE "WebsiteLeadPriority" AS ENUM ('LOW','NORMAL','HIGH','URGENT');
CREATE TYPE "WebsiteFormSubmissionStatus" AS ENUM ('RECEIVED','PROCESSED','SPAM','ARCHIVED');
CREATE TYPE "WebsiteReleaseStatus" AS ENUM ('QUEUED','BUILDING','PUBLISHED','FAILED','ROLLED_BACK');

CREATE TABLE "WebsiteSiteSettings" (
  "id" TEXT NOT NULL, "firmId" TEXT NOT NULL, "firmName" TEXT NOT NULL, "tagline" TEXT NOT NULL,
  "phone" TEXT NOT NULL, "email" TEXT NOT NULL, "address" TEXT NOT NULL,
  "socials" JSONB NOT NULL DEFAULT '[]', "navigation" JSONB NOT NULL DEFAULT '[]', "footer" JSONB NOT NULL DEFAULT '{}',
  "defaultSeo" JSONB NOT NULL DEFAULT '{}', "theme" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteSiteSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WebsiteSiteSettings_firmId_key" ON "WebsiteSiteSettings"("firmId");

CREATE TABLE "WebsiteMediaAsset" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"filename" TEXT NOT NULL,"originalName" TEXT NOT NULL,"mimeType" TEXT NOT NULL,
 "sizeBytes" INTEGER NOT NULL,"storagePath" TEXT NOT NULL,"alt" TEXT NOT NULL,"caption" TEXT,"credit" TEXT,"width" INTEGER,"height" INTEGER,
 "focalX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,"focalY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,"checksum" TEXT,"variants" JSONB NOT NULL DEFAULT '{}',
 "createdById" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteMediaAsset_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteMediaAsset_firmId_createdAt_idx" ON "WebsiteMediaAsset"("firmId","createdAt");
CREATE INDEX "WebsiteMediaAsset_firmId_mimeType_idx" ON "WebsiteMediaAsset"("firmId","mimeType");

CREATE TABLE "WebsiteProfessionalProfile" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"userId" TEXT,"slug" TEXT NOT NULL,"name" TEXT NOT NULL,"title" TEXT NOT NULL,
 "summary" TEXT NOT NULL,"bio" TEXT NOT NULL,"imageId" TEXT,"email" TEXT,"phone" TEXT,"practiceAreaSlugs" TEXT[] NOT NULL,
 "credentials" TEXT[] NOT NULL,"memberships" TEXT[] NOT NULL,"education" TEXT[] NOT NULL,"featured" BOOLEAN NOT NULL DEFAULT false,
 "displayOrder" INTEGER NOT NULL DEFAULT 0,"status" "WebsiteContentStatus" NOT NULL DEFAULT 'DRAFT',"publishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteProfessionalProfile_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsiteProfessionalProfile_firmId_slug_key" ON "WebsiteProfessionalProfile"("firmId","slug");
CREATE INDEX "WebsiteProfessionalProfile_firmId_status_displayOrder_idx" ON "WebsiteProfessionalProfile"("firmId","status","displayOrder");

CREATE TABLE "WebsitePracticeArea" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"slug" TEXT NOT NULL,"title" TEXT NOT NULL,"summary" TEXT NOT NULL,"description" TEXT NOT NULL,
 "icon" TEXT NOT NULL,"services" TEXT[] NOT NULL,"faqs" JSONB NOT NULL DEFAULT '[]',"featured" BOOLEAN NOT NULL DEFAULT false,
 "displayOrder" INTEGER NOT NULL DEFAULT 0,"status" "WebsiteContentStatus" NOT NULL DEFAULT 'DRAFT',"publishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsitePracticeArea_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsitePracticeArea_firmId_slug_key" ON "WebsitePracticeArea"("firmId","slug");
CREATE INDEX "WebsitePracticeArea_firmId_status_displayOrder_idx" ON "WebsitePracticeArea"("firmId","status","displayOrder");

CREATE TABLE "WebsitePage" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"slug" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT NOT NULL,
 "status" "WebsiteContentStatus" NOT NULL DEFAULT 'DRAFT',"seo" JSONB NOT NULL DEFAULT '{}',"heroAssetId" TEXT,
 "currentVersion" INTEGER NOT NULL DEFAULT 0,"scheduledFor" TIMESTAMP(3),"publishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsitePage_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsitePage_firmId_slug_key" ON "WebsitePage"("firmId","slug");
CREATE INDEX "WebsitePage_firmId_status_updatedAt_idx" ON "WebsitePage"("firmId","status","updatedAt");

CREATE TABLE "WebsitePageVersion" (
 "id" TEXT NOT NULL,"pageId" TEXT NOT NULL,"version" INTEGER NOT NULL,"title" TEXT NOT NULL,"description" TEXT NOT NULL,
 "seo" JSONB NOT NULL,"snapshot" JSONB NOT NULL,"createdById" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "WebsitePageVersion_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsitePageVersion_pageId_version_key" ON "WebsitePageVersion"("pageId","version");

CREATE TABLE "WebsiteBlock" (
 "id" TEXT NOT NULL,"pageId" TEXT NOT NULL,"blockType" TEXT NOT NULL,"variant" TEXT NOT NULL DEFAULT 'default',
 "displayOrder" INTEGER NOT NULL,"theme" TEXT NOT NULL DEFAULT 'light',"content" JSONB NOT NULL,"settings" JSONB NOT NULL DEFAULT '{}',
 "visible" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteBlock_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsiteBlock_pageId_displayOrder_key" ON "WebsiteBlock"("pageId","displayOrder");
CREATE INDEX "WebsiteBlock_pageId_visible_idx" ON "WebsiteBlock"("pageId","visible");

CREATE TABLE "WebsitePublication" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"slug" TEXT NOT NULL,"kind" "WebsitePublicationKind" NOT NULL,"title" TEXT NOT NULL,
 "excerpt" TEXT NOT NULL,"body" TEXT NOT NULL,"coverId" TEXT,"authorProfileId" TEXT,"duration" TEXT,"practiceAreaSlugs" TEXT[] NOT NULL,
 "tags" TEXT[] NOT NULL,"status" "WebsiteContentStatus" NOT NULL DEFAULT 'DRAFT',"seo" JSONB NOT NULL DEFAULT '{}',
 "currentVersion" INTEGER NOT NULL DEFAULT 0,"scheduledFor" TIMESTAMP(3),"publishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsitePublication_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsitePublication_firmId_slug_key" ON "WebsitePublication"("firmId","slug");
CREATE INDEX "WebsitePublication_firmId_status_publishedAt_idx" ON "WebsitePublication"("firmId","status","publishedAt");
CREATE INDEX "WebsitePublication_authorProfileId_idx" ON "WebsitePublication"("authorProfileId");

CREATE TABLE "WebsitePublicationVersion" (
 "id" TEXT NOT NULL,"publicationId" TEXT NOT NULL,"version" INTEGER NOT NULL,"title" TEXT NOT NULL,"excerpt" TEXT NOT NULL,
 "body" TEXT NOT NULL,"seo" JSONB NOT NULL,"snapshot" JSONB NOT NULL DEFAULT '{}',"createdById" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WebsitePublicationVersion_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsitePublicationVersion_publicationId_version_key" ON "WebsitePublicationVersion"("publicationId","version");

CREATE TABLE "WebsiteTestimonial" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"title" TEXT NOT NULL,"quote" TEXT NOT NULL,"source" TEXT NOT NULL,"rating" INTEGER NOT NULL DEFAULT 5,
 "featured" BOOLEAN NOT NULL DEFAULT true,"displayOrder" INTEGER NOT NULL DEFAULT 0,"status" "WebsiteContentStatus" NOT NULL DEFAULT 'DRAFT',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteTestimonial_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteTestimonial_firmId_status_displayOrder_idx" ON "WebsiteTestimonial"("firmId","status","displayOrder");

CREATE TABLE "WebsiteMetric" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"value" TEXT NOT NULL,"label" TEXT NOT NULL,"icon" TEXT NOT NULL,"sourceNote" TEXT,"verifiedAt" TIMESTAMP(3),
 "displayOrder" INTEGER NOT NULL DEFAULT 0,"status" "WebsiteContentStatus" NOT NULL DEFAULT 'PUBLISHED',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteMetric_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteMetric_firmId_status_displayOrder_idx" ON "WebsiteMetric"("firmId","status","displayOrder");

CREATE TABLE "WebsiteFormDefinition" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"key" TEXT NOT NULL,"name" TEXT NOT NULL,"schema" JSONB NOT NULL,"routing" JSONB NOT NULL,
 "consentText" TEXT NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,"version" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteFormDefinition_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsiteFormDefinition_firmId_key_key" ON "WebsiteFormDefinition"("firmId","key");

CREATE TABLE "WebsiteLead" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"reference" TEXT NOT NULL,"name" TEXT NOT NULL,"email" TEXT,"phone" TEXT NOT NULL,
 "practiceAreaSlug" TEXT,"message" TEXT NOT NULL,"status" "WebsiteLeadStatus" NOT NULL DEFAULT 'NEW',"priority" "WebsiteLeadPriority" NOT NULL DEFAULT 'NORMAL',
 "ownerUserId" TEXT,"source" TEXT,"landingPage" TEXT,"consent" BOOLEAN NOT NULL,"score" INTEGER NOT NULL DEFAULT 0,"dispositionReason" TEXT,
 "intakeId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,"convertedAt" TIMESTAMP(3),
 CONSTRAINT "WebsiteLead_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsiteLead_reference_key" ON "WebsiteLead"("reference");
CREATE INDEX "WebsiteLead_firmId_status_createdAt_idx" ON "WebsiteLead"("firmId","status","createdAt");
CREATE INDEX "WebsiteLead_firmId_ownerUserId_status_idx" ON "WebsiteLead"("firmId","ownerUserId","status");
CREATE INDEX "WebsiteLead_firmId_phone_idx" ON "WebsiteLead"("firmId","phone");
CREATE INDEX "WebsiteLead_firmId_email_idx" ON "WebsiteLead"("firmId","email");

CREATE TABLE "WebsiteFormSubmission" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"formId" TEXT,"leadId" TEXT,"payload" JSONB NOT NULL,"ipHash" TEXT,"userAgent" TEXT,
 "referrer" TEXT,"landingPage" TEXT,"status" "WebsiteFormSubmissionStatus" NOT NULL DEFAULT 'RECEIVED',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WebsiteFormSubmission_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteFormSubmission_firmId_createdAt_idx" ON "WebsiteFormSubmission"("firmId","createdAt");
CREATE INDEX "WebsiteFormSubmission_leadId_idx" ON "WebsiteFormSubmission"("leadId");

CREATE TABLE "WebsiteLeadEvent" (
 "id" TEXT NOT NULL,"leadId" TEXT NOT NULL,"actorUserId" TEXT,"type" TEXT NOT NULL,"note" TEXT,"metadata" JSONB NOT NULL DEFAULT '{}',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WebsiteLeadEvent_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteLeadEvent_leadId_createdAt_idx" ON "WebsiteLeadEvent"("leadId","createdAt");

CREATE TABLE "WebsiteLeadAssignment" (
 "id" TEXT NOT NULL,"leadId" TEXT NOT NULL,"userId" TEXT NOT NULL,"assignedById" TEXT,"reason" TEXT,
 "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"endedAt" TIMESTAMP(3), CONSTRAINT "WebsiteLeadAssignment_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteLeadAssignment_leadId_endedAt_idx" ON "WebsiteLeadAssignment"("leadId","endedAt");
CREATE INDEX "WebsiteLeadAssignment_userId_endedAt_idx" ON "WebsiteLeadAssignment"("userId","endedAt");

CREATE TABLE "WebsiteLeadContactAttempt" (
 "id" TEXT NOT NULL,"leadId" TEXT NOT NULL,"actorUserId" TEXT,"channel" TEXT NOT NULL,"direction" TEXT NOT NULL,"outcome" TEXT NOT NULL,"notes" TEXT,
 "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WebsiteLeadContactAttempt_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteLeadContactAttempt_leadId_contactedAt_idx" ON "WebsiteLeadContactAttempt"("leadId","contactedAt");

CREATE TABLE "WebsiteLeadAppointment" (
 "id" TEXT NOT NULL,"leadId" TEXT NOT NULL,"assignedUserId" TEXT NOT NULL,"calendarEventId" TEXT,"startsAt" TIMESTAMP(3) NOT NULL,"endsAt" TIMESTAMP(3) NOT NULL,
 "location" TEXT,"status" TEXT NOT NULL DEFAULT 'SCHEDULED',"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteLeadAppointment_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteLeadAppointment_leadId_startsAt_idx" ON "WebsiteLeadAppointment"("leadId","startsAt");
CREATE INDEX "WebsiteLeadAppointment_assignedUserId_startsAt_idx" ON "WebsiteLeadAppointment"("assignedUserId","startsAt");

CREATE TABLE "WebsiteCampaign" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"name" TEXT NOT NULL,"code" TEXT NOT NULL,"source" TEXT,"medium" TEXT,"startsAt" TIMESTAMP(3),"endsAt" TIMESTAMP(3),
 "active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WebsiteCampaign_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsiteCampaign_firmId_code_key" ON "WebsiteCampaign"("firmId","code");

CREATE TABLE "WebsiteAttributionTouch" (
 "id" TEXT NOT NULL,"leadId" TEXT NOT NULL,"campaignId" TEXT,"source" TEXT,"medium" TEXT,"campaign" TEXT,"term" TEXT,"content" TEXT,"referrer" TEXT,
 "landingPage" TEXT,"occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WebsiteAttributionTouch_pkey" PRIMARY KEY("id")
);
CREATE INDEX "WebsiteAttributionTouch_leadId_occurredAt_idx" ON "WebsiteAttributionTouch"("leadId","occurredAt");

CREATE TABLE "WebsitePublishRelease" (
 "id" TEXT NOT NULL,"firmId" TEXT NOT NULL,"version" INTEGER NOT NULL,"status" "WebsiteReleaseStatus" NOT NULL DEFAULT 'QUEUED',"requestedById" TEXT,
 "manifest" JSONB NOT NULL DEFAULT '{}',"error" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"startedAt" TIMESTAMP(3),"publishedAt" TIMESTAMP(3),
 CONSTRAINT "WebsitePublishRelease_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "WebsitePublishRelease_firmId_version_key" ON "WebsitePublishRelease"("firmId","version");
CREATE INDEX "WebsitePublishRelease_firmId_status_createdAt_idx" ON "WebsitePublishRelease"("firmId","status","createdAt");

-- Existing KKA core-table foreign keys.
ALTER TABLE "WebsiteSiteSettings" ADD CONSTRAINT "WebsiteSiteSettings_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteMediaAsset" ADD CONSTRAINT "WebsiteMediaAsset_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteMediaAsset" ADD CONSTRAINT "WebsiteMediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteProfessionalProfile" ADD CONSTRAINT "WebsiteProfessionalProfile_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteProfessionalProfile" ADD CONSTRAINT "WebsiteProfessionalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteProfessionalProfile" ADD CONSTRAINT "WebsiteProfessionalProfile_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "WebsiteMediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsitePracticeArea" ADD CONSTRAINT "WebsitePracticeArea_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePage" ADD CONSTRAINT "WebsitePage_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePage" ADD CONSTRAINT "WebsitePage_heroAssetId_fkey" FOREIGN KEY ("heroAssetId") REFERENCES "WebsiteMediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsitePageVersion" ADD CONSTRAINT "WebsitePageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WebsitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePageVersion" ADD CONSTRAINT "WebsitePageVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteBlock" ADD CONSTRAINT "WebsiteBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WebsitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePublication" ADD CONSTRAINT "WebsitePublication_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePublication" ADD CONSTRAINT "WebsitePublication_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "WebsiteMediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsitePublication" ADD CONSTRAINT "WebsitePublication_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "WebsiteProfessionalProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsitePublicationVersion" ADD CONSTRAINT "WebsitePublicationVersion_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "WebsitePublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePublicationVersion" ADD CONSTRAINT "WebsitePublicationVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteTestimonial" ADD CONSTRAINT "WebsiteTestimonial_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteMetric" ADD CONSTRAINT "WebsiteMetric_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteFormDefinition" ADD CONSTRAINT "WebsiteFormDefinition_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteFormSubmission" ADD CONSTRAINT "WebsiteFormSubmission_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteFormSubmission" ADD CONSTRAINT "WebsiteFormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "WebsiteFormDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteFormSubmission" ADD CONSTRAINT "WebsiteFormSubmission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "WebsiteLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadEvent" ADD CONSTRAINT "WebsiteLeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "WebsiteLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadEvent" ADD CONSTRAINT "WebsiteLeadEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadAssignment" ADD CONSTRAINT "WebsiteLeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "WebsiteLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadAssignment" ADD CONSTRAINT "WebsiteLeadAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadAssignment" ADD CONSTRAINT "WebsiteLeadAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadContactAttempt" ADD CONSTRAINT "WebsiteLeadContactAttempt_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "WebsiteLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadContactAttempt" ADD CONSTRAINT "WebsiteLeadContactAttempt_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadAppointment" ADD CONSTRAINT "WebsiteLeadAppointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "WebsiteLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteLeadAppointment" ADD CONSTRAINT "WebsiteLeadAppointment_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebsiteCampaign" ADD CONSTRAINT "WebsiteCampaign_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteAttributionTouch" ADD CONSTRAINT "WebsiteAttributionTouch_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "WebsiteLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteAttributionTouch" ADD CONSTRAINT "WebsiteAttributionTouch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "WebsiteCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsitePublishRelease" ADD CONSTRAINT "WebsitePublishRelease_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsitePublishRelease" ADD CONSTRAINT "WebsitePublishRelease_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One-to-one relation constraints required by Prisma
CREATE UNIQUE INDEX "WebsiteProfessionalProfile_userId_key"
ON "WebsiteProfessionalProfile"("userId");

CREATE UNIQUE INDEX "WebsiteLead_intakeId_key"
ON "WebsiteLead"("intakeId");
