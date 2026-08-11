import { chromium } from 'playwright';

(async () => {
  console.log('Starting E2E flow test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err));
    
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:5173/#/');
    
    console.log('Waiting for dashboard content...');
    await page.waitForTimeout(5000);
    
    // Dump body text
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('BODY TEXT:\n', bodyText);
    
    // Check if the dashboard or empty state loaded
    console.log('Checking for loaded content...');
    
    // We expect either "Welcome to Definite!" (empty state) or "Daily Review" (populated dashboard)
    const emptyStateVisible = await page.locator('text=Welcome to Definite!').isVisible();
    const dashboardVisible = await page.locator('text=Daily Review').isVisible();
    
    if (emptyStateVisible || dashboardVisible) {
        console.log('✅ TEST PASSED: The dashboard loaded successfully without an infinite spinner.');
    } else {
        console.log('❌ TEST FAILED: Could not find empty state or dashboard header. Spinner might still be visible.');
    }

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'flow-error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();
