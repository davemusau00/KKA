import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
if(new URL(process.env.DATABASE_URL).pathname!=='/kka_public_local')throw new Error('Isolated local database required');
let baseline;for(let attempt=0;attempt<50;attempt++){try{baseline=await fetch('http://127.0.0.1:5175/',{signal:AbortSignal.timeout(2000)});break;}catch{await new Promise(r=>setTimeout(r,200));}}assert.equal(baseline?.status,200);
const html=await baseline.text();const image=html.match(/src="(\/media\/[^\"]+)"/)?.[1];assert.ok(image);
const unavailable=new URL(process.env.DATABASE_URL);unavailable.port='1';
const child=spawn(process.execPath,['scripts/serve-public-release.mjs'],{windowsHide:true,env:{...process.env,DATABASE_URL:unavailable.href,PUBLIC_SITE_PORT:'5176'},stdio:'ignore'});
try{
 let response;for(let attempt=0;attempt<50;attempt++){try{response=await fetch('http://127.0.0.1:5176/',{signal:AbortSignal.timeout(1000)});break;}catch{await new Promise(r=>setTimeout(r,200));}}
 assert.equal(response?.status,200,'Cold start serves the retained release while the database is unreachable');
 assert.equal(response.headers.get('x-website-release'),baseline.headers.get('x-website-release'));
 assert.equal(await response.text(),html);
 assert.equal((await fetch('http://127.0.0.1:5176'+image)).status,200,'Static images remain available');
 console.log('Recovery passed: cold start without database serves the retained HTML and media.');
}finally{child.kill();}
