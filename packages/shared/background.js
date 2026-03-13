/**
 * Shortless — Background Service Worker
 * Manages per-platform toggle state, ruleset enabling/disabling,
 * block counting, and badge updates.
 */

const PLATFORMS = ['youtube', 'instagram', 'tiktok', 'snapchat'];

const RULESET_MAP = {
  youtube: 'youtube_rules',
  instagram: 'instagram_rules',
  tiktok: 'tiktok_rules',
  snapchat: 'snapchat_rules'
};

// --- Initialization ---

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set all platforms enabled by default
    const defaults = {};
    PLATFORMS.forEach(p => defaults[p] = true);
    chrome.storage.sync.set(defaults, () => {
      if (chrome.runtime.lastError) {
        console.error('[Shortless] Failed to set defaults:', chrome.runtime.lastError);
      }
    });
  } else if (details.reason === 'update') {
    // Ensure any newly added platforms get a default value
    chrome.storage.sync.get(PLATFORMS, (result) => {
      const missing = {};
      PLATFORMS.forEach(p => {
        if (result[p] === undefined) missing[p] = true;
      });
      if (Object.keys(missing).length > 0) {
        chrome.storage.sync.set(missing);
      }
    });
  }

  // Set badge styling
  chrome.action.setBadgeBackgroundColor({ color: '#2E75B6' });
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  updateBadge();
});

// --- Message Handling ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;

  switch (message.type) {
    case 'TOGGLE_PLATFORM':
      handleToggle(message.platform, message.enabled);
      sendResponse({ success: true });
      break;

    case 'BLOCK_COUNT_INCREMENT':
      incrementBlockCount(message.count || 1);
      sendResponse({ success: true });
      break;

    case 'GET_PLATFORM_STATE':
      chrome.storage.sync.get(message.platform, (data) => {
        if (chrome.runtime.lastError) {
          console.error('[Shortless] Failed to get platform state:', chrome.runtime.lastError);
          sendResponse({ enabled: true });
          return;
        }
        sendResponse({ enabled: data[message.platform] !== false });
      });
      return true; // async response

    case 'GET_BLOCK_COUNT':
      getBlockCount().then(count => sendResponse({ count }));
      return true; // async response
  }
});

// --- Platform Toggle ---

function handleToggle(platform, enabled) {
  if (!PLATFORMS.includes(platform)) return;

  const rulesetId = RULESET_MAP[platform];
  if (!rulesetId) return;

  // Update DNR rulesets
  const options = enabled
    ? { enableRulesetIds: [rulesetId], disableRulesetIds: [] }
    : { enableRulesetIds: [], disableRulesetIds: [rulesetId] };

  chrome.declarativeNetRequest.updateEnabledRulesets(options).catch(err => {
    console.error(`[Shortless] Failed to update ruleset for ${platform}:`, err);
  });

  // Persist state
  chrome.storage.sync.set({ [platform]: enabled }, () => {
    if (chrome.runtime.lastError) {
      console.error(`[Shortless] Failed to persist ${platform} state:`, chrome.runtime.lastError);
    }
  });
}

// --- Block Counting ---

function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `blocks_${yyyy}-${mm}-${dd}`;
}

// Serializes concurrent increments to prevent lost counts from read-modify-write races.
let _pendingIncrement = 0;
let _flushInProgress = false;

function incrementBlockCount(count) {
  _pendingIncrement += count;
  if (!_flushInProgress) {
    _flushBlockCount();
  }
}

function _flushBlockCount() {
  if (_pendingIncrement <= 0) {
    _flushInProgress = false;
    return;
  }
  _flushInProgress = true;
  const toAdd = _pendingIncrement;
  _pendingIncrement = 0;
  const key = getTodayKey();
  chrome.storage.local.get(key, (data) => {
    if (chrome.runtime.lastError) {
      console.error('[Shortless] Failed to read block count:', chrome.runtime.lastError);
      _pendingIncrement += toAdd; // re-queue on failure
      _flushInProgress = false;
      return;
    }
    const current = data[key] || 0;
    const updated = current + toAdd;
    chrome.storage.local.set({ [key]: updated }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Shortless] Failed to save block count:', chrome.runtime.lastError);
        _pendingIncrement += toAdd; // re-queue on failure
        _flushInProgress = false;
        return;
      }
      updateBadge(updated);
      // Flush any increments that arrived during the write
      _flushBlockCount();
    });
  });
}

function getBlockCount() {
  return new Promise((resolve) => {
    const key = getTodayKey();
    chrome.storage.local.get(key, (data) => {
      if (chrome.runtime.lastError) {
        console.error('[Shortless] Failed to get block count:', chrome.runtime.lastError);
        resolve(0);
        return;
      }
      resolve(data[key] || 0);
    });
  });
}

// --- Badge ---

function updateBadge(count) {
  if (count !== undefined) {
    setBadgeText(count);
    return;
  }

  getBlockCount().then(c => setBadgeText(c));
}

function setBadgeText(count) {
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text });
}

// Update badge on startup
updateBadge();
