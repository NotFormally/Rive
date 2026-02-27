const puppeteer = require('puppeteer');

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
    console.log("Navigating to http://localhost:3000/fr/dashboard");
    const response = await page.goto('http://localhost:3000/fr/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Status code:', response.status());
    
    await page.screenshot({ path: 'dashboard-debug.png' });
    console.log("Screenshot saved to dashboard-debug.png");
    
    // Check if the Next.js error overlay is present
    const hasErrorOverlay = await page.evaluate(() => {
      return !!document.querySelector('nextjs-portal');
    });
    console.log('Next.js Error Overlay Present:', hasErrorOverlay);
    
  } catch (err) {
    console.error("Navigation failed:", err);
  } finally {
    await browser.close();
  }
})();
