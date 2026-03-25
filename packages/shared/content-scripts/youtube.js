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
  // All selectors use href/attribute-based matching for i18n safety.
  var SHORTS_SELECTORS = [
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-guide-entry-renderer:has(a[href="/shorts"])',
    'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])',
    'yt-tab-shape[tab-title="Shorts"]',
    'yt-tab-shape:has(a[href*="/shorts"])',
    '[overlay-style="SHORTS"]',
    'ytd-grid-video-renderer:has([overlay-style="SHORTS"])',
    'ytd-video-renderer:has([overlay-style="SHORTS"])'
  ];
  // Localised text labels for Shorts chip-cloud chips.
  // "Shorts" is YouTube's brand name (unchanged in most locales), but a few
  // languages use a translated label when the chip has no child link.
  var SHORTS_CHIP_TERMS = ['Shorts', 'Cortos', 'Curtas', '\u30B7\u30E7\u30FC\u30C8'];

  // Note: chip-cloud chips lack href/data attrs. Handled by hideChipsByText() below.

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
   * Hide "Shorts" chip-cloud chips.
   * Primary: i18n-safe check for child links containing "/shorts".
   * Fallback: text match for "Shorts" (YouTube brand name, same in most locales).
   *
   * @returns {number} Count of newly hidden chips.
   */
  function hideChipsByText() {
    var count = 0;
    var chips = document.querySelectorAll(
      'yt-chip-cloud-chip-renderer:not([data-shortless-hidden])'
    );
    for (var i = 0; i < chips.length; i++) {
      var chip = chips[i];
      // i18n-safe: check if chip contains a link to /shorts
      var link = chip.querySelector('a[href*="/shorts"]');
      if (link) {
        chip.style.setProperty('display', 'none', 'important');
        chip.setAttribute('data-shortless-hidden', '');
        count++;
        continue;
      }
      // Fallback: text match (covers locales where chip has no link).
      // Uses startsWith to tolerate injected badge text (e.g. "ShortsNew").
      var text = (chip.textContent || '').trim();
      var matched = false;
      for (var j = 0; j < SHORTS_CHIP_TERMS.length; j++) {
        if (text === SHORTS_CHIP_TERMS[j] || text.indexOf(SHORTS_CHIP_TERMS[j]) === 0) {
          matched = true;
          break;
        }
      }
      if (matched) {
        chip.style.setProperty('display', 'none', 'important');
        chip.setAttribute('data-shortless-hidden', '');
        count++;
      }
    }
    return count;
  }

  /**
   * Run the hide pass and report any newly hidden elements.
   */
  function hideAndReport() {
    if (!isActive) return;
    var count = S.hideElements(SHORTS_SELECTORS);
    count += hideChipsByText();
    S.sendBlockCount(count);
  }

  /**
   * Combined handler for navigation events – redirect if needed, then hide.
   */
  function onNavigate() {
    if (!isActive) return;
    if (redirectShorts()) return;
    hideAndReport();
  }

  // ---- Initialisation -------------------------------------------------------

  /**
   * Read the auth token set by the MAIN-world fetch guard.
   * @returns {string|null}
   */
  function getGuardToken() {
    var meta = document.querySelector('meta[name="shortless-guard"]');
    if (!meta) return null;
    var token = meta.getAttribute('content');
    meta.remove(); // Remove from DOM to reduce token exposure window
    return token;
  }

  /**
   * Dispatch toggle state to the MAIN-world fetch guard script.
   * Includes the guard's auth token to prevent page-script spoofing.
   * @param {boolean} state
   */
  function dispatchToggleState(state) {
    var detail = { enabled: state, _t: getGuardToken() };
    // Firefox requires cloneInto to pass objects from ISOLATED → MAIN world.
    if (typeof cloneInto === 'function') {
      detail = cloneInto(detail, document.defaultView);
    }
    document.dispatchEvent(new CustomEvent('shortless-youtube-state', {
      detail: detail
    }));
  }

  var isActive = false;
  var observer = null;

  S.isPlatformEnabled('youtube').then(function (enabled) {
    isActive = enabled;

    // Inform the fetch guard of the current toggle state.
    dispatchToggleState(enabled);

    if (!enabled) return;

    // Immediate redirect check
    if (redirectShorts()) return;

    // Immediate hide pass (elements may already be in the DOM)
    hideAndReport();

    // YouTube fires these custom events on SPA navigation
    document.addEventListener('yt-navigate-finish', onNavigate);
    document.addEventListener('yt-page-data-updated', onNavigate);

    // Observe DOM mutations for lazily-loaded Shorts content
    observer = S.createObserver(hideAndReport);
  }).then(function () {
    // React to live toggle changes from the popup.
    // Registered after init to avoid race with isPlatformEnabled resolution.
    S.watchToggle('youtube', {
      onEnable: function () {
        isActive = true;
        dispatchToggleState(true);
        hideAndReport();
        if (!observer) observer = S.createObserver(hideAndReport);
      },
      onDisable: function () {
        isActive = false;
        dispatchToggleState(false);
        S.unhideAll();
        if (observer) { observer.disconnect(); observer = null; }
      }
    });
  });

  // --- Test exports (no-op in browser content scripts) ---
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { redirectShorts, hideChipsByText, SHORTS_SELECTORS, SHORTS_CHIP_TERMS };
  }
})();
