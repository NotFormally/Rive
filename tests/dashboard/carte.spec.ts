import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Carte (Menu Management)', () => {
  test('carte page loads', async ({ page }) => {
    await page.goto('/en/dashboard/carte');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('carte editor sub-page loads', async ({ page }) => {
    await page.goto('/en/dashboard/carte/editeur');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('carte has navigation or content sections', async ({ page }) => {
    await page.goto('/en/dashboard/carte');
    await waitForDashboard(page);

    const contentElements = page.locator(
      'button, [role="tab"], [class*="card"], [class*="section"], table, [class*="grid"]',
    );
    const count = await contentElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
