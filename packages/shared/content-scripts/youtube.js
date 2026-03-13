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
      // Fallback: text match (covers locales where chip has no link)
      var text = (chip.textContent || '').trim();
      if (text === 'Shorts') {
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
    var count = S.hideElements(SHORTS_SELECTORS);
    count += hideChipsByText();
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

  /**
   * Dispatch toggle state to the MAIN-world fetch guard script.
   * @param {boolean} state
   */
  function dispatchToggleState(state) {
    document.dispatchEvent(new CustomEvent('shortless-youtube-state', {
      detail: { enabled: state }
    }));
  }

  S.isPlatformEnabled('youtube').then(function (enabled) {
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
    S.createObserver(hideAndReport);
  });

  /**
   * Restore visibility of elements previously hidden by Shortless.
   */
  function unhideAll() {
    var hidden = document.querySelectorAll('[data-shortless-hidden]');
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].style.removeProperty('display');
      hidden[i].removeAttribute('data-shortless-hidden');
    }
  }

  // React to live toggle changes from the popup.
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (changes) {
      if (changes.youtube) {
        var nowEnabled = changes.youtube.newValue;
        dispatchToggleState(nowEnabled);
        if (nowEnabled) {
          hideAndReport();
        } else {
          unhideAll();
        }
      }
    });
  }
})();
