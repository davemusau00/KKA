import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const [input, destination]=process.argv.slice(2);
if(!input||!destination)throw new Error('Usage: render-public-release.mjs snapshot.json output-directory');
const root=resolve(import.meta.dirname,'..');
const snapshot=JSON.parse(await readFile(input,'utf8'));
if(snapshot.schemaVersion!==1)throw new Error('Unsupported snapshot version');
const requiredPages=['home','about','practice-areas','team','insights','contact'];
const pagesBySlug=new Map(snapshot.pages.map(page=>[page.slug,page]));
for(const slug of requiredPages)if(!pagesBySlug.get(slug)?.blocks?.length)throw new Error(`Required public page is missing or empty: ${slug}`);
const {render}=await import(pathToFileURL(join(root,'apps/site/dist-server/entry-server.js')).href);
const source=join(root,'apps/site/dist');
await mkdir(destination,{recursive:true});
await cp(source,destination,{recursive:true});
const media=JSON.parse(await readFile(input+'.media.json','utf8'));
for(const item of Object.values(media)){
 const target=join(destination,item.target);await mkdir(join(destination,'media'),{recursive:true});
 await cp(item.source,target);
 if(createHash('sha256').update(await readFile(target)).digest('hex')!==item.checksum)throw new Error('Copied media checksum mismatch');
}
function localize(value){
 if(!value||typeof value!=='object')return;
 if(value.videoAssetId&&media[value.videoAssetId+':original'])value.videoUrl='/'+media[value.videoAssetId+':original'].target;
 if(value.id&&media[value.id+':original']&&value.url){
  value.url='/'+media[value.id+':original'].target;
  for(const [key,variant]of Object.entries(value.variants||{}))if(media[value.id+':'+key])variant.url='/'+media[value.id+':'+key].target;
 }
 for(const nested of Object.values(value))localize(nested);
}
localize(snapshot);
const template=await readFile(join(source,'index.html'),'utf8');
const b=snapshot.bootstrap;
const origin=process.env.PUBLIC_SITE_ORIGIN||'http://127.0.0.1:5175';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const routes=new Map([['/',{title:b.settings.firmName,description:b.settings.tagline}],['/about',{title:'About Us'}],['/practice-areas',{title:'Areas of Practice'}],['/team',{title:'Our Team'}],['/insights',{title:'Legal Insights'}],['/contact',{title:'Contact Us'}],['/search',{title:'Search',noindex:true}]]);
for(const p of snapshot.pages){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))throw new Error('Invalid page slug');routes.set(p.slug==='home'?'/':`/${p.slug}`,{...p,...p.seo});}
for(const [key,prefix]of [['partners','team'],['practiceAreas','practice-areas'],['publications','insights']])for(const p of b[key]){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))throw new Error('Invalid content slug');
 const seo=p.seo||{};routes.set(`/${prefix}/${p.slug}`,{...p,...seo,title:seo.title||p.title||p.name,description:seo.description||p.excerpt||p.summary,canonical:seo.canonical,noindex:seo.noindex});
}
const supported=new Set(['HERO','RICH_TEXT','QUOTE','IMAGE_TEXT','PRACTICE_GRID','PROFESSIONAL_GRID','INSIGHTS_GRID','METRICS','FAQ','CTA','SPACER','HERO_JUSTICE','FIRM_INTRODUCTION','PARTNER_LEADERSHIP','MEDIA_FEATURE','TEAM_FEATURE','TESTIMONIALS','CONSULTATION']);
for(const p of snapshot.pages)for(const block of p.blocks)if(!supported.has(block.blockType))throw new Error(`Unsupported block: ${block.blockType}`);
for(const [url,meta]of [...routes,['/404',{title:'Page not found',noindex:true}]]){
 const body=await render(url,snapshot);
 if(body.includes('Website temporarily unavailable')||(url!=='/404'&&body.includes('THIS PAGE HAS LEFT THE COURTROOM.')))throw new Error(`Incomplete render: ${url}`);
 const canonical=meta.canonical?new URL(meta.canonical,origin).href:new URL(url,origin).href;
 const description=meta.description||b.settings.tagline;
 const structured={'@context':'https://schema.org','@type':meta.kind==='ARTICLE'?'Article':'LegalService',name:meta.title,url:canonical,...(meta.kind==='ARTICLE'?{headline:meta.title,datePublished:meta.publishedAt}:{telephone:b.settings.phone,email:b.settings.email})};
 const head=`<title>${escape(meta.title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}"><meta name="robots" content="${meta.noindex?'noindex,nofollow':'index,follow'}"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><script type="application/ld+json">${safeJson(structured)}</script>`;
 const html=template.replace(/<title>.*?<\/title>/s,'').replace(/<meta name="description"[^>]*>/g,'').replace('</head>',head+'</head>').replace('<div id="root"></div>',`<div id="root">${body}</div><script id="site-snapshot" type="application/json">${safeJson(snapshot)}</script>`);
 const dir=url==='/'?destination:join(destination,url.slice(1));await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),html);
}
const publicRoutes=[...routes].filter(([,m])=>!m.noindex);
await writeFile(join(destination,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes.map(([u])=>`<url><loc>${escape(new URL(u,origin).href)}</loc></url>`).join('')}</urlset>`);
await writeFile(join(destination,'rss.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(b.settings.firmName)}</title><link>${escape(origin)}</link><description>${escape(b.settings.tagline)}</description>${b.publications.map(p=>`<item><title>${escape(p.title)}</title><link>${escape(new URL('/insights/'+p.slug,origin).href)}</link><description>${escape(p.excerpt)}</description></item>`).join('')}</channel></rss>`);
await writeFile(join(destination,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const files={};
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())await walk(path);else files[relative(destination,path).replaceAll('\\','/')]=createHash('sha256').update(await readFile(path)).digest('hex');}}
await walk(destination);
await writeFile(join(destination,'release.json'),JSON.stringify({schemaVersion:1,routeCount:routes.size,routes:[...routes.keys()],files}));
console.log(JSON.stringify({routeCount:routes.size,files:Object.keys(files).length}));
