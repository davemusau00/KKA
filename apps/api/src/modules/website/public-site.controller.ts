import { Controller, Get, Param, Query, Res } from '@nestjs/common';
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
  async media(@Param('id') id: string, @Res() reply: FastifyReply) {
    const asset = await this.site.media(id);
    const stream = await this.storage.openDocument(asset.storagePath);
    return reply
      .header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Content-Disposition', 'inline')
      .type(asset.mimeType)
      .send(stream);
  }
}
