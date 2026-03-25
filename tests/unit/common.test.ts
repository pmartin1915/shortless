/// <reference types="vitest/globals" />
// @vitest-environment jsdom

import path from 'path';
import { createChromeMock } from './mocks/chrome';

const COMMON_PATH = path.resolve(
  __dirname,
  '../../packages/shared/content-scripts/common.js'
);

type ChromeMock = ReturnType<typeof createChromeMock>;
let chromeMock: ChromeMock;

/**
 * Clear require cache and load a fresh copy of common.js.
 * The IIFE sets window.__shortless and module.exports.
 */
function loadCommon() {
  // Reset window.__shortless so the guard doesn't skip init
  delete (window as any).__shortless;

  const resolved = require.resolve(COMMON_PATH);
  delete require.cache[resolved];
  return require(COMMON_PATH);
}

beforeEach(() => {
  chromeMock = createChromeMock();
  vi.stubGlobal('chrome', chromeMock);
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// hideElements()
// ---------------------------------------------------------------------------
describe('hideElements()', () => {
  it('hides elements matching selectors and returns count', () => {
    document.body.innerHTML = `
      <div class="shorts-shelf">Shorts</div>
      <div class="normal">Normal</div>
      <div class="shorts-shelf">Shorts 2</div>
    `;
    const common = loadCommon();
    const count = common.hideElements(['.shorts-shelf']);
    expect(count).toBe(2);

    const hidden = document.querySelectorAll('[data-shortless-hidden]');
    expect(hidden.length).toBe(2);
  });

  it('skips already-hidden elements via :not() filter', () => {
    document.body.innerHTML = `
      <div class="target" data-shortless-hidden="true">Already hidden</div>
      <div class="target">New</div>
    `;
    const common = loadCommon();
    const count = common.hideElements(['.target']);
    expect(count).toBe(1);
  });

  it('returns 0 for empty selector array', () => {
    const common = loadCommon();
    expect(common.hideElements([])).toBe(0);
  });

  it('sets display none important on matched elements', () => {
    document.body.innerHTML = '<div class="target">Content</div>';
    const common = loadCommon();
    common.hideElements(['.target']);

    const el = document.querySelector('.target') as HTMLElement;
    expect(el.style.getPropertyValue('display')).toBe('none');
    expect(el.style.getPropertyPriority('display')).toBe('important');
  });

  it('uses custom marker attribute when provided', () => {
    document.body.innerHTML = '<div class="target">Content</div>';
    const common = loadCommon();
    common.hideElements(['.target'], 'data-custom-marker');

    const el = document.querySelector('.target') as HTMLElement;
    expect(el.hasAttribute('data-custom-marker')).toBe(true);
    expect(el.hasAttribute('data-shortless-hidden')).toBe(false);
  });

  it('returns 0 for unsupported CSS selectors', () => {
    const common = loadCommon();
    // Invalid pseudo-class that should throw in querySelectorAll
    const count = common.hideElements(['::-invalid-pseudo']);
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// unhideAll()
// ---------------------------------------------------------------------------
describe('unhideAll()', () => {
  it('restores display and removes marker attribute', () => {
    document.body.innerHTML = `
      <div class="a" data-shortless-hidden="true" style="display: none !important;">Hidden</div>
      <div class="b" data-shortless-hidden="true" style="display: none !important;">Hidden 2</div>
    `;
    const common = loadCommon();
    common.unhideAll();

    const els = document.querySelectorAll('[data-shortless-hidden]');
    expect(els.length).toBe(0);

    const a = document.querySelector('.a') as HTMLElement;
    expect(a.style.getPropertyValue('display')).toBe('');
  });

  it('works with custom marker attribute', () => {
    document.body.innerHTML = '<div data-custom="true" style="display: none !important;">Hidden</div>';
    const common = loadCommon();
    common.unhideAll('data-custom');

    expect(document.querySelectorAll('[data-custom]').length).toBe(0);
  });

  it('does nothing when no hidden elements exist', () => {
    document.body.innerHTML = '<div>Normal</div>';
    const common = loadCommon();
    // Should not throw
    common.unhideAll();
    expect(document.querySelectorAll('[data-shortless-hidden]').length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// sendBlockCount() — debounced (2-second flush)
// ---------------------------------------------------------------------------
describe('sendBlockCount()', () => {
  it('does not send immediately — waits for debounce flush', () => {
    vi.useFakeTimers();
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(5);
    expect(sendMsg).not.toHaveBeenCalled();
  });

  it('sends accumulated count after 2 seconds', () => {
    vi.useFakeTimers();
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(3);
    common.sendBlockCount(7);

    vi.advanceTimersByTime(2000);
    expect(sendMsg).toHaveBeenCalledOnce();
    expect(sendMsg).toHaveBeenCalledWith({ type: 'BLOCK_COUNT_INCREMENT', count: 10 });
  });

  it('resets accumulator after flush', () => {
    vi.useFakeTimers();
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(5);
    vi.advanceTimersByTime(2000);
    sendMsg.mockClear();

    common.sendBlockCount(2);
    vi.advanceTimersByTime(2000);
    expect(sendMsg).toHaveBeenCalledWith({ type: 'BLOCK_COUNT_INCREMENT', count: 2 });
  });

  it('does not send for zero or negative counts', () => {
    vi.useFakeTimers();
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(0);
    common.sendBlockCount(-3);
    vi.advanceTimersByTime(2000);
    expect(sendMsg).not.toHaveBeenCalled();
  });

  it('flushPendingCount sends immediately and clears timer', () => {
    vi.useFakeTimers();
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(8);
    expect(sendMsg).not.toHaveBeenCalled();

    common.flushPendingCount();
    expect(sendMsg).toHaveBeenCalledOnce();
    expect(sendMsg).toHaveBeenCalledWith({ type: 'BLOCK_COUNT_INCREMENT', count: 8 });

    // Timer should be cleared — advancing should not send again
    sendMsg.mockClear();
    vi.advanceTimersByTime(2000);
    expect(sendMsg).not.toHaveBeenCalled();
  });

  it('flushPendingCount is a no-op when nothing is pending', () => {
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.flushPendingCount();
    expect(sendMsg).not.toHaveBeenCalled();
  });

  it('ignores zero then correctly sends subsequent positive count', () => {
    vi.useFakeTimers();
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(0); // should be ignored
    common.sendBlockCount(5);
    vi.advanceTimersByTime(2000);
    expect(sendMsg).toHaveBeenCalledOnce();
    expect(sendMsg).toHaveBeenCalledWith({ type: 'BLOCK_COUNT_INCREMENT', count: 5 });
  });

  it('silently drops count when extension context is invalidated', () => {
    vi.useFakeTimers();
    const sendMsg = vi.fn(() => { throw new Error('Extension context invalidated'); });
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(3);
    // Should not throw
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// isPlatformEnabled()
// ---------------------------------------------------------------------------
describe('isPlatformEnabled()', () => {
  it('resolves to true when platform is enabled in storage', async () => {
    chromeMock._syncStorage.youtube = true;
    const common = loadCommon();
    const enabled = await common.isPlatformEnabled('youtube');
    expect(enabled).toBe(true);
  });

  it('resolves to true when platform is missing from storage (default)', async () => {
    const common = loadCommon();
    const enabled = await common.isPlatformEnabled('youtube');
    expect(enabled).toBe(true);
  });

  it('resolves to false when platform is explicitly disabled', async () => {
    chromeMock._syncStorage.instagram = false;
    const common = loadCommon();
    const enabled = await common.isPlatformEnabled('instagram');
    expect(enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// watchToggle()
// ---------------------------------------------------------------------------
describe('watchToggle()', () => {
  it('calls onEnable when platform toggles to true', () => {
    const common = loadCommon();
    const onEnable = vi.fn();
    const onDisable = vi.fn();
    common.watchToggle('youtube', { onEnable, onDisable });

    // Get the registered onChanged listener
    const listener = chromeMock.storage.onChanged.addListener.mock.calls[0][0];
    listener({ youtube: { newValue: true, oldValue: false } }, 'sync');

    expect(onEnable).toHaveBeenCalledOnce();
    expect(onDisable).not.toHaveBeenCalled();
  });

  it('calls onDisable when platform toggles to false', () => {
    const common = loadCommon();
    const onEnable = vi.fn();
    const onDisable = vi.fn();
    common.watchToggle('youtube', { onEnable, onDisable });

    const listener = chromeMock.storage.onChanged.addListener.mock.calls[0][0];
    listener({ youtube: { newValue: false, oldValue: true } }, 'sync');

    expect(onDisable).toHaveBeenCalledOnce();
    expect(onEnable).not.toHaveBeenCalled();
  });

  it('ignores changes in non-sync storage areas', () => {
    const common = loadCommon();
    const onEnable = vi.fn();
    const onDisable = vi.fn();
    common.watchToggle('youtube', { onEnable, onDisable });

    const listener = chromeMock.storage.onChanged.addListener.mock.calls[0][0];
    listener({ youtube: { newValue: true } }, 'local');

    expect(onEnable).not.toHaveBeenCalled();
    expect(onDisable).not.toHaveBeenCalled();
  });

  it('ignores changes to unrelated platforms', () => {
    const common = loadCommon();
    const onEnable = vi.fn();
    const onDisable = vi.fn();
    common.watchToggle('youtube', { onEnable, onDisable });

    const listener = chromeMock.storage.onChanged.addListener.mock.calls[0][0];
    listener({ instagram: { newValue: false } }, 'sync');

    expect(onEnable).not.toHaveBeenCalled();
    expect(onDisable).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// interceptHistoryNav()
// ---------------------------------------------------------------------------
describe('interceptHistoryNav()', () => {
  it('calls callback on pushState', () => {
    const common = loadCommon();
    const callback = vi.fn();
    common.interceptHistoryNav(callback);

    history.pushState({}, '', '/test-page');
    expect(callback).toHaveBeenCalledWith(expect.stringContaining('/test-page'));
  });

  it('calls callback on replaceState', () => {
    const common = loadCommon();
    const callback = vi.fn();
    common.interceptHistoryNav(callback);

    history.replaceState({}, '', '/replaced');
    expect(callback).toHaveBeenCalledWith(expect.stringContaining('/replaced'));
  });

  it('preserves pushState return value', () => {
    const common = loadCommon();
    common.interceptHistoryNav(vi.fn());

    // pushState returns undefined per spec
    const ret = history.pushState({}, '', '/retval');
    expect(ret).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// createObserver()
// ---------------------------------------------------------------------------
describe('createObserver()', () => {
  it('returns a MutationObserver instance', () => {
    const common = loadCommon();
    const observer = common.createObserver(vi.fn());
    expect(observer).toBeInstanceOf(MutationObserver);
    observer.disconnect();
  });

  it('calls callback on DOM mutation (leading edge)', async () => {
    vi.useFakeTimers();
    const common = loadCommon();
    const callback = vi.fn();
    const observer = common.createObserver(callback, 100);

    document.body.appendChild(document.createElement('div'));

    // Flush microtask queue so MutationObserver callback is delivered
    await vi.advanceTimersByTimeAsync(0);

    expect(callback).toHaveBeenCalledTimes(1);
    observer.disconnect();
  });

  it('fires trailing edge after throttle window', async () => {
    vi.useFakeTimers();
    const common = loadCommon();
    const callback = vi.fn();
    const observer = common.createObserver(callback, 100);

    document.body.appendChild(document.createElement('div'));

    // Leading edge
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledTimes(1);

    // Trailing edge at 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalledTimes(2);
    observer.disconnect();
  });

  it('observer can be disconnected without error', () => {
    const common = loadCommon();
    const observer = common.createObserver(vi.fn());
    expect(() => observer.disconnect()).not.toThrow();
  });

  it('uses default throttle of 150ms', async () => {
    vi.useFakeTimers();
    const common = loadCommon();
    const callback = vi.fn();
    const observer = common.createObserver(callback);

    document.body.appendChild(document.createElement('div'));
    await vi.advanceTimersByTimeAsync(0); // leading edge
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(149); // not yet
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1); // 150ms total — trailing edge
    expect(callback).toHaveBeenCalledTimes(2);
    observer.disconnect();
  });

  it('coalesces rapid mutations to exactly 2 calls (leading + trailing)', async () => {
    vi.useFakeTimers();
    const common = loadCommon();
    const callback = vi.fn();
    const observer = common.createObserver(callback, 100);

    // 5 rapid mutations within the throttle window
    for (let i = 0; i < 5; i++) {
      document.body.appendChild(document.createElement('span'));
    }

    // Leading edge fires once
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledTimes(1);

    // Trailing edge fires once at 100ms — total exactly 2
    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalledTimes(2);
    observer.disconnect();
  });
});
