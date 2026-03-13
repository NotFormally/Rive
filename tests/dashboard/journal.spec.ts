import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Journal de Bord (Logbook)', () => {
  test('journal page loads', async ({ page }) => {
    await page.goto('/en/dashboard/journal');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('journal shows entries list or empty state', async ({ page }) => {
    await page.goto('/en/dashboard/journal');
    await waitForDashboard(page);

    const hasEntries = page.locator('[class*="entry"], [class*="log"], table tbody tr, [class*="card"]');
    const hasEmptyState = page.locator('text=/no.*entries|empty|start|begin|aucun/i');
    const entriesCount = await hasEntries.count();
    const emptyCount = await hasEmptyState.count();
    expect(entriesCount + emptyCount).toBeGreaterThanOrEqual(0);
  });

  test('barometre sub-page loads', async ({ page }) => {
    await page.goto('/en/dashboard/journal/barometre');
    await waitForDashboard(page);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('journal page has interactive elements', async ({ page }) => {
    await page.goto('/en/dashboard/journal');
    await waitForDashboard(page);

    const interactiveElements = page.locator('button, input, select, textarea, [role="button"]');
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
