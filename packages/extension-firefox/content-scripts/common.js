/*
 * Shortless - Common Utilities (Layer 3: Content Script Shared Module)
 *
 * Attaches shared helpers to window.__shortless so platform-specific
 * content scripts can use them without bundling.
 */
(function () {
  'use strict';

  if (window.__shortless) return; // already initialised

  /**
   * Create a MutationObserver on document.body that fires a debounced callback
   * whenever the DOM subtree changes.
   *
   * @param {Function} callback - Invoked after mutations settle.
   * @param {number}   debounceMs - Debounce window in milliseconds (default 150).
   * @returns {MutationObserver}
   */
  function createObserver(callback, debounceMs) {
    if (debounceMs === undefined) debounceMs = 150;

    var timer = null;
    var observer = new MutationObserver(function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        callback();
      }, debounceMs);
    });

    // Observe as soon as body exists; if not yet available, wait for it.
    function attach() {
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          observer.observe(document.body, { childList: true, subtree: true });
        });
      }
    }
    attach();

    return observer;
  }

  /**
   * Query the DOM for elements matching any of the given selectors, hide them,
   * and mark them so they are not processed again.
   *
   * @param {string[]} selectors   - CSS selectors to match.
   * @param {string}   markerAttr  - Data attribute used to mark hidden elements.
   * @returns {number} Number of newly hidden elements.
   */
  function hideElements(selectors, markerAttr) {
    if (!markerAttr) markerAttr = 'data-shortless-hidden';

    var combined = selectors.join(', ');
    if (!combined) return 0;

    var elements;
    try {
      elements = document.querySelectorAll(combined);
    } catch (e) {
      // Bail out silently if a selector is unsupported in this browser.
      return 0;
    }

    var count = 0;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.hasAttribute(markerAttr)) {
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute(markerAttr, 'true');
        count++;
      }
    }
    return count;
  }

  /**
   * If the current URL path starts with pathPrefix, navigate away via
   * location.replace (no back-button entry).
   *
   * @param {string} pathPrefix  - e.g. "/shorts/"
   * @param {string} redirectUrl - Full or relative URL to redirect to.
   * @returns {boolean} True if a redirect was initiated.
   */
  function checkUrlAndRedirect(pathPrefix, redirectUrl) {
    if (window.location.pathname.startsWith(pathPrefix)) {
      window.location.replace(redirectUrl);
      return true;
    }
    return false;
  }

  /**
   * Send a block-count increment message to the background / service worker.
   *
   * @param {number} count - Number of elements blocked in this batch.
   */
  function sendBlockCount(count) {
    if (count <= 0) return;
    try {
      chrome.runtime.sendMessage({ type: 'BLOCK_COUNT_INCREMENT', count: count });
    } catch (e) {
      // Extension context may have been invalidated (e.g. update/reload).
    }
  }

  /**
   * Monkey-patch history.pushState / replaceState and listen for popstate so
   * that SPA navigations are detected.
   *
   * @param {Function} callback - Receives window.location.href on each nav.
   */
  function interceptHistoryNav(callback) {
    var origPush = history.pushState;
    var origReplace = history.replaceState;

    history.pushState = function () {
      origPush.apply(this, arguments);
      callback(window.location.href);
    };

    history.replaceState = function () {
      origReplace.apply(this, arguments);
      callback(window.location.href);
    };

    window.addEventListener('popstate', function () {
      callback(window.location.href);
    });
  }

  /**
   * Check whether a given platform is enabled in user settings.
   *
   * @param {string} platform - e.g. "youtube", "instagram", "snapchat"
   * @returns {Promise<boolean>} Resolves to true if enabled (default true).
   */
  function isPlatformEnabled(platform) {
    return new Promise(function (resolve) {
      try {
        var defaults = {};
        defaults[platform] = true;
        chrome.storage.sync.get(defaults, function (result) {
          if (chrome.runtime.lastError) {
            resolve(true);
            return;
          }
          resolve(result[platform] !== false);
        });
      } catch (e) {
        // Storage unavailable – assume enabled.
        resolve(true);
      }
    });
  }

  // Expose public API
  window.__shortless = {
    createObserver: createObserver,
    hideElements: hideElements,
    checkUrlAndRedirect: checkUrlAndRedirect,
    sendBlockCount: sendBlockCount,
    interceptHistoryNav: interceptHistoryNav,
    isPlatformEnabled: isPlatformEnabled
  };
})();
