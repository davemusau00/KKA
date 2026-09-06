import { test, expect } from '@playwright/test';
import path from 'node:path';
test.beforeEach(async({page})=>{
  const r=await page.request.post('http://localhost:3015/api/v1/auth/login',{data:{email:process.env.SEED_ADMIN_EMAIL||'documents.admin@example.test',password:process.env.SEED_ADMIN_PASSWORD||'Kka-Documents-Test-2026!'}});expect(r.ok()).toBeTruthy();
  await page.goto('/');
});
test('managed logo upload, persistence, default restoration, and document placement UI',async({page})=>{
  await page.getByRole('button',{name:/Admin & Staff/}).first().click();
  await page.getByRole('button',{name:/Firm Profile/}).click();
  await expect(page.getByRole('heading',{name:'Firm logo',exact:true})).toBeVisible();
  await page.getByLabel('Upload firm logo').setInputFiles(path.resolve('public/firm-logo.png'));
  await page.getByRole('button',{name:'Save logo',exact:true}).click();
  await expect(page.getByText('Logo saved.',{exact:true})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:/Admin & Staff/}).first().click();
  await page.getByRole('button',{name:/Firm Profile/}).click();
  await expect(page.getByText(/Saved firm branding/)).toBeVisible();
  await page.getByRole('button',{name:'Restore default',exact:true}).click();
  await expect(page.getByText('Default logo restored.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Documents',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'Documents & firm execution'})).toBeVisible();
  const select=page.getByLabel('Stored document');await expect(select.locator('option')).not.toHaveCount(1);
  const id=await select.locator('option').nth(1).getAttribute('value');await select.selectOption(id!);
  await expect(page.locator('canvas').first()).toBeVisible();
  const assets=page.getByLabel('Artwork / signature');const asset=await assets.locator('option').nth(1).getAttribute('value');await assets.selectOption(asset!);
  await page.getByRole('button',{name:'Add placement',exact:true}).click();
  await expect(page.getByRole('group',{name:'Placement 1'})).toBeVisible();
  await page.getByRole('button',{name:'Preview rendered PDF'}).click();
  await expect(page.getByRole('link',{name:'Open rendered preview'})).toBeVisible({timeout:20000});
});
for(const width of [360,768,1440])for(const theme of ['light','dark'])test(`branding and documents layout ${width}px ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.evaluate(theme=>{document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(theme);},theme);
  if(width<768)await page.getByRole('button',{name:'Toggle navigation menu'}).click();
  await page.getByRole('button',{name:/Admin & Staff/}).first().click();
  await page.getByRole('button',{name:/Firm Profile/}).click();
  await expect(page.getByRole('heading',{name:'Firm logo',exact:true})).toBeVisible();
  await expect(page.getByAltText('Current firm logo')).toBeVisible();
  await page.screenshot({path:`../../.artifacts/branding-${width}-${theme}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});

test('wide transparent branding, favicon refresh, keyboard navigation and failed-image fallback',async({page})=>{
  const data=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=800;canvas.height=160;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#92652a';ctx.fillRect(0,50,800,60);return canvas.toDataURL().split(',')[1];});
  const response=await page.request.post('/api/v1/branding/logo',{multipart:{file:{name:'wide.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')}}});expect(response.ok()).toBeTruthy();
  try {
    await page.reload();
    await expect.poll(()=>page.locator('link[rel="icon"]').first().getAttribute('href')).toMatch(/^data:image\/png/);
    const dashboard=page.getByRole('button',{name:'Open firm dashboard'}).first();await dashboard.focus();await expect(dashboard).toBeFocused();await page.keyboard.press('Enter');
    await page.getByRole('button',{name:/Admin & Staff/}).first().click();await page.getByRole('button',{name:/Firm Profile/}).click();
    const logo=page.getByAltText('Current firm logo');await expect.poll(()=>logo.evaluate((img:HTMLImageElement)=>img.naturalWidth/img.naturalHeight)).toBe(5);
    await page.route('**/branding/image**',route=>route.abort());await page.reload();
    await page.getByRole('button',{name:/Admin & Staff/}).first().click();await page.getByRole('button',{name:/Firm Profile/}).click();
    await expect.poll(()=>page.getByAltText('Current firm logo').getAttribute('src')).toContain('firm-logo.png');
  } finally { await page.request.post('/api/v1/branding/default'); }
});
