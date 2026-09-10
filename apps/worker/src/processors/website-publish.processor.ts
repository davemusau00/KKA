import type { Job } from 'bullmq';
import type { KkaPrismaClient } from '@kka/database';
import { mkdir, writeFile, readFile, rename } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
function render(script:string,input:string,output:string):Promise<void>{return new Promise((done,fail)=>{
 const child=spawn(process.execPath,[script,input,output],{windowsHide:true,stdio:['ignore','pipe','pipe']});let errors='';
 child.stderr.on('data',data=>{errors=(errors+data).slice(-8000);});child.stdout.resume();child.on('error',fail);
 child.on('close',code=>code===0?done():fail(new Error(`Public render failed (${code}): ${errors}`)));
});}
export async function processWebsitePublish(job:Job,prisma:KkaPrismaClient){
 const {firmId,releaseId}=job.data as {firmId:string;releaseId:string};
 const release=await prisma.websitePublishRelease.findFirst({where:{id:releaseId,firmId}});
 if(!release)throw new Error('Website release not found');
 if(['PUBLISHED','ROLLED_BACK'].includes(release.status))return release.manifest;
 const manifest=release.manifest as any;
 if(manifest?.schemaVersion!==1||!manifest.snapshot)throw new Error('Release has no frozen snapshot; request a new publish');
 const root=resolve(process.env.KKA_WORKSPACE_ROOT||process.cwd());
 const releases=resolve(process.env.WEBSITE_RELEASE_ROOT||join(root,'.artifacts/public-releases'));
 if(!/^[a-zA-Z0-9_-]+$/.test(releaseId))throw new Error('Invalid release ID');
 const work=join(releases,releaseId+'-'+randomUUID());const output=join(work,'site');const final=join(releases,releaseId);
 await prisma.websitePublishRelease.update({where:{id:releaseId},data:{status:'BUILDING',startedAt:new Date(),error:null}});
 try{
  await mkdir(work,{recursive:true});const input=join(work,'snapshot.json');await writeFile(input,JSON.stringify(manifest.snapshot));
  // Copy only media referenced by this frozen release. Private storage paths
  // stay in the build workspace and never enter the public snapshot.
  if(process.env.STORAGE_DRIVER==='s3')throw new Error('Static media export for S3 must be configured before publishing');
  const storageRoot=resolve(process.env.LOCAL_STORAGE_ROOT||'.storage');
  const assets=await prisma.websiteMediaAsset.findMany({where:{firmId,id:{in:manifest.snapshot.mediaIds}}});
  if(assets.length!==manifest.snapshot.mediaIds.length)throw new Error('A referenced release asset is unavailable');
  const media:Record<string,{source:string;target:string;checksum:string}>={};
  const extensions:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/avif':'avif','video/mp4':'mp4','video/webm':'webm','application/pdf':'pdf'};
  for(const asset of assets)for(const [variant,value]of Object.entries({original:{storagePath:asset.storagePath,checksum:asset.checksum,mimeType:asset.mimeType},...(asset.variants as Record<string,any>)})){
    const source=resolve(storageRoot,value.storagePath);
    if(!source.startsWith(storageRoot+sep))throw new Error('Unsafe media storage path');
    const bytes=await readFile(source);if(createHash('sha256').update(bytes).digest('hex')!==value.checksum)throw new Error('Media checksum mismatch');
    media[asset.id+':'+variant]={source,target:`media/${asset.id}-${variant}-${value.checksum.slice(0,12)}.${extensions[value.mimeType]||'bin'}`,checksum:value.checksum};
  }
  await writeFile(input+'.media.json',JSON.stringify(media));
  await render(join(root,'scripts/render-public-release.mjs'),input,output);
  const artifact=JSON.parse(await readFile(join(output,'release.json'),'utf8'));
  for(const [file,checksum]of Object.entries(artifact.files)){
   const path=resolve(output,file);if(!path.startsWith(output+require('node:path').sep))throw new Error('Invalid artifact path');
   if(createHash('sha256').update(await readFile(path)).digest('hex')!==checksum)throw new Error('Artifact checksum mismatch');
  }
  await rename(output,final).catch(async(error:NodeJS.ErrnoException)=>{
   if(!['EEXIST','EPERM','ENOTEMPTY'].includes(error.code||''))throw error;
   const prior=JSON.parse(await readFile(join(final,'release.json'),'utf8'));
   if(JSON.stringify(prior.files)!==JSON.stringify(artifact.files))throw new Error('Existing release artifact differs');
  });
  const completed={...manifest,artifact:{...artifact,directory:releaseId}};
  await prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${firmId+':website-activate'}))`;
   const latest=await tx.websitePublishRelease.findFirst({where:{firmId,status:'PUBLISHED'},orderBy:{version:'desc'}});
   await tx.websitePublishRelease.update({where:{id:releaseId},data:{status:latest&&latest.version>release.version?'ROLLED_BACK':'PUBLISHED',publishedAt:new Date(),manifest:completed}});
  },{maxWait:30000,timeout:30000});
  return {routeCount:artifact.routeCount};
 }catch(error){await prisma.websitePublishRelease.update({where:{id:releaseId},data:{status:'FAILED',error:error instanceof Error?error.message:String(error)}});throw error;}
}
