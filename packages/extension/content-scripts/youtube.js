/*
 * Shortless - YouTube Content Script (Layer 3)
 *
 * Depends on common.js being injected first (provides window.__shortless).
 * Handles:
 *   - Redirecting /shorts/{id} to /watch?v={id}
 *   - Hiding Shorts elements that survive CSS injection
 *   - Listening for YouTube SPA navigation events
 *   - Reporting block counts to the background script
 */
(function () {
  'use strict';

  var S = window.__shortless;
  if (!S) {
    console.warn('[Shortless] common.js not loaded – YouTube script aborting.');
    return;
  }

  // ---- Selectors (mirrors youtube-hide.css, plus dynamic overlay) -----------
  var SHORTS_SELECTORS = [
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-guide-entry-renderer a[title="Shorts"]',
    'ytd-guide-entry-renderer:has(a[title="Shorts"])',
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
    'yt-tab-shape[tab-title="Shorts"]',
    'yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"])',
    '[overlay-style="SHORTS"]',
    'ytd-grid-video-renderer:has([overlay-style="SHORTS"])',
    'ytd-video-renderer:has([overlay-style="SHORTS"])'
  ];

  // ---- Helpers --------------------------------------------------------------

  /**
   * If the user is on a /shorts/ URL, extract the video ID and redirect
   * to the standard /watch?v= player page.
   *
   * @returns {boolean} True if a redirect was triggered.
   */
  function redirectShorts() {
    var path = window.location.pathname;
    if (path.startsWith('/shorts/')) {
      var videoId = path.split('/shorts/')[1];
      // Strip trailing slash or query fragments from the ID
      if (videoId) {
        videoId = videoId.split('/')[0].split('?')[0];
      }
      if (videoId) {
        window.location.replace('/watch?v=' + videoId);
        return true;
      }
    }
    return false;
  }

  /**
   * Run the hide pass and report any newly hidden elements.
   */
  function hideAndReport() {
    var count = S.hideElements(SHORTS_SELECTORS);
    S.sendBlockCount(count);
  }

  /**
   * Combined handler for navigation events – redirect if needed, then hide.
   */
  function onNavigate() {
    if (redirectShorts()) return;
    hideAndReport();
  }

  // ---- Initialisation -------------------------------------------------------

  S.isPlatformEnabled('youtube').then(function (enabled) {
    if (!enabled) return;

    // Immediate redirect check
    if (redirectShorts()) return;

    // Immediate hide pass (elements may already be in the DOM)
    hideAndReport();

    // YouTube fires these custom events on SPA navigation
    document.addEventListener('yt-navigate-finish', onNavigate);
    document.addEventListener('yt-page-data-updated', onNavigate);

    // Observe DOM mutations for lazily-loaded Shorts content
    S.createObserver(hideAndReport);
  });
})();
