const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  
  // Also log network requests to see if that's the issue
  page.on('requestfailed', request => {
    console.error(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    console.log("Navigating to http://localhost:3000/fr/dashboard");
    const response = await page.goto('http://localhost:3000/fr/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Status code:', response?.status());
    
    // Check if the Next.js error overlay is present
    const hasErrorOverlay = await page.evaluate(() => {
      const nextjsPortal = document.querySelector('nextjs-portal');
      if (nextjsPortal) {
        return nextjsPortal.shadowRoot ? nextjsPortal.shadowRoot.innerHTML.substring(0, 500) : 'portal exists but no shadowRoot';
      }
      return false;
    });
    console.log('Next.js Error Overlay Present:', hasErrorOverlay);
    
    // Check main content
    const bodyContent = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('Body Content Preview:', bodyContent);

  } catch (err) {
    console.error("Navigation failed:", err);
  } finally {
    await browser.close();
  }
})();
