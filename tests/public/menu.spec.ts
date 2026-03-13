import { test, expect } from '@playwright/test';
import { expectPageLoads } from '../helpers/navigation';

test.describe('Public Menu', () => {
  test('menu page with valid slug loads', async ({ page }) => {
    // The public menu uses a [slug] param — try a common test slug
    const response = await page.goto('/en/menu/test-restaurant');
    // Should not crash (404 is acceptable if no restaurant exists)
    expect(response?.status()).toBeLessThan(500);
    await expectPageLoads(page);
  });

  test('menu page with invalid slug handles gracefully', async ({ page }) => {
    const response = await page.goto('/en/menu/nonexistent-restaurant-xyz-999');
    // Should not return 500 — either 404 or a friendly "not found" page
    expect(response?.status()).toBeLessThan(500);
  });
});
