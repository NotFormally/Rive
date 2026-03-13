import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

/**
 * Provisions a dedicated test user via Supabase Admin API if SUPABASE_SERVICE_ROLE_KEY
 * is available (CI environment). Falls back to static TEST_EMAIL/TEST_PASSWORD otherwise.
 *
 * In CI, creates a unique user per run to avoid session contention.
 * The user is cleaned up after tests via the global teardown.
 */
async function getTestCredentials(): Promise<{ email: string; password: string; provisioned: boolean }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // If we have a service role key AND we're in CI, provision a dedicated user
  if (serviceKey && supabaseUrl && process.env.CI) {
    const runId = process.env.GITHUB_RUN_ID || Date.now().toString();
    const email = `test-e2e-${runId}@rivehub-tests.local`;
    const password = `TestP@ss${runId}!`;

    try {
      // Create user via Supabase Admin API
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true, // Auto-confirm in test
          user_metadata: { is_test_user: true, run_id: runId },
        }),
      });

      if (res.ok) {
        const user = await res.json();
        // Store user ID for cleanup
        process.env.TEST_USER_ID = user.id;
        console.log(`[auth.setup] Provisioned test user: ${email} (${user.id})`);
        return { email, password, provisioned: true };
      } else {
        const errBody = await res.text();
        console.warn(`[auth.setup] Failed to provision user, falling back to static: ${errBody}`);
      }
    } catch (err) {
      console.warn(`[auth.setup] Provisioning error, falling back to static:`, err);
    }
  }

  // Fallback: use static test credentials
  return {
    email: process.env.TEST_EMAIL || 'nassim.saighi@gmail.com',
    password: process.env.TEST_PASSWORD || 'sain5721',
    provisioned: false,
  };
}

setup('authenticate', async ({ page }) => {
  const { email, password } = await getTestCredentials();

  await page.goto('/en/login');

  // Fill login form
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Submit
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  // Wait for dashboard to fully load (auth provider established, cookies set)
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  // Small delay to ensure all cookies are flushed
  await page.waitForTimeout(2_000);

  // Save auth state (cookies + localStorage)
  await page.context().storageState({ path: AUTH_FILE });
});
