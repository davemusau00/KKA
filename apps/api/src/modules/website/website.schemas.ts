import { z } from 'zod';

export const ContentStatusSchema = z.enum(['DRAFT','IN_REVIEW','APPROVED','SCHEDULED','PUBLISHED','ARCHIVED']);
export const PublicationKindSchema = z.enum(['ARTICLE','VIDEO']);
export const LeadStatusSchema = z.enum(['NEW','REVIEWING','CONTACTED','CONSULTATION_BOOKED','CONSULTED','QUALIFIED','INTAKE_STARTED','CONVERTED','DECLINED','DUPLICATE','NO_RESPONSE','CONFLICT','OUT_OF_SCOPE']);
export const LeadPrioritySchema = z.enum(['LOW','NORMAL','HIGH','URGENT']);

export { PublicLeadSchema } from '@kka/contracts';
import { PublicLeadSchema } from '@kka/contracts';

const SeoSchema = z.object({
  title: z.string().max(180).optional(),
  description: z.string().max(400).optional(),
  canonical: z.string().url().optional().or(z.literal('')),
  imageId: z.string().optional().or(z.literal('')),
  noindex: z.boolean().optional(),
}).catchall(z.json());

export const SiteSettingsSchema = z.object({
  firmName: z.string().min(2).max(250),
  tagline: z.string().max(300),
  phone: z.string().max(120),
  email: z.string().email(),
  address: z.string().max(800),
  socials: z.array(z.object({ label:z.string().max(60), url:z.string().max(500) })).max(20),
  navigation: z.array(z.object({ label:z.string().max(80), url:z.string().max(500) })).max(30),
  footer: z.record(z.string(), z.json()).default({}),
  defaultSeo: SeoSchema.default({}),
  theme: z.record(z.string(), z.json()).default({}),
});

export const SiteBlockSchema = z.object({
  id: z.string().optional(),
  blockType: z.enum(['HERO','RICH_TEXT','QUOTE','IMAGE_TEXT','PRACTICE_GRID','PROFESSIONAL_GRID','INSIGHTS_GRID','METRICS','FAQ','CTA','SPACER','HERO_JUSTICE','FIRM_INTRODUCTION','PARTNER_LEADERSHIP','MEDIA_FEATURE','TEAM_FEATURE','TESTIMONIALS','CONSULTATION']),
  variant: z.string().max(80).default('default'),
  theme: z.enum(['light','ivory','dark','gold']).default('light'),
  content: z.record(z.string(), z.json()).default({}),
  settings: z.record(z.string(), z.json()).default({}),
  visible: z.boolean().default(true),
});

export const SavePageSchema = z.object({
  currentVersion: z.number().int().min(0).optional(),
  id: z.string().optional(),
  slug: z.string().max(180).optional(),
  title: z.string().min(2).max(250),
  description: z.string().max(1000).default(''),
  status: ContentStatusSchema.default('DRAFT'),
  seo: SeoSchema.default({}),
  heroAssetId: z.string().nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  blocks: z.array(SiteBlockSchema).max(80).default([]),
});

export const SaveProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string().nullable().optional(),
  slug: z.string().max(180).optional(),
  name: z.string().min(2).max(250),
  title: z.string().min(2).max(160),
  summary: z.string().max(1200).default(''),
  bio: z.string().max(30000).default(''),
  imageId: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().max(80).nullable().optional(),
  practiceAreaSlugs: z.array(z.string().max(180)).max(60).default([]),
  credentials: z.array(z.string().max(300)).max(80).default([]),
  memberships: z.array(z.string().max(300)).max(80).default([]),
  education: z.array(z.string().max(300)).max(80).default([]),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(10000).default(0),
  status: ContentStatusSchema.default('DRAFT'),
});

export const SavePracticeAreaSchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(180).optional(),
  title: z.string().min(2).max(250),
  summary: z.string().max(1200).default(''),
  description: z.string().max(30000).default(''),
  icon: z.string().max(80).default('scale'),
  services: z.array(z.string().max(500)).max(100).default([]),
  faqs: z.array(z.object({ q:z.string().max(500), a:z.string().max(5000) })).max(80).default([]),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(10000).default(0),
  status: ContentStatusSchema.default('DRAFT'),
});

export const SavePublicationSchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(180).optional(),
  kind: PublicationKindSchema.default('ARTICLE'),
  title: z.string().min(2).max(300),
  excerpt: z.string().max(1600).default(''),
  body: z.string().max(150000).default(''),
  coverId: z.string().nullable().optional(),
  authorProfileId: z.string().nullable().optional(),
  duration: z.string().max(40).nullable().optional(),
  practiceAreaSlugs: z.array(z.string().max(180)).max(80).default([]),
  tags: z.array(z.string().max(120)).max(100).default([]),
  status: ContentStatusSchema.default('DRAFT'),
  seo: SeoSchema.default({}),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export const SaveTestimonialSchema = z.object({
  id:z.string().optional(), title:z.string().min(2).max(300), quote:z.string().min(4).max(6000),
  source:z.string().max(250).default('Client testimonial'), rating:z.coerce.number().int().min(1).max(5).default(5),
  featured:z.boolean().default(true), displayOrder:z.coerce.number().int().min(0).default(0), status:ContentStatusSchema.default('DRAFT')
});

export const SaveMetricSchema = z.object({
  id:z.string().optional(), value:z.string().min(1).max(80), label:z.string().min(2).max(180), icon:z.string().max(80).default('award'),
  sourceNote:z.string().max(1000).nullable().optional(), verifiedAt:z.string().datetime().nullable().optional(),
  displayOrder:z.coerce.number().int().min(0).default(0), status:ContentStatusSchema.default('PUBLISHED')
});

export const SaveFormSchema = z.object({
  id:z.string().optional(), key:z.string().min(2).max(120), name:z.string().min(2).max(200),
  schema:z.record(z.string(),z.json()).default({}), routing:z.record(z.string(),z.json()).default({}),
  consentText:z.string().min(8).max(3000), active:z.boolean().default(true), version:z.coerce.number().int().min(1).default(1)
});

export const UpdateLeadSchema = z.object({
  status: LeadStatusSchema.optional(),
  priority: LeadPrioritySchema.optional(),
  dispositionReason: z.string().max(3000).nullable().optional(),
});
export const AssignLeadSchema = z.object({ userId:z.string().min(1), reason:z.string().max(1000).optional() });
export const ContactAttemptSchema = z.object({ channel:z.enum(['PHONE','EMAIL','WHATSAPP','SMS','IN_PERSON']), direction:z.enum(['INBOUND','OUTBOUND']), outcome:z.string().min(2).max(250), notes:z.string().max(3000).optional() });
export const AppointmentSchema = z.object({ startsAt:z.string().datetime(), endsAt:z.string().datetime(), location:z.string().max(500).optional(), notes:z.string().max(3000).optional(), assignedUserId:z.string().min(1) });
export const MediaMetadataSchema = z.object({ alt:z.string().min(1).max(600), caption:z.string().max(2000).optional(), credit:z.string().max(500).optional(), focalX:z.coerce.number().min(0).max(1).default(.5), focalY:z.coerce.number().min(0).max(1).default(.5) });
