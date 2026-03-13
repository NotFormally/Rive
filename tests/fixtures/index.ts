import { test as base, expect } from '@playwright/test';

type TestFixtures = {
  locale: string;
};

/**
 * Extended test with locale fixture.
 * Default locale is 'en'. Override per-test with test.use({ locale: 'fr' }).
 */
export const test = base.extend<TestFixtures>({
  locale: ['en', { option: true }],
});

export { expect };
