import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApplyDocumentMarksSchema } from '@kka/contracts';
import { z } from 'zod';
import { CurrentUser, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { DocumentWorkflowService } from './document-workflow.service';
@Controller('document-operations')
export class DocumentWorkflowController {
  constructor(private readonly workflow: DocumentWorkflowService) {}
  @Post('preview') @RequirePermissions('document.sign') async preview(@CurrentUser() user: RequestUser, @Body() body: unknown, @Res() reply: FastifyReply) {
    return reply.header('Cache-Control','no-store').type('application/pdf').send(await this.workflow.preview(user, ApplyDocumentMarksSchema.parse(body)));
  }
  @Post('apply') @RequirePermissions('document.sign') apply(@CurrentUser() user: RequestUser, @Body() body: unknown) { return this.workflow.submit(user, ApplyDocumentMarksSchema.parse(body)); }
  @Get() @RequirePermissions('document.view') list(@CurrentUser() user: RequestUser, @Query('documentId') documentId: string) { return this.workflow.list(user, documentId); }
  @Get(':id/preview-file') @RequirePermissions('document.view') async previewFile(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() reply: FastifyReply) { return reply.header('Cache-Control','no-store').type('application/pdf').send(await this.workflow.previewFile(user,id)); }
  @Post(':id/retry') @RequirePermissions('document.sign') retry(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: unknown) { return this.workflow.retry(user, id, z.object({ elevationToken: z.string().optional() }).parse(body).elevationToken); }
}
