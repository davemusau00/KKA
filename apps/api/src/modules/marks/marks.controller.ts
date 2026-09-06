import { DocumentWorkflowService } from './document-workflow.service';
import { Body, Controller, Get, Param, Post, Req, BadRequestException, Patch, Res } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import { ApplyMarkSchema, CreateMarkAssetSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { MarksService } from "./marks.service";
import { RegistryService, MarkUpdateSchema } from './registry.service';
import { env } from "../../platform/env";

@Controller("marks")
export class MarksController {
  constructor(private readonly marks: MarksService, private readonly registry: RegistryService, private readonly workflow: DocumentWorkflowService) {}

  @Get()
  @RequirePermissions("document.view")
  list(@CurrentUser() user: RequestUser) {
    return this.marks.listAssets(user.firmId);
  }

  @Post()
  @RequirePermissions("admin.settings_manage")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.marks.createAsset(user.firmId, user.id, CreateMarkAssetSchema.parse(body));
  }

  @Post(":id/versions")
  @RequirePermissions("admin.settings_manage")
  async upload(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Req() request: FastifyRequest
  ) {
    const part = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } });
    if (!part) throw new BadRequestException("No mark image uploaded");
    const buffer = await part.toBuffer();
    if (buffer.length > env().MAX_UPLOAD_BYTES) throw new BadRequestException("File exceeds upload limit");
    return this.registry.upload(user, id, false, { mimetype: part.mimetype, buffer });
  }

  @Patch(':id') @RequirePermissions('admin.settings_manage')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: unknown) { return this.registry.update(user, id, MarkUpdateSchema.parse(body)); }
  @Get('signature-profiles')
  signatures(@CurrentUser() user: RequestUser) { return this.registry.signatures(user); }
  @Get('versions/:id/preview') @RequirePermissions('document.view')
  async preview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() reply: FastifyReply) { const v = await this.registry.preview(user, id, false); return reply.header('Cache-Control','no-store').type(v.mimeType).send(v.stream); }
  @Get('signature-versions/:id/preview')
  async signaturePreview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() reply: FastifyReply) { const v = await this.registry.preview(user, id, true); return reply.header('Cache-Control','no-store').type(v.mimeType).send(v.stream); }

  @Post("placements")
  @RequirePermissions("admin.settings_manage")
  placement(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      name: z.string().min(2),
      pageSelection: z.enum(["FIRST", "LAST", "ALL", "EXPLICIT"]).default("LAST"),
      anchorType: z.enum(["PAGE", "TEXT_ANCHOR", "MERGE_FIELD_ANCHOR", "SIGNATURE_ANCHOR"]).default("PAGE"),
      anchorName: z.string().optional(),
      xPoints: z.number().optional(),
      yPoints: z.number().optional(),
      widthPoints: z.number().positive().optional(),
      heightPoints: z.number().positive().optional(),
      scale: z.number().positive().default(1),
      rotation: z.number().min(-180).max(180).default(0),
      opacity: z.number().min(0.1).max(1).default(1),
      constraints: z.record(z.string(), z.unknown()).optional()
    }).parse(body);
    return this.marks.createPlacement(user.firmId, user.id, input);
  }

  @Get("placements")
  @RequirePermissions("document.view")
  placements(@CurrentUser() user: RequestUser) { return this.marks.placements(user.firmId); }

  @Get("policies")
  @RequirePermissions("admin.settings_manage")
  policies(@CurrentUser() user: RequestUser) { return this.marks.policies(user.firmId); }

  @Post("policies")
  @RequirePermissions("admin.settings_manage")
  policy(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      name: z.string().min(2), documentTypes: z.array(z.string()).default([]), matterTypes: z.array(z.string()).default([]),
      allowedMarkAssetTypes: z.array(z.enum(["FIRM_SEAL","BRANCH_SEAL","LOGO","RECEIVED_STAMP","PAID_STAMP","APPROVED_STAMP","CERTIFIED_COPY_STAMP","CONFIDENTIAL_STAMP","DRAFT_STAMP","COPY_STAMP","INTERNAL_REVIEW_STAMP","CUSTOM_OPERATIONAL_MARK"])).default([]),
      requiresReviewComplete: z.boolean().default(true), requiresReauth: z.boolean().default(true),
      requiresApproval: z.boolean().default(false), approvalRoleKeys: z.array(z.string()).default([]), active: z.boolean().default(true)
    }).parse(body);
    return this.marks.createPolicy(user.firmId, user.id, input);
  }

  @Get("execution-blocks")
  @RequirePermissions("document.view")
  executionBlocks(@CurrentUser() user: RequestUser) { return this.marks.executionBlocks(user.firmId); }

  @Post("execution-blocks")
  @RequirePermissions("admin.settings_manage")
  executionBlock(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({ branchId:z.string().optional(), name:z.string().min(2), documentTypes:z.array(z.string()).default([]), signerRoleKeys:z.array(z.string()).default([]), definition:z.any(), effectiveFrom:z.string().datetime().optional() }).parse(body);
    return this.marks.createExecutionBlock(user.firmId,user.id,input);
  }

  @Post("execution-blocks/:id/versions")
  @RequirePermissions("admin.settings_manage")
  executionBlockVersion(@CurrentUser() user:RequestUser,@Param("id")id:string,@Body()body:unknown){const input=z.object({definition:z.any(),effectiveFrom:z.string().datetime().optional(),effectiveTo:z.string().datetime().optional()}).parse(body);return this.marks.addExecutionBlockVersion(user.firmId,user.id,id,input);}

  @Post("signature-profiles")
  @RequirePermissions("admin.settings_manage")
  signatureProfile(@CurrentUser()user:RequestUser,@Body()body:unknown){const input=z.object({userId:z.string(),professionalDisplayName:z.string().min(2),postNominals:z.string().optional(),jobTitle:z.string().optional(),admissionNumber:z.string().optional(),typedSignatureAllowed:z.boolean().default(false),approvalStatus:z.string().default("PENDING")}).parse(body);return this.marks.upsertSignatureProfile(user.firmId,user.id,input);}

  @Post("signature-profiles/:id/assets")
  @RequirePermissions("admin.settings_manage")
  async signatureAsset(@CurrentUser()user:RequestUser,@Param("id")id:string,@Req()request:FastifyRequest){const part=await request.file({ limits: { fileSize: 5 * 1024 * 1024 } });if(!part)throw new BadRequestException("No signature image uploaded");const buffer=await part.toBuffer();if(buffer.length>env().MAX_UPLOAD_BYTES)throw new BadRequestException("File exceeds upload limit");return this.registry.upload(user,id,true,{mimetype:part.mimetype,buffer});}

  @Post("signature-delegations")
  @RequirePermissions("admin.settings_manage")
  signatureDelegation(@CurrentUser()user:RequestUser,@Body()body:unknown){const input=z.object({delegatorProfileId:z.string(),delegateUserId:z.string(),allowedActions:z.array(z.string()).default([]),allowedMatterTypes:z.array(z.string()).default([]),allowedDocumentTypes:z.array(z.string()).default([]),startsAt:z.string().datetime(),endsAt:z.string().datetime(),reason:z.string().min(2)}).parse(body);return this.marks.createDelegation(user.firmId,user.id,input);}

  @Post("apply")
  @RequirePermissions("document.sign")
  apply(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.workflow.legacy(user, ApplyMarkSchema.parse(body));
  }
}
