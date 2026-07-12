const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  await page.goto('http://127.0.0.1:3005/quotes/new', { waitUntil: 'domcontentloaded' });
  console.log("Waiting for selector...");
  try {
    await page.waitForSelector('.wizard-container', { timeout: 15000 });
    console.log("Found .wizard-container");
    // wait a bit for framer motion
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.log("Timeout waiting for selector");
  }
  await page.screenshot({ path: 'C:\\Users\\Akash\\.gemini\\antigravity\\brain\\053b1188-3ef7-45ef-b57f-99a3d989fa98\\screenshot_quotes_new_waitFor.png' });
  await browser.close();
})();
