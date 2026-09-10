import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));const {chromium}=require('@playwright/test');
const origin=process.env.MENU_TEST_ORIGIN||'http://127.0.0.1:5174';
const output='.artifacts/public-menu/'+Date.now();await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
try{
 for(const width of [360,390,430,640,768,1024,1200])for(const scrolled of [false,true]){
  await page.setViewportSize({width,height:844});await page.goto(origin);await page.locator('.hero-copy h1').waitFor();
  if(scrolled){await page.evaluate(()=>scrollTo(0,900));await page.locator('.site-header.is-compact').waitFor();}
  await page.getByRole('button',{name:'Open menu'}).click();const menu=page.getByRole('dialog',{name:'Site navigation'});
  await menu.waitFor();await menu.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  const geometry=await menu.evaluate(el=>{const r=el.getBoundingClientRect();const css=getComputedStyle(el);return {x:r.x,y:r.y,width:r.width,height:r.height,background:css.backgroundColor,covered:el.contains(document.elementFromPoint(innerWidth/2,innerHeight-10)),locked:getComputedStyle(document.body).overflow};});
  assert.equal(geometry.x,0);assert.equal(geometry.y,0);assert.equal(geometry.width,width);assert.equal(geometry.height,844);assert.equal(geometry.background,'rgb(6, 22, 35)');assert.ok(geometry.covered);assert.equal(geometry.locked,'hidden');
  assert.ok(await menu.getByRole('link',{name:'Home',exact:true}).isVisible());
  if([390,768].includes(width))await page.screenshot({path:`${output}/menu-${width}-${scrolled?'scrolled':'top'}.png`});
  await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});assert.equal(await page.getByRole('button',{name:'Open menu'}).evaluate(el=>document.activeElement===el),true);
 }
 await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'Open menu'}).click();const contact=page.locator('.mobile-contact a').last();await contact.scrollIntoViewIfNeeded();assert.ok(await contact.isVisible());
 await page.setViewportSize({width:1201,height:844});await page.getByRole('dialog',{name:'Site navigation'}).waitFor({state:'hidden'});assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');
 console.log('Menu passed: seven widths at top and scrolled, opaque full-viewport coverage, keyboard dismissal, focus restoration, landscape scrolling and desktop resize. Evidence: '+output);
}finally{await browser.close();}
