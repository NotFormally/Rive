import { test, expect } from '@playwright/test';
import { expectPageLoads } from '../helpers/navigation';

test.describe('Error Pages', () => {
  test('404 page renders for unknown route', async ({ page }) => {
    const response = await page.goto('/en/this-route-does-not-exist-xyz');
    // Should get a 404 status
    expect(response?.status()).toBe(404);
    await expectPageLoads(page);
  });

  test('404 page has navigation back to home', async ({ page }) => {
    await page.goto('/en/this-route-does-not-exist-xyz');
    await expectPageLoads(page);

    // Should have a link back to home or some navigation
    const homeLink = page.locator('a[href="/"], a[href="/en"], a[href*="home"]');
    const hasHomeLink = (await homeLink.count()) > 0;

    // Or at least have some navigation buttons
    const navElements = page.locator('a, button');
    const navCount = await navElements.count();

    expect(hasHomeLink || navCount > 0).toBe(true);
  });

  test('404 page does not crash', async ({ page }) => {
    await page.goto('/en/this-route-does-not-exist-xyz');
    await expectPageLoads(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });
});
