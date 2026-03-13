import { Page, expect } from '@playwright/test';

/**
 * Collect console errors during a page interaction.
 * Returns an array of error messages.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Assert that no JavaScript errors were thrown on the page.
 * Call after page interactions, passing the errors array from collectConsoleErrors.
 */
export function expectNoConsoleErrors(errors: string[]) {
  // Filter out known noisy errors (e.g., third-party scripts, favicon)
  const real = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('third-party') &&
      !e.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT'),
  );
  expect(real).toHaveLength(0);
}
