import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@kka/database';
import type { RequestUser } from '../../platform/auth/auth.types';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { AuditService } from '../../platform/audit/audit.service';
import {
  SaveFormSchema, SaveMetricSchema, SavePageSchema, SavePracticeAreaSchema,
  SaveProfileSchema, SavePublicationSchema, SaveTestimonialSchema, SiteSettingsSchema
} from './website.schemas';
import { slugify } from './website.utils';

@Injectable()
export class WebsiteAdminService {
  constructor(private readonly prisma:PrismaService,private readonly audit:AuditService) {}

  async dashboard(user:RequestUser) {
    const since = new Date(Date.now()-30*86400000);
    const [pages,publications,professionals,practiceAreas,openLeads,submissions30d,media,pendingReview,scheduled] = await Promise.all([
      this.prisma.client.websitePage.count({ where:{ firmId:user.firmId } }),
      this.prisma.client.websitePublication.count({ where:{ firmId:user.firmId } }),
      this.prisma.client.websiteProfessionalProfile.count({ where:{ firmId:user.firmId } }),
      this.prisma.client.websitePracticeArea.count({ where:{ firmId:user.firmId } }),
      this.prisma.client.websiteLead.count({ where:{ firmId:user.firmId,status:{ notIn:['CONVERTED','DECLINED','DUPLICATE','OUT_OF_SCOPE','CONFLICT'] } } }),
      this.prisma.client.websiteFormSubmission.count({ where:{ firmId:user.firmId,createdAt:{ gte:since } } }),
      this.prisma.client.websiteMediaAsset.count({ where:{ firmId:user.firmId } }),
      this.prisma.client.websitePublication.count({ where:{ firmId:user.firmId,status:'IN_REVIEW' } }),
      this.prisma.client.websitePublication.count({ where:{ firmId:user.firmId,status:'SCHEDULED' } }),
    ]);
    return { pages,publications,professionals,practiceAreas,openLeads,submissions30d,media,pendingReview,scheduled };
  }

  settings(user:RequestUser){ return this.prisma.client.websiteSiteSettings.findUnique({ where:{ firmId:user.firmId } }); }
  async saveSettings(user:RequestUser,raw:unknown) {
    const input=SiteSettingsSchema.parse(raw);
    const settings=await this.prisma.client.websiteSiteSettings.upsert({
      where:{ firmId:user.firmId }, update:input, create:{ firmId:user.firmId,...input }
    });
    await this.audit.record({ firmId:user.firmId,actorUserId:user.id,action:'website.settings_changed',entityType:'website_site_settings',entityId:settings.id,metadata:{ fields:Object.keys(input) } });
    return settings;
  }

  listPages(user:RequestUser){ return this.prisma.client.websitePage.findMany({ where:{ firmId:user.firmId },include:{ heroAsset:true,_count:{ select:{ versions:true,blocks:true } } },orderBy:{ updatedAt:'desc' } }); }
  async page(user:RequestUser,id:string){ const p=await this.prisma.client.websitePage.findFirst({ where:{ id,firmId:user.firmId },include:{ heroAsset:true,blocks:{ orderBy:{ displayOrder:'asc' } },versions:{ orderBy:{ version:'desc' },take:50 } } });if(!p)throw new NotFoundException('Website page not found');return p; }
  async savePage(user:RequestUser,raw:unknown){
    const input=SavePageSchema.parse(raw);const slug=slugify(input.slug||input.title);
    const result=await this.prisma.client.$transaction(async tx=>{
      const existing=input.id?await tx.websitePage.findFirst({where:{id:input.id,firmId:user.firmId}}):null;
      if(input.id&&!existing)throw new NotFoundException('Website page not found');
      const scheduledFor=input.scheduledFor?new Date(input.scheduledFor):null;
      const effectiveStatus=input.status==='SCHEDULED'&&!scheduledFor?'DRAFT':input.status;
      const data={slug,title:input.title,description:input.description,status:effectiveStatus,seo:input.seo,heroAssetId:input.heroAssetId||null,scheduledFor,publishedAt:effectiveStatus==='PUBLISHED'?(existing?.publishedAt||new Date()):existing?.publishedAt||null};
      const page=existing?await tx.websitePage.update({where:{id:existing.id},data}):await tx.websitePage.create({data:{firmId:user.firmId,...data,currentVersion:0}});
      const version=(existing?.currentVersion||0)+1;
      await tx.websitePageVersion.create({data:{pageId:page.id,version,title:page.title,description:page.description,seo:page.seo ?? Prisma.JsonNull,snapshot:{heroAssetId:page.heroAssetId,scheduledFor:page.scheduledFor?.toISOString() ?? null,blocks:input.blocks},createdById:user.id}});
      await tx.websiteBlock.deleteMany({where:{pageId:page.id}});
      if(input.blocks.length)await tx.websiteBlock.createMany({data:input.blocks.map((b,i)=>({pageId:page.id,blockType:b.blockType,variant:b.variant,displayOrder:i,theme:b.theme,content:b.content,settings:b.settings,visible:b.visible}))});
      return tx.websitePage.update({where:{id:page.id},data:{currentVersion:version},include:{blocks:{orderBy:{displayOrder:'asc'}}}});
    });
    await this.audit.record({firmId:user.firmId,actorUserId:user.id,action:'website.page_saved',entityType:'website_page',entityId:result.id,metadata:{slug:result.slug,status:result.status,version:result.currentVersion}});
    return result;
  }
  async restorePageVersion(user:RequestUser,id:string,version:number){
    const current=await this.page(user,id);const v=current.versions.find(x=>x.version===version);if(!v)throw new NotFoundException('Page version not found');
    const snapshot=v.snapshot as any;return this.savePage(user,{id:current.id,slug:current.slug,title:v.title,description:v.description,status:'DRAFT',seo:v.seo,heroAssetId:snapshot?.heroAssetId||null,blocks:snapshot?.blocks||[]});
  }
  async deletePage(user:RequestUser,id:string){const p=await this.page(user,id);await this.prisma.client.websitePage.delete({where:{id:p.id}});await this.audit.record({firmId:user.firmId,actorUserId:user.id,action:'website.page_deleted',entityType:'website_page',entityId:id,metadata:{slug:p.slug}});return{ok:true};}

  listProfiles(user:RequestUser){return this.prisma.client.websiteProfessionalProfile.findMany({where:{firmId:user.firmId},include:{image:true,user:{select:{id:true,fullName:true,email:true}}},orderBy:[{displayOrder:'asc'},{name:'asc'}]});}
  async saveProfile(user:RequestUser,raw:unknown){const input=SaveProfileSchema.parse(raw);const data={userId:input.userId||null,slug:slugify(input.slug||input.name),name:input.name,title:input.title,summary:input.summary,bio:input.bio,imageId:input.imageId||null,email:input.email||null,phone:input.phone||null,practiceAreaSlugs:input.practiceAreaSlugs,credentials:input.credentials,memberships:input.memberships,education:input.education,featured:input.featured,displayOrder:input.displayOrder,status:input.status,publishedAt:input.status==='PUBLISHED'?new Date():null};const record=input.id?await this.updateScoped('websiteProfessionalProfile',user,input.id,data):await this.prisma.client.websiteProfessionalProfile.create({data:{firmId:user.firmId,...data}});await this.auditCms(user,'profile_saved',record.id,{slug:record.slug,status:record.status});return record;}
  async deleteProfile(user:RequestUser,id:string){await this.ensureScope('websiteProfessionalProfile',user,id);await this.prisma.client.websiteProfessionalProfile.delete({where:{id}});await this.auditCms(user,'profile_deleted',id);return{ok:true};}

  listPracticeAreas(user:RequestUser){return this.prisma.client.websitePracticeArea.findMany({where:{firmId:user.firmId},orderBy:[{displayOrder:'asc'},{title:'asc'}]});}
  async savePracticeArea(user:RequestUser,raw:unknown){const input=SavePracticeAreaSchema.parse(raw);const data={slug:slugify(input.slug||input.title),title:input.title,summary:input.summary,description:input.description,icon:input.icon,services:input.services,faqs:input.faqs,featured:input.featured,displayOrder:input.displayOrder,status:input.status,publishedAt:input.status==='PUBLISHED'?new Date():null};const record=input.id?await this.updateScoped('websitePracticeArea',user,input.id,data):await this.prisma.client.websitePracticeArea.create({data:{firmId:user.firmId,...data}});await this.auditCms(user,'practice_area_saved',record.id,{slug:record.slug,status:record.status});return record;}
  async deletePracticeArea(user:RequestUser,id:string){await this.ensureScope('websitePracticeArea',user,id);await this.prisma.client.websitePracticeArea.delete({where:{id}});await this.auditCms(user,'practice_area_deleted',id);return{ok:true};}

  listPublications(user:RequestUser){return this.prisma.client.websitePublication.findMany({where:{firmId:user.firmId},include:{cover:true,author:true,_count:{select:{versions:true}}},orderBy:{updatedAt:'desc'}});}
  async publication(user:RequestUser,id:string){const p=await this.prisma.client.websitePublication.findFirst({where:{id,firmId:user.firmId},include:{cover:true,author:true,versions:{orderBy:{version:'desc'},take:50}}});if(!p)throw new NotFoundException('Publication not found');return p;}
  async savePublication(user:RequestUser,raw:unknown){const input=SavePublicationSchema.parse(raw);const existing=input.id?await this.prisma.client.websitePublication.findFirst({where:{id:input.id,firmId:user.firmId}}):null;if(input.id&&!existing)throw new NotFoundException('Publication not found');const scheduledFor=input.scheduledFor?new Date(input.scheduledFor):null;const effectiveStatus=input.status==='SCHEDULED'&&!scheduledFor?'DRAFT':input.status;const data={slug:slugify(input.slug||input.title),kind:input.kind,title:input.title,excerpt:input.excerpt,body:input.body,coverId:input.coverId||null,authorProfileId:input.authorProfileId||null,duration:input.duration||null,practiceAreaSlugs:input.practiceAreaSlugs,tags:input.tags,status:effectiveStatus,seo:input.seo,scheduledFor,publishedAt:effectiveStatus==='PUBLISHED'?(existing?.publishedAt||new Date()):existing?.publishedAt||null};const record=await this.prisma.client.$transaction(async tx=>{const p=existing?await tx.websitePublication.update({where:{id:existing.id},data}):await tx.websitePublication.create({data:{firmId:user.firmId,...data,currentVersion:0}});const version=(existing?.currentVersion||0)+1;await tx.websitePublicationVersion.create({data:{publicationId:p.id,version,title:p.title,excerpt:p.excerpt,body:p.body,seo:p.seo ?? Prisma.JsonNull,snapshot:{coverId:p.coverId,authorProfileId:p.authorProfileId,duration:p.duration,practiceAreaSlugs:p.practiceAreaSlugs,tags:p.tags,status:p.status,scheduledFor:p.scheduledFor?.toISOString() ?? null},createdById:user.id}});return tx.websitePublication.update({where:{id:p.id},data:{currentVersion:version}});});await this.auditCms(user,'publication_saved',record.id,{slug:record.slug,status:record.status,version:record.currentVersion});return record;}
  async restorePublicationVersion(user:RequestUser,id:string,version:number){const current=await this.publication(user,id);const v=current.versions.find(x=>x.version===version);if(!v)throw new NotFoundException('Publication version not found');const s=v.snapshot as any;return this.savePublication(user,{id:current.id,slug:current.slug,kind:current.kind,title:v.title,excerpt:v.excerpt,body:v.body,coverId:s?.coverId,authorProfileId:s?.authorProfileId,duration:s?.duration,practiceAreaSlugs:s?.practiceAreaSlugs||[],tags:s?.tags||[],status:'DRAFT',seo:v.seo});}
  async deletePublication(user:RequestUser,id:string){await this.publication(user,id);await this.prisma.client.websitePublication.delete({where:{id}});await this.auditCms(user,'publication_deleted',id);return{ok:true};}

  listTestimonials(user:RequestUser){return this.prisma.client.websiteTestimonial.findMany({where:{firmId:user.firmId},orderBy:[{displayOrder:'asc'},{createdAt:'asc'}]});}
  async saveTestimonial(user:RequestUser,raw:unknown){const input=SaveTestimonialSchema.parse(raw);const {id,...data}=input;const r=id?await this.updateScoped('websiteTestimonial',user,id,data):await this.prisma.client.websiteTestimonial.create({data:{firmId:user.firmId,...data}});await this.auditCms(user,'testimonial_saved',r.id);return r;}
  async deleteTestimonial(user:RequestUser,id:string){await this.ensureScope('websiteTestimonial',user,id);await this.prisma.client.websiteTestimonial.delete({where:{id}});await this.auditCms(user,'testimonial_deleted',id);return{ok:true};}

  listMetrics(user:RequestUser){return this.prisma.client.websiteMetric.findMany({where:{firmId:user.firmId},orderBy:[{displayOrder:'asc'},{createdAt:'asc'}]});}
  async saveMetric(user:RequestUser,raw:unknown){const input=SaveMetricSchema.parse(raw);const{id,...rest}=input;const data={...rest,verifiedAt:rest.verifiedAt?new Date(rest.verifiedAt):null};const r=id?await this.updateScoped('websiteMetric',user,id,data):await this.prisma.client.websiteMetric.create({data:{firmId:user.firmId,...data}});await this.auditCms(user,'metric_saved',r.id);return r;}
  async deleteMetric(user:RequestUser,id:string){await this.ensureScope('websiteMetric',user,id);await this.prisma.client.websiteMetric.delete({where:{id}});await this.auditCms(user,'metric_deleted',id);return{ok:true};}

  listForms(user:RequestUser){return this.prisma.client.websiteFormDefinition.findMany({where:{firmId:user.firmId},include:{_count:{select:{submissions:true}}},orderBy:{name:'asc'}});}
  async saveForm(user:RequestUser,raw:unknown){const input=SaveFormSchema.parse(raw);const{id,...rest}=input;const data={...rest,key:slugify(rest.key)};const r=id?await this.updateScoped('websiteFormDefinition',user,id,data):await this.prisma.client.websiteFormDefinition.create({data:{firmId:user.firmId,...data}});await this.auditCms(user,'form_saved',r.id,{key:r.key});return r;}
  async deleteForm(user:RequestUser,id:string){await this.ensureScope('websiteFormDefinition',user,id);const count=await this.prisma.client.websiteFormSubmission.count({where:{formId:id}});if(count)throw new BadRequestException('Forms with submissions cannot be deleted; disable the form instead');await this.prisma.client.websiteFormDefinition.delete({where:{id}});await this.auditCms(user,'form_deleted',id);return{ok:true};}

  private async ensureScope(model:string,user:RequestUser,id:string){const delegate=(this.prisma.client as any)[model];const record=await delegate.findFirst({where:{id,firmId:user.firmId}});if(!record)throw new NotFoundException('Website record not found');return record;}
  private async updateScoped(model:string,user:RequestUser,id:string,data:any){await this.ensureScope(model,user,id);return (this.prisma.client as any)[model].update({where:{id},data});}
  private auditCms(user:RequestUser,action:string,entityId:string,metadata:any={}){return this.audit.record({firmId:user.firmId,actorUserId:user.id,action:`website.${action}`,entityType:'website_content',entityId,metadata});}
}
