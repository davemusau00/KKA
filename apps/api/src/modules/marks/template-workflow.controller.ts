import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { GenerateDocumentSchema, TemplateConfigurationSchema } from '@kka/contracts';
import { z } from 'zod';
import { CurrentUser, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { TemplateWorkflowService, SaveTemplateSchema } from './template-workflow.service';
@Controller('document-templates')
export class TemplateWorkflowController {
  constructor(private readonly templates: TemplateWorkflowService) {}
  @Get() @RequirePermissions('document.view') list(@CurrentUser() user: RequestUser) { return this.templates.list(user); }
  @Post() @RequirePermissions('admin.settings_manage') create(@CurrentUser() user: RequestUser, @Body() body: unknown) { return this.templates.save(user, SaveTemplateSchema.parse(body)); }
  @Post(':id/versions') @RequirePermissions('admin.settings_manage') version(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: unknown) { return this.templates.save(user, SaveTemplateSchema.parse(body), id); }
  @Post(':id/docx') @RequirePermissions('admin.settings_manage') async upload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: FastifyRequest) {
    const file = await req.file({ limits: { fileSize: 20 * 1024 * 1024 } }); if (!file) throw new BadRequestException('Choose a Word template');
    const source = await file.toBuffer();
    const field = file.fields.configuration;
    const config = field && !Array.isArray(field) && 'value' in field ? JSON.parse(String(field.value)) as unknown : {};
    return this.templates.upload(user, id, source, TemplateConfigurationSchema.parse(config));
  }
  @Post('versions/:id/publish') @RequirePermissions('admin.settings_manage') publish(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.templates.publish(user,id); }
  @Patch(':id') @RequirePermissions('admin.settings_manage') retire(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: unknown) { return this.templates.retire(user,id,z.object({active:z.boolean()}).parse(body).active); }
  @Post('generate') @RequirePermissions('document.upload') generate(@CurrentUser() user: RequestUser, @Body() body: unknown) { return this.templates.generate(user,GenerateDocumentSchema.parse(body)); }
  @Post('preview') @RequirePermissions('admin.settings_manage') preview(@CurrentUser() user: RequestUser, @Body() body: unknown) { return this.templates.generate(user,GenerateDocumentSchema.parse(body),true); }
  @Post('generations/:id/retry') @RequirePermissions('document.upload') retry(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.templates.retry(user,id); }
}
