import { z } from 'zod';
export type MediaAsset={id:string;url:string;alt:string;caption?:string|null;credit?:string|null;mimeType?:string;width?:number|null;height?:number|null;focalX?:number;focalY?:number;variants?:Record<string,unknown>};
export type Partner={id:string;slug:string;name:string;title:string;summary:string;bio:string;image:MediaAsset|null;email?:string|null;phone?:string|null;practiceAreas:string[];credentials:string[];memberships:string[];education:string[];featured:boolean;order:number};
export type PracticeArea={id:string;slug:string;title:string;summary:string;description:string;icon:string;services:string[];faqs:{q:string;a:string}[];featured:boolean;order:number};
export type Publication={id:string;slug:string;kind:'ARTICLE'|'VIDEO';title:string;excerpt:string;body:string;cover:MediaAsset|null;publishedAt:string;author?:Partner;duration?:string;videoUrl?:string;videoAssetId?:string;captionsUrl?:string;practiceAreas:string[];tags?:string[];seo?:Record<string,unknown>};
export type Testimonial={id:string;title:string;quote:string;source:string;rating:number};
export type Metric={id:string;value:string;label:string;icon:string;sourceNote?:string|null;verifiedAt?:string|null};
export type SiteSettings={firmName:string;tagline:string;phone:string;email:string;address:string;socials:{label:string;url:string}[];navigation?:{label:string;url:string}[];footer?:Record<string,unknown>;defaultSeo?:Record<string,unknown>;theme?:Record<string,unknown>};
export type SiteBlock={id?:string;blockType:'HERO'|'RICH_TEXT'|'QUOTE'|'IMAGE_TEXT'|'PRACTICE_GRID'|'PROFESSIONAL_GRID'|'INSIGHTS_GRID'|'METRICS'|'FAQ'|'CTA'|'SPACER'|'HERO_JUSTICE'|'FIRM_INTRODUCTION'|'PARTNER_LEADERSHIP'|'MEDIA_FEATURE'|'TEAM_FEATURE'|'TESTIMONIALS'|'CONSULTATION';variant:string;theme:'light'|'ivory'|'dark'|'gold';content:Record<string,any>;settings?:Record<string,any>};
export type Page={id:string;slug:string;title:string;description:string;blocks:SiteBlock[];seo:Record<string,any>;heroAsset?:MediaAsset|null};
export type SiteBootstrap={settings:SiteSettings;partners:Partner[];practiceAreas:PracticeArea[];publications:Publication[];testimonials:Testimonial[];metrics:Metric[];pages?:Page[];forms?:PublicForm[];releaseVersion?:number};
export type LeadInput={name:string;email?:string;phone:string;practiceAreaSlug?:string;message:string;consent:true;source?:string;landingPage?:string;utm?:Record<string,string>;website?:string};

export type PublicFormField={key:'name'|'email'|'phone'|'practiceAreaSlug'|'message'|'consent'|'website';label:string;helpText?:string;placeholder?:string;visible:boolean;required:boolean;order:number};
export type PublicForm={id:string;key:string;version:number;consentText:string;fields?:PublicFormField[]};
export type SiteSnapshot={schemaVersion:1;bootstrap:SiteBootstrap;pages:Page[];mediaIds:string[]};

export const PublicLeadSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(250).optional().or(z.literal('')),
  phone: z.string().trim().min(7).max(50),
  practiceAreaSlug: z.string().trim().max(160).optional().or(z.literal('')),
  message: z.string().trim().min(10).max(8000),
  consent: z.literal(true),
  source: z.string().trim().max(250).optional(),
  landingPage: z.string().trim().max(800).optional(),
  utm: z.object({
    utm_source: z.string().max(250).optional(),
    utm_medium: z.string().max(250).optional(),
    utm_campaign: z.string().max(250).optional(),
    utm_term: z.string().max(250).optional(),
    utm_content: z.string().max(250).optional(),
  }).optional(),
  idempotencyKey: z.string().uuid().optional(),
  formVersion: z.number().int().positive().optional(),
  website: z.string().max(200).optional(), // honeypot
});

