import { RegistryService } from './registry.service';
import { Module } from "@nestjs/common";
import { MarksController } from "./marks.controller";
import { MarksService } from "./marks.service";
import { BrandingService } from './branding.service';
import { BrandingController } from './branding.controller';

@Module({ controllers: [MarksController, BrandingController], providers: [MarksService, BrandingService, RegistryService], exports: [MarksService, BrandingService] })
export class MarksModule {}
