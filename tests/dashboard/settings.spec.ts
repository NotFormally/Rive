import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Settings (Gouvernail)', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('module toggles or settings controls are visible', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail');
    await waitForDashboard(page);

    // Settings page should have interactive controls (toggles, buttons, inputs, switches)
    const controls = page.locator(
      '[role="switch"], input[type="checkbox"], [class*="toggle"], [class*="switch"], button, [role="button"], select',
    );
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('HACCP builder sub-page loads from settings', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/haccp-builder');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
    const builderElements = page.locator('button, input, select, textarea, [role="button"]');
    const count = await builderElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
