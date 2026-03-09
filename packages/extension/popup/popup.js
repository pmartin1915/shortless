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
      var count = result[key] || 0;
      updateBlockCountDisplay(count);
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

        // Update sync storage
        var update = {};
        update[platform] = enabled;
        chrome.storage.sync.set(update);

        // Notify background script
        chrome.runtime.sendMessage({
          type: 'TOGGLE_PLATFORM',
          platform: platform,
          enabled: enabled
        });
      });
    });
  }

  function setupStorageListener() {
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName === 'local') {
        var key = getTodayKey();
        if (changes[key]) {
          var newCount = changes[key].newValue || 0;
          updateBlockCountDisplay(newCount);
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadPlatformStates();
    loadBlockCount();
    setupToggleHandlers();
    setupStorageListener();
  });
})();
