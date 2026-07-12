const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://127.0.0.1:3005/quotes/new', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Users\\Akash\\.gemini\\antigravity\\brain\\053b1188-3ef7-45ef-b57f-99a3d989fa98\\screenshot_quotes_new_mobile.png' });
  await browser.close();
})();
