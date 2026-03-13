import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Variance (Le Tirant d\'Eau)', () => {
  test('tirant page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/tirant');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('tirant page has variance analysis UI', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/tirant');
    await waitForDashboard(page);

    const interactive = page.locator('button, [role="button"], input, table, select');
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('coulage (spoilage) sub-page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/tirant/coulage');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('variance API returns valid response', async ({ request }) => {
    const response = await request.get('/api/variance');
    expect(response.status()).toBeLessThan(500);
  });
});
