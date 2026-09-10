import { Controller, Get, Headers, Param, Post, Res, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import type { FastifyReply } from 'fastify';
import { CurrentUser, Public, RequirePermissions } from '../../platform/auth/decorators';
import type { RequestUser } from '../../platform/auth/auth.types';
import { RedisService } from '../../platform/redis/redis.service';
import { StorageService } from '../../platform/storage/storage.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { SiteContentService } from './site-content.service';
const key=(token:string)=>'website:preview:'+createHash('sha256').update(token).digest('hex');
@Controller('website')
export class WebsitePreviewController {
 constructor(private readonly site:SiteContentService,private readonly redis:RedisService,private readonly storage:StorageService,private readonly prisma:PrismaService){}
 @Post('admin/preview') @RequirePermissions('website.edit')
 async create(@CurrentUser() user:RequestUser){
  const snapshot=await this.prisma.client.$transaction(tx=>this.site.capture(user.firmId,tx,true),{isolationLevel:'RepeatableRead',timeout:30000});
  const token=randomBytes(32).toString('base64url');
  await this.redis.client.set(key(token),JSON.stringify({firmId:user.firmId,snapshot}),'EX',600);
  return {token,expiresAt:Date.now()+600000};
 }
 private async read(token:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))throw new UnauthorizedException('Invalid preview session');
  const value=await this.redis.client.get(key(token));if(!value)throw new UnauthorizedException('Preview expired. Open a new preview.');return JSON.parse(value);
 }
 @Get('public/preview') @Public()
 async snapshot(@Headers('x-website-preview') token:string,@Res({passthrough:true}) reply:FastifyReply){reply.header('Cache-Control','no-store').header('X-Robots-Tag','noindex, nofollow');return (await this.read(token)).snapshot;}
 @Get('public/preview/media/:id') @Public()
 async media(@Param('id') id:string,@Headers('x-website-preview') token:string,@Res() reply:FastifyReply){
  const session=await this.read(token);if(!session.snapshot.mediaIds.includes(id))throw new UnauthorizedException('Media not included in preview');
  const asset=await this.prisma.client.websiteMediaAsset.findFirst({where:{id,firmId:session.firmId}});if(!asset)throw new UnauthorizedException('Media unavailable');
  return reply.header('Cache-Control','no-store').header('X-Robots-Tag','noindex').type(asset.mimeType).send(await this.storage.openDocument(asset.storagePath));
 }
}
