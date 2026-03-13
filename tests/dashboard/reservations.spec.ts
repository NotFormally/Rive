import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Reservations (Le Mouillage)', () => {
  test('mouillage page loads', async ({ page }) => {
    await page.goto('/en/dashboard/quart/mouillage');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('mouillage page has reservation UI elements', async ({ page }) => {
    await page.goto('/en/dashboard/quart/mouillage');
    await waitForDashboard(page);

    // Should have interactive elements (calendar, table, list)
    const interactive = page.locator('button, [role="button"], table, [role="grid"], select');
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('reservation settings page loads', async ({ page }) => {
    await page.goto('/en/dashboard/settings/reservations');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('calfatage integration page loads', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/calfatage');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });
});
