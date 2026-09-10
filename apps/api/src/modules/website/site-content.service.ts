import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { publicAssetUrl, publicFirmId } from './website.utils';

@Injectable()
export class SiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap() {
    const firmId = publicFirmId();
    const now = new Date();
    const [settings, profiles, areas, publications, testimonials, metrics] = await Promise.all([
      this.prisma.client.websiteSiteSettings.findUnique({ where: { firmId } }),
      this.prisma.client.websiteProfessionalProfile.findMany({
        where: { firmId, status: 'PUBLISHED', OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        include: { image: true }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
      }),
      this.prisma.client.websitePracticeArea.findMany({
        where: { firmId, status: 'PUBLISHED', OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }]
      }),
      this.prisma.client.websitePublication.findMany({
        where: { firmId, status: 'PUBLISHED', OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
        include: { cover: true, author: { include: { image: true } } },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }], take: 60
      }),
      this.prisma.client.websiteTestimonial.findMany({
        where: { firmId, status: 'PUBLISHED' }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }]
      }),
      this.prisma.client.websiteMetric.findMany({
        where: { firmId, status: 'PUBLISHED' }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }]
      })
    ]);
    if (!settings) throw new NotFoundException('Public website is not configured');
    return {
      settings: {
        firmName: settings.firmName, tagline: settings.tagline, phone: settings.phone,
        email: settings.email, address: settings.address, socials: settings.socials,
        navigation: settings.navigation, footer: settings.footer, defaultSeo: settings.defaultSeo, theme: settings.theme
      },
      partners: profiles.map(p => this.profileDto(p)),
      practiceAreas: areas.map(a => this.areaDto(a)),
      publications: publications.map(p => this.publicationDto(p)),
      testimonials: testimonials.map(t => ({ id:t.id, title:t.title, quote:t.quote, source:t.source, rating:t.rating })),
      metrics: metrics.map(m => ({ id:m.id, value:m.value, label:m.label, icon:m.icon, sourceNote:m.sourceNote, verifiedAt:m.verifiedAt }))
    };
  }

  async page(slug: string) {
    const normalized = slug === '' || slug === '/' ? 'home' : slug;
    const page = await this.prisma.client.websitePage.findFirst({
      where: { firmId: publicFirmId(), slug: normalized, status: 'PUBLISHED' },
      include: { heroAsset: true, blocks: { where: { visible: true }, orderBy: { displayOrder: 'asc' } } }
    });
    if (!page) throw new NotFoundException('Page not found');
    return {
      id: page.id, slug: page.slug, title: page.title, description: page.description, seo: page.seo,
      heroAsset: page.heroAsset ? this.assetDto(page.heroAsset) : null,
      blocks: page.blocks.map(b => ({ id:b.id, blockType:b.blockType, variant:b.variant, theme:b.theme, content:b.content, settings:b.settings }))
    };
  }

  async partner(slug: string) {
    const p = await this.prisma.client.websiteProfessionalProfile.findFirst({
      where: { firmId: publicFirmId(), slug, status: 'PUBLISHED' }, include: { image: true }
    });
    if (!p) throw new NotFoundException('Professional not found');
    return this.profileDto(p);
  }

  async practice(slug: string) {
    const area = await this.prisma.client.websitePracticeArea.findFirst({
      where: { firmId: publicFirmId(), slug, status: 'PUBLISHED' }
    });
    if (!area) throw new NotFoundException('Practice area not found');
    return this.areaDto(area);
  }

  async publication(slug: string) {
    const p = await this.prisma.client.websitePublication.findFirst({
      where: { firmId: publicFirmId(), slug, status: 'PUBLISHED' },
      include: { cover: true, author: { include: { image: true } } }
    });
    if (!p) throw new NotFoundException('Publication not found');
    return this.publicationDto(p);
  }

  async search(q: string) {
    const query = q.trim();
    if (query.length < 2) return [];
    const firmId = publicFirmId();
    const [areas, profiles, publications, pages] = await Promise.all([
      this.prisma.client.websitePracticeArea.findMany({
        where: { firmId, status:'PUBLISHED', OR:[
          { title:{ contains:query, mode:'insensitive' } }, { summary:{ contains:query, mode:'insensitive' } }, { description:{ contains:query, mode:'insensitive' } }
        ]}, take:8
      }),
      this.prisma.client.websiteProfessionalProfile.findMany({
        where: { firmId, status:'PUBLISHED', OR:[
          { name:{ contains:query, mode:'insensitive' } }, { summary:{ contains:query, mode:'insensitive' } }, { bio:{ contains:query, mode:'insensitive' } }
        ]}, take:8
      }),
      this.prisma.client.websitePublication.findMany({
        where: { firmId, status:'PUBLISHED', OR:[
          { title:{ contains:query, mode:'insensitive' } }, { excerpt:{ contains:query, mode:'insensitive' } }, { body:{ contains:query, mode:'insensitive' } }
        ]}, take:12, orderBy:{ publishedAt:'desc' }
      }),
      this.prisma.client.websitePage.findMany({
        where: { firmId, status:'PUBLISHED', OR:[
          { title:{ contains:query, mode:'insensitive' } }, { description:{ contains:query, mode:'insensitive' } }
        ]}, take:8
      })
    ]);
    return [
      ...areas.map(x => ({ type:'Practice Area', title:x.title, url:`/practice-areas/${x.slug}`, excerpt:x.summary })),
      ...profiles.map(x => ({ type:'Professional', title:x.name, url:`/team/${x.slug}`, excerpt:x.summary })),
      ...publications.map(x => ({ type:x.kind === 'VIDEO' ? 'Video' : 'Insight', title:x.title, url:`/insights/${x.slug}`, excerpt:x.excerpt })),
      ...pages.filter(x => x.slug !== 'home').map(x => ({ type:'Page', title:x.title, url:`/${x.slug}`, excerpt:x.description }))
    ];
  }

  async media(id: string) {
    const asset = await this.prisma.client.websiteMediaAsset.findFirst({ where: { id, firmId: publicFirmId() } });
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }

  private assetDto(asset: any) {
    return {
      id:asset.id, url:publicAssetUrl(asset.id, asset.checksum), alt:asset.alt, caption:asset.caption,
      credit:asset.credit, mimeType:asset.mimeType, width:asset.width, height:asset.height,
      focalX:asset.focalX, focalY:asset.focalY, variants:asset.variants
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
      author:p.author ? this.profileDto(p.author) : undefined,
      duration:p.duration ?? undefined, practiceAreas:p.practiceAreaSlugs, tags:p.tags, seo:p.seo
    };
  }
}
