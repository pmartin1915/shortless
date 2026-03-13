import { test, expect } from '../fixtures/extension';
import { YOUTUBE_SHORTS_SELECTORS } from '../helpers/selectors';

test.describe('YouTube DOM hiding (L2 CSS + L3 JS)', () => {
  test('Shorts elements on homepage are hidden', async ({ context }) => {
    const page = await context.newPage();

    await page.goto('https://www.youtube.com', {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(3_000);

    for (const selector of YOUTUBE_SHORTS_SELECTORS) {
      const elements = await page.locator(selector).all();
      for (const el of elements) {
        const display = await el.evaluate(
          (node) => getComputedStyle(node).display
        );
        expect(display).toBe('none');
      }
    }
  });

  test('Shorts sidebar entry is hidden', async ({ context }) => {
    const page = await context.newPage();

    await page.goto('https://www.youtube.com', {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    const entry = page.locator(
      'ytd-guide-entry-renderer:has(a[href="/shorts"])'
    );
    const count = await entry.count();
    if (count > 0) {
      const display = await entry.first().evaluate(
        (node) => getComputedStyle(node).display
      );
      expect(display).toBe('none');
    }
  });
});
