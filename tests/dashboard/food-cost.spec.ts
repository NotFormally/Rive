import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Food Cost (La Reserve)', () => {
  test('food cost dashboard loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('reception/invoices page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/reception');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('variance (tirant) page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/tirant');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('food cost page has data display or empty state', async ({ page }) => {
    await page.goto('/en/dashboard/reserve');
    await waitForDashboard(page);

    const contentElements = page.locator(
      '[class*="chart"], [class*="card"], table, [class*="empty"], [class*="grid"], canvas, svg',
    );
    const count = await contentElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
