/// <reference types="vitest/globals" />
import path from 'path';
import { createChromeMock } from './mocks/chrome';

const BG_PATH = path.resolve(__dirname, '../../packages/shared/background.js');

type ChromeMock = ReturnType<typeof createChromeMock>;
let chromeMock: ChromeMock;

/**
 * Clear Node's require cache and load a fresh copy of background.js.
 * Each load re-executes the module: registers onInstalled/onMessage listeners,
 * sets up internal state, and calls updateBadge() at the bottom.
 */
function loadBackground() {
  const resolved = require.resolve(BG_PATH);
  delete require.cache[resolved];
  return require(BG_PATH);
}

function getOnInstalledHandler(): (details: { reason: string }) => void {
  return chromeMock.runtime.onInstalled.addListener.mock.calls[0][0];
}

function getOnMessageHandler(): (
  message: any,
  sender: { id: string },
  sendResponse: (resp: any) => void
) => boolean | void {
  return chromeMock.runtime.onMessage.addListener.mock.calls[0][0];
}

beforeEach(() => {
  chromeMock = createChromeMock();
  vi.stubGlobal('chrome', chromeMock);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// getTodayKey()
// ---------------------------------------------------------------------------
describe('getTodayKey()', () => {
  it('returns blocks_YYYY-MM-DD format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T12:00:00'));
    const bg = loadBackground();
    expect(bg.getTodayKey()).toBe('blocks_2026-03-22');
  });

  it('zero-pads single-digit month and day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T00:00:00'));
    const bg = loadBackground();
    expect(bg.getTodayKey()).toBe('blocks_2026-01-05');
  });
});

// ---------------------------------------------------------------------------
// handleToggle()
// ---------------------------------------------------------------------------
describe('handleToggle()', () => {
  it('enables a DNR ruleset for a valid platform', () => {
    const bg = loadBackground();
    bg.handleToggle('youtube', true);
    expect(chromeMock.declarativeNetRequest.updateEnabledRulesets).toHaveBeenCalledWith({
      enableRulesetIds: ['youtube_rules'],
      disableRulesetIds: [],
    });
  });

  it('disables a DNR ruleset for a valid platform', () => {
    const bg = loadBackground();
    bg.handleToggle('tiktok', false);
    expect(chromeMock.declarativeNetRequest.updateEnabledRulesets).toHaveBeenCalledWith({
      enableRulesetIds: [],
      disableRulesetIds: ['tiktok_rules'],
    });
  });

  it('persists toggle state to chrome.storage.sync', () => {
    const bg = loadBackground();
    bg.handleToggle('instagram', false);
    expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
      { instagram: false },
      expect.any(Function)
    );
    expect(chromeMock._syncStorage.instagram).toBe(false);
  });

  it('ignores invalid platform name', () => {
    const bg = loadBackground();
    bg.handleToggle('facebook', true);
    expect(chromeMock.declarativeNetRequest.updateEnabledRulesets).not.toHaveBeenCalled();
  });

  it('persists state even if DNR update rejects', () => {
    chromeMock.declarativeNetRequest.updateEnabledRulesets.mockRejectedValueOnce(
      new Error('DNR failure')
    );
    const bg = loadBackground();
    bg.handleToggle('snapchat', true);
    expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
      { snapchat: true },
      expect.any(Function)
    );
  });
});

// ---------------------------------------------------------------------------
// incrementBlockCount() / _flushBlockCount()
// ---------------------------------------------------------------------------
describe('incrementBlockCount / _flushBlockCount', () => {
  it('writes incremented count to storage', () => {
    const bg = loadBackground();
    bg.incrementBlockCount(3);
    const key = bg.getTodayKey();
    expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
      { [key]: 3 },
      expect.any(Function)
    );
  });

  it('accumulates count on top of existing value', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 22, 12)); // noon local time avoids TZ ambiguity
    // Pre-populate storage before loading so initial updateBadge() sees the value
    const key = 'blocks_2026-03-22';
    chromeMock._localStorage[key] = 10;
    const bg = loadBackground();
    bg.incrementBlockCount(5);
    expect(chromeMock._localStorage[key]).toBe(15);
  });

  it('batches rapid increments', () => {
    // Make storage.local.get deferred so second increment arrives during flush
    let pendingCb: ((data: any) => void) | null = null;
    chromeMock.storage.local.get.mockImplementation((key: string, cb: (data: any) => void) => {
      if (!pendingCb) {
        pendingCb = cb;
      } else {
        cb({ [key]: chromeMock._localStorage[key] });
      }
    });

    const bg = loadBackground();
    bg.incrementBlockCount(2);
    bg.incrementBlockCount(3);

    const key = bg.getTodayKey();
    pendingCb!({ [key]: 0 });

    expect(chromeMock._localStorage[key]).toBe(5);
  });

  it('re-queues on storage read failure', () => {
    chromeMock.runtime.lastError = { message: 'read error' };
    chromeMock.storage.local.get.mockImplementation((_key: string, cb: (data: any) => void) => {
      cb({});
    });

    const bg = loadBackground();
    bg.incrementBlockCount(7);

    expect(chromeMock.action.setBadgeText).not.toHaveBeenCalledWith({ text: '7' });
  });

  it('updates badge after successful flush', () => {
    const bg = loadBackground();
    chromeMock.action.setBadgeText.mockClear();

    bg.incrementBlockCount(4);
    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '4' });
  });
});

// ---------------------------------------------------------------------------
// getBlockCount()
// ---------------------------------------------------------------------------
describe('getBlockCount()', () => {
  it('returns today\'s count from storage', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 22, 12));
    chromeMock._localStorage['blocks_2026-03-22'] = 42;
    const bg = loadBackground();
    const count = await bg.getBlockCount();
    expect(count).toBe(42);
  });

  it('returns 0 when no count exists', async () => {
    const bg = loadBackground();
    const count = await bg.getBlockCount();
    expect(count).toBe(0);
  });

  it('returns 0 on storage error', async () => {
    chromeMock.runtime.lastError = { message: 'storage error' };
    chromeMock.storage.local.get.mockImplementation((_key: string, cb: (data: any) => void) => {
      cb({});
    });
    const bg = loadBackground();
    const count = await bg.getBlockCount();
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// updateBadge() / setBadgeText()
// ---------------------------------------------------------------------------
describe('setBadgeText()', () => {
  it('sets text to count string when count > 0', () => {
    const bg = loadBackground();
    chromeMock.action.setBadgeText.mockClear();
    bg.setBadgeText(12);
    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '12' });
  });

  it('sets text to empty string when count is 0', () => {
    const bg = loadBackground();
    chromeMock.action.setBadgeText.mockClear();
    bg.setBadgeText(0);
    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });
});

describe('updateBadge()', () => {
  it('sets badge directly when count is provided', () => {
    const bg = loadBackground();
    chromeMock.action.setBadgeText.mockClear();
    bg.updateBadge(5);
    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '5' });
  });

  it('fetches count from storage when no count is provided', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 22, 12));
    chromeMock._localStorage['blocks_2026-03-22'] = 8;
    const bg = loadBackground();
    chromeMock.action.setBadgeText.mockClear();

    bg.updateBadge();
    await vi.advanceTimersByTimeAsync(0);
    expect(chromeMock.action.setBadgeText).toHaveBeenCalledWith({ text: '8' });
  });
});

// ---------------------------------------------------------------------------
// onInstalled handler
// ---------------------------------------------------------------------------
describe('onInstalled handler', () => {
  it('sets all platforms enabled on fresh install', () => {
    loadBackground();
    const handler = getOnInstalledHandler();
    handler({ reason: 'install' });
    expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(
      { youtube: true, instagram: true, tiktok: true, snapchat: true },
      expect.any(Function)
    );
  });

  it('fills missing platforms on update', () => {
    chromeMock._syncStorage.youtube = true;
    chromeMock._syncStorage.instagram = false;
    loadBackground();
    const handler = getOnInstalledHandler();
    handler({ reason: 'update' });

    const setCalls = chromeMock.storage.sync.set.mock.calls;
    const updateCall = setCalls.find((call: any[]) => {
      const arg = call[0];
      return arg.tiktok !== undefined || arg.snapchat !== undefined;
    });
    expect(updateCall).toBeTruthy();
    expect(updateCall![0]).toEqual({ tiktok: true, snapchat: true });
  });

  it('sets badge background color', () => {
    loadBackground();
    const handler = getOnInstalledHandler();
    handler({ reason: 'install' });
    expect(chromeMock.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: '#2E75B6',
    });
  });

  it('sets badge text color when supported', () => {
    loadBackground();
    const handler = getOnInstalledHandler();
    handler({ reason: 'install' });
    expect(chromeMock.action.setBadgeTextColor).toHaveBeenCalledWith({
      color: '#FFFFFF',
    });
  });

  it('handles missing setBadgeTextColor gracefully', () => {
    delete (chromeMock.action as any).setBadgeTextColor;
    loadBackground();
    const handler = getOnInstalledHandler();
    expect(() => handler({ reason: 'install' })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// onMessage handler
// ---------------------------------------------------------------------------
describe('onMessage handler', () => {
  const selfSender = { id: 'test-extension-id' };
  const foreignSender = { id: 'other-extension' };

  it('TOGGLE_PLATFORM calls handleToggle', () => {
    loadBackground();
    const handler = getOnMessageHandler();
    const sendResponse = vi.fn();

    handler(
      { type: 'TOGGLE_PLATFORM', platform: 'youtube', enabled: false },
      selfSender,
      sendResponse
    );

    expect(chromeMock.declarativeNetRequest.updateEnabledRulesets).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('BLOCK_COUNT_INCREMENT increments by message count', () => {
    const bg = loadBackground();
    const handler = getOnMessageHandler();
    const sendResponse = vi.fn();

    handler({ type: 'BLOCK_COUNT_INCREMENT', count: 5 }, selfSender, sendResponse);

    const key = bg.getTodayKey();
    expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
      { [key]: 5 },
      expect.any(Function)
    );
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('BLOCK_COUNT_INCREMENT defaults to 1 when count not provided', () => {
    const bg = loadBackground();
    const handler = getOnMessageHandler();
    const sendResponse = vi.fn();

    handler({ type: 'BLOCK_COUNT_INCREMENT' }, selfSender, sendResponse);

    const key = bg.getTodayKey();
    expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
      { [key]: 1 },
      expect.any(Function)
    );
  });

  it('GET_PLATFORM_STATE returns enabled state', () => {
    chromeMock._syncStorage.youtube = false;
    loadBackground();
    const handler = getOnMessageHandler();
    const sendResponse = vi.fn();

    const result = handler(
      { type: 'GET_PLATFORM_STATE', platform: 'youtube' },
      selfSender,
      sendResponse
    );

    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({ enabled: false });
  });

  it('GET_BLOCK_COUNT returns current count', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 22, 12));
    chromeMock._localStorage['blocks_2026-03-22'] = 17;
    loadBackground();
    const handler = getOnMessageHandler();
    const sendResponse = vi.fn();

    const result = handler({ type: 'GET_BLOCK_COUNT' }, selfSender, sendResponse);
    expect(result).toBe(true);

    await vi.advanceTimersByTimeAsync(0);
    expect(sendResponse).toHaveBeenCalledWith({ count: 17 });
  });

  it('ignores messages from other extensions', () => {
    loadBackground();
    const handler = getOnMessageHandler();
    const sendResponse = vi.fn();

    handler(
      { type: 'TOGGLE_PLATFORM', platform: 'youtube', enabled: false },
      foreignSender,
      sendResponse
    );

    expect(sendResponse).not.toHaveBeenCalled();
    expect(chromeMock.declarativeNetRequest.updateEnabledRulesets).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// cleanupOldBlockKeys()
// ---------------------------------------------------------------------------
describe('cleanupOldBlockKeys()', () => {
  it('removes keys older than 30 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T12:00:00'));

    // 31 days ago
    chromeMock._localStorage['blocks_2026-02-19'] = 42;
    // 60 days ago
    chromeMock._localStorage['blocks_2026-01-21'] = 10;
    // Today (should keep)
    chromeMock._localStorage['blocks_2026-03-22'] = 5;

    const bg = loadBackground();
    bg.cleanupOldBlockKeys();

    expect(chromeMock._localStorage['blocks_2026-02-19']).toBeUndefined();
    expect(chromeMock._localStorage['blocks_2026-01-21']).toBeUndefined();
    expect(chromeMock._localStorage['blocks_2026-03-22']).toBe(5);
  });

  it('keeps keys from the last 30 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T12:00:00'));

    // 29 days ago (within 30-day window)
    chromeMock._localStorage['blocks_2026-02-21'] = 7;
    // Today
    chromeMock._localStorage['blocks_2026-03-22'] = 3;

    const bg = loadBackground();
    bg.cleanupOldBlockKeys();

    expect(chromeMock._localStorage['blocks_2026-02-21']).toBe(7);
    expect(chromeMock._localStorage['blocks_2026-03-22']).toBe(3);
  });

  it('ignores non-block keys in storage', () => {
    chromeMock._localStorage['some_other_key'] = 'value';
    chromeMock._localStorage['blocks_2020-01-01'] = 99;

    const bg = loadBackground();
    bg.cleanupOldBlockKeys();

    // Non-block keys should be untouched
    expect(chromeMock._localStorage['some_other_key']).toBe('value');
    // Old block key should be removed
    expect(chromeMock._localStorage['blocks_2020-01-01']).toBeUndefined();
  });

  it('handles empty storage gracefully', () => {
    const bg = loadBackground();
    expect(() => bg.cleanupOldBlockKeys()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe('constants', () => {
  it('PLATFORMS contains all 4 platforms', () => {
    const bg = loadBackground();
    expect(bg.PLATFORMS).toEqual(['youtube', 'instagram', 'tiktok', 'snapchat']);
  });

  it('RULESET_MAP maps every platform to a ruleset ID', () => {
    const bg = loadBackground();
    for (const p of bg.PLATFORMS) {
      expect(bg.RULESET_MAP[p]).toBe(`${p}_rules`);
    }
  });
});
