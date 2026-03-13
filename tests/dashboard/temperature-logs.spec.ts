import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Temperature Logs', () => {
  test('temperature logs page loads', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/temperature-logs');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('temperature logs has logger interface', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/temperature-logs');
    await waitForDashboard(page);

    // Should have input fields for temperature entry
    const inputs = page.locator('input, button, [role="button"], select');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('temperature logs does not show raw i18n keys', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/temperature-logs');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/TemperatureLogger\.\w+/);
  });

  test('temperature alerts API returns valid response', async ({ request }) => {
    const response = await request.get('/api/temperature-logs');
    expect(response.status()).toBeLessThan(500);
  });
});
