import { Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { WebsitePublishingService } from './website-publishing.service';
import { FeatureFlag } from '../../platform/features/feature-flags.decorator';

@Controller('website/admin/publishing')
@RequirePermissions('website.publish')
@FeatureFlag('module.website')
export class WebsitePublishingController {
  constructor(private readonly publishing:WebsitePublishingService){}
  @Get('releases') list(@CurrentUser() user:RequestUser){return this.publishing.list(user);}
  @Post('publish') publish(@CurrentUser() user:RequestUser){return this.publishing.publish(user);}
  @Post('rollback/:version') rollback(@CurrentUser() user:RequestUser,@Param('version') version:string){return this.publishing.rollback(user,Number(version));}
}
