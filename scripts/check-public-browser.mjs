import {createRequire}from'node:module';import{mkdir,writeFile}from'node:fs/promises';import assert from'node:assert/strict';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));const {chromium}=require('@playwright/test');
await mkdir('.artifacts/public-browser',{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const width of [360,390,430,640,768,1024,1280,1440,1920]){
  await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:5175/',{waitUntil:'domcontentloaded'});
  await page.locator('.hero-copy h1').waitFor();await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
  await page.screenshot({path:`.artifacts/public-browser/home-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5175/');
 await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'Close menu'}).click();
 await page.locator('.lead-form button[type=submit]').click();await page.getByText('Please correct the highlighted fields.').waitFor();
 await page.locator('.lead-form [name=name]').fill('Browser acceptance enquiry');await page.locator('.lead-form [name=phone]').fill('0712345678');await page.locator('.lead-form [name=email]').fill('browser@example.test');await page.locator('.lead-form [name=message]').fill('Please review this local browser integration test enquiry.');await page.locator('.lead-form [name=consent]').check();
 await page.locator('.lead-form button[type=submit]').click();await page.locator('.lead-success strong').waitFor();const reference=await page.locator('.lead-success strong').innerText();
 const login=await context.request.post('http://127.0.0.1:3016/api/v1/auth/login',{data:{email:process.env.SEED_ADMIN_EMAIL,password:process.env.SEED_ADMIN_PASSWORD}});assert.equal(login.status(),201);
 const leads=await context.request.get('http://127.0.0.1:3016/api/v1/website/admin/leads?q='+encodeURIComponent(reference));assert.equal(leads.status(),200);assert.ok((await leads.json()).some(l=>l.reference===reference));
 await page.reload();await page.locator('.lead-form').waitFor();
 const missing=await context.request.get('http://127.0.0.1:5175/does-not-exist');assert.equal(missing.status(),404);
 assert.deepEqual(errors,[],'Browser page errors');
 await writeFile('.artifacts/public-browser/result.json',JSON.stringify({widths:[360,390,430,640,768,1024,1280,1440,1920],form:'persisted and visible in authenticated lead list',reference,errors},null,2));
 console.log('Browser verification passed: nine widths, menu, validation, persisted enquiry, reload, authenticated lead visibility and 404.');
}finally{await browser.close();}
