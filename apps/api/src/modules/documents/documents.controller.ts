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
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermissions("document.view")
  list(@CurrentUser() user: RequestUser, @Query("matterId") matterId?: string, @Query("q") q?: string) {
    return this.documents.list(user.firmId, matterId, q);
  }

  @Post()
  @RequirePermissions("document.upload")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.documents.createMetadata(user.firmId, user.id, CreateDocumentSchema.parse(body));
  }

  @Post(":id/versions")
  @RequirePermissions("document.upload")
  async upload(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Req() request: FastifyRequest
  ) {
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
    const { version, stream } = await this.documents.getVersionForDownload(user.firmId, versionId);
    reply.header("Content-Type", version.mimeType);
    reply.header("Content-Disposition", `attachment; filename="${version.originalFilename.replace(/"/g, "")}"`);
    reply.header("X-Content-Type-Options", "nosniff");
    return reply.send(stream);
  }

  @Post(":id/review")
  @RequirePermissions("document.review_submit")
  review(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ reviewerId: z.string(), comment: z.string().optional() }).parse(body);
    return this.documents.submitForReview(user.firmId, user.id, id, input.reviewerId, input.comment);
  }

  @Post(":id/review-decision")
  @RequirePermissions("document.approve")
  decision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      decision: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
      comment: z.string().optional()
    }).parse(body);
    return this.documents.decideReview(user.firmId, user.id, id, input.decision, input.comment);
  }

  @Post(":id/filed")
  @RequirePermissions("document.file")
  filed(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ filingRef: z.string().min(2) }).parse(body);
    return this.documents.markFiled(user.firmId, user.id, id, input.filingRef);
  }
}
