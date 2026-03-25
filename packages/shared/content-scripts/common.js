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
   * Create a MutationObserver on document.body that fires a throttled callback
   * whenever the DOM subtree changes. Uses a trailing-edge throttle to guarantee
   * the callback fires at most once per interval, even during continuous
   * mutations (e.g. infinite scroll feeds).
   *
   * @param {Function} callback - Invoked after mutations settle.
   * @param {number}   throttleMs - Throttle window in milliseconds (default 150).
   * @returns {MutationObserver}
   */
  function createObserver(callback, throttleMs) {
    if (throttleMs === undefined) throttleMs = 150;

    var isScheduled = false;
    var observer = new MutationObserver(function () {
      observer.takeRecords(); // Clear queue to prevent MutationRecord memory buildup
      if (!isScheduled) {
        isScheduled = true;
        callback(); // Leading edge: fire immediately on first mutation
        setTimeout(function () {
          isScheduled = false;
          callback(); // Trailing edge: catch mutations during the throttle window
        }, throttleMs);
      }
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

    // Append :not() filter so the browser's CSS engine skips already-hidden
    // elements — avoids iterating thousands of processed nodes on infinite scroll.
    var combined = selectors.map(function (s) {
      return s + ':not([' + markerAttr + '])';
    }).join(', ');
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
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute(markerAttr, 'true');
      count++;
    }
    return count;
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
  var _historyPatched = false;
  function interceptHistoryNav(callback) {
    // Guard against double-wrapping if called multiple times.
    if (_historyPatched) return;
    _historyPatched = true;

    var origPush = history.pushState;
    var origReplace = history.replaceState;

    history.pushState = function () {
      var ret = origPush.apply(this, arguments);
      callback(window.location.href);
      return ret;
    };

    history.replaceState = function () {
      var ret = origReplace.apply(this, arguments);
      callback(window.location.href);
      return ret;
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

  /**
   * Restore visibility of all elements previously hidden by Shortless.
   *
   * @param {string} markerAttr - Data attribute used to identify hidden elements.
   */
  function unhideAll(markerAttr) {
    var attr = markerAttr || 'data-shortless-hidden';
    var hidden = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].style.removeProperty('display');
      hidden[i].removeAttribute(attr);
    }
  }

  /**
   * Listen for live toggle changes from the popup via chrome.storage.onChanged.
   * Eliminates boilerplate duplication across platform scripts.
   *
   * @param {string}   platform  - Storage key to watch (e.g. "youtube").
   * @param {Object}   callbacks - { onEnable: Function, onDisable: Function }
   */
  function watchToggle(platform, callbacks) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function (changes, areaName) {
        if (areaName !== 'sync') return;
        if (changes[platform]) {
          if (changes[platform].newValue) {
            callbacks.onEnable();
          } else {
            callbacks.onDisable();
          }
        }
      });
    }
  }

  // Expose public API
  window.__shortless = {
    createObserver: createObserver,
    hideElements: hideElements,
    sendBlockCount: sendBlockCount,
    interceptHistoryNav: interceptHistoryNav,
    isPlatformEnabled: isPlatformEnabled,
    unhideAll: unhideAll,
    watchToggle: watchToggle
  };

  // --- Test exports (no-op in browser content scripts) ---
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createObserver, hideElements, sendBlockCount,
      interceptHistoryNav, isPlatformEnabled, unhideAll, watchToggle
    };
  }
})();
