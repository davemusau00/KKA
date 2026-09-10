import { test, expect } from '@playwright/test';

test.skip(!process.env.RUN_WEBSITE_GROWTH_ACCEPTANCE, 'Set RUN_WEBSITE_GROWTH_ACCEPTANCE=1 with a seeded local admin to run the authenticated workspace acceptance.');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.locator('input[type="email"]').fill(process.env.SEED_ADMIN_EMAIL || 'documents.admin@example.test');
  await page.locator('input[type="password"]').fill(process.env.SEED_ADMIN_PASSWORD || 'Kka-Documents-Test-2026!');
  await page.getByRole('button', { name: 'Sign In with Session Cookie' }).click();
  await expect(page.getByRole('button', { name: /Website & Growth/ }).first()).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /Website & Growth/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Public Site, Media & Lead Operations' })).toBeVisible();
});

for (const width of [360, 390, 430, 640, 768, 1024, 1280, 1440, 1920]) {
  test(`website workspace remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const tab of ['Settings', 'Pages', 'Content', 'Media', 'Leads', 'Publishing']) {
      const button = page.getByRole('button', { name: tab, exact: true });
      if (await button.count()) {
        await button.click();
        await expect(page.getByText(/JSON/i)).toHaveCount(0);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  });
}

test('settings exposes guided rows and the live preview entry point', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Public website settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add menu item', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add social link', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Live public preview' })).toBeVisible();
  await expect(page.getByText(/JSON/i)).toHaveCount(0);
});
