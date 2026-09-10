import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { WebsiteAdminService } from './website-admin.service';

@Controller('website/admin')
@RequirePermissions('website.view')
export class WebsiteAdminController {
  constructor(private readonly cms:WebsiteAdminService) {}

  @Get('dashboard') dashboard(@CurrentUser() user:RequestUser){return this.cms.dashboard(user);}
  @Get('settings') settings(@CurrentUser() user:RequestUser){return this.cms.settings(user);}
  @Put('settings') @RequirePermissions('website.settings') saveSettings(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveSettings(user,body);}

  @Get('pages') pages(@CurrentUser() user:RequestUser){return this.cms.listPages(user);}
  @Get('pages/:id') page(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.page(user,id);}
  @Post('pages') @RequirePermissions('website.edit') savePage(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.savePage(user,body);}
  @Put('pages/:id') @RequirePermissions('website.edit') updatePage(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.savePage(user,{...body,id});}
  @Post('pages/:id/restore/:version') @RequirePermissions('website.edit') restorePage(@CurrentUser() user:RequestUser,@Param('id') id:string,@Param('version') version:string){return this.cms.restorePageVersion(user,id,Number(version));}
  @Delete('pages/:id') @RequirePermissions('website.edit') deletePage(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deletePage(user,id);}

  @Get('profiles') profiles(@CurrentUser() user:RequestUser){return this.cms.listProfiles(user);}
  @Post('profiles') @RequirePermissions('website.edit') saveProfile(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveProfile(user,body);}
  @Put('profiles/:id') @RequirePermissions('website.edit') updateProfile(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveProfile(user,{...body,id});}
  @Delete('profiles/:id') @RequirePermissions('website.edit') deleteProfile(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteProfile(user,id);}

  @Get('practice-areas') practiceAreas(@CurrentUser() user:RequestUser){return this.cms.listPracticeAreas(user);}
  @Post('practice-areas') @RequirePermissions('website.edit') savePractice(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.savePracticeArea(user,body);}
  @Put('practice-areas/:id') @RequirePermissions('website.edit') updatePractice(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.savePracticeArea(user,{...body,id});}
  @Delete('practice-areas/:id') @RequirePermissions('website.edit') deletePractice(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deletePracticeArea(user,id);}

  @Get('publications') publications(@CurrentUser() user:RequestUser){return this.cms.listPublications(user);}
  @Get('publications/:id') publication(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.publication(user,id);}
  @Post('publications') @RequirePermissions('website.edit') savePublication(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.savePublication(user,body);}
  @Put('publications/:id') @RequirePermissions('website.edit') updatePublication(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.savePublication(user,{...body,id});}
  @Post('publications/:id/restore/:version') @RequirePermissions('website.edit') restorePublication(@CurrentUser() user:RequestUser,@Param('id') id:string,@Param('version') version:string){return this.cms.restorePublicationVersion(user,id,Number(version));}
  @Delete('publications/:id') @RequirePermissions('website.edit') deletePublication(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deletePublication(user,id);}

  @Get('testimonials') testimonials(@CurrentUser() user:RequestUser){return this.cms.listTestimonials(user);}
  @Post('testimonials') @RequirePermissions('website.edit') saveTestimonial(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveTestimonial(user,body);}
  @Put('testimonials/:id') @RequirePermissions('website.edit') updateTestimonial(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveTestimonial(user,{...body,id});}
  @Delete('testimonials/:id') @RequirePermissions('website.edit') deleteTestimonial(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteTestimonial(user,id);}

  @Get('metrics') metrics(@CurrentUser() user:RequestUser){return this.cms.listMetrics(user);}
  @Post('metrics') @RequirePermissions('website.edit') saveMetric(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveMetric(user,body);}
  @Put('metrics/:id') @RequirePermissions('website.edit') updateMetric(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveMetric(user,{...body,id});}
  @Delete('metrics/:id') @RequirePermissions('website.edit') deleteMetric(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteMetric(user,id);}

  @Get('forms') forms(@CurrentUser() user:RequestUser){return this.cms.listForms(user);}
  @Post('forms') @RequirePermissions('website.edit') saveForm(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveForm(user,body);}
  @Put('forms/:id') @RequirePermissions('website.edit') updateForm(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveForm(user,{...body,id});}
  @Delete('forms/:id') @RequirePermissions('website.edit') deleteForm(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteForm(user,id);}
}
