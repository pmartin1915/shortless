(function () {
  'use strict';

  var PLATFORMS = ['youtube', 'instagram', 'tiktok', 'snapchat'];

  function getTodayKey() {
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    var dd = String(now.getDate()).padStart(2, '0');
    return 'blocks_' + yyyy + '-' + mm + '-' + dd;
  }

  function updateBlockCountDisplay(count) {
    var el = document.getElementById('block-count');
    if (el) {
      el.textContent = count;
    }
  }

  function loadBlockCount() {
    var key = getTodayKey();
    chrome.storage.local.get(key, function (result) {
      if (chrome.runtime.lastError) return;
      updateBlockCountDisplay(result[key] || 0);
    });
  }

  function loadPlatformStates() {
    var defaults = {};
    PLATFORMS.forEach(function (p) {
      defaults[p] = true;
    });

    chrome.storage.sync.get(defaults, function (result) {
      PLATFORMS.forEach(function (platform) {
        var card = document.querySelector('[data-platform="' + platform + '"]');
        if (card) {
          var checkbox = card.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = result[platform];
          }
        }
      });
    });
  }

  function setupToggleHandlers() {
    PLATFORMS.forEach(function (platform) {
      var card = document.querySelector('[data-platform="' + platform + '"]');
      if (!card) return;

      var checkbox = card.querySelector('input[type="checkbox"]');
      if (!checkbox) return;

      checkbox.addEventListener('change', function () {
        var enabled = checkbox.checked;

        // Background script is the single source of truth for storage writes.
        chrome.runtime.sendMessage(
          { type: 'TOGGLE_PLATFORM', platform: platform, enabled: enabled },
          function (response) {
            if (chrome.runtime.lastError || !response || !response.success) {
              checkbox.checked = !enabled; // revert on failure
            }
          }
        );
      });
    });
  }

  function setupStorageListener() {
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName === 'local') {
        var keys = Object.keys(changes);
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].indexOf('blocks_') === 0) {
            // Re-fetch today's count rather than consuming the change value
            // directly. Handles midnight rollover and stale-date re-queues.
            loadBlockCount();
            break;
          }
        }
      }
    });
  }

  function setVersion() {
    var el = document.querySelector('.version');
    if (el) {
      el.textContent = 'v' + chrome.runtime.getManifest().version;
    }
  }

  function setupReportBreakage() {
    var link = document.getElementById('report-breakage');
    if (!link) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      var version = chrome.runtime.getManifest().version;
      var title = encodeURIComponent('Breakage Report — v' + version);
      var body = encodeURIComponent(
        '**Version:** ' + version + '\n' +
        '**Browser:** ' + navigator.userAgent + '\n' +
        '**Platform:** \n' +
        '**URL (if applicable):** \n\n' +
        '**What leaked through?**\n\n'
      );
      var url = 'https://github.com/pmartin1915/shortless/issues/new?title=' + title + '&body=' + body;
      chrome.tabs.create({ url: url });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var inits = [setVersion, loadPlatformStates, loadBlockCount,
                 setupToggleHandlers, setupStorageListener, setupReportBreakage];
    for (var i = 0; i < inits.length; i++) {
      try {
        inits[i]();
      } catch (e) {
        console.error('[Shortless] Init error in ' + inits[i].name + ':', e);
      }
    }
  });
})();
