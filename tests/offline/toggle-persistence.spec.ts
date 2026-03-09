import { test, expect } from '../fixtures/extension';

test.describe('Toggle persistence', () => {
  test('toggling off persists to storage', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForTimeout(500);

    // The <input> is visually hidden (opacity:0, width:0) for the custom
    // toggle slider. Click the visible <label class="toggle"> instead.
    await page.locator('[data-platform="youtube"] .toggle').click();
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        chrome.storage.sync.get('youtube', (r) => resolve(r.youtube));
      });
    });
    expect(stored).toBe(false);
  });

  test('toggle state survives popup reopen', async ({ context, extensionId }) => {
    const popupUrl = `chrome-extension://${extensionId}/popup/popup.html`;
    const page = await context.newPage();
    await page.goto(popupUrl);
    await page.waitForTimeout(500);

    // Toggle Instagram off
    await page.locator('[data-platform="instagram"] .toggle').click();
    await page.waitForTimeout(300);

    // Reopen popup
    await page.goto('about:blank');
    await page.goto(popupUrl);
    await page.waitForTimeout(500);

    // Instagram should be unchecked, others still checked
    await expect(
      page.locator('[data-platform="instagram"] input[type="checkbox"]')
    ).not.toBeChecked();
    await expect(
      page.locator('[data-platform="youtube"] input[type="checkbox"]')
    ).toBeChecked();
  });

  test('re-enabling updates storage back to true', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForTimeout(500);

    const toggle = page.locator('[data-platform="tiktok"] .toggle');
    // Toggle off then back on
    await toggle.click();
    await page.waitForTimeout(200);
    await toggle.click();
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        chrome.storage.sync.get('tiktok', (r) => resolve(r.tiktok));
      });
    });
    expect(stored).toBe(true);
  });
});
