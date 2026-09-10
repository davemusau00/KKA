import { createRequire } from 'node:module';
import { appendFile } from 'node:fs/promises';
const require=createRequire(new URL('../packages/database/package.json',import.meta.url));const {createPrismaClient}=require('./dist/src/index.js');
const db=createPrismaClient(process.env.DATABASE_URL);
if(!new URL(process.env.DATABASE_URL).pathname.endsWith('/kka_public_local'))throw new Error('Reference fixture is restricted to kka_public_local');
const firm=await db.firm.findFirst({orderBy:{createdAt:'asc'}});if(!firm)throw new Error('Seed the OS first');
await appendFile('.artifacts/public.env',`\nPUBLIC_BRANDING_FIRM_ID=${firm.id}\n`);
const block=(blockType,content,variant='default',theme='light')=>({blockType,content,variant,theme,visible:true});
const blocks=[
 block('HERO_JUSTICE',{eyebrow:'Kariuki Kagunda & Co. Advocates',title:'A LAW FIRM THAT\nFIGHTS FOR JUSTICE',description:'A dedicated law firm committed to protecting your rights and delivering justice.',ctaLabel:'Contact Us',ctaUrl:'/contact',quote:'?Justice\nis not an option.\nIt is a duty.?',values:[{title:'INTEGRITY',description:'Our Foundation'},{title:'EXCELLENCE',description:'Our Standard'},{title:'JUSTICE',description:'Our Purpose'}]}),
 block('FIRM_INTRODUCTION',{eyebrow:'Who We Are',title:'WE ARE A LEADING LAW FIRM IN KENYA WHICH OFFERS PRACTICAL AND PROFESSIONAL LEGAL SERVICES',description:'Kariuki Kagunda & Co. Advocates is a full-service law firm in Kenya committed to providing practical, innovative and result-oriented legal solutions to individuals, businesses and organisations.',bullets:['Practical legal services.','Expert service and experience.','Flexibility in legal solutions.','Innovative legal support.'],statement:'Experienced.\nTrusted.\nResults Driven.'}),
 block('PARTNER_LEADERSHIP',{eyebrow:'Our Partners',title:'EXPERIENCED TRUSTED LEADERSHIP',description:'Our partners bring decades of combined experience, delivering strategic legal solutions with integrity and excellence.',quote:'?Justice is not an option.\nIt is a duty.?'}),
 block('METRICS',{}),
 block('PRACTICE_GRID',{eyebrow:'Our Services',title:'COMPREHENSIVE LEGAL SOLUTIONS FOR ALL YOUR NEEDS',description:'We provide tailored legal solutions for individuals, businesses and institutions across Kenya.'},'home'),
 block('MEDIA_FEATURE',{eyebrow:'Legal Insights',title:'INSIGHTS & UPDATES',description:'Stay informed with our latest articles, legal updates and thought leadership on key legal issues in Kenya.'}),
 block('TEAM_FEATURE',{eyebrow:'Our Team',title:'MEET THE TEAM',description:'A team of dedicated professionals committed to achieving the best outcomes for our clients.',quote:'?A strong team\nbuilds stronger\nfutures.?'}),
 block('TESTIMONIALS',{eyebrow:'Testimonials',title:'SEE WHAT OUR CLIENTS SAY ABOUT US'}),
 block('CONSULTATION',{eyebrow:"Let?s Talk",title:'Let?s Start a Conversation!',description:'What can we help you with?',statement:'Your Legal Partner\nfor a Brighter\nTomorrow.'})
];
const home=await db.websitePage.findFirst({where:{firmId:firm.id,slug:'home'},include:{blocks:true}});
if(home&&!home.blocks.length){await db.websiteBlock.createMany({data:blocks.map((b,i)=>({...b,pageId:home.id,displayOrder:i,settings:{}}))});}
console.log('Reference homepage fixture prepared; business claims remain unverified development content.');await db.$disconnect();
