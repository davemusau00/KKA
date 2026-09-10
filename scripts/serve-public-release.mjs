import { createServer, request as proxyRequest } from 'node:http';
import { readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../packages/database/package.json',import.meta.url));const {createPrismaClient}=require('./dist/src/index.js');
const db=createPrismaClient(process.env.DATABASE_URL);const root=resolve(process.env.WEBSITE_RELEASE_ROOT||'.artifacts/public-releases');
let active;const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.mp4':'video/mp4','.woff2':'font/woff2'};
const cache=join(root,'last-served-release.json');
try{const previous=JSON.parse(await readFile(cache,'utf8'));if(previous.firmId===process.env.PUBLIC_BRANDING_FIRM_ID&&/^[a-zA-Z0-9_-]+$/.test(previous.id)&&previous.manifest?.artifact){
 const artifact=JSON.parse(await readFile(join(root,previous.id,'release.json'),'utf8'));
 if(Object.keys(artifact.files).length===Object.keys(previous.manifest.artifact.files).length&&Object.entries(artifact.files).every(([path,hash])=>previous.manifest.artifact.files[path]===hash))active=previous;
}}catch{}
let refresh,checkedAt=0;
function refreshRelease(){
 if(!refresh)refresh=db.websitePublishRelease.findMany({where:{firmId:process.env.PUBLIC_BRANDING_FIRM_ID,status:'PUBLISHED'},orderBy:{version:'desc'}}).then(async rows=>{
  const next=rows.find(r=>r.manifest?.schemaVersion===1&&r.manifest?.artifact);
  if(next&&next.id!==active?.id){const temp=cache+'.'+process.pid+'.tmp';await writeFile(temp,JSON.stringify(next));await rename(temp,cache);active=next;}
 }).finally(()=>{checkedAt=Date.now();refresh=undefined;});
 return refresh;
}
async function retainedAsset(relative){
 if(!/^(?:assets|media)\/[A-Za-z0-9._/-]+$/.test(relative))return null;
 for(const entry of await readdir(root,{withFileTypes:true})){
  if(!entry.isDirectory()||entry.name===active?.id||!/^[A-Za-z0-9_-]+$/.test(entry.name))continue;
  try{const manifest=JSON.parse(await readFile(join(root,entry.name,'release.json'),'utf8'));if(!manifest.files?.[relative])continue;return {directory:resolve(root,entry.name),version:entry.name,manifest};}catch{}
 }
 return null;
}
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
   const upstream=new URL(req.url,process.env.SITE_API_ORIGIN||'http://127.0.0.1:3016');
   const proxy=proxyRequest(upstream,{method:req.method,headers:{...req.headers,host:upstream.host}},reply=>{res.writeHead(reply.statusCode||502,reply.headers);reply.pipe(res);});
   proxy.on('error',()=>{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'The enquiry service is temporarily unavailable. Please retry.'}));});req.pipe(proxy);return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(!active)await refreshRelease();else if(Date.now()-checkedAt>2000)void refreshRelease().catch(()=>{});
  if(!active){res.writeHead(503,{'Content-Type':'text/plain'});res.end('No completed website release is available.');return;}
  const manifest=active.manifest;let relative=decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g,'');
  if(!relative||!extname(relative))relative=(relative?relative+'/':'')+'index.html';
  let status=200;let directory=resolve(root,active.id);let releaseHeader=String(active.version);
  if(!manifest.artifact.files[relative]){
   const retained=await retainedAsset(relative);
   if(retained){directory=retained.directory;releaseHeader=retained.version;}
   else{relative='404/index.html';status=404;}
  }
  const file=resolve(directory,relative);
  if(!file.startsWith(directory+sep))throw new Error('Invalid public path');
  const bytes=await readFile(file);let body=bytes;
  const headers={'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':bytes.length,'X-Website-Release':releaseHeader,'X-Content-Type-Options':'nosniff','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600','Accept-Ranges':'bytes'};
  if(status===200&&req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   let start=match?.[1]?Number(match[1]):Math.max(0,bytes.length-Number(match?.[2]));
   let end=match?.[1]&&match?.[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1;
   if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=bytes.length){res.writeHead(416,{'Content-Range':`bytes */${bytes.length}`});res.end();return;}
   status=206;body=bytes.subarray(start,end+1);headers['Content-Range']=`bytes ${start}-${end}/${bytes.length}`;headers['Content-Length']=body.length;
  }
  res.writeHead(status,headers);res.end(req.method==='HEAD'?undefined:body);
 }catch(error){res.writeHead(503,{'Content-Type':'text/plain'});res.end('Website temporarily unavailable.');}
});
server.listen(Number(process.env.PUBLIC_SITE_PORT||5175),'127.0.0.1',()=>console.log('Public release server listening on '+(process.env.PUBLIC_SITE_PORT||5175)));
process.on('SIGTERM',()=>server.close(()=>void db.$disconnect()));
