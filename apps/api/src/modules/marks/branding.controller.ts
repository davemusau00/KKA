import { BadRequestException, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { Public, CurrentUser, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { env } from '../../platform/env';
import { BrandingService } from './branding.service';
@Controller('branding')
export class BrandingController {
  constructor(private readonly branding: BrandingService) {}
  @Public() @Get('public') publicMetadata() { return this.branding.metadata(env().PUBLIC_BRANDING_FIRM_ID, true); }
  @Public() @Get('public/image') async publicImage(@Res() reply: FastifyReply) { return this.send(reply, env().PUBLIC_BRANDING_FIRM_ID); }
  @Get() metadata(@CurrentUser() user: RequestUser) { return this.branding.metadata(user.firmId); }
  @Get('image') async image(@CurrentUser() user: RequestUser, @Res() reply: FastifyReply) { return this.send(reply, user.firmId); }
  private async send(reply: FastifyReply, firmId?: string) {
    const image = await this.branding.image(firmId);
    return reply.header('Cache-Control', 'no-cache').header('X-Content-Type-Options', 'nosniff').type(image.mimeType).send(image.stream);
  }
  @Post('logo') @RequirePermissions('admin.settings_manage') async upload(@CurrentUser() user: RequestUser, @Req() req: FastifyRequest) {
    const file = await req.file({ limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
    if (!file) throw new BadRequestException('Choose a logo image');
    return this.branding.upload(user.firmId, user.id, await file.toBuffer(), file.mimetype);
  }
  @Post('restore-default') @RequirePermissions('admin.settings_manage') restore(@CurrentUser() user: RequestUser) { return this.branding.restore(user.firmId, user.id); }
}
