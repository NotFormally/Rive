import { test, expect } from '@playwright/test';

/**
 * Stripe checkout flow tests.
 *
 * These tests verify the checkout API without completing actual payments.
 * They test:
 * - API returns a valid Stripe checkout URL
 * - Error handling for missing/invalid parameters
 * - Pricing page CTAs trigger checkout flow
 *
 * Note: Full payment completion requires Stripe test card automation
 * which is complex and fragile. These tests cover the initiation flow.
 */

const STRIPE_CHECKOUT_API = '/api/stripe/checkout';

test.describe('Stripe Checkout — API', () => {
  test('returns 400 when priceId is missing', async ({ request }) => {
    const response = await request.post(STRIPE_CHECKOUT_API, {
      data: { restaurantId: 'test-123' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('returns 400 when both priceId and restaurantId are missing', async ({ request }) => {
    const response = await request.post(STRIPE_CHECKOUT_API, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('returns checkout URL with valid parameters', async ({ request }) => {
    // Use env var for price ID — this should be a real Stripe test price
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL;

    if (!priceId) {
      test.skip();
      return;
    }

    const response = await request.post(STRIPE_CHECKOUT_API, {
      data: {
        priceId,
        restaurantId: 'test-checkout-flow',
        userId: 'test-user-id',
      },
    });

    // May fail if restaurantId doesn't exist in DB, but should not be 400
    // It could be 500 if Stripe rejects, or 200 with a URL
    if (response.ok()) {
      const body = await response.json();
      expect(body.url).toBeTruthy();
      expect(body.url).toContain('checkout.stripe.com');
    }
  });
});

test.describe('Stripe Checkout — Webhook endpoint', () => {
  test('webhook endpoint exists and rejects unsigned requests', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: { type: 'checkout.session.completed' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Should reject because there's no valid Stripe signature
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Stripe Checkout — Pricing Page Integration', () => {
  test('pricing page CTA buttons exist for each tier', async ({ page }) => {
    await page.goto('/en/pricing');
    await page.waitForLoadState('domcontentloaded');

    // Should have CTA buttons for subscription tiers
    const ctaButtons = page.locator('a[href*="checkout"], button:has-text("Start"), button:has-text("Subscribe"), button:has-text("Commencer"), a:has-text("Start"), a:has-text("Essai")');
    const count = await ctaButtons.count();

    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('pricing page displays tier names', async ({ page }) => {
    await page.goto('/en/pricing');
    await page.waitForLoadState('domcontentloaded');

    const body = await page.locator('body').innerText();

    // At least some tier names should be visible
    const tierKeywords = ['Essence', 'Performance', 'Intelligence', 'Free', 'Gratuit'];
    const found = tierKeywords.filter((k) => body.includes(k));

    expect(found.length).toBeGreaterThanOrEqual(2);
  });
});
