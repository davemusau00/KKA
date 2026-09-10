import { Module } from '@nestjs/common';
import { AuditModule } from '../../platform/audit/audit.module';
import { StorageModule } from '../../platform/storage/storage.module';
import { NumberingModule } from '../numbering/numbering.module';
import { IntakeModule } from '../intake/intake.module';
import { CalendarModule } from '../calendar/calendar.module';
import { SiteContentService } from './site-content.service';
import { PublicSiteController } from './public-site.controller';
import { WebsiteAdminService } from './website-admin.service';
import { WebsiteAdminController } from './website-admin.controller';
import { WebsiteLeadsService } from './website-leads.service';
import { WebsiteLeadsController } from './website-leads.controller';
import { WebsiteMediaService } from './website-media.service';
import { WebsiteMediaController } from './website-media.controller';
import { WebsitePublishingService } from './website-publishing.service';
import { WebsitePublishingController } from './website-publishing.controller';

@Module({
  imports:[AuditModule,StorageModule,NumberingModule,IntakeModule,CalendarModule],
  controllers:[PublicSiteController,WebsiteAdminController,WebsiteLeadsController,WebsiteMediaController,WebsitePublishingController],
  providers:[SiteContentService,WebsiteAdminService,WebsiteLeadsService,WebsiteMediaService,WebsitePublishingService],
  exports:[SiteContentService,WebsiteLeadsService]
})
export class WebsiteModule {}
