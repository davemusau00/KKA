import { test, expect } from '@playwright/test';
import path from 'node:path';
const apiBase=process.env.TEST_API_URL||'http://localhost:5173/api/v1';
test.beforeEach(async({page})=>{
  page.on('pageerror', error => { throw error; });
  await page.goto('/');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('input[type="email"]').fill(process.env.SEED_ADMIN_EMAIL||'documents.admin@example.test');
  await page.locator('input[type="password"]').fill(process.env.SEED_ADMIN_PASSWORD||'Kka-Documents-Test-2026!');
  await page.getByRole('button',{name:'Sign In with Session Cookie'}).click();
  await expect(page.getByRole('button',{name:/Admin & Staff|Documents/}).first()).toBeVisible({timeout:15000});
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

test('production permissions ignore local overrides; logout failure stays visible and successful logout revokes access', async ({page}) => {
  await page.evaluate(() => localStorage.setItem('kklaw_os_state_v1_role_permissions', JSON.stringify({ technical_admin: [] })));
  await page.reload();
  await expect(page.getByRole('button',{name:/Admin & Staff/}).first()).toBeVisible();
  expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('kklaw_os_state_v1_')&&!key.endsWith('_theme')))).toEqual([]);
  await page.getByRole('button',{name:/Synthetic CI Administrator|Document Test Administrator/}).first().click();
  await expect(page.getByText('Test Role Personas',{exact:true})).toHaveCount(0);
  await page.route('**/auth/logout', route => route.abort());
  await page.getByRole('button',{name:'Sign Out',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Sign out failed');
  await page.unroute('**/auth/logout');
  await page.getByRole('button',{name:'Sign Out',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
  expect((await page.request.get(`${apiBase}/auth/me`)).status()).toBe(401);
});

test('expired CSRF cookie is renewed before a single saved branding change', async ({page,context}) => {
  await page.getByRole('button',{name:/Admin & Staff/}).first().click();
  await page.getByRole('button',{name:/Firm Profile/}).click();
  await context.clearCookies({name:'kka_csrf'});
  await page.getByLabel('Upload firm logo').setInputFiles(path.resolve('public/firm-logo.png'));
  const successes:number[]=[];
  page.on('response', response => { if(response.url().endsWith('/branding/logo')&&response.ok())successes.push(response.status()); });
  await page.getByRole('button',{name:'Save logo',exact:true}).click();
  await expect(page.getByText('Logo saved.',{exact:true})).toBeVisible();
  expect(successes).toHaveLength(1);
  await page.getByRole('button',{name:'Restore default',exact:true}).click();
  await expect(page.getByText('Default logo restored.',{exact:true})).toBeVisible();
});

test('organization profile persists, exposes failures and rejects stale browser edits', async ({page}) => {
  const openProfile = async () => {
    await page.getByRole('button',{name:/Admin & Staff/}).first().click();
    await page.getByRole('button',{name:/Firm Profile/}).click();
    await expect(page.getByRole('button',{name:'Edit firm identity',exact:true})).toBeVisible();
  };
  await openProfile();
  await expect(page.getByText('Judiciary CTS Sync',{exact:true})).toHaveCount(0);
  await expect(page.getByText('LSK/FIRM/NRB/2004/0892',{exact:true})).toHaveCount(0);
  const original = await (await page.request.get(`${apiBase}/organization/profile`)).json();
  await page.getByRole('button',{name:'Edit firm identity',exact:true}).click();
  await page.getByLabel('Short name',{exact:true}).fill('Synthetic browser firm');
  await page.route('**/organization/profile', route => route.request().method()==='PATCH' ? route.abort() : route.continue());
  await page.getByRole('button',{name:'Save firm identity',exact:true}).click();
  await expect(page.getByRole('form',{name:'Firm identity'}).getByRole('alert')).toBeVisible();
  await expect(page.getByText('Firm identity saved.',{exact:true})).toHaveCount(0);
  await expect(page.getByLabel('Short name',{exact:true})).toHaveValue('Synthetic browser firm');
  await page.unroute('**/organization/profile');
  await page.getByRole('button',{name:'Save firm identity',exact:true}).click();
  await expect(page.getByText('Firm identity saved.',{exact:true})).toBeVisible();
  await page.reload(); await openProfile();
  await expect(page.getByRole('form',{name:'Firm identity'})).toContainText('Synthetic browser firm');
  await page.getByRole('button',{name:'Edit firm identity',exact:true}).click();
  await page.getByLabel('Short name',{exact:true}).fill('Stale browser edit');
  const current = await (await page.request.get(`${apiBase}/organization/profile`)).json();
  const csrf = await (await page.request.get(`${apiBase}/auth/csrf`)).json();
  const external = await page.request.patch(`${apiBase}/organization/profile`,{headers:{'X-CSRF-Token':csrf.token},data:{name:original.name,shortName:original.shortName||'',expectedUpdatedAt:current.updatedAt}});
  expect(external.ok()).toBeTruthy();
  // A refetch must not silently replace the version pinned when the form opened.
  await page.getByRole('button',{name:'Reload profile',exact:true}).click();
  await page.getByRole('button',{name:'Save firm identity',exact:true}).click();
  await expect(page.getByRole('form',{name:'Firm identity'}).getByRole('alert')).toContainText('This record changed');
  const after = await (await page.request.get(`${apiBase}/organization/profile`)).json();
  expect(after.shortName).toBe(original.shortName||'');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByLabel('Legal entity',{exact:true}).selectOption(original.legalEntities[0].id);
  await page.getByRole('button',{name:'Edit legal entity',exact:true}).click();
  await page.getByLabel('Registered entity name').focus();
  await expect(page.getByLabel('Registered entity name')).toBeFocused();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByLabel('Branch contact record').selectOption(original.branches[0].id);
  await expect(page.getByRole('form',{name:'Branch contacts'})).toBeVisible();
});
for(const width of [360,768,1440])for(const theme of ['light','dark'])test(`branding and documents layout ${width}px ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.evaluate(theme=>{document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(theme);},theme);
  if(width<768)await page.getByRole('button',{name:'Toggle navigation menu'}).click();
  await page.getByRole('button',{name:/Admin & Staff/}).first().click();
  await page.getByRole('button',{name:/Firm Profile/}).click();
  await expect(page.getByRole('heading',{name:'Firm logo',exact:true})).toBeVisible();
  await expect(page.getByAltText('Current firm logo')).toBeVisible();
  await expect(page.getByRole('button',{name:'Edit firm identity',exact:true})).toBeVisible();
  const entitySelect=page.getByLabel('Legal entity',{exact:true});
  await entitySelect.selectOption(await entitySelect.locator('option').nth(1).getAttribute('value')||'');
  const branchSelect=page.getByLabel('Branch contact record');
  await branchSelect.selectOption(await branchSelect.locator('option').nth(1).getAttribute('value')||'');
  await page.getByRole('button',{name:'Edit branch contacts',exact:true}).click();
  await page.screenshot({path:`../../.artifacts/branding-${width}-${theme}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});

test('wide transparent branding, favicon refresh, keyboard navigation and failed-image fallback',async({page})=>{
  const csrf=await (await page.request.get(`${apiBase}/auth/csrf`)).json();
  const headers={'X-CSRF-Token':csrf.token};
  const data=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=800;canvas.height=160;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#92652a';ctx.fillRect(0,50,800,60);return canvas.toDataURL().split(',')[1];});
  const response=await page.request.post(`${apiBase}/branding/logo`,{headers,multipart:{file:{name:'wide.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')}}});expect(response.ok()).toBeTruthy();
  try {
    await page.reload();
    await expect.poll(()=>page.locator('link[rel="icon"]').first().getAttribute('href')).toMatch(/^data:image\/png/);
    const dashboard=page.getByRole('button',{name:'Open firm dashboard'}).first();await dashboard.focus();await expect(dashboard).toBeFocused();await page.keyboard.press('Enter');
    await page.getByRole('button',{name:/Admin & Staff/}).first().click();await page.getByRole('button',{name:/Firm Profile/}).click();
    const logo=page.getByAltText('Current firm logo');await expect.poll(()=>logo.evaluate((img:HTMLImageElement)=>img.naturalWidth/img.naturalHeight)).toBe(5);
    await page.route('**/branding/image**',route=>route.abort());await page.reload();
    await page.getByRole('button',{name:/Admin & Staff/}).first().click();await page.getByRole('button',{name:/Firm Profile/}).click();
    await expect.poll(()=>page.getByAltText('Current firm logo').getAttribute('src')).toContain('firm-logo.png');
  } finally { await page.request.post(`${apiBase}/branding/restore-default`,{headers}); }
});


test('structured template authoring, publication, queued generation and reload',async({page})=>{
  test.setTimeout(120000);
  await page.getByRole('button',{name:'Documents',exact:true}).first().click();
  const documents=page.getByLabel('Stored document');await expect(documents.locator('option')).not.toHaveCount(1);const documentId=(await documents.locator('option').nth(1).getAttribute('value'))!;await documents.selectOption(documentId);
  await page.getByRole('button',{name:'Templates',exact:true}).click();
  await page.getByLabel('Name',{exact:true}).fill('Synthetic browser letter');await page.getByLabel('Reference (lowercase letters, digits, hyphens)').fill(`browser-${Date.now()}`);
  await page.getByRole('button',{name:'Save new draft version'}).click();await expect(page.getByText('New template version saved as draft.')).toBeVisible();
  await page.getByRole('button',{name:'Publish version',exact:true}).click();await expect(page.getByText('Template published.')).toBeVisible();
  await page.getByLabel('Recipient',{exact:true}).fill('Synthetic Recipient');await page.getByLabel('Subject',{exact:true}).fill('Synthetic browser test');await page.getByLabel('Body',{exact:true}).fill('This generated letter contains synthetic test data.');
  const response=page.waitForResponse(r=>r.url().endsWith('/document-templates/generate')&&r.request().method()==='POST');await page.getByRole('button',{name:'Generate draft',exact:true}).click();const queued=await response;expect(queued.ok()).toBeTruthy();const operation=await queued.json();
  await page.getByRole('button',{name:'Documents',exact:true}).last().click();
  await expect.poll(async()=>{const r=await page.request.get(`${apiBase}/document-operations?documentId=${documentId}`);const rows=await r.json();return rows.find((o:{id:string})=>o.id===operation.id)?.status;},{timeout:90000}).toBe('COMPLETED');
  await page.reload();await page.getByRole('button',{name:'Documents',exact:true}).first().click();await expect(page.getByLabel('Stored document').locator('option')).not.toHaveCount(1);
});
