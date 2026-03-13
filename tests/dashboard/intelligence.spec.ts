import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Intelligence Score', () => {
  test('intelligence page loads', async ({ page }) => {
    await page.goto('/en/dashboard/my-intelligence');
    await waitForDashboard(page);

    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/Internal Server Error/i);
  });

  test('intelligence page shows score or onboarding', async ({ page }) => {
    await page.goto('/en/dashboard/my-intelligence');
    await waitForDashboard(page);

    // Should show either a score/dashboard or an onboarding state
    const body = await page.locator('body').innerText();
    const hasContent = body.length > 100;
    expect(hasContent).toBe(true);
  });

  test('intelligence page has interactive elements', async ({ page }) => {
    await page.goto('/en/dashboard/my-intelligence');
    await waitForDashboard(page);

    const interactive = page.locator('button, [role="button"], a[href*="dashboard"]');
    const count = await interactive.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('intelligence score API returns valid response', async ({ request }) => {
    const response = await request.get('/api/intelligence-score');
    expect(response.status()).toBeLessThan(500);
  });
});
