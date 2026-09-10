import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');
const output=join(root,'.artifacts','release-gap-audit',String(Date.now()));await mkdir(output,{recursive:true});
const response=await fetch('http://127.0.0.1:5175/');assert.equal(response.status,200);
const html=await response.text();const snapshot=JSON.parse(html.match(/<script id="site-snapshot" type="application\/json">(.*?)<\/script>/s)[1]);
const cached=JSON.parse(await readFile(join(root,'.artifacts/public-releases/last-served-release.json'),'utf8'));
assert.equal(String(cached.version),response.headers.get('x-website-release'));
snapshot.pages=snapshot.pages.filter(page=>page.slug!=='about');
const publication=snapshot.bootstrap.publications[0];assert.ok(publication);
publication.seo={...publication.seo,title:'AUDIT CUSTOM SEO TITLE',description:'AUDIT CUSTOM SEO DESCRIPTION',canonical:'https://example.test/audit-canonical'};
const portrait=snapshot.bootstrap.partners.find(p=>p.image)?.image;assert.ok(portrait);
const home=snapshot.pages.find(page=>page.slug==='home');
const videoUrl=`http://127.0.0.1:3016/api/v1/website/public/media/${portrait.id}`;
home.blocks[0].content.videoAssetId=portrait.id;home.blocks[0].content.videoUrl=videoUrl;
// An existing image is enough to test URL localization; this does not claim video playback.
const source=join(root,'.artifacts/public-releases',cached.id,portrait.url.replace(/^\//,''));
const checksum=createHash('sha256').update(await readFile(source)).digest('hex');
const input=join(output,'snapshot.json');await writeFile(input,JSON.stringify(snapshot));
await writeFile(input+'.media.json',JSON.stringify({[portrait.id+':original']:{source,target:'media/audit-source.png',checksum}}));
const artifact=join(output,'site');
const render=()=>new Promise((done,fail)=>{const child=spawn(process.execPath,[join(root,'scripts/render-public-release.mjs'),input,artifact],{windowsHide:true,stdio:['ignore','pipe','pipe']});let error='';child.stdout.resume();child.stderr.on('data',data=>error+=data);child.on('error',fail);child.on('exit',code=>code===0?done():fail(new Error(error)));});
let missingCorePageRejected=false;try{await render();}catch(error){missingCorePageRejected=/Required public page is missing/.test(String(error));}
snapshot.pages.push({id:'audit-about',slug:'about',title:'About Us',description:'Audit fixture',seo:{},blocks:[{id:'audit-about-block',blockType:'RICH_TEXT',variant:'default',theme:'light',content:{title:'About audit fixture',body:'Audit fixture'},settings:{}}]});
await writeFile(input,JSON.stringify(snapshot));await render();
const about=await readFile(join(artifact,'about/index.html'),'utf8');const article=await readFile(join(artifact,'insights',publication.slug,'index.html'),'utf8');
const renderedHome=await readFile(join(artifact,'index.html'),'utf8');const renderedSnapshot=JSON.parse(renderedHome.match(/<script id="site-snapshot" type="application\/json">(.*?)<\/script>/s)[1]);
const results={
 baseRelease:cached.version,
 missingCorePageRejected,
 customSeoTitleApplied:article.match(/<title>(.*?)<\/title>/s)[1].includes('AUDIT CUSTOM SEO TITLE'),
 customSeoDescriptionApplied:article.match(/<meta name="description" content="(.*?)"/s)[1].includes('AUDIT CUSTOM SEO DESCRIPTION'),
 customCanonicalApplied:article.match(/<link rel="canonical" href="(.*?)"/s)[1].includes('example.test/audit-canonical'),
 scalarVideoUrlLocalized:renderedSnapshot.pages.find(p=>p.slug==='home').blocks[0].content.videoUrl!==videoUrl,
 artifact
};
await writeFile(join(output,'findings.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
