const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 560 });
  await page.goto(`file://${path.resolve(__dirname, 'mockup-marquee.html')}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.resolve(__dirname, '..', 'promo-marquee.png') });
  console.log('Captured: store/promo-marquee.png (1400x560)');
  await browser.close();
})();
