const puppeteer = require('puppeteer');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    console.log("Navigating to http://localhost:3000/fr/login");
    await page.goto('http://localhost:3000/fr/login', { waitUntil: 'networkidle0' });
    
    console.log("Typing credentials...");
    await page.type('input[type="email"]', 'test@test.com');
    await page.type('input[type="password"]', 'test1234');
    
    console.log("Clicking submit...");
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
    ]);
    
    console.log("Navigated to:", page.url());
    
    // Check if the Next.js error overlay is present on the destination page
    const hasErrorOverlay = await page.evaluate(() => !!document.querySelector('nextjs-portal'));
    console.log('Next.js Error Overlay Present:', hasErrorOverlay);
    
    // Check main content to verify if it's actually blank
    const bodyContentLength = await page.evaluate(() => document.body.innerText.length);
    console.log(`Body text length: ${bodyContentLength} characters`);
    
    await page.screenshot({ path: 'dashboard-auth-debug.png' });
    console.log("Screenshot saved to dashboard-auth-debug.png");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
