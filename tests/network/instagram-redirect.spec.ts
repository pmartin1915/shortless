import { test, expect } from '../fixtures/extension';

test.describe('Instagram Reels redirect (L1 DNR)', () => {
  test('/reels/ redirects away', async ({ context }) => {
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/reels/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // DNR fires before page loads. May end up at / or /accounts/login/.
    expect(page.url()).not.toContain('/reels/');
  });

  test('/reel/{id} redirects away', async ({ context }) => {
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/reel/ABC123/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(page.url()).not.toContain('/reel/');
  });
});
