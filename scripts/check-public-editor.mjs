import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.setDefaultTimeout(60000);
try{
 const csrf=await (await context.request.get('http://127.0.0.1:3016/api/v1/auth/csrf')).json();
 const login=await context.request.post('http://127.0.0.1:3016/api/v1/auth/login',{headers:{'X-CSRF-Token':csrf.token},data:{email:process.env.SEED_ADMIN_EMAIL,password:process.env.SEED_ADMIN_PASSWORD}});assert.equal(login.status(),201);
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('button',{name:'Website & Growth',exact:true}).click();
 await page.getByRole('button',{name:'Pages',exact:true}).click();
 const pages=await (await context.request.get('http://127.0.0.1:3016/api/v1/website/admin/pages')).json();const home=pages.find(p=>p.slug==='home');assert.ok(home);
 await page.getByRole('button',{name:'Edit '+home.title,exact:true}).click();
 await page.getByRole('button',{name:'Preview saved draft',exact:true}).click();
 const preview=page.frameLocator('iframe[title="Public website draft preview"]');
 await preview.locator('.hero-copy h1').waitFor();
 const image=preview.locator('.partner-leadership img').first();await image.waitFor({state:'attached'});
 assert.ok((await image.getAttribute('src')).startsWith('blob:'),'Private preview resolves authenticated image blobs');
 await image.evaluate(async i=>{i.loading='eager';await i.decode();});
 assert.equal(await image.evaluate(i=>i.complete&&i.naturalWidth>0),true);
 assert.equal(await preview.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
 await page.screenshot({path:'.artifacts/public-browser/editor-preview.png'});
 console.log('Authenticated OS editor opens the saved draft in a private iframe with working portrait media.');
}finally{await browser.close();}
