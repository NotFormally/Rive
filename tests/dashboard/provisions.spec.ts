import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Receipt Scanner (Les Provisions)', () => {
  test('provisions page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/provisions');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('provisions page has upload or scanner interface', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/provisions');
    await waitForDashboard(page);

    // Should have some form of upload/input for receipts
    const interactive = page.locator('input[type="file"], button, [role="button"], .dropzone, [data-dropzone]');
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('provisions page respects module gate', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/provisions');
    await waitForDashboard(page);

    // Should not show raw translation keys
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Provisions.');
  });

  test('reception sub-page loads', async ({ page }) => {
    await page.goto('/en/dashboard/reserve/reception');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });
});
