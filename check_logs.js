import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/H1-V2/#/login');
  
  // Try to login
  try {
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'nimaythakur1234@gmail.com');
    await page.type('input[type="password"]', 'nimaythakur1234');
    await page.click('button[type="submit"]');
    
    // Wait for a bit
    await new Promise(r => setTimeout(r, 5000));
  } catch(e) {
    console.error("Login failed:", e);
  }
  
  await browser.close();
})();
