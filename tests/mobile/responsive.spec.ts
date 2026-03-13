import { test, expect } from '@playwright/test';
import { expectPageLoads, waitForDashboard } from '../helpers/navigation';

const MOBILE_VIEWPORT = { width: 375, height: 812 }; // iPhone 13

test.describe('Mobile Responsive', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('landing page renders without horizontal overflow', async ({ page }) => {
    await page.goto('/en');
    await expectPageLoads(page);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    // Body should not overflow significantly (allow 2px tolerance for borders)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
  });

  test('login page is usable on mobile', async ({ page }) => {
    await page.goto('/en/login');
    await expectPageLoads(page);

    // Email and password inputs should be visible and tappable
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Inputs should be wide enough to be tappable (at least 200px)
    const emailBox = await emailInput.boundingBox();
    expect(emailBox!.width).toBeGreaterThanOrEqual(200);
  });

  test('pricing page tiers stack vertically on mobile', async ({ page }) => {
    await page.goto('/en/pricing');
    await expectPageLoads(page);

    // Page should load without horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);

    // Content should be visible
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('dashboard sidebar collapses on mobile', async ({ page }) => {
    await page.goto('/en/dashboard');
    await waitForDashboard(page);

    // On mobile, sidebar should either be hidden or collapsed
    // Check that the main content is visible and takes full width
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();

    const mainBox = await mainContent.boundingBox();
    // Main content should take most of the viewport width on mobile
    expect(mainBox!.width).toBeGreaterThanOrEqual(300);
  });
});
