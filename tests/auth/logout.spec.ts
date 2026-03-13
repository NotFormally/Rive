import { test, expect } from '@playwright/test';
import { fillLoginForm } from '../helpers/auth';

test.describe('Logout', () => {
  test('logout redirects to login page', async ({ page }) => {
    const email = process.env.TEST_EMAIL || 'nassim.saighi@gmail.com';
    const password = process.env.TEST_PASSWORD || 'sain5721';

    await page.goto('/en/login');
    await fillLoginForm(page, email, password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Wait for dashboard to fully render before clicking logout
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });

    // The logout button has accessible name "Logout" — force click to bypass Next.js dev overlay
    const logoutBtn = page.getByRole('button', { name: 'Logout' });
    await expect(logoutBtn).toBeVisible({ timeout: 10_000 });

    // Use dispatchEvent to bypass the Next.js dev overlay intercepting clicks
    await logoutBtn.dispatchEvent('click');

    // signOut() clears user state, then useEffect redirects to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('after logout, dashboard redirects to login', async ({ page }) => {
    const email = process.env.TEST_EMAIL || 'nassim.saighi@gmail.com';
    const password = process.env.TEST_PASSWORD || 'sain5721';

    await page.goto('/en/login');
    await fillLoginForm(page, email, password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 });

    const logoutBtn = page.getByRole('button', { name: 'Logout' });
    await expect(logoutBtn).toBeVisible({ timeout: 10_000 });
    await logoutBtn.dispatchEvent('click');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // After logout, navigating to dashboard should redirect to login
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
