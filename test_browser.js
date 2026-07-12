const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating...');
  try {
    await page.goto('http://localhost:3005/quotes/new', { waitUntil: 'domcontentloaded', timeout: 10000 });
    // wait a bit for react to render
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (e) {
    console.log('Goto error:', e.message);
  }
  console.log('Done');
  await browser.close();
})();
