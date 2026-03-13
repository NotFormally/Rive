import { test, expect } from '@playwright/test';

test.describe('Page Load Performance', () => {
  test('landing page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;

    expect(elapsed, `Landing page took ${elapsed}ms`).toBeLessThan(5_000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/en/login', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;

    expect(elapsed, `Login page took ${elapsed}ms`).toBeLessThan(5_000);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('pricing page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/en/pricing', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;

    expect(elapsed, `Pricing page took ${elapsed}ms`).toBeLessThan(5_000);
    await expect(page.locator('body')).toBeVisible();
  });
});
