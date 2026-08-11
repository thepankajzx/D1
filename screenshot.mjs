import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Navigate to local dev server
  await page.goto('http://localhost:5173/');
  
  // Wait a bit for it to load
  await page.waitForTimeout(3000);
  
  // Screenshot the login page
  await page.screenshot({ path: 'screenshot_login.png' });
  
  // Close
  await browser.close();
})();
