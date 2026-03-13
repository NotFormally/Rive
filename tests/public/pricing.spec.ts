import { test, expect } from '@playwright/test';
import { expectPageLoads } from '../helpers/navigation';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/pricing');
  });

  test('pricing page loads', async ({ page }) => {
    await expectPageLoads(page);
    // Should have pricing-related content
    await expect(page.getByText(/pricing|plans|price|\$/i).first()).toBeVisible();
  });

  test('at least 2 pricing tiers are visible', async ({ page }) => {
    await expectPageLoads(page);

    // Look for pricing tier cards/sections — each tier has a CheckoutButton or price indicator
    const tiers = page.locator('[class*="card"], [class*="tier"], [class*="plan"]').or(
      page.locator('text=/\\$\\d+/'),
    );
    // At minimum, Essence and Performance tiers should be visible
    const count = await tiers.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('CTA buttons exist on pricing tiers', async ({ page }) => {
    await expectPageLoads(page);

    // Each tier should have a call-to-action button
    const ctaButtons = page.locator('button, a').filter({
      hasText: /start|subscribe|get|commencer|choisir|select/i,
    });
    await expect(ctaButtons.first()).toBeVisible({ timeout: 10_000 });
  });

  test('tier CTA buttons trigger navigation when clicked', async ({ page }) => {
    await expectPageLoads(page);

    // Find a CTA button with "Start saving" text (from CheckoutButton component)
    const ctaButton = page.locator('button').filter({
      hasText: /start|subscribe|get|commencer|choisir|select|essayer|try|saving/i,
    }).first();

    const isVisible = await ctaButton.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!isVisible) return;

    // The CheckoutButton calls window.location.assign to /signup when not logged in.
    // Wait for auth loading to finish before clicking (authLoading guard)
    await page.waitForTimeout(2_000);
    await ctaButton.click({ force: true });

    // Should navigate to /signup?plan=... (unauthenticated user flow)
    await expect(page).toHaveURL(/\/(signup|login)/, { timeout: 10_000 });
  });
});
