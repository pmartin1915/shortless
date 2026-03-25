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
// sendBlockCount()
// ---------------------------------------------------------------------------
describe('sendBlockCount()', () => {
  it('sends BLOCK_COUNT_INCREMENT message for positive counts', () => {
    const common = loadCommon();
    common.sendBlockCount(5);
    expect(chromeMock.runtime.sendMessage).toBeDefined();
  });

  it('does not send for zero or negative counts', () => {
    const sendMsg = vi.fn();
    chromeMock.runtime.sendMessage = sendMsg;
    vi.stubGlobal('chrome', chromeMock);

    const common = loadCommon();
    common.sendBlockCount(0);
    common.sendBlockCount(-3);
    expect(sendMsg).not.toHaveBeenCalled();
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
