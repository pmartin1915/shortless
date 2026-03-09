import { test, expect } from '../fixtures/extension';

test.describe('TikTok domain block (L1 DNR)', () => {
  test('tiktok.com is blocked', async ({ context }) => {
    const page = await context.newPage();

    let blocked = false;
    try {
      const response = await page.goto('https://www.tiktok.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
      if (response === null) blocked = true;
    } catch (error: any) {
      if (
        error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
        error.message.includes('Navigation failed')
      ) {
        blocked = true;
      }
    }

    expect(blocked).toBe(true);
  });
});
