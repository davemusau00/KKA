import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentUser, Public, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { WebsiteLeadsService } from './website-leads.service';
import { FeatureFlag } from '../../platform/features/feature-flags.decorator';

@Controller('website')
export class WebsiteLeadsController {
  constructor(private readonly leads: WebsiteLeadsService) {}

  @Public()
  @Post('public/leads')
  create(@Body() body:unknown,@Req() req:FastifyRequest) {
    return this.leads.createPublic(body,{ ip:req.ip, userAgent:String(req.headers['user-agent'] ?? ''), referrer:String(req.headers.referer ?? '') });
  }

  @Get('admin/leads') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.view')
  list(@CurrentUser() user:RequestUser,@Query() query:any) { return this.leads.list(user,query); }

  @Get('admin/leads/analytics') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.view')
  analytics(@CurrentUser() user:RequestUser,@Query('days') days='30') { return this.leads.analytics(user,Number(days)); }

  @Get('admin/leads/:id') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.view')
  get(@CurrentUser() user:RequestUser,@Param('id') id:string) { return this.leads.get(user,id); }

  @Patch('admin/leads/:id') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.manage')
  update(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:unknown) { return this.leads.update(user,id,body); }

  @Post('admin/leads/:id/assign') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.manage')
  assign(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:unknown) { return this.leads.assign(user,id,body); }

  @Post('admin/leads/:id/contact-attempts') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.manage')
  contact(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:unknown) { return this.leads.contact(user,id,body); }

  @Post('admin/leads/:id/appointments') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.manage','calendar.manage')
  appointment(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:unknown) { return this.leads.appointment(user,id,body); }

  @Post('admin/leads/:id/start-intake') @FeatureFlag('module.website')
  @RequirePermissions('website.leads.manage','matter.create')
  startIntake(@CurrentUser() user:RequestUser,@Param('id') id:string) { return this.leads.startIntake(user,id); }
}
