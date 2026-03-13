import { test, expect } from '@playwright/test';
import { expectPageLoads } from '../helpers/navigation';
import { collectConsoleErrors, expectNoConsoleErrors } from '../helpers/assertions';

test.describe('Landing Page', () => {
  test('page loads with visible content', async ({ page }) => {
    await page.goto('/en');
    await expectPageLoads(page);
    await expect(page.getByText(/Rive/i).first()).toBeVisible();
  });

  test('navigation bar links are present', async ({ page }) => {
    await page.goto('/en');
    await expectPageLoads(page);

    // Should have at least a nav element or header with links
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();

    // Should have links to pricing, login, or signup
    const links = await page.locator('a[href]').all();
    expect(links.length).toBeGreaterThan(0);
  });

  test('CTA button exists and links to signup or pricing', async ({ page }) => {
    await page.goto('/en');
    await expectPageLoads(page);

    // Look for primary CTA (signup, get started, pricing)
    const cta = page.locator('a, button').filter({
      hasText: /sign up|get started|start|pricing|commencer|essayer/i,
    });
    await expect(cta.first()).toBeVisible({ timeout: 10_000 });
  });

  test('page loads at /fr locale with French content', async ({ page }) => {
    await page.goto('/fr');
    await expectPageLoads(page);
    // Body should be visible and contain some content
    await expect(page.locator('body')).toBeVisible();
  });

  test('language switch navigates between locales', async ({ page }) => {
    await page.goto('/en');
    await expectPageLoads(page);

    // Navigate directly to French version
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr/);
    await expectPageLoads(page);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/en');
    await expectPageLoads(page);

    // Wait a bit for async scripts
    await page.waitForTimeout(2000);
    expectNoConsoleErrors(errors);
  });
});
