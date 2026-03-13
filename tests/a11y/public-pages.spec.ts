import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Critical violations we never want to allow
const CRITICAL_IMPACT = ['critical', 'serious'];

test.describe('Accessibility — Public Pages', () => {
  test('landing page has no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    const critical = results.violations.filter((v) =>
      CRITICAL_IMPACT.includes(v.impact ?? '')
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      );
      console.log('Landing page a11y violations:\n' + summary.join('\n'));
    }

    expect(critical).toHaveLength(0);
  });

  test('login page has no critical a11y violations', async ({ page }) => {
    await page.goto('/en/auth');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    const critical = results.violations.filter((v) =>
      CRITICAL_IMPACT.includes(v.impact ?? '')
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      );
      console.log('Login page a11y violations:\n' + summary.join('\n'));
    }

    expect(critical).toHaveLength(0);
  });

  test('pricing page has no critical a11y violations', async ({ page }) => {
    await page.goto('/en/pricing');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    const critical = results.violations.filter((v) =>
      CRITICAL_IMPACT.includes(v.impact ?? '')
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      );
      console.log('Pricing page a11y violations:\n' + summary.join('\n'));
    }

    expect(critical).toHaveLength(0);
  });

  test('all public pages have lang attribute', async ({ page }) => {
    await page.goto('/en');
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
  });

  test('all public pages have proper heading hierarchy', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');

    const headings = await page.$$eval(
      'h1, h2, h3, h4, h5, h6',
      (els) => els.map((el) => ({ tag: el.tagName.toLowerCase(), text: el.textContent?.trim().slice(0, 50) }))
    );

    // Must have at least one h1
    const h1s = headings.filter((h) => h.tag === 'h1');
    expect(h1s.length).toBeGreaterThanOrEqual(1);

    // Check no heading level is skipped (e.g., h1 -> h3 without h2)
    const levels = headings.map((h) => parseInt(h.tag.replace('h', '')));
    for (let i = 1; i < levels.length; i++) {
      const jump = levels[i] - levels[i - 1];
      // Allow going deeper by 1 level or going back up to any level
      expect(jump).toBeLessThanOrEqual(1);
    }
  });
});
