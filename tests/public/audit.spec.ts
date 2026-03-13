import { test, expect } from '@playwright/test';
import { expectPageLoads } from '../helpers/navigation';

test.describe('Audit Page', () => {
  test('audit page loads', async ({ page }) => {
    await page.goto('/en/audit');
    await expectPageLoads(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('audit page has search form', async ({ page }) => {
    await page.goto('/en/audit');
    await expectPageLoads(page);

    // Audit page should have an address search input and submit button
    const formElements = page.locator('input, button[type="submit"], [role="search"], form');
    const count = await formElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
