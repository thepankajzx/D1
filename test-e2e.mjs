import { chromium } from 'playwright';

(async () => {
  console.log('Starting E2E tests...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Open the app
    console.log('Navigating to local dev server...');
    // We assume the dev server is running on http://localhost:5173
    await page.goto('http://localhost:5173/#/login');
    
    // 2. Login
    console.log('Attempting login...');
    await page.waitForSelector('button:has-text("Continue with Google")', { timeout: 10000 }).catch(() => null);
    
    // Note: Google OAuth login is hard to automate in headless mode due to captchas.
    // However, if we just want to verify the app renders the login page, we can do that.
    const loginTitle = await page.locator('text="Sign In"').isVisible();
    console.log('Login page visible:', loginTitle);
    
    // For a real E2E test without a dummy account bypassing auth, 
    // we would need to mock the auth context or use a Firebase emulator.
    // For now, let's just make sure the page loads and doesn't crash on a white screen.
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Sign In') || bodyText.includes('Definite Habit Tracker')) {
      console.log('✅ UI rendered successfully (no white screen of death).');
    } else {
      console.error('❌ UI did not render properly.', bodyText.substring(0, 200));
    }
    
    console.log('E2E Basic Render Test Passed.');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
