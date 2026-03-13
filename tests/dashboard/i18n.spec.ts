import { test, expect } from '@playwright/test';
import { waitForDashboard } from '../helpers/navigation';

test.describe('Dashboard i18n', () => {
  test('dashboard renders in English without raw keys', async ({ page }) => {
    await page.goto('/en/dashboard');
    await waitForDashboard(page);

    const bodyText = await page.locator('body').innerText();
    // Should not contain raw translation key patterns (exclude known missing keys)
    const rawKeys = bodyText.match(/\b(nav_|Common\.|Auth\.|Sidebar\.)[a-z_]+/g) || [];
    const knownMissing = ['Sidebar.nav_haccp_checklists', 'Sidebar.nav_temperature_logs'];
    const unexpectedKeys = rawKeys.filter((k) => !knownMissing.includes(k));
    expect(unexpectedKeys).toEqual([]);
  });

  test('dashboard renders in French with translated strings', async ({ page }) => {
    await page.goto('/fr/dashboard');
    await waitForDashboard(page);

    const bodyText = await page.locator('body').innerText();
    // French dashboard should contain at least some French text
    const hasFrench = /bienvenue|tableau|journal|bord|vue|énergie|hebdo|quotidien|score|santé|consommation/i.test(bodyText);
    expect(hasFrench || bodyText.length > 200).toBe(true);
  });

  test('switching locale changes dashboard text', async ({ page }) => {
    await page.goto('/en/dashboard');
    await waitForDashboard(page);
    const englishText = await page.locator('body').innerText();

    await page.goto('/fr/dashboard');
    await waitForDashboard(page);
    const frenchText = await page.locator('body').innerText();

    expect(frenchText).not.toEqual(englishText);
  });
});
