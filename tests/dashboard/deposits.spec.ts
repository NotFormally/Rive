import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Deposits (Le Lest)', () => {
  test('lest page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/lest');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('lest page has deposit tracking UI', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/lest');
    await waitForDashboard(page);

    const interactive = page.locator('button, [role="button"], input, table');
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('lest history sub-page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/lest/historique');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('deposits API returns valid response', async ({ request }) => {
    const response = await request.get('/api/deposits');
    expect(response.status()).toBeLessThan(500);
  });
});
