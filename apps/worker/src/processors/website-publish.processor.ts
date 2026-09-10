import type { Job } from 'bullmq';
import type { KkaPrismaClient } from '@kka/database';

export async function processWebsitePublish(job:Job,prisma:KkaPrismaClient){
  const {firmId,releaseId}=job.data as {firmId:string;releaseId:string};
  const release=await prisma.websitePublishRelease.findFirst({where:{id:releaseId,firmId}});
  if(!release)throw new Error('Website release not found');
  await prisma.websitePublishRelease.update({where:{id:releaseId},data:{status:'BUILDING',startedAt:new Date(),error:null}});
  try{
    const now=new Date();
    await prisma.$transaction(async tx=>{
      await tx.websitePage.updateMany({where:{firmId,status:'SCHEDULED',scheduledFor:{lte:now}},data:{status:'PUBLISHED',publishedAt:now}});
      await tx.websitePublication.updateMany({where:{firmId,status:'SCHEDULED',scheduledFor:{lte:now}},data:{status:'PUBLISHED',publishedAt:now}});
    });
    const [pages,publications,profiles,areas,settings]=await Promise.all([
      prisma.websitePage.findMany({where:{firmId,status:'PUBLISHED'},select:{id:true,slug:true,currentVersion:true,status:true,publishedAt:true},orderBy:{slug:'asc'}}),
      prisma.websitePublication.findMany({where:{firmId,status:'PUBLISHED'},select:{id:true,slug:true,currentVersion:true,status:true,publishedAt:true},orderBy:{slug:'asc'}}),
      prisma.websiteProfessionalProfile.findMany({where:{firmId,status:'PUBLISHED'},select:{id:true,slug:true,updatedAt:true},orderBy:{slug:'asc'}}),
      prisma.websitePracticeArea.findMany({where:{firmId,status:'PUBLISHED'},select:{id:true,slug:true,updatedAt:true},orderBy:{slug:'asc'}}),
      prisma.websiteSiteSettings.findUnique({where:{firmId},select:{updatedAt:true}}),
    ]);
    const manifest={
      version:release.version,generatedAt:now.toISOString(),
      pages:pages.map(x=>({id:x.id,slug:x.slug,version:x.currentVersion,status:x.status,publishedAt:x.publishedAt?.toISOString()??null})),
      publications:publications.map(x=>({id:x.id,slug:x.slug,version:x.currentVersion,status:x.status,publishedAt:x.publishedAt?.toISOString()??null})),
      professionals:profiles.map(x=>({id:x.id,slug:x.slug,updatedAt:x.updatedAt.toISOString()})),
      practiceAreas:areas.map(x=>({id:x.id,slug:x.slug,updatedAt:x.updatedAt.toISOString()})),
      settingsUpdatedAt:settings?.updatedAt.toISOString()??null,
      routeCount:pages.length+publications.length+profiles.length+areas.length,
    };
    await prisma.websitePublishRelease.update({where:{id:releaseId},data:{status:'PUBLISHED',publishedAt:now,manifest}});
    return manifest;
  }catch(error){
    await prisma.websitePublishRelease.update({where:{id:releaseId},data:{status:'FAILED',error:error instanceof Error?error.message:String(error)}});
    throw error;
  }
}
