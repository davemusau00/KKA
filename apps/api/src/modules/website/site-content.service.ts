import { Injectable, NotFoundException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import type { SiteSnapshot } from '@kka/contracts';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { publicAssetUrl, publicFirmId } from './website.utils';
import { normalizePublicFormFields } from './website.schemas';

/** Public reads never query mutable editorial records. */
@Injectable()
export class SiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  async active(firmId = publicFirmId(), client: any = this.prisma.client) {
    const releases = await client.websitePublishRelease.findMany({where:{firmId,status:'PUBLISHED'},orderBy:{version:'desc'}});
    return releases.find((r:any) => r.manifest?.schemaVersion === 1 && r.manifest?.snapshot && r.manifest?.artifact) ?? null;
  }
  async snapshot() {
    const release = await this.active();
    if (!release) throw new ServiceUnavailableException('The website has no completed release yet.');
    return release.manifest.snapshot as SiteSnapshot;
  }
  async bootstrap() { const s=await this.snapshot(); return {...s.bootstrap,pages:s.pages}; }
  async page(slug:string) { return this.required((await this.snapshot()).pages.find(p=>p.slug===(slug==='/'?'home':slug)), 'Page'); }
  async partner(slug:string) { return this.required((await this.snapshot()).bootstrap.partners.find(p=>p.slug===slug), 'Professional'); }
  async practice(slug:string) { return this.required((await this.snapshot()).bootstrap.practiceAreas.find(p=>p.slug===slug), 'Practice area'); }
  async publication(slug:string) { return this.required((await this.snapshot()).bootstrap.publications.find(p=>p.slug===slug), 'Publication'); }
  private required<T>(value:T|undefined, kind:string):T { if(!value) throw new NotFoundException(`${kind} not found`); return value; }
  async search(q:string) {
    const query=q.trim().toLocaleLowerCase(); if(query.length<2)return [];
    const {bootstrap:b,pages}=await this.snapshot();
    const items=[
      ...b.practiceAreas.map(p=>({type:'Practice Area',title:p.title,url:`/practice-areas/${p.slug}`,excerpt:p.summary,body:p.description+' '+JSON.stringify(p.faqs)})),
      ...b.partners.map(p=>({type:'Professional',title:p.name,url:`/team/${p.slug}`,excerpt:p.summary,body:p.bio})),
      ...b.publications.map(p=>({type:p.kind==='VIDEO'?'Video':'Insight',title:p.title,url:`/insights/${p.slug}`,excerpt:p.excerpt,body:p.body})),
      ...pages.filter(p=>!p.seo?.noindex).map(p=>({type:'Page',title:p.title,url:p.slug==='home'?'/':`/${p.slug}`,excerpt:p.description,body:JSON.stringify(p.blocks)}))
    ];
    return items.filter(p=>`${p.title} ${p.excerpt} ${p.body}`.toLocaleLowerCase().includes(query)).slice(0,40).map(({body,...p})=>p);
  }
  async media(id:string) {
    const releases=await this.prisma.client.websitePublishRelease.findMany({where:{firmId:publicFirmId(),status:{in:['PUBLISHED','ROLLED_BACK']}}});
    if(!releases.some((r:any)=>r.manifest?.snapshot?.mediaIds?.includes(id)))throw new NotFoundException('Released media not found');
    return this.required(await this.prisma.client.websiteMediaAsset.findFirst({where:{id,firmId:publicFirmId()}}) ?? undefined,'Media');
  }

  /** Called inside the publisher's repeatable-read transaction. Draft edits retain the prior public revision. */
  async capture(firmId:string, client:any = this.prisma.client, preview=false):Promise<SiteSnapshot> {
    const previous=(await this.active(firmId,client))?.manifest?.snapshot as SiteSnapshot|undefined;
    const now=new Date();
    const [settings,profiles,areas,publications,testimonials,metrics,pages,forms,media]=await Promise.all([
      client.websiteSiteSettings.findUnique({where:{firmId}}),
      client.websiteProfessionalProfile.findMany({where:{firmId},include:{image:true},orderBy:{displayOrder:'asc'}}),
      client.websitePracticeArea.findMany({where:{firmId},orderBy:{displayOrder:'asc'}}),
      client.websitePublication.findMany({where:{firmId},include:{cover:true,author:{include:{image:true}}},orderBy:{publishedAt:'desc'}}),
      client.websiteTestimonial.findMany({where:{firmId},orderBy:{displayOrder:'asc'}}),
      client.websiteMetric.findMany({where:{firmId},orderBy:{displayOrder:'asc'}}),
      client.websitePage.findMany({where:{firmId},include:{heroAsset:true,blocks:{where:{visible:true},orderBy:{displayOrder:'asc'}}}}),
      client.websiteFormDefinition.findMany({where:{firmId,active:true}}),
      client.websiteMediaAsset.findMany({where:{firmId}})
    ]);
    if(!settings)throw new BadRequestException('Configure website settings before publishing.');
    const merge=(rows:any[],old:any[]=[],map:(r:any)=>any)=>rows.flatMap(r=>{
      if(r.status==='ARCHIVED')return [];
      const due=r.status==='SCHEDULED' && r.scheduledFor && r.scheduledFor<=now;
      const publishable=['APPROVED','PUBLISHED'].includes(r.status) && (!r.publishedAt || r.publishedAt<=now);
      const value=preview||due||publishable?map(r):old.find(p=>p.id===r.id);
      return value?[value]:[];
    });
    const b=previous?.bootstrap;
    const snapshot:SiteSnapshot={schemaVersion:1,bootstrap:{
      settings:{firmName:settings.firmName,tagline:settings.tagline,phone:settings.phone,email:settings.email,address:settings.address,socials:settings.socials,navigation:settings.navigation,footer:settings.footer,defaultSeo:settings.defaultSeo,theme:settings.theme},
      partners:merge(profiles,b?.partners,p=>this.profileDto(p)),
      practiceAreas:merge(areas,b?.practiceAreas,p=>this.areaDto(p)),
      publications:merge(publications,b?.publications,p=>this.publicationDto(p)),
      testimonials:merge(testimonials,b?.testimonials,p=>({id:p.id,title:p.title,quote:p.quote,source:p.source,rating:p.rating})),
      metrics:merge(metrics,b?.metrics,p=>({id:p.id,value:p.value,label:p.label,icon:p.icon,sourceNote:p.sourceNote,verifiedAt:p.verifiedAt})),
      forms:forms.map((f:any)=>({id:f.id,key:f.key,version:f.version,consentText:f.consentText,fields:normalizePublicFormFields(f.schema)}))
    },pages:merge(pages,previous?.pages,p=>({id:p.id,slug:p.slug,title:p.title,description:p.description,seo:p.seo,heroAsset:p.heroAsset?this.assetDto(p.heroAsset):null,blocks:p.blocks.map((x:any)=>({id:x.id,blockType:x.blockType,variant:x.variant,theme:x.theme,content:x.content,settings:x.settings}))})),mediaIds:[]};
    // Resolve block asset IDs through the same firm-scoped DTO map; never trust a browser-supplied asset object.
    const mediaMap=new Map(media.map((m:any)=>[m.id,m]));
    const asset=(id:string)=>{const m=mediaMap.get(id);if(!m)throw new BadRequestException('Referenced media must belong to this firm');return this.assetDto(m);};
    for(const p of snapshot.pages)for(const block of p.blocks){
      const c=block.content;
      if(c.assetId)c.asset=asset(c.assetId);
      if(c.videoAssetId)c.videoUrl=asset(c.videoAssetId).url;
    }
    const json=JSON.stringify(snapshot);
    snapshot.mediaIds=media.filter((m:any)=>json.includes(JSON.stringify(m.id)) || json.includes(`/media/${m.id}`)).map((m:any)=>m.id);
    for(const p of snapshot.bootstrap.partners)if(p.image && !mediaMap.has(p.image.id))throw new BadRequestException('Profile image belongs to another firm');
    for(const p of snapshot.bootstrap.publications)if(p.cover && !mediaMap.has(p.cover.id))throw new BadRequestException('Publication cover belongs to another firm');
    return JSON.parse(JSON.stringify(snapshot));
  }
  private assetDto(asset: any) {
    return {
      id:asset.id, url:publicAssetUrl(asset.id, asset.checksum), alt:asset.alt, caption:asset.caption,
      credit:asset.credit, mimeType:asset.mimeType, width:asset.width, height:asset.height,
      focalX:asset.focalX, focalY:asset.focalY, variants:Object.fromEntries(Object.entries(asset.variants||{}).map(([key,v]:[string,any])=>[key,{width:v.width,height:v.height,mimeType:v.mimeType,url:publicAssetUrl(asset.id,asset.checksum)+(asset.checksum?'&':'?')+'variant='+encodeURIComponent(key)}]))
    };
  }

  private profileDto(p: any) {
    return {
      id:p.id, slug:p.slug, name:p.name, title:p.title, summary:p.summary, bio:p.bio,
      image:p.image ? this.assetDto(p.image) : null, email:p.email, phone:p.phone,
      practiceAreas:p.practiceAreaSlugs, credentials:p.credentials, memberships:p.memberships,
      education:p.education, featured:p.featured, order:p.displayOrder
    };
  }

  private areaDto(a: any) {
    return {
      id:a.id, slug:a.slug, title:a.title, summary:a.summary, description:a.description,
      icon:a.icon, services:a.services, faqs:Array.isArray(a.faqs) ? a.faqs : [], featured:a.featured, order:a.displayOrder
    };
  }

  private publicationDto(p: any) {
    return {
      id:p.id, slug:p.slug, kind:p.kind, title:p.title, excerpt:p.excerpt, body:p.body,
      cover:p.cover ? this.assetDto(p.cover) : null,
      publishedAt:(p.publishedAt ?? p.createdAt).toISOString(),
      author:p.author && p.author.firmId === p.firmId && ['PUBLISHED','APPROVED'].includes(p.author.status) ? this.profileDto(p.author) : undefined,
      duration:p.duration ?? undefined, videoUrl:p.seo?.videoUrl, videoAssetId:p.seo?.videoAssetId, captionsUrl:p.seo?.captionsUrl, practiceAreas:p.practiceAreaSlugs, tags:p.tags, seo:p.seo
    };
  }
}
