import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Read environment variables from .env.local
 */
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const AUTH_FILE = path.join(__dirname, 'tests', '.auth', 'user.json');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  globalTeardown: process.env.CI ? './tests/fixtures/global-teardown.ts' : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  timeout: 60_000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // --- Setup: login once and save auth state ---
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // --- Public pages (no auth needed, but run after setup to avoid session conflicts) ---
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /\/(public|auth)\/.+\.spec\.ts$/,
      dependencies: ['setup'],
    },

    // --- Authenticated pages (depend on setup) ---
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testMatch: /\/dashboard\/.+\.spec\.ts$/,
    },

    // --- API tests (depend on setup for auth cookies) ---
    {
      name: 'api',
      use: {
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testMatch: /\/api\/.+\.spec\.ts$/,
    },

    // --- Mobile responsive tests (use storageState for dashboard mobile test) ---
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testMatch: /\/mobile\/.+\.spec\.ts$/,
    },

    // --- Visual regression tests ---
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testMatch: /\/visual\/.+\.spec\.ts$/,
    },

    // --- Accessibility tests ---
    {
      name: 'a11y',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testMatch: /\/a11y\/.+\.spec\.ts$/,
    },

    // --- i18n multi-locale regression tests ---
    {
      name: 'i18n-regression',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /\/i18n\/.+\.spec\.ts$/,
    },

    // --- Stripe checkout tests ---
    {
      name: 'stripe',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testMatch: /\/stripe\/.+\.spec\.ts$/,
    },

    // --- Access control tests ---
    {
      name: 'access-control',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testMatch: /\/access-control\/.+\.spec\.ts$/,
    },

    // --- Error handling tests ---
    {
      name: 'error-handling',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /\/error-handling\/.+\.spec\.ts$/,
    },

    // --- Performance tests ---
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /\/performance\/.+\.spec\.ts$/,
    },
  ],

  // Skip local dev server when testing against a staging/production URL
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
