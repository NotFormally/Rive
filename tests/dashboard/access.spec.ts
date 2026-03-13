import { test, expect } from '@playwright/test';
import { expectRedirectToLogin, waitForDashboard } from '../helpers/navigation';

test.describe('Dashboard Access Control', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/dashboard');
    await expectRedirectToLogin(page);
  });

  test('authenticated user loads dashboard successfully', async ({ page }) => {
    // Uses storageState from the authenticated project config
    await page.goto('/en/dashboard');
    await waitForDashboard(page);
    // Verify we're still on dashboard (not redirected to login)
    expect(page.url()).toContain('/dashboard');
  });
});
