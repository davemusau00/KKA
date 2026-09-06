import { RegistryService } from './registry.service';
import { DocumentAccessService } from './document-access.service';
import { DocumentWorkflowService } from './document-workflow.service';
import { DocumentWorkflowController } from './document-workflow.controller';
import { TemplateWorkflowService } from './template-workflow.service';
import { TemplateWorkflowController } from './template-workflow.controller';
import { Module } from "@nestjs/common";
import { MarksController } from "./marks.controller";
import { MarksService } from "./marks.service";
import { BrandingService } from './branding.service';
import { BrandingController } from './branding.controller';

@Module({ controllers: [MarksController, BrandingController, DocumentWorkflowController, TemplateWorkflowController], providers: [MarksService, BrandingService, RegistryService, DocumentAccessService, DocumentWorkflowService, TemplateWorkflowService], exports: [MarksService, BrandingService, DocumentAccessService, DocumentWorkflowService] })
export class MarksModule {}
