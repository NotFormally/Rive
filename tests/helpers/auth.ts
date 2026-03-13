import { Page } from '@playwright/test';

/**
 * Fill the login form fields.
 */
export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
}

/**
 * Fill the signup form fields.
 */
export async function fillSignupForm(
  page: Page,
  restaurantName: string,
  email: string,
  password: string,
) {
  await page.locator('input[type="text"]').first().fill(restaurantName);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
}
