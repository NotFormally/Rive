import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Smart Prep (L\'Appareillage)', () => {
  test('appareillage page loads', async ({ page }) => {
    await page.goto('/en/dashboard/quart/appareillage');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('appareillage has prep list interface', async ({ page }) => {
    await page.goto('/en/dashboard/quart/appareillage');
    await waitForDashboard(page);

    // Should have interactive elements for prep lists
    const interactive = page.locator('button, [role="button"], input, table, [role="list"]');
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('voice prep terminal loads', async ({ page }) => {
    await page.goto('/en/dashboard/atelier/production/voice');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('appareillage does not show raw i18n keys', async ({ page }) => {
    await page.goto('/en/dashboard/quart/appareillage');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/SmartPrep\.\w+/);
  });
});
