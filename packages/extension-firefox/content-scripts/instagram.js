/*
 * Shortless - Instagram Content Script (Layer 3)
 *
 * Depends on common.js being injected first (provides window.__shortless).
 * Handles:
 *   - Redirecting /reels/ and /reel/ URLs to the Instagram home page
 *   - Hiding Reels elements that survive CSS injection
 *   - Intercepting SPA history navigations (Instagram has no custom events)
 *   - Collapsing parent list items around Reels nav links to avoid empty gaps
 *   - Reporting block counts to the background script
 */
(function () {
  'use strict';

  var S = window.__shortless;
  if (!S) {
    console.warn('[Shortless] common.js not loaded – Instagram script aborting.');
    return;
  }

  // ---- Selectors (mirrors instagram-hide.css, plus menu-item variant) -------
  // All selectors use href/attribute-based matching for i18n safety.
  var REELS_SELECTORS = [
    'a[href="/reels/"]',
    'a[href^="/reels/"]',
    '[data-testid="reels-tab"]',
    'article:has(a[href*="/reel/"])',
    'div[role="menuitem"]:has(a[href^="/reels/"])'
  ];

  // ---- Helpers --------------------------------------------------------------

  /**
   * If the user is on a /reels/ or /reel/ URL, redirect to the IG home page.
   *
   * @returns {boolean} True if a redirect was triggered.
   */
  function redirectReels() {
    var path = window.location.pathname;
    if (path.startsWith('/reels/') || path.startsWith('/reel/')) {
      window.location.replace('https://www.instagram.com/');
      return true;
    }
    return false;
  }

  /**
   * After hiding Reels nav links, walk up to the nearest parent <li> or
   * [role="listitem"] and hide it too, so no empty gap remains in the nav.
   */
  function collapseParentListItems() {
    var navLinks = document.querySelectorAll(
      'a[href="/reels/"][data-shortless-hidden], a[href^="/reels/"][data-shortless-hidden]'
    );

    for (var i = 0; i < navLinks.length; i++) {
      var parent = navLinks[i].closest('li, [role="listitem"]');
      if (parent && !parent.hasAttribute('data-shortless-hidden')) {
        parent.style.setProperty('display', 'none', 'important');
        parent.setAttribute('data-shortless-hidden', 'true');
      }
    }
  }

  /**
   * Run the hide pass, collapse parent list items, and report counts.
   */
  function hideAndReport() {
    var count = S.hideElements(REELS_SELECTORS);
    collapseParentListItems();
    S.sendBlockCount(count);
  }

  /**
   * Combined handler for navigation events.
   */
  function onNavigate() {
    if (redirectReels()) return;
    hideAndReport();
  }

  // ---- Initialisation -------------------------------------------------------

  S.isPlatformEnabled('instagram').then(function (enabled) {
    if (!enabled) return;

    // Immediate redirect check
    if (redirectReels()) return;

    // Immediate hide pass
    hideAndReport();

    // Instagram is a SPA with no custom nav events – intercept History API
    S.interceptHistoryNav(function () {
      onNavigate();
    });

    // Observe DOM mutations for lazily-loaded Reels content
    S.createObserver(hideAndReport);
  });
})();
