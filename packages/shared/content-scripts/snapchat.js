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
    if (!isActive) return;
    var count = S.hideElements(SPOTLIGHT_SELECTORS);
    S.sendBlockCount(count);
  }

  /**
   * Combined handler for navigation events.
   */
  function onNavigate() {
    if (!isActive) return;
    if (redirectSpotlight()) return;
    hideAndReport();
  }

  // ---- Live toggle ----------------------------------------------------------

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

  // ---- Initialisation -------------------------------------------------------

  var isActive = false;
  var observer = null;

  S.isPlatformEnabled('snapchat').then(function (enabled) {
    isActive = enabled;
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
    observer = S.createObserver(hideAndReport);
  }).then(function () {
    // React to live toggle changes from the popup.
    // Registered after init to avoid race with isPlatformEnabled resolution.
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function (changes, areaName) {
        if (areaName !== 'sync') return;
        if (changes.snapchat) {
          var nowEnabled = changes.snapchat.newValue;
          isActive = nowEnabled;
          if (nowEnabled) {
            hideAndReport();
            if (!observer) observer = S.createObserver(hideAndReport);
          } else {
            unhideAll();
            if (observer) { observer.disconnect(); observer = null; }
          }
        }
      });
    }
  });
})();
