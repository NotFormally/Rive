import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

/**
 * Visual regression tests using Playwright's built-in screenshot comparison.
 *
 * First run generates baseline snapshots in tests/visual/snapshots.spec.ts-snapshots/.
 * Subsequent runs compare against baselines. Update baselines with:
 *   npx playwright test tests/visual --update-snapshots
 *
 * Threshold is set to 0.3 (30%) to tolerate minor rendering differences
 * across environments while catching major layout regressions.
 */

const SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.05,
  threshold: 0.3,
};

test.describe('Visual Regression — Public Pages', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    // Dismiss any cookie/overlay banners
    await page.evaluate(() => {
      document.querySelectorAll('[class*="cookie"], [class*="banner"], [class*="overlay"], nextjs-portal').forEach((el) => el.remove());
    });
    await expect(page).toHaveScreenshot('landing-page.png', SNAPSHOT_OPTIONS);
  });

  test('landing page — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.querySelectorAll('[class*="cookie"], [class*="banner"], [class*="overlay"], nextjs-portal').forEach((el) => el.remove());
    });
    await expect(page).toHaveScreenshot('landing-mobile.png', SNAPSHOT_OPTIONS);
  });

  test('pricing page', async ({ page }) => {
    await page.goto('/en/pricing');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.querySelectorAll('[class*="cookie"], [class*="banner"], [class*="overlay"], nextjs-portal').forEach((el) => el.remove());
    });
    await expect(page).toHaveScreenshot('pricing-page.png', SNAPSHOT_OPTIONS);
  });

  test('login page', async ({ page }) => {
    await page.goto('/en/login');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.querySelectorAll('[class*="cookie"], [class*="banner"], [class*="overlay"], nextjs-portal').forEach((el) => el.remove());
    });
    await expect(page).toHaveScreenshot('login-page.png', SNAPSHOT_OPTIONS);
  });
});

test.describe('Visual Regression — Dashboard', () => {
  test('dashboard main view', async ({ page }) => {
    await page.goto('/en/dashboard');
    await waitForDashboard(page);
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
    });
    await expect(page).toHaveScreenshot('dashboard-main.png', {
      ...SNAPSHOT_OPTIONS,
      // Dashboard has dynamic data — be more lenient
      maxDiffPixelRatio: 0.15,
    });
  });

  test('dashboard — food cost', async ({ page }) => {
    await page.goto('/en/dashboard/food-cost');
    await waitForDashboard(page);
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
    });
    await expect(page).toHaveScreenshot('dashboard-food-cost.png', {
      ...SNAPSHOT_OPTIONS,
      maxDiffPixelRatio: 0.15,
    });
  });

  test('dashboard — HACCP', async ({ page }) => {
    await page.goto('/en/dashboard/haccp');
    await waitForDashboard(page);
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
    });
    await expect(page).toHaveScreenshot('dashboard-haccp.png', {
      ...SNAPSHOT_OPTIONS,
      maxDiffPixelRatio: 0.15,
    });
  });
});
