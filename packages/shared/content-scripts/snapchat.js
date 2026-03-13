/*
 * Shortless - Snapchat Content Script (Layer 3)
 *
 * Depends on common.js being injected first (provides window.__shortless).
 * Handles:
 *   - Redirecting /spotlight URLs to the Snapchat home page
 *   - Hiding Spotlight elements that survive CSS injection
 *   - Intercepting SPA history navigations
 *   - Reporting block counts to the background script
 */
(function () {
  'use strict';

  var S = window.__shortless;
  if (!S) {
    console.warn('[Shortless] common.js not loaded – Snapchat script aborting.');
    return;
  }

  // ---- Selectors (mirrors snapchat-hide.css) --------------------------------
  var SPOTLIGHT_SELECTORS = [
    'a[href^="/spotlight"]',
    '[data-testid="spotlight-tab"]'
  ];

  // ---- Helpers --------------------------------------------------------------

  /**
   * If the user is on a /spotlight URL, redirect to the Snapchat home page.
   *
   * @returns {boolean} True if a redirect was triggered.
   */
  function redirectSpotlight() {
    var path = window.location.pathname;
    if (path.startsWith('/spotlight')) {
      window.location.replace('https://www.snapchat.com/');
      return true;
    }
    return false;
  }

  /**
   * Run the hide pass and report any newly hidden elements.
   */
  function hideAndReport() {
    var count = S.hideElements(SPOTLIGHT_SELECTORS);
    S.sendBlockCount(count);
  }

  /**
   * Combined handler for navigation events.
   */
  function onNavigate() {
    if (redirectSpotlight()) return;
    hideAndReport();
  }

  // ---- Initialisation -------------------------------------------------------

  S.isPlatformEnabled('snapchat').then(function (enabled) {
    if (!enabled) return;

    // Immediate redirect check
    if (redirectSpotlight()) return;

    // Immediate hide pass
    hideAndReport();

    // Snapchat is a SPA with no custom nav events – intercept History API
    S.interceptHistoryNav(function () {
      onNavigate();
    });

    // Observe DOM mutations for lazily-loaded Spotlight content
    S.createObserver(hideAndReport);
  });
})();
