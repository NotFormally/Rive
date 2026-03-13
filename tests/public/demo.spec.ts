import { test, expect } from '@playwright/test';
import { expectPageLoads } from '../helpers/navigation';

test.describe('Demo HACCP', () => {
  test('demo HACCP page loads', async ({ page }) => {
    await page.goto('/en/demo/haccp');
    await expectPageLoads(page);
    // Should have demo-related content (build/audit steps)
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/i);
  });

  test('demo page has interactive builder elements', async ({ page }) => {
    await page.goto('/en/demo/haccp');
    await expectPageLoads(page);

    // The demo has a multi-step form builder with buttons and inputs
    const interactiveElements = page.locator(
      'button, input, [role="button"], [class*="step"], [class*="field"]',
    );
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
