import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('HACCP Compliance', () => {
  test('HACCP checklists page loads', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/haccp-checklists');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('temperature logs page loads', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/temperature-logs');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('HACCP builder page loads', async ({ page }) => {
    await page.goto('/en/dashboard/gouvernail/haccp-builder');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('audit demo page loads with interactive elements', async ({ page }) => {
    await page.goto('/en/dashboard/quart/sonar/audit-demo');
    await waitForDashboard(page);

    const interactiveElements = page.locator(
      'button, input, [role="checkbox"], [role="button"], [class*="check"]',
    );
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
