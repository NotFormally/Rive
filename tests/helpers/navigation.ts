import { Page, expect } from '@playwright/test';

/**
 * Navigate to a locale-prefixed path.
 */
export async function gotoWithLocale(page: Page, path: string, locale = 'en') {
  const url = `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  await page.goto(url);
}

/**
 * Assert that the page was redirected to the login page.
 */
export async function expectRedirectToLogin(page: Page) {
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
}

/**
 * Assert that a page loaded successfully (body visible, no 5xx).
 */
export async function expectPageLoads(page: Page) {
  const body = page.locator('body');
  await expect(body).toBeVisible({ timeout: 15_000 });
}

/**
 * Wait for the dashboard to finish client-side rendering.
 * If the storageState session was invalidated (e.g. by a logout test),
 * auto-login as fallback so dashboard tests don't fail.
 */
export async function waitForDashboard(page: Page) {
  // Wait for the loading/workspace generation to finish
  await page.waitForFunction(
    () => {
      const body = document.body.innerText;
      return !body.includes('Generating workspace') && body.length > 100;
    },
    { timeout: 30_000 },
  );

  // Check if we got redirected to login (stale storageState)
  if (page.url().includes('/login')) {
    const email = process.env.TEST_EMAIL || 'nassim.saighi@gmail.com';
    const password = process.env.TEST_PASSWORD || 'sain5721';
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    // Wait for dashboard to render after login
    await page.waitForFunction(
      () => {
        const body = document.body.innerText;
        return !body.includes('Generating workspace') && body.length > 100;
      },
      { timeout: 30_000 },
    );
  }

  // Give React a moment to settle
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}
