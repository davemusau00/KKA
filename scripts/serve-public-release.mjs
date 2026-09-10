import { createServer, request as proxyRequest } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../packages/database/package.json',import.meta.url));const {createPrismaClient}=require('./dist/src/index.js');
const db=createPrismaClient(process.env.DATABASE_URL);const root=resolve(process.env.WEBSITE_RELEASE_ROOT||'.artifacts/public-releases');
let active;const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.mp4':'video/mp4','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
   const upstream=new URL(req.url,process.env.SITE_API_ORIGIN||'http://127.0.0.1:3016');
   const proxy=proxyRequest(upstream,{method:req.method,headers:{...req.headers,host:upstream.host}},reply=>{res.writeHead(reply.statusCode||502,reply.headers);reply.pipe(res);});
   proxy.on('error',()=>{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'The enquiry service is temporarily unavailable. Please retry.'}));});req.pipe(proxy);return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try{const rows=await db.websitePublishRelease.findMany({where:{firmId:process.env.PUBLIC_BRANDING_FIRM_ID,status:'PUBLISHED'},orderBy:{version:'desc'}});active=rows.find(r=>r.manifest?.schemaVersion===1&&r.manifest?.artifact)||active;}catch(error){if(!active)throw error;}
  if(!active){res.writeHead(503,{'Content-Type':'text/plain'});res.end('No completed website release is available.');return;}
  const manifest=active.manifest;let relative=decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g,'');
  if(!relative||!extname(relative))relative=(relative?relative+'/':'')+'index.html';
  let status=200;if(!manifest.artifact.files[relative]){relative='404/index.html';status=404;}
  const directory=resolve(root,active.id);const file=resolve(directory,relative);
  if(!file.startsWith(directory+sep))throw new Error('Invalid public path');
  const bytes=await readFile(file);
  res.writeHead(status,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':bytes.length,'X-Website-Release':String(active.version),'X-Content-Type-Options':'nosniff','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});
  res.end(req.method==='HEAD'?undefined:bytes);
 }catch(error){res.writeHead(503,{'Content-Type':'text/plain'});res.end('Website temporarily unavailable.');}
});
server.listen(Number(process.env.PUBLIC_SITE_PORT||5175),'127.0.0.1',()=>console.log('Public release server listening on '+(process.env.PUBLIC_SITE_PORT||5175)));
process.on('SIGTERM',()=>server.close(()=>void db.$disconnect()));
