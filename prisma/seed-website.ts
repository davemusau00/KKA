import 'dotenv/config';
import { createPrismaClient } from '../packages/database/src';

const prisma=createPrismaClient(process.env.DATABASE_URL!);
const slug=(v:string)=>v.toLowerCase().trim().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

async function main(){
  const firmId=process.env.PUBLIC_BRANDING_FIRM_ID || process.env.PUBLIC_FIRM_ID || (await prisma.firm.findFirst({orderBy:{createdAt:'asc'}}))?.id;
  if(!firmId) throw new Error('No firm exists. Set PUBLIC_BRANDING_FIRM_ID or seed KKA first.');

  await prisma.websiteSiteSettings.upsert({where:{firmId},update:{},create:{
    firmId,firmName:'Kariuki Kagunda & Co. Advocates',tagline:'Justice Today. A Stronger Tomorrow.',
    phone:'0722685101 / 0796264899',email:'info@kariukikagunda.co.ke',
    address:'Cianda House, 10th Floor, Suite 1007, Koinange Street, Nairobi, Kenya',
    socials:[{label:'LinkedIn',url:'#'},{label:'X',url:'#'},{label:'Facebook',url:'#'},{label:'YouTube',url:'#'}],
    navigation:[{label:'Home',url:'/'},{label:'About Us',url:'/about'},{label:'Area of Practice',url:'/practice-areas'},{label:'Our Team',url:'/team'},{label:'Contact Us',url:'/contact'}],
    footer:{statement:'A dedicated law firm committed to protecting your rights and delivering justice.'},
    defaultSeo:{title:'Kariuki Kagunda & Co. Advocates',description:'Practical, innovative and result-oriented legal services in Kenya.'},
    theme:{identity:'public-editorial',navy:'#061623',gold:'#CDA05C',ivory:'#FBF8F2'}
  }});

  const areas=[
    ['Conveyance','Property transfers, due diligence and real estate transactions.','building',['Title due diligence','Sale agreements','Transfers and registrations','Leases and property advisory']],
    ['E-commerce and Virtual Assets','Legal support for online businesses, platforms and digital assets.','briefcase',['Platform terms','Privacy and data protection','Digital contracts','Virtual asset advisory']],
    ['Intellectual Property','Protection of inventions, brands and creative works.','copyright',['Trademark advisory','Copyright','Licensing','IP enforcement']],
    ['Personal Injury Claims','Support for people injured through the negligence of another party.','gavel',['Road traffic claims','Workplace injury claims','Medical evidence coordination','Negotiation and litigation']],
    ['Employment Disputes','Advice and representation for employers and employees.','scale',['Employment contracts','Disciplinary processes','Termination disputes','Employment litigation']],
  ] as const;
  for(let i=0;i<areas.length;i++){
    const [title,summary,icon,services]=areas[i];
    await prisma.websitePracticeArea.upsert({where:{firmId_slug:{firmId,slug:slug(title)}},update:{},create:{firmId,slug:slug(title),title,summary,description:summary,icon,services:[...services],faqs:[],featured:true,displayOrder:i+1,status:'PUBLISHED',publishedAt:new Date()}});
  }

  const profiles=[
    {slug:'kariuki-kagunda',name:'Kariuki Kagunda',title:'Partner',summary:'Strategic counsel with a practical, client-first approach.',bio:'Partner of Kariuki Kagunda & Co. Advocates, providing practical and disciplined legal counsel across the firm’s areas of practice.',email:'legal@kariukikagunda.co.ke',practiceAreaSlugs:['personal-injury-claims','employment-disputes','conveyance'],displayOrder:1},
    {slug:'wanjiru-kagunda',name:'Wanjiru Kagunda',title:'Partner',summary:'Client-focused legal counsel combining precision, empathy and commercial awareness.',bio:'Partner of Kariuki Kagunda & Co. Advocates, focused on responsive client service and practical legal outcomes.',email:'info@kariukikagunda.co.ke',practiceAreaSlugs:['intellectual-property','e-commerce-and-virtual-assets','conveyance'],displayOrder:2}
  ];
  for(const p of profiles) await prisma.websiteProfessionalProfile.upsert({where:{firmId_slug:{firmId,slug:p.slug}},update:{},create:{firmId,...p,credentials:['Advocate of the High Court of Kenya'],memberships:['Law Society of Kenya'],education:[],featured:true,status:'PUBLISHED',publishedAt:new Date()}});

  for(const [i,m] of [['50+','Clients and Partners','users'],['70+','Cases Cleared','gavel'],['15+','Years of Experience','shield'],['100%','Client-focused Solutions','award']].entries()){
    const [value,label,icon]=m; const existing=await prisma.websiteMetric.findFirst({where:{firmId,label}});
    if(!existing) await prisma.websiteMetric.create({data:{firmId,value,label,icon,displayOrder:i+1,status:'PUBLISHED'}});
  }
  const testimonials=[
    ['Trustworthy, efficient, and highly professional!','These lawyers are quite professional, very thorough at their work, and good at communication.'],
    ['Exceptional service, highly recommended!','Clear advice, responsive communication and a professional experience throughout.'],
    ['Highly knowledgeable and practical.','The team made a complex legal issue easier to understand and act on.']
  ];
  for(let i=0;i<testimonials.length;i++){
    const [title,quote]=testimonials[i]; const existing=await prisma.websiteTestimonial.findFirst({where:{firmId,title}});
    if(!existing) await prisma.websiteTestimonial.create({data:{firmId,title,quote,source:'Client testimonial',rating:5,featured:true,displayOrder:i+1,status:'PUBLISHED'}});
  }
  await prisma.websiteFormDefinition.upsert({where:{firmId_key:{firmId,key:'general-enquiry'}},update:{},create:{firmId,key:'general-enquiry',name:'General Website Enquiry',schema:{fields:['name','email','phone','practiceAreaSlug','message','consent']},routing:{destination:'website-leads'},consentText:'I consent to Kariuki Kagunda & Co. Advocates using these details to respond to my enquiry.',active:true,version:1}});

  const pages=[
    ['home','Home','A law firm that fights for justice.'],['about','About Us','Learn about Kariuki Kagunda & Co. Advocates.'],
    ['practice-areas','Areas of Practice','Explore the firm’s legal services.'],['team','Our Team','Meet the professionals behind the firm.'],
    ['insights','Insights & Updates','Legal insights, articles and media.'],['contact','Contact Us','Start a conversation with our legal team.']
  ];
  for(const [s,title,description] of pages) await prisma.websitePage.upsert({where:{firmId_slug:{firmId,slug:s}},update:{},create:{firmId,slug:s,title,description,status:'PUBLISHED',seo:{title:`${title} | Kariuki Kagunda & Co. Advocates`,description},publishedAt:new Date()}});

  const publications=[
    {slug:'role-of-law-in-a-changing-kenya',kind:'VIDEO' as const,title:'The Role of Law in a Changing Kenya',excerpt:'A practical look at how law adapts to a fast-changing society.',body:'Legal systems must preserve certainty while responding to new technologies, markets and social expectations.',duration:'3:45'},
    {slug:'protecting-intellectual-property-digital-age',kind:'ARTICLE' as const,title:'Protecting Intellectual Property in the Digital Age',excerpt:'What creators and businesses should consider when valuable work moves online.',body:'A practical protection strategy combines registration where available, contracts, evidence of ownership, licensing discipline and proportionate enforcement.'},
    {slug:'employment-law-reforms-what-you-need-to-know',kind:'ARTICLE' as const,title:'Employment Law Reforms: What You Need to Know',excerpt:'A concise guide to reviewing workplace policies when the legal landscape changes.',body:'Employers should keep contracts, policies, disciplinary processes and record keeping aligned with current legal requirements and actual workplace practice.'}
  ];
  for(const p of publications) await prisma.websitePublication.upsert({where:{firmId_slug:{firmId,slug:p.slug}},update:{},create:{firmId,...p,practiceAreaSlugs:[],tags:[],status:'PUBLISHED',seo:{title:p.title,description:p.excerpt},publishedAt:new Date()}});

  console.log(`KKA public website seed complete for firm ${firmId}`);
}
main().finally(()=>prisma.$disconnect());
