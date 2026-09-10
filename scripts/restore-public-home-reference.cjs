const {createRequire}=require('node:module');const {resolve}=require('node:path');createRequire(resolve('apps/api/package.json'))('reflect-metadata');
const {PrismaService}=require('../apps/api/dist/platform/prisma/prisma.service');const {AuditService}=require('../apps/api/dist/platform/audit/audit.service');const {SiteContentService}=require('../apps/api/dist/modules/website/site-content.service');const {WebsiteAdminService}=require('../apps/api/dist/modules/website/website-admin.service');
(async()=>{
 if(new URL(process.env.DATABASE_URL).pathname!=='/kka_public_local')throw new Error('Only isolated reference fixtures may be restored');
 const prisma=new PrismaService();try{
  const content=new SiteContentService(prisma),cms=new WebsiteAdminService(prisma,new AuditService(prisma));
  const user={...await prisma.client.user.findFirst({where:{firmId:process.env.PUBLIC_BRANDING_FIRM_ID}}),permissions:['website.edit','website.review'],roleKeys:[]};
  const published=await content.page('home');const current=await cms.page(user,published.id);
  const blocks=published.blocks.map(block=>{const c={...block.content};if(typeof c.quote==='string'&&c.quote.startsWith('?')&&c.quote.endsWith('?'))c.quote=c.quote.slice(1,-1);if(block.blockType==='FIRM_INTRODUCTION')c.mobileTitle='WE ARE A LEADING LAW FIRM IN KENYA';return {...block,content:c};});
  await cms.savePage(user,{...published,currentVersion:current.currentVersion,status:'APPROVED',blocks});
  console.log('Local homepage restored from its active reference content, with corrected fixture punctuation and mobile heading.');
 }finally{await prisma.onModuleDestroy();}
})().catch(error=>{console.error(error);process.exitCode=1;});
