import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'Africa/Nairobi' });
const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><div id="root"></div><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => type => type;
window.__vite_plugin_react_preamble_installed__ = true;
await import('/test/fixtures/leave-harness.tsx');
</script></body></html>`;

for (const width of [360, 768, 1440]) test(`leave preview and retry preserve calendar dates and idempotency at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const submissions: any[] = [];
  await page.route('**/__leave_test', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'test-token', expiresAt: Date.now() + 300000 } });
    if (path.endsWith('/leave/policies')) return route.fulfill({ json: [{ id: 'p', key: 'ANNUAL', name: 'Annual leave', annualEntitlementDays: 24, active: true }] });
    if (path.endsWith('/leave/preview')) {
      const body = route.request().postDataJSON();
      expect(body.startsOn).toBe('2026-09-14'); expect(body.endsOn).toBe('2026-09-15');
      return route.fulfill({ json: { days: 2, chargeableDates: ['2026-09-14', '2026-09-15'], sufficient: true, projectedAfterRequest: 18, position: { openingDays: 0, accruedDays: 24, adjustmentDays: 0, usedDays: 3, pendingDays: 1, availableDays: 21, projectedAvailableDays: 20, asOf: '2026-09-13', unclassifiedRequestIds: [] } } });
    }
    if (path.endsWith('/leave')) {
      submissions.push(route.request().postDataJSON());
      return submissions.length === 1 ? route.fulfill({ status: 503, json: { message: 'Temporary interruption; please retry' } }) : route.fulfill({ json: { id: 'saved', auditRef: 'audit-1' } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/__leave_test');
  await page.getByLabel('Leave policy').selectOption('ANNUAL');
  await page.getByLabel('Starts', { exact: true }).fill('2026-09-14');
  await page.getByLabel('Ends', { exact: true }).fill('2026-09-15');
  await expect(page.getByRole('heading', { name: '2 chargeable day(s)' })).toBeVisible();
  const submit = page.getByRole('button', { name: 'Submit leave request' });
  await submit.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText('Temporary interruption');
  await expect(page.getByText('Request saved', { exact: true })).toHaveCount(0);
  await submit.focus(); await page.keyboard.press('Enter');
  await expect(page.getByText('Request saved', { exact: true })).toBeVisible();
  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toEqual(submissions[0]);
  expect(submissions[0].startsOn).toBe('2026-09-14');
  expect(submissions[0]).not.toHaveProperty('days');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
