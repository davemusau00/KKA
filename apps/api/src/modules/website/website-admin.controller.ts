import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { WebsiteAdminService } from './website-admin.service';

@Controller('website/admin')
@RequirePermissions('admin.settings_manage')
export class WebsiteAdminController {
  constructor(private readonly cms:WebsiteAdminService) {}

  @Get('dashboard') dashboard(@CurrentUser() user:RequestUser){return this.cms.dashboard(user);}
  @Get('settings') settings(@CurrentUser() user:RequestUser){return this.cms.settings(user);}
  @Put('settings') saveSettings(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveSettings(user,body);}

  @Get('pages') pages(@CurrentUser() user:RequestUser){return this.cms.listPages(user);}
  @Get('pages/:id') page(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.page(user,id);}
  @Post('pages') savePage(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.savePage(user,body);}
  @Put('pages/:id') updatePage(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.savePage(user,{...body,id});}
  @Post('pages/:id/restore/:version') restorePage(@CurrentUser() user:RequestUser,@Param('id') id:string,@Param('version') version:string){return this.cms.restorePageVersion(user,id,Number(version));}
  @Delete('pages/:id') deletePage(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deletePage(user,id);}

  @Get('profiles') profiles(@CurrentUser() user:RequestUser){return this.cms.listProfiles(user);}
  @Post('profiles') saveProfile(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveProfile(user,body);}
  @Put('profiles/:id') updateProfile(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveProfile(user,{...body,id});}
  @Delete('profiles/:id') deleteProfile(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteProfile(user,id);}

  @Get('practice-areas') practiceAreas(@CurrentUser() user:RequestUser){return this.cms.listPracticeAreas(user);}
  @Post('practice-areas') savePractice(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.savePracticeArea(user,body);}
  @Put('practice-areas/:id') updatePractice(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.savePracticeArea(user,{...body,id});}
  @Delete('practice-areas/:id') deletePractice(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deletePracticeArea(user,id);}

  @Get('publications') publications(@CurrentUser() user:RequestUser){return this.cms.listPublications(user);}
  @Get('publications/:id') publication(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.publication(user,id);}
  @Post('publications') savePublication(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.savePublication(user,body);}
  @Put('publications/:id') updatePublication(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.savePublication(user,{...body,id});}
  @Post('publications/:id/restore/:version') restorePublication(@CurrentUser() user:RequestUser,@Param('id') id:string,@Param('version') version:string){return this.cms.restorePublicationVersion(user,id,Number(version));}
  @Delete('publications/:id') deletePublication(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deletePublication(user,id);}

  @Get('testimonials') testimonials(@CurrentUser() user:RequestUser){return this.cms.listTestimonials(user);}
  @Post('testimonials') saveTestimonial(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveTestimonial(user,body);}
  @Put('testimonials/:id') updateTestimonial(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveTestimonial(user,{...body,id});}
  @Delete('testimonials/:id') deleteTestimonial(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteTestimonial(user,id);}

  @Get('metrics') metrics(@CurrentUser() user:RequestUser){return this.cms.listMetrics(user);}
  @Post('metrics') saveMetric(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveMetric(user,body);}
  @Put('metrics/:id') updateMetric(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveMetric(user,{...body,id});}
  @Delete('metrics/:id') deleteMetric(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteMetric(user,id);}

  @Get('forms') forms(@CurrentUser() user:RequestUser){return this.cms.listForms(user);}
  @Post('forms') saveForm(@CurrentUser() user:RequestUser,@Body() body:unknown){return this.cms.saveForm(user,body);}
  @Put('forms/:id') updateForm(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:any){return this.cms.saveForm(user,{...body,id});}
  @Delete('forms/:id') deleteForm(@CurrentUser() user:RequestUser,@Param('id') id:string){return this.cms.deleteForm(user,id);}
}
