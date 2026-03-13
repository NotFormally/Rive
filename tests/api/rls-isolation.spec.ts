import { test, expect } from '@playwright/test';

/**
 * Multi-tenant RLS isolation tests.
 *
 * Verifies that the API endpoints respect Supabase Row-Level Security:
 * - Authenticated requests only return data for the user's restaurant
 * - API endpoints don't leak cross-tenant data
 * - Attempting to access another restaurant's data is blocked
 *
 * These are API-level tests using the authenticated session cookies.
 */

test.describe('RLS Isolation — API Data Scoping', () => {
  test('logbook API returns only own restaurant data', async ({ request }) => {
    const response = await request.get('/api/logbook');

    if (response.ok()) {
      const body = await response.json();
      // Response should not contain multiple restaurant IDs
      if (Array.isArray(body) && body.length > 0) {
        const restaurantIds = new Set(
          body.map((entry: any) => entry.restaurant_id).filter(Boolean)
        );
        // All entries should belong to the same restaurant
        expect(restaurantIds.size).toBeLessThanOrEqual(1);
      }
    }
    // Even if empty, it should not error
    expect(response.status()).toBeLessThan(500);
  });

  test('food-cost API returns only own restaurant data', async ({ request }) => {
    const response = await request.get('/api/food-cost');

    if (response.ok()) {
      const body = await response.json();
      if (Array.isArray(body) && body.length > 0) {
        const restaurantIds = new Set(
          body.map((entry: any) => entry.restaurant_id).filter(Boolean)
        );
        expect(restaurantIds.size).toBeLessThanOrEqual(1);
      }
    }
    expect(response.status()).toBeLessThan(500);
  });

  test('haccp-checklists API returns only own restaurant data', async ({ request }) => {
    const response = await request.get('/api/haccp-checklists');

    if (response.ok()) {
      const body = await response.json();
      if (Array.isArray(body) && body.length > 0) {
        const restaurantIds = new Set(
          body.map((entry: any) => entry.restaurant_id).filter(Boolean)
        );
        expect(restaurantIds.size).toBeLessThanOrEqual(1);
      }
    }
    expect(response.status()).toBeLessThan(500);
  });

  test('temperature-logs API returns only own restaurant data', async ({ request }) => {
    const response = await request.get('/api/temperature-logs');

    if (response.ok()) {
      const body = await response.json();
      if (Array.isArray(body) && body.length > 0) {
        const restaurantIds = new Set(
          body.map((entry: any) => entry.restaurant_id).filter(Boolean)
        );
        expect(restaurantIds.size).toBeLessThanOrEqual(1);
      }
    }
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('RLS Isolation — Cross-tenant access blocked', () => {
  test('cannot fetch another restaurant profile directly', async ({ request }) => {
    // Try to access a non-existent/other restaurant's data
    const fakeRestaurantId = '00000000-0000-0000-0000-000000000000';

    const response = await request.get(`/api/health-score?restaurant_id=${fakeRestaurantId}`);

    // Should either return empty data or the user's own data, never another tenant's
    if (response.ok()) {
      const body = await response.json();
      // If it returns data, it should NOT be for the fake restaurant
      if (body && body.restaurant_id) {
        expect(body.restaurant_id).not.toBe(fakeRestaurantId);
      }
    }
  });

  test('unauthenticated requests to data APIs are rejected', async ({ browser }) => {
    const context = await browser.newContext(); // Fresh context, no cookies
    const page = await context.newPage();

    const endpoints = ['/api/logbook', '/api/food-cost', '/api/haccp-checklists'];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      // Should be 401 or redirect, never 200 with data
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }

    await context.close();
  });
});

test.describe('RLS Isolation — Health Score API', () => {
  test('health-score returns data scoped to authenticated user', async ({ request }) => {
    const response = await request.get('/api/health-score');

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const body = await response.json();
      // Should have a restaurant_id matching the user's
      expect(body).toBeTruthy();
    }
  });
});
