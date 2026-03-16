const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const mockups = [
    'mockup-1-popup.html',
    'mockup-2-youtube.html',
    'mockup-3-platforms.html',
  ];

  for (const file of mockups) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    const filePath = path.resolve(__dirname, file);
    await page.goto(`file://${filePath}`);
    // Wait for fonts/rendering
    await page.waitForTimeout(500);
    const outName = file.replace('.html', '.png');
    await page.screenshot({ path: path.resolve(__dirname, outName) });
    console.log(`Captured: ${outName}`);
    await page.close();
  }

  await browser.close();
  console.log('Done! Screenshots saved to store/screenshots/');
})();
