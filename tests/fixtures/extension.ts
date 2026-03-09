/**
 * Playwright fixture that launches Chromium with the Shortless extension loaded.
 *
 * Usage in tests:
 *   import { test, expect } from '../fixtures/extension';
 *   test('my test', async ({ context, extensionId }) => { ... });
 */
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const EXTENSION_PATH = path.resolve(__dirname, '..', '..', 'packages', 'extension');

export type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
};

async function getExtensionId(context: BrowserContext): Promise<string> {
  let sw = context.serviceWorkers()[0];
  if (!sw) {
    sw = await context.waitForEvent('serviceworker', { timeout: 10_000 });
  }
  const match = sw.url().match(/chrome-extension:\/\/([a-z]+)\//);
  if (!match) {
    throw new Error(`Could not extract extension ID from: ${sw.url()}`);
  }
  return match[1];
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const userDataDir = path.join(
      __dirname, '..', '..', 'test-profile-' + Date.now()
    );

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--headless=new',
      ],
    });

    await use(context);
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },

  extensionId: async ({ context }, use) => {
    const id = await getExtensionId(context);
    await use(id);
  },
});

export { expect } from '@playwright/test';
