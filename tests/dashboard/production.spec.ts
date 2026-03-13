import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Production', () => {
  test('production page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/production');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('production has batch/recipe interface', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/production');
    await waitForDashboard(page);

    const interactive = page.locator('button, [role="button"], input, table');
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('production recipes sub-page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/production/recettes');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('production API returns valid response', async ({ request }) => {
    const response = await request.get('/api/production');
    expect(response.status()).toBeLessThan(500);
  });
});
