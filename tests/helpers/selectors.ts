/**
 * Centralized selectors mirroring the extension source code.
 */

export const YOUTUBE_SHORTS_SELECTORS = [
  'ytd-reel-shelf-renderer',
  'ytd-rich-shelf-renderer[is-shorts]',
  'ytd-guide-entry-renderer:has(a[href="/shorts"])',
  'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])',
  'yt-tab-shape[tab-title="Shorts"]',
  'yt-tab-shape:has(a[href*="/shorts"])',
  '[overlay-style="SHORTS"]',
];

export const INSTAGRAM_REELS_SELECTORS = [
  'a[href="/reels/"]',
  'a[href^="/reels/"]',
  '[data-testid="reels-tab"]',
];

export const SNAPCHAT_SPOTLIGHT_SELECTORS = [
  'a[href^="/spotlight"]',
  '[data-testid="spotlight-tab"]',
];

export const POPUP_PLATFORMS = ['youtube', 'instagram', 'tiktok', 'snapchat'] as const;
