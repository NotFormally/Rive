import { test, expect } from '@playwright/test';
import { fillLoginForm } from '../helpers/auth';
import { expectPageLoads } from '../helpers/navigation';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/login');
  });

  test('renders login form with email and password fields', async ({ page }) => {
    await expectPageLoads(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    const email = process.env.TEST_EMAIL || 'nassim.saighi@gmail.com';
    const password = process.env.TEST_PASSWORD || 'sain5721';

    await fillLoginForm(page, email, password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test('invalid credentials shows error message', async ({ page }) => {
    await fillLoginForm(page, 'invalid@example.com', 'wrongpassword123');
    await page.locator('button[type="submit"]').click();

    // Error message should appear (text-red-500 paragraph)
    await expect(page.locator('.text-red-500')).toBeVisible({ timeout: 10_000 });
  });

  test('empty fields do not submit the form', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    // Should stay on login page — no redirect, no error (form just doesn't submit)
    await expect(page).toHaveURL(/\/login/);
  });

  test('already authenticated user on /login is redirected to dashboard', async ({ page }) => {
    // First login to establish session
    const email = process.env.TEST_EMAIL || 'nassim.saighi@gmail.com';
    const password = process.env.TEST_PASSWORD || 'sain5721';

    await fillLoginForm(page, email, password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Now navigate back to login — middleware should redirect to dashboard
    await page.goto('/en/login');
    // Allow more time — session verification + redirect can be slow under load
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });
});
