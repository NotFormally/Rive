import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Dashboard Navigation', () => {
  test('food-cost deep links load correctly', async ({ page }) => {
    const routes = [
      '/en/dashboard/reserve',
      '/en/dashboard/reserve/reception',
      '/en/dashboard/reserve/tirant',
    ];

    for (const route of routes) {
      await page.goto(route);
      await waitForDashboard(page);
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('gouvernail deep links load correctly', async ({ page }) => {
    const routes = [
      '/en/dashboard/gouvernail',
      '/en/dashboard/gouvernail/haccp-builder',
      '/en/dashboard/gouvernail/haccp-checklists',
      '/en/dashboard/gouvernail/temperature-logs',
    ];

    for (const route of routes) {
      await page.goto(route);
      await waitForDashboard(page);
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('navigating between dashboard sections preserves auth', async ({ page }) => {
    // Navigate through multiple sections — auth should persist
    await page.goto('/en/dashboard');
    await waitForDashboard(page);

    await page.goto('/en/dashboard/journal');
    await waitForDashboard(page);
    expect(page.url()).toContain('/dashboard');

    await page.goto('/en/dashboard/gouvernail');
    await waitForDashboard(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('direct URL access to dashboard sub-pages works', async ({ page }) => {
    // Deep-link directly without going through main dashboard first
    await page.goto('/en/dashboard/journal/barometre');
    await waitForDashboard(page);
    expect(page.url()).toContain('/dashboard');
  });
});
