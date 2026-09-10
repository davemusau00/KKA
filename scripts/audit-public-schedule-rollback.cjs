const{createRequire}=require('node:module');const{resolve}=require('node:path');const{randomUUID}=require('node:crypto');
createRequire(resolve('apps/api/package.json'))('reflect-metadata');
const{PrismaService}=require('../apps/api/dist/platform/prisma/prisma.service');
const{WebsitePublishingService}=require('../apps/api/dist/modules/website/website-publishing.service');
(async()=>{
 if(new URL(process.env.DATABASE_URL).pathname!=='/kka_public_local')throw new Error('Isolated local database required');
 const prisma=new PrismaService();const db=prisma.client;const rollbackProbe=new Error('Rollback audit transaction intentionally aborted');let findings;
 try{
  const user=await db.user.findFirstOrThrow({where:{firmId:process.env.PUBLIC_BRANDING_FIRM_ID}});
  const prior=await db.websitePublishRelease.findFirstOrThrow({where:{firmId:user.firmId,status:'PUBLISHED'},orderBy:{version:'desc'}});
  const wrapped={client:{websitePublishRelease:db.websitePublishRelease,$transaction:callback=>db.$transaction(async tx=>{
   const page=await tx.websitePage.create({data:{firmId:user.firmId,slug:'audit-scheduled-'+randomUUID(),title:'Scheduled audit fixture',description:'Rollback-only audit fixture',status:'SCHEDULED',scheduledFor:new Date(Date.now()-60000)}});
   const release=await callback(tx);const after=await tx.websitePage.findUniqueOrThrow({where:{id:page.id}});
   findings={rollbackOf:prior.version,duePageStatusDuringRollback:after.status,duePageIncludedInRollbackSnapshot:release.manifest.snapshot.pages.some(p=>p.id===page.id),transactionCommitted:false};
   throw rollbackProbe;
  },{timeout:30000})}};
  const publisher=new WebsitePublishingService(wrapped,{},{record:async()=>{}},{});
  try{await publisher.rollback(user,prior.version);}catch(error){if(error!==rollbackProbe)throw error;}
  console.log(JSON.stringify(findings,null,2));
 }finally{await prisma.onModuleDestroy();}
})().catch(error=>{console.error(error);process.exitCode=1;});
