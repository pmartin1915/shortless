/// <reference types="vitest/globals" />

/**
 * Creates a fresh Chrome extension API mock with in-memory storage backing.
 * Every API method is a vi.fn() for assertion via toHaveBeenCalledWith().
 */
export function createChromeMock() {
  const syncStorage: Record<string, any> = {};
  const localStorage: Record<string, any> = {};

  const mock = {
    runtime: {
      id: 'test-extension-id',
      lastError: null as null | { message: string },
      onInstalled: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
      sendMessage: vi.fn(),
      getManifest: vi.fn(() => ({ version: '1.1.2' })),
    },
    storage: {
      sync: {
        get: vi.fn((keys: string | string[] | Record<string, any>, cb: (result: Record<string, any>) => void) => {
          // Handle object-with-defaults (e.g. { youtube: true }) — merge defaults with stored values
          if (keys && typeof keys === 'object' && !Array.isArray(keys)) {
            const result: Record<string, any> = { ...keys };
            Object.keys(keys).forEach(k => {
              if (k in syncStorage) result[k] = syncStorage[k];
            });
            cb(result);
            return;
          }
          const keyList = Array.isArray(keys) ? keys : [keys as string];
          const result: Record<string, any> = {};
          keyList.forEach(k => {
            if (k in syncStorage) result[k] = syncStorage[k];
          });
          cb(result);
        }),
        set: vi.fn((items: Record<string, any>, cb?: () => void) => {
          Object.assign(syncStorage, items);
          cb?.();
        }),
      },
      local: {
        get: vi.fn((key: string, cb: (result: Record<string, any>) => void) => {
          cb({ [key]: localStorage[key] });
        }),
        set: vi.fn((items: Record<string, any>, cb?: () => void) => {
          Object.assign(localStorage, items);
          cb?.();
        }),
      },
      onChanged: { addListener: vi.fn() },
    },
    declarativeNetRequest: {
      updateEnabledRulesets: vi.fn(() => Promise.resolve()),
    },
    action: {
      setBadgeBackgroundColor: vi.fn(),
      setBadgeTextColor: vi.fn(),
      setBadgeText: vi.fn(),
    },
    tabs: {
      create: vi.fn(),
    },
    // Expose internal storage for test assertions
    _syncStorage: syncStorage,
    _localStorage: localStorage,
  };

  return mock;
}
