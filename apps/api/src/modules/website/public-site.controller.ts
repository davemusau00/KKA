import { Controller, Get, Param, Query, Res, NotFoundException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Public } from '../../platform/auth/decorators';
import { StorageService } from '../../platform/storage/storage.service';
import { SiteContentService } from './site-content.service';

@Public()
@Controller('website/public')
export class PublicSiteController {
  constructor(
    private readonly site: SiteContentService,
    private readonly storage: StorageService,
  ) {}

  @Get('release')
  async release() { const r=await this.site.active(); return r ? {id:r.id,version:r.version} : {id:null,version:null}; }

  @Get('bootstrap')
  bootstrap() { return this.site.bootstrap(); }

  @Get('pages/:slug')
  page(@Param('slug') slug: string) { return this.site.page(slug); }

  @Get('partners/:slug')
  partner(@Param('slug') slug: string) { return this.site.partner(slug); }

  @Get('practice-areas/:slug')
  practice(@Param('slug') slug: string) { return this.site.practice(slug); }

  @Get('publications/:slug')
  publication(@Param('slug') slug: string) { return this.site.publication(slug); }

  @Get('search')
  search(@Query('q') q = '') { return this.site.search(q); }

  @Get('media/:id')
  async media(@Param('id') id: string, @Query('variant') variant:string|undefined, @Res() reply: FastifyReply) {
    const asset = await this.site.media(id);
    const selected=variant?(asset.variants as any)?.[variant]:asset;
    if(!selected?.storagePath)throw new NotFoundException('Media variant not found');
    const stream = await this.storage.openDocument(selected.storagePath);
    return reply
      .header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Cross-Origin-Resource-Policy', 'cross-origin')
      .header('Content-Disposition', 'inline')
      .type(selected.mimeType)
      .send(stream);
  }
}
