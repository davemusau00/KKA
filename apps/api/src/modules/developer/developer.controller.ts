import{Body,Controller,Get,Param,Post,Put}from"@nestjs/common";import{z}from"zod";import{CurrentUser,RequirePermissions}from"../../platform/auth/decorators";import type{RequestUser}from"../../platform/auth/auth.types";import{DeveloperService}from"./developer.service";
@Controller("developer")export class DeveloperController{constructor(private readonly d:DeveloperService){}
@Get("feature-flags")@RequirePermissions("admin.feature_flags_manage")flags(){return this.d.flags()}
@Put("feature-flags")@RequirePermissions("admin.feature_flags_manage")flag(@CurrentUser()u:RequestUser,@Body()b:unknown){const i=z.object({key:z.string().min(2),description:z.string().optional(),enabled:z.boolean(),rules:z.any().optional()}).parse(b);return this.d.upsertFlag(u.id,i)}
@Get("api-clients")@RequirePermissions("admin.integrations_manage")clients(@CurrentUser()u:RequestUser){return this.d.clients(u.firmId)}
@Post("api-clients")@RequirePermissions("admin.integrations_manage")client(@CurrentUser()u:RequestUser,@Body()b:unknown){const i=z.object({name:z.string().min(2),permissionKeys:z.array(z.string()).default([]),allowedCidrs:z.array(z.string()).default([])}).parse(b);return this.d.createClient(u.firmId,u.id,i)}
@Get("webhooks")@RequirePermissions("admin.integrations_manage")webhooks(@CurrentUser()u:RequestUser){return this.d.webhooks(u.firmId)}
@Post("webhooks")@RequirePermissions("admin.integrations_manage")webhook(@CurrentUser()u:RequestUser,@Body()b:unknown){const i=z.object({name:z.string().min(2),url:z.string().url(),secret:z.string().min(16).optional(),eventKeys:z.array(z.string()).min(1),active:z.boolean().default(true)}).parse(b);return this.d.createWebhook(u.firmId,u.id,i)}
@Post("webhooks/:id/test")@RequirePermissions("admin.integrations_manage")test(@CurrentUser()u:RequestUser,@Param("id")id:string){return this.d.testWebhook(u.firmId,u.id,id)}
@Get("jobs")@RequirePermissions("admin.audit_view")jobs(){return this.d.jobs()}}
