import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { CustomizationService } from "./customization.service";
import { env } from "../../platform/env";

@Controller("customization")
export class CustomizationController {
  constructor(private readonly c:CustomizationService){}
  @Get("fields") @RequirePermissions("admin.settings_manage") fields(@CurrentUser()u:RequestUser,@Query("entityType")e?:string){return this.c.fields(u.firmId,e);}
  @Post("fields") @RequirePermissions("admin.settings_manage") field(@CurrentUser()u:RequestUser,@Body()body:unknown){const i=z.object({entityType:z.string(),key:z.string().regex(/^[a-z0-9_.-]+$/i),label:z.string(),helpText:z.string().optional(),fieldType:z.string(),requiredRule:z.any().optional(),validation:z.any().optional(),defaultValue:z.any().optional(),options:z.any().optional(),conditionalVisibility:z.any().optional(),readPermissionKeys:z.array(z.string()).default([]),writePermissionKeys:z.array(z.string()).default([]),searchable:z.boolean().default(false),reportable:z.boolean().default(false),mergeField:z.boolean().default(false),sensitivity:z.string().default("INTERNAL")}).parse(body);return this.c.createField(u.firmId,u.id,i);}
  @Patch("fields/:id") @RequirePermissions("admin.settings_manage") updateField(@CurrentUser()u:RequestUser,@Param("id")id:string,@Body()body:Record<string,unknown>){return this.c.updateField(u.firmId,u.id,id,body);}
  @Post("fields/:id/value") @RequirePermissions("matter.edit") value(@CurrentUser()u:RequestUser,@Param("id")id:string,@Body()body:unknown){const i=z.object({entityType:z.string(),entityId:z.string(),matterId:z.string().optional(),value:z.any()}).parse(body);return this.c.setFieldValue(u.firmId,u.id,id,i.entityType,i.entityId,i.value,i.matterId);}

  @Get("forms") @RequirePermissions("admin.settings_manage") forms(@CurrentUser()u:RequestUser){return this.c.forms(u.firmId);}
  @Post("forms") @RequirePermissions("admin.settings_manage") form(@CurrentUser()u:RequestUser,@Body()body:unknown){const i=z.object({key:z.string(),name:z.string(),purpose:z.string().optional(),scopeType:z.string(),scopeId:z.string(),schema:z.any(),publish:z.boolean().default(false)}).parse(body);return this.c.createForm(u.firmId,u.id,i);}
  @Post("forms/:id/versions") @RequirePermissions("admin.settings_manage") formVersion(@CurrentUser()u:RequestUser,@Param("id")id:string,@Body()body:unknown){const i=z.object({schema:z.any(),publish:z.boolean().default(false)}).parse(body);return this.c.addFormVersion(u.firmId,u.id,id,i.schema,i.publish);}
  @Post("forms/versions/:id/submissions") submit(@CurrentUser()u:RequestUser,@Param("id")id:string,@Body()body:unknown){const i=z.object({entityType:z.string(),entityId:z.string(),data:z.any(),status:z.string().optional()}).parse(body);return this.c.submitForm(u.firmId,u.id,id,i);}

  @Get("document-templates") @RequirePermissions("document.view") templates(@CurrentUser()u:RequestUser){return this.c.templates(u.firmId);}
  @Post("document-templates") @RequirePermissions("admin.settings_manage") template(@CurrentUser()u:RequestUser,@Body()body:unknown){const i=z.object({key:z.string(),name:z.string(),category:z.string(),practiceArea:z.string().optional(),matterType:z.string().optional(),mergeSchema:z.any().optional(),content:z.string().optional(),publish:z.boolean().default(false)}).parse(body);return this.c.createTemplate(u.firmId,u.id,i);}
  @Post("document-templates/:id/versions/upload") @RequirePermissions("admin.settings_manage") async upload(@CurrentUser()u:RequestUser,@Param("id")id:string,@Req()req:FastifyRequest,@Query("publish")publish?:string){const part=await req.file();if(!part)throw new BadRequestException("No template file uploaded");const buffer=await part.toBuffer();if(buffer.length>env().MAX_UPLOAD_BYTES)throw new BadRequestException("File exceeds upload limit");return this.c.uploadTemplateVersion(u.firmId,u.id,id,{filename:part.filename,mimetype:part.mimetype,buffer},undefined,publish==="true");}
}
