import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {open,mkdir,readFile,cp,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../packages/database/package.json',import.meta.url));const {Client}=require('pg');
const url=new URL(process.env.DATABASE_URL);assert.equal(url.pathname,'/kka_public_local');
const restoreName='kka_public_restore_'+Date.now();const directory='.artifacts/public-backup/'+restoreName;
await mkdir(directory,{recursive:true});const dump=join(directory,'database.dump');
const client=new Client({connectionString:url.href});await client.connect();
async function docker(args,stdio){await new Promise((done,fail)=>{const p=spawn('docker',['exec',...args],{windowsHide:true,stdio});let error='';p.stderr?.on('data',d=>error+=d);p.on('error',fail);p.on('exit',code=>code===0?done():fail(new Error('Backup command failed: '+error)));});}
let restored;
try{
 const output=await open(dump,'w');try{await docker(['kka-local-postgres','pg_dump','-U',decodeURIComponent(url.username),'-d','kka_public_local','-Fc'],['ignore',output.fd,'pipe']);}finally{await output.close();}
 const checksum=createHash('sha256').update(await readFile(dump)).digest('hex');
 await client.query('CREATE DATABASE '+restoreName);
 const input=await open(dump,'r');try{await docker(['-i','kka-local-postgres','pg_restore','-U',decodeURIComponent(url.username),'-d',restoreName,'--no-owner','--no-privileges'],[input.fd,'ignore','pipe']);}finally{await input.close();}
 const restoreUrl=new URL(url);restoreUrl.pathname='/'+restoreName;restored=new Client({connectionString:restoreUrl.href});await restored.connect();
 const counts={};for(const table of ['WebsitePage','WebsitePublication','WebsiteLead','WebsiteFormSubmission','WebsitePublishRelease']){
  const source=(await client.query(`SELECT count(*)::int AS count FROM "${table}"`)).rows[0].count;
  assert.equal((await restored.query(`SELECT count(*)::int AS count FROM "${table}"`)).rows[0].count,source);counts[table]=source;
 }
 const release=(await restored.query('SELECT id, manifest FROM "WebsitePublishRelease" WHERE status=\'PUBLISHED\' ORDER BY version DESC')).rows.find(r=>r.manifest?.artifact);
 assert.ok(release);const artifact=join(directory,'active-release');await cp(join(process.env.WEBSITE_RELEASE_ROOT,release.id),artifact,{recursive:true});
 for(const [file,hash]of Object.entries(release.manifest.artifact.files))assert.equal(createHash('sha256').update(await readFile(join(artifact,file))).digest('hex'),hash);
 await writeFile(join(directory,'verification.json'),JSON.stringify({restoreDatabase:restoreName,sha256:checksum,counts,releaseId:release.id,artifactFiles:Object.keys(release.manifest.artifact.files).length},null,2));
 console.log('Backup rehearsal passed: isolated database restored, table counts matched, active release files verified. Evidence: '+directory);
}finally{await restored?.end();await client.end();}
