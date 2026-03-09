/**
 * Centralized selectors mirroring the extension source code.
 */

export const YOUTUBE_SHORTS_SELECTORS = [
  'ytd-reel-shelf-renderer',
  'ytd-rich-shelf-renderer[is-shorts]',
  'ytd-guide-entry-renderer:has(a[title="Shorts"])',
  'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
  'yt-tab-shape[tab-title="Shorts"]',
  '[overlay-style="SHORTS"]',
];

export const INSTAGRAM_REELS_SELECTORS = [
  'a[href="/reels/"]',
  'a[href^="/reels/"]',
  'svg[aria-label="Reels"]',
  '[data-testid="reels-tab"]',
];

export const SNAPCHAT_SPOTLIGHT_SELECTORS = [
  'a[href^="/spotlight"]',
  '[data-testid="spotlight-tab"]',
];

export const POPUP_PLATFORMS = ['youtube', 'instagram', 'tiktok', 'snapchat'] as const;
