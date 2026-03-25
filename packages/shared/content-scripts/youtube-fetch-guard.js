/*
 * Shortless - YouTube Fetch Guard (Layer 1.5: Fetch Interception)
 *
 * Runs in the MAIN world (page JS context) at document_start, before
 * YouTube's own scripts execute.  Intercepts fetch() calls to the
 * youtubei/v1/browse endpoint and blocks requests whose JSON body
 * contains browseId "FEshorts" — preventing the Shorts feed data
 * from loading (DNR cannot inspect POST bodies).
 *
 * Toggle state is received from the ISOLATED-world content script
 * (youtube.js) via a CustomEvent on the document.
 */
(function () {
  'use strict';

  // Default to blocking until told otherwise by the isolated-world script.
  var enabled = true;

  // Generate an auth token to prevent page scripts from spoofing toggle events.
  // The ISOLATED world content script reads this from the DOM and includes it.
  var _authToken = Array.from(crypto.getRandomValues(new Uint8Array(8)), function (b) {
    return b.toString(36);
  }).join('');
  try {
    var meta = document.createElement('meta');
    meta.setAttribute('name', 'shortless-guard');
    meta.setAttribute('content', _authToken);
    (document.head || document.documentElement).appendChild(meta);
  } catch (e) { /* pre-DOM edge case — token validation will simply not match */ }

  // Listen for toggle state from the isolated-world content script.
  document.addEventListener('shortless-youtube-state', function (e) {
    if (e.detail && typeof e.detail.enabled === 'boolean' && e.detail._t === _authToken) {
      enabled = e.detail.enabled;
    }
  });

  // ---- Fetch interception ----------------------------------------------------

  var originalFetch = window.fetch;

  /**
   * Check whether a request body targets the Shorts browse feed.
   *
   * @param {*} body - The fetch body (string, ArrayBuffer, ReadableStream, etc.)
   * @returns {boolean}
   */
  function isShortsRequest(body) {
    if (!body) return false;
    try {
      var text = typeof body === 'string' ? body : null;
      if (!text) return false;
      var json = JSON.parse(text);
      return json && json.browseId === 'FEshorts';
    } catch (_) {
      return false;
    }
  }

  /**
   * Build a minimal valid response that YouTube's JS can parse without errors.
   *
   * @returns {Response}
   */
  function emptyBrowseResponse() {
    return new Response(
      JSON.stringify({ responseContext: {}, contents: {} }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  window.fetch = function (input, init) {
    if (!enabled) {
      return originalFetch.apply(this, arguments);
    }

    // Normalise the URL from either a Request object or a string.
    var url = '';
    if (input instanceof Request) {
      url = input.url;
    } else if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input.toString === 'function') {
      url = input.toString();
    }

    // Only inspect POSTs to the browse endpoint.
    if (url.indexOf('youtubei/v1/browse') === -1) {
      return originalFetch.apply(this, arguments);
    }

    var method = (init && init.method) || (input instanceof Request && input.method) || 'GET';
    if (method.toUpperCase() !== 'POST') {
      return originalFetch.apply(this, arguments);
    }

    // Extract body from init options, or from a Request object.
    var body = (init && init.body) || (input instanceof Request ? input.body : null);

    // Handle string bodies synchronously (fast path — YouTube's current format).
    if (typeof body === 'string') {
      if (isShortsRequest(body)) {
        return Promise.resolve(emptyBrowseResponse());
      }
      return originalFetch.apply(this, arguments);
    }

    // Handle Request objects with non-string bodies via clone().
    // clone() preserves headers, credentials, and mode — avoids losing them.
    if (input instanceof Request && body && typeof body !== 'string') {
      try {
        var req = input.clone();
        return req.text().then(function (text) {
          if (isShortsRequest(text)) {
            return emptyBrowseResponse();
          }
          // Re-create a fresh request since reading consumed the clone's body.
          return originalFetch.call(this, new Request(input, init));
        }.bind(this)).catch(function () {
          return originalFetch.call(this, new Request(input, init));
        }.bind(this));
      } catch (e) {
        return originalFetch.apply(this, arguments);
      }
    }

    // Handle non-string bodies (Blob, ArrayBuffer) when input is a URL string.
    if (body && typeof body.text === 'function') {
      return body.text().then(function (text) {
        if (isShortsRequest(text)) {
          return emptyBrowseResponse();
        }
        var newInit = Object.assign({}, init, { body: text });
        return originalFetch.call(this, input, newInit);
      }.bind(this));
    }

    return originalFetch.apply(this, arguments);
  };

  // --- Test exports (no-op in browser MAIN world scripts) ---
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isShortsRequest, emptyBrowseResponse };
  }
})();
