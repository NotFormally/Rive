import { test, expect } from '@playwright/test';

/**
 * Multi-locale regression: verifies every supported locale
 * can render the landing page without errors or raw translation keys.
 *
 * This catches:
 * - Missing locale files
 * - Broken translation JSON
 * - Locale routing misconfiguration
 * - Raw keys leaking to users (e.g., "Common.cta_start")
 */

const ALL_LOCALES = [
  // Major
  'fr', 'en', 'es', 'it', 'de', 'pt', 'ru', 'pl', 'tr', 'da', 'sv', 'ro', 'el', 'hu', 'cs',
  // MENA + Iran
  'fa', 'ar', 'ar-AE', 'ar-LB', 'ar-EG', 'kab',
  // Asia
  'hi', 'ur', 'pa', 'ta', 'bn', 'zh-CN', 'zh-HK', 'nan', 'ja', 'ko',
  // Indo-Oceania
  'id', 'ms', 'jv', 'th', 'vi', 'tl',
  // Africa
  'sw', 'am', 'yo', 'ha', 'zu', 'om',
  // ANZ
  'en-AU', 'en-NZ',
  // Celtic
  'br', 'cy', 'gd', 'ga',
  // Romance/Isolates
  'eu', 'co',
  // Germanic Regional
  'nds', 'gsw', 'frk-mos', 'nl-BE',
  // Others
  'nl', 'hsb', 'rom', 'ht',
];

// Patterns that indicate raw translation keys leaked through
const RAW_KEY_PATTERNS = [
  /\b[A-Z][a-zA-Z]+\.[a-z_]+[a-z]\b/, // e.g., "Common.cta_start", "Sidebar.nav_journal"
  /\{[a-zA-Z_]+\}/,                     // e.g., "{count}", "{name}" — uninterpolated variables
];

// Known exceptions: keys that look like raw keys but aren't
const RAW_KEY_WHITELIST = [
  'RiveHub',
  'HACCP',
  'next-intl',
];

test.describe('Multi-locale regression — Landing page', () => {
  for (const locale of ALL_LOCALES) {
    test(`[${locale}] landing page loads without errors`, async ({ page }) => {
      const response = await page.goto(`/${locale}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Page should not return 4xx/5xx
      expect(response?.status()).toBeLessThan(400);

      // Page should have content
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(50);

      // Check for raw translation keys
      const violations: string[] = [];
      for (const pattern of RAW_KEY_PATTERNS) {
        const matches = body.match(new RegExp(pattern.source, 'g'));
        if (matches) {
          const real = matches.filter(
            (m) => !RAW_KEY_WHITELIST.some((w) => m.includes(w))
          );
          if (real.length > 0) {
            violations.push(...real.slice(0, 5)); // Cap to avoid noise
          }
        }
      }

      if (violations.length > 0) {
        console.log(`[${locale}] Possible raw keys: ${violations.join(', ')}`);
      }

      // Allow up to 3 raw keys (some edge cases like brand names)
      expect(
        violations.length,
        `Found ${violations.length} possible raw translation keys in [${locale}]: ${violations.join(', ')}`
      ).toBeLessThanOrEqual(3);
    });
  }
});

test.describe('Multi-locale regression — Login page', () => {
  // Test a representative subset for login (every locale would be too slow)
  const SUBSET = ['en', 'fr', 'es', 'ar', 'zh-CN', 'ja', 'hi', 'ko', 'de', 'pt', 'ru', 'tr', 'fa', 'sw', 'vi'];

  for (const locale of SUBSET) {
    test(`[${locale}] login page renders form`, async ({ page }) => {
      await page.goto(`/${locale}/login`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Login form should be present
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible({ timeout: 10_000 });
      await expect(passwordInput).toBeVisible();
      await expect(submitBtn).toBeVisible();
    });
  }
});

test.describe('Multi-locale regression — RTL layout', () => {
  const RTL_LOCALES = ['ar', 'ar-AE', 'ar-LB', 'ar-EG', 'fa', 'ur', 'he'];

  for (const locale of RTL_LOCALES) {
    test(`[${locale}] page has RTL direction if supported`, async ({ page }) => {
      const response = await page.goto(`/${locale}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Skip if locale not supported (404)
      if (response && response.status() >= 400) {
        test.skip();
        return;
      }

      const dir = await page.getAttribute('html', 'dir');
      // RTL locales should have dir="rtl"
      expect(dir).toBe('rtl');
    });
  }
});
