import { DocumentAccessService } from '../marks/document-access.service';
import {
  Body, Controller, Get, Param, Post, Query, Req, Res, BadRequestException
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateDocumentSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { DocumentsService } from "./documents.service";
import { env } from "../../platform/env";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documents: DocumentsService, private readonly access: DocumentAccessService) {}

  @Get()
  @RequirePermissions("document.view")
  async list(@CurrentUser() user: RequestUser, @Query("matterId") matterId?: string, @Query("q") q?: string) {
    const rows = await this.documents.list(user.firmId, matterId, q);
    const visible = [];
    for (const row of rows) { try { await this.access.document(user, row.id); visible.push(row); } catch { /* Omit documents outside this user's access. */ } }
    return visible.map(row => ({ ...row, versions: row.versions.map(({storagePath, ...version}) => version), currentVersion: row.currentVersion ? (({storagePath, ...v})=>v)(row.currentVersion) : null }));
  }

  @Post()
  @RequirePermissions("document.upload")
  async create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = CreateDocumentSchema.parse(body);
    await this.access.matter(user, input.matterId);
    return this.documents.createMetadata(user.firmId, user.id, input);
  }

  @Post(":id/versions")
  @RequirePermissions("document.upload")
  async upload(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Req() request: FastifyRequest
  ) {
    await this.access.document(user, id);
    const part = await request.file();
    if (!part) throw new BadRequestException("No file uploaded");
    const buffer = await part.toBuffer();
    if (buffer.length > env().MAX_UPLOAD_BYTES) {
      throw new BadRequestException("File exceeds upload limit");
    }
    const summaryField = part.fields?.changeSummary as any;
    const changeSummary = typeof summaryField?.value === "string"
      ? summaryField.value
      : undefined;
    return this.documents.uploadVersion(user.firmId, user.id, id, {
      filename: part.filename,
      mimetype: part.mimetype,
      buffer
    }, changeSummary);
  }

  @Get("versions/:versionId/download")
  @RequirePermissions("document.view")
  async download(
    @CurrentUser() user: RequestUser,
    @Param("versionId") versionId: string,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const version = await this.documents.getVersionForDownload(user.firmId, versionId);
    await this.access.document(user, version.documentId);
    const stream = await this.documents.openAuthorizedVersionForDownload(user.firmId, user.id, version);
    reply.header("Content-Type", version.mimeType);
    reply.header("Cache-Control", "no-store");
    reply.header("Content-Disposition", `attachment; filename="${version.originalFilename.replace(/"/g, "")}"`);
    reply.header("X-Content-Type-Options", "nosniff");
    return reply.send(stream);
  }

  @Post(":id/review")
  @RequirePermissions("document.review_submit")
  async review(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ reviewerId: z.string(), comment: z.string().optional() }).parse(body);
    await this.access.document(user, id);
    return this.documents.submitForReview(user.firmId, user.id, id, input.reviewerId, input.comment);
  }

  @Post(":id/review-decision")
  @RequirePermissions("document.approve")
  async decision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      decision: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
      comment: z.string().optional()
    }).parse(body);
    await this.access.document(user, id);
    return this.documents.decideReview(user.firmId, user.id, id, input.decision, input.comment);
  }

  @Post(":id/filed")
  @RequirePermissions("document.file")
  async filed(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ filingRef: z.string().min(2) }).parse(body);
    await this.access.document(user, id);
    return this.documents.markFiled(user.firmId, user.id, id, input.filingRef);
  }
}
