import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CurrentUser, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { WebsiteMediaService } from './website-media.service';

@Controller('website/admin/media')
export class WebsiteMediaController {
  constructor(private readonly media: WebsiteMediaService) {}

  @Get()
  @RequirePermissions('admin.settings_manage')
  list(@CurrentUser() user:RequestUser,@Query('q') q?:string) { return this.media.list(user,q); }

  @Post()
  @RequirePermissions('admin.settings_manage')
  async upload(@CurrentUser() user:RequestUser,@Req() req:FastifyRequest) {
    const part = await req.file({ limits:{ fileSize:50*1024*1024, files:1 } });
    if (!part) throw new BadRequestException('Choose a media file');
    const fields = part.fields as Record<string, any>;
    return this.media.upload(user,{ filename:part.filename, mimetype:part.mimetype, buffer:await part.toBuffer() },{
      alt:String(fields?.alt?.value ?? part.filename.replace(/\.[^.]+$/,'')),
      caption:fields?.caption?.value ? String(fields.caption.value) : undefined,
      credit:fields?.credit?.value ? String(fields.credit.value) : undefined,
      focalX:fields?.focalX?.value ?? .5, focalY:fields?.focalY?.value ?? .5
    });
  }

  @Patch(':id')
  @RequirePermissions('admin.settings_manage')
  update(@CurrentUser() user:RequestUser,@Param('id') id:string,@Body() body:unknown) { return this.media.update(user,id,body); }

  @Delete(':id')
  @RequirePermissions('admin.settings_manage')
  remove(@CurrentUser() user:RequestUser,@Param('id') id:string) { return this.media.remove(user,id); }
}
