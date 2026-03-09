import { test, expect } from '../fixtures/extension';

test.describe('Snapchat Spotlight redirect (L1 DNR)', () => {
  test('/spotlight redirects to snapchat.com home', async ({ context }) => {
    const page = await context.newPage();

    await page.goto('https://www.snapchat.com/spotlight', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    const url = page.url();
    expect(url).not.toContain('/spotlight');
    expect(url).toContain('snapchat.com');
  });

  test('non-spotlight URLs are unaffected', async ({ context }) => {
    const page = await context.newPage();

    await page.goto('https://www.snapchat.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    const pathname = new URL(page.url()).pathname;
    expect(pathname === '/' || pathname === '').toBe(true);
  });
});
