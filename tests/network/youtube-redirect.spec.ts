import { test, expect } from '../fixtures/extension';

test.describe('YouTube Shorts redirect (L1 DNR)', () => {
  test('/shorts/{id} redirects to /watch?v={id}', async ({ context }) => {
    const page = await context.newPage();
    const videoId = 'dQw4w9WgXcQ';

    await page.goto(`https://www.youtube.com/shorts/${videoId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    const url = page.url();
    expect(url).toContain('/watch?v=' + videoId);
    expect(url).not.toContain('/shorts/');
  });

  test('non-shorts URLs are unaffected', async ({ context }) => {
    const page = await context.newPage();

    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(page.url()).toContain('/watch?v=');
  });
});
