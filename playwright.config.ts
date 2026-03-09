import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],

  projects: [
    {
      name: 'offline',
      testDir: './tests/offline',
      retries: 0,
      timeout: 15_000,
    },
    {
      name: 'network',
      testDir: './tests/network',
      retries: 2,
      timeout: 60_000,
    },
  ],
});
