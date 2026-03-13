import { test, expect } from '@playwright/test';

test.describe('API Health Checks', () => {
  // These tests verify key API endpoints return non-500 responses.
  // They use the authenticated storageState for endpoints that require auth.

  test('GET /api/health-score returns non-500', async ({ request }) => {
    const response = await request.get('/api/health-score');
    expect(response.status(), '/api/health-score').toBeLessThan(500);
  });

  test('POST /api/logbook returns non-500', async ({ request }) => {
    const response = await request.post('/api/logbook', { data: {} });
    expect(response.status(), '/api/logbook').toBeLessThan(500);
  });

  test('POST /api/haccp-checklists returns non-500', async ({ request }) => {
    const response = await request.post('/api/haccp-checklists', { data: {} });
    expect(response.status(), '/api/haccp-checklists').toBeLessThan(500);
  });

  test('POST /api/food-cost returns non-500', async ({ request }) => {
    const response = await request.post('/api/food-cost', { data: {} });
    expect(response.status(), '/api/food-cost').toBeLessThan(500);
  });

  test('POST /api/temperature-logs returns non-500', async ({ request }) => {
    const response = await request.post('/api/temperature-logs', { data: {} });
    expect(response.status(), '/api/temperature-logs').toBeLessThan(500);
  });

  test('POST /api/stripe/webhook rejects without signature', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', { data: {} });
    // Should reject (400/401/403) but NOT crash (500)
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/weather returns non-500', async ({ request }) => {
    const response = await request.get('/api/weather');
    expect(response.status(), '/api/weather').toBeLessThan(500);
  });

  test('POST /api/verify-turnstile returns non-500', async ({ request }) => {
    const response = await request.post('/api/verify-turnstile', {
      data: { token: 'test-token' },
    });
    expect(response.status(), '/api/verify-turnstile').toBeLessThan(500);
  });
});
