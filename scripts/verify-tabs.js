const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting E2E Dashboard Verification...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser Error:`, msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error(`Browser Exception:`, err.message);
  });

  try {
    console.log('Navigating to Signup...');
    await page.goto('https://www.rivehub.com/en/signup', { waitUntil: 'networkidle2' });
    
    // Fill signup form
    const email = `test.e2e.${Date.now()}@rivehub.com`;
    console.log(`Signing up with ${email}...`);
    
    await page.type('input[type="text"]', 'E2E Test Restaurant');
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    console.log('Waiting for dashboard load...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      throw new Error(`Failed to navigate to dashboard. Current URL: ${currentUrl}`);
    }
    console.log('✅ Successfully reached dashboard.');

    // We will explicitly visit all known dashboard tabs to ensure no hidden modules crash
    const allRoutes = [
      '/en/dashboard',
      '/en/dashboard/menu',
      '/en/dashboard/food-cost',
      '/en/dashboard/engineering',
      '/en/dashboard/engineering/sales',
      '/en/dashboard/reservations',
      '/en/dashboard/prep-list',
      '/en/dashboard/settings',
      '/en/dashboard/settings/integrations',
      '/en/dashboard/settings/reservations'
    ];
    
    console.log(`Verifying ${allRoutes.length} specific dashboard routes...`);

    for (const link of allRoutes) {
      console.log(`\nTesting Tab: ${link}`);
      await page.goto(`https://www.rivehub.com${link}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000)); // wait for client rendering/fetches
      
      // Check for the Next.js/React error overlay
      const hasErrorOverlay = await page.$('body[style*="overflow: hidden"]') || 
                              await page.evaluate(() => document.body.innerText.includes('Une erreur inattendue est survenue'));

      if (hasErrorOverlay) {
        throw new Error(`❌ Layout Crash detected on ${link}!`);
      } else {
        console.log(`✅ ${link} rendered successfully.`);
      }
    }
    
    console.log('\n🎉 All tabs verified successfully. No layout crashes detected.');
  } catch (error) {
    console.error('\n❌ E2E Verification Failed:', error.message);
  } finally {
    await browser.close();
  }
})();
