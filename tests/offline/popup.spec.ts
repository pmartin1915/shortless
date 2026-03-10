import { test, expect } from '../fixtures/extension';
import { POPUP_PLATFORMS } from '../helpers/selectors';
import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'packages', 'extension', 'manifest.json'),
    'utf-8'
  )
);

test.describe('Popup UI', () => {
  test('renders title and tagline', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    await expect(page.locator('.title')).toHaveText('Shortless');
    await expect(page.locator('.tagline')).toHaveText(
      'Block the Scroll. Keep the Content.'
    );
    await expect(page.locator('.version')).toHaveText(`v${manifest.version}`);
  });

  test('renders 4 platform cards', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    await expect(page.locator('.platform-card')).toHaveCount(4);
  });

  test('each platform has correct name', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const names = ['YouTube', 'Instagram', 'TikTok', 'Snapchat'];
    for (let i = 0; i < POPUP_PLATFORMS.length; i++) {
      const card = page.locator(`[data-platform="${POPUP_PLATFORMS[i]}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator('.platform-name')).toHaveText(names[i]);
    }
  });

  test('all toggles checked by default', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForTimeout(500);

    for (const platform of POPUP_PLATFORMS) {
      const checkbox = page.locator(
        `[data-platform="${platform}"] input[type="checkbox"]`
      );
      await expect(checkbox).toBeChecked();
    }
  });

  test('block count displays 0 initially', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForTimeout(500);

    await expect(page.locator('#block-count')).toHaveText('0');
  });

  test('dark mode styling applied', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    expect(bodyBg).toBe('rgb(26, 26, 46)');
  });
});
