/// <reference types="vitest/globals" />
// @vitest-environment jsdom

import path from 'path';
import { createChromeMock } from './mocks/chrome';

const YOUTUBE_PATH = path.resolve(
  __dirname,
  '../../packages/shared/content-scripts/youtube.js'
);
const INSTAGRAM_PATH = path.resolve(
  __dirname,
  '../../packages/shared/content-scripts/instagram.js'
);
const SNAPCHAT_PATH = path.resolve(
  __dirname,
  '../../packages/shared/content-scripts/snapchat.js'
);
const COMMON_PATH = path.resolve(
  __dirname,
  '../../packages/shared/content-scripts/common.js'
);

type ChromeMock = ReturnType<typeof createChromeMock>;
let chromeMock: ChromeMock;

/**
 * Load common.js first (sets window.__shortless), then load a platform script.
 * Platform scripts depend on window.__shortless being present.
 */
function loadWithCommon(platformPath: string) {
  delete (window as any).__shortless;

  // Load common.js to set up window.__shortless
  const commonResolved = require.resolve(COMMON_PATH);
  delete require.cache[commonResolved];
  require(COMMON_PATH);

  // Load the platform script
  const resolved = require.resolve(platformPath);
  delete require.cache[resolved];
  return require(platformPath);
}

beforeEach(() => {
  chromeMock = createChromeMock();
  // Default all platforms to enabled
  chromeMock._syncStorage.youtube = true;
  chromeMock._syncStorage.instagram = true;
  chromeMock._syncStorage.snapchat = true;
  vi.stubGlobal('chrome', chromeMock);
  document.body.innerHTML = '';

  // Stub location for redirect tests
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      pathname: '/',
      href: 'https://www.youtube.com/',
      replace: vi.fn(),
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// YouTube — redirectShorts()
// ---------------------------------------------------------------------------
describe('YouTube redirectShorts()', () => {
  it('redirects /shorts/{id} to /watch?v={id}', () => {
    (window.location as any).pathname = '/shorts/dQw4w9WgXcQ';
    const yt = loadWithCommon(YOUTUBE_PATH);
    const result = yt.redirectShorts();
    expect(result).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith('/watch?v=dQw4w9WgXcQ');
  });

  it('strips trailing slash from video ID', () => {
    (window.location as any).pathname = '/shorts/abc123_def/';
    const yt = loadWithCommon(YOUTUBE_PATH);
    yt.redirectShorts();
    expect(window.location.replace).toHaveBeenCalledWith('/watch?v=abc123_def');
  });

  it('strips query params from video ID', () => {
    (window.location as any).pathname = '/shorts/abc123?feature=share';
    const yt = loadWithCommon(YOUTUBE_PATH);
    yt.redirectShorts();
    expect(window.location.replace).toHaveBeenCalledWith('/watch?v=abc123');
  });

  it('returns false for non-shorts URLs', () => {
    (window.location as any).pathname = '/watch';
    const yt = loadWithCommon(YOUTUBE_PATH);
    expect(yt.redirectShorts()).toBe(false);
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('returns false for /shorts/ with no video ID', () => {
    (window.location as any).pathname = '/shorts/';
    const yt = loadWithCommon(YOUTUBE_PATH);
    expect(yt.redirectShorts()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// YouTube — hideChipsByText()
// ---------------------------------------------------------------------------
describe('YouTube hideChipsByText()', () => {
  it('hides chips with href containing /shorts', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer>
        <a href="/shorts">Shorts</a>
      </yt-chip-cloud-chip-renderer>
      <yt-chip-cloud-chip-renderer>
        <a href="/feed/trending">Trending</a>
      </yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    const count = yt.hideChipsByText();
    expect(count).toBe(1);

    const hidden = document.querySelectorAll('[data-shortless-hidden]');
    expect(hidden.length).toBe(1);
  });

  it('hides chips with text "Shorts" as fallback', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer>Shorts</yt-chip-cloud-chip-renderer>
      <yt-chip-cloud-chip-renderer>Music</yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    const count = yt.hideChipsByText();
    expect(count).toBe(1);
  });

  it('skips already-hidden chips', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer data-shortless-hidden="">
        <a href="/shorts">Shorts</a>
      </yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    const count = yt.hideChipsByText();
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// YouTube — SHORTS_SELECTORS
// ---------------------------------------------------------------------------
describe('YouTube SHORTS_SELECTORS', () => {
  it('exports 9 selectors', () => {
    const yt = loadWithCommon(YOUTUBE_PATH);
    expect(yt.SHORTS_SELECTORS).toHaveLength(9);
  });

  it('includes reel-shelf-renderer selector', () => {
    const yt = loadWithCommon(YOUTUBE_PATH);
    expect(yt.SHORTS_SELECTORS).toContain('ytd-reel-shelf-renderer');
  });
});

// ---------------------------------------------------------------------------
// YouTube — SHORTS_CHIP_TERMS (i18n fallback)
// ---------------------------------------------------------------------------
describe('YouTube SHORTS_CHIP_TERMS', () => {
  it('exports known localized Shorts terms', () => {
    const yt = loadWithCommon(YOUTUBE_PATH);
    expect(yt.SHORTS_CHIP_TERMS).toContain('Shorts');
    expect(yt.SHORTS_CHIP_TERMS).toContain('Cortos');
    expect(yt.SHORTS_CHIP_TERMS).toContain('Curtas');
    expect(yt.SHORTS_CHIP_TERMS.length).toBeGreaterThanOrEqual(4);
  });

  it('hides chips with localized text "Cortos"', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer>Cortos</yt-chip-cloud-chip-renderer>
      <yt-chip-cloud-chip-renderer>Music</yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    const count = yt.hideChipsByText();
    expect(count).toBe(1);
  });

  it('hides chips with Portuguese text "Curtas"', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer>Curtas</yt-chip-cloud-chip-renderer>
      <yt-chip-cloud-chip-renderer>Em alta</yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    const count = yt.hideChipsByText();
    expect(count).toBe(1);
  });

  it('hides chips with Japanese text "\u30B7\u30E7\u30FC\u30C8"', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer>\u30B7\u30E7\u30FC\u30C8</yt-chip-cloud-chip-renderer>
      <yt-chip-cloud-chip-renderer>\u97F3\u697D</yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    const count = yt.hideChipsByText();
    expect(count).toBe(1);
  });

  it('hides chips via startsWith when badge text is appended', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer>Shorts<span class="badge">New</span></yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    const count = yt.hideChipsByText();
    expect(count).toBe(1);
  });

  it('marks innocent chips as checked and skips them on re-scan', () => {
    document.body.innerHTML = `
      <yt-chip-cloud-chip-renderer>Music</yt-chip-cloud-chip-renderer>
      <yt-chip-cloud-chip-renderer>Gaming</yt-chip-cloud-chip-renderer>
    `;
    const yt = loadWithCommon(YOUTUBE_PATH);
    yt.hideChipsByText();

    // Both innocent chips should be marked as checked
    const checked = document.querySelectorAll('[data-shortless-checked]');
    expect(checked.length).toBe(2);

    // Second scan should find 0 new chips (all marked)
    const count = yt.hideChipsByText();
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Instagram — redirectReels()
// ---------------------------------------------------------------------------
describe('Instagram redirectReels()', () => {
  it('redirects /reels/ to Instagram home', () => {
    (window.location as any).pathname = '/reels/';
    const ig = loadWithCommon(INSTAGRAM_PATH);
    const result = ig.redirectReels();
    expect(result).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith('https://www.instagram.com/');
  });

  it('redirects /reel/{id} to Instagram home', () => {
    (window.location as any).pathname = '/reel/abc123/';
    const ig = loadWithCommon(INSTAGRAM_PATH);
    expect(ig.redirectReels()).toBe(true);
  });

  it('returns false for normal Instagram URLs', () => {
    (window.location as any).pathname = '/explore/';
    const ig = loadWithCommon(INSTAGRAM_PATH);
    expect(ig.redirectReels()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Instagram — collapseParentListItems()
// ---------------------------------------------------------------------------
describe('Instagram collapseParentListItems()', () => {
  it('hides parent li elements of hidden reels nav links', () => {
    document.body.innerHTML = `
      <ul>
        <li>
          <a href="/reels/" data-shortless-hidden="true" style="display: none !important;">Reels</a>
        </li>
        <li>
          <a href="/explore/">Explore</a>
        </li>
      </ul>
    `;
    const ig = loadWithCommon(INSTAGRAM_PATH);
    ig.collapseParentListItems();

    const hiddenLis = document.querySelectorAll('li[data-shortless-hidden]');
    expect(hiddenLis.length).toBe(1);
  });

  it('does not re-hide already-hidden parent items', () => {
    document.body.innerHTML = `
      <ul>
        <li data-shortless-hidden="true">
          <a href="/reels/" data-shortless-hidden="true">Reels</a>
        </li>
      </ul>
    `;
    const ig = loadWithCommon(INSTAGRAM_PATH);
    ig.collapseParentListItems();
    // Should not throw or double-mark
    const hiddenLis = document.querySelectorAll('li[data-shortless-hidden]');
    expect(hiddenLis.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Instagram — REELS_SELECTORS
// ---------------------------------------------------------------------------
describe('Instagram REELS_SELECTORS', () => {
  it('exports 5 selectors', () => {
    const ig = loadWithCommon(INSTAGRAM_PATH);
    expect(ig.REELS_SELECTORS).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Snapchat — redirectSpotlight()
// ---------------------------------------------------------------------------
describe('Snapchat redirectSpotlight()', () => {
  it('redirects /spotlight to Snapchat home', () => {
    (window.location as any).pathname = '/spotlight';
    const sc = loadWithCommon(SNAPCHAT_PATH);
    const result = sc.redirectSpotlight();
    expect(result).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith('https://www.snapchat.com/');
  });

  it('redirects /spotlight/abc123 to Snapchat home', () => {
    (window.location as any).pathname = '/spotlight/abc123';
    const sc = loadWithCommon(SNAPCHAT_PATH);
    expect(sc.redirectSpotlight()).toBe(true);
  });

  it('returns false for non-spotlight URLs', () => {
    (window.location as any).pathname = '/stories';
    const sc = loadWithCommon(SNAPCHAT_PATH);
    expect(sc.redirectSpotlight()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Snapchat — SPOTLIGHT_SELECTORS
// ---------------------------------------------------------------------------
describe('Snapchat SPOTLIGHT_SELECTORS', () => {
  it('exports 3 selectors', () => {
    const sc = loadWithCommon(SNAPCHAT_PATH);
    expect(sc.SPOTLIGHT_SELECTORS).toHaveLength(3);
  });
});
