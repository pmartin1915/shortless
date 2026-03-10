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

  // Listen for toggle state from the isolated-world content script.
  document.addEventListener('shortless-youtube-state', function (e) {
    if (e.detail && typeof e.detail.enabled === 'boolean') {
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

    var body = (init && init.body) || null;

    if (isShortsRequest(body)) {
      return Promise.resolve(emptyBrowseResponse());
    }

    return originalFetch.apply(this, arguments);
  };
})();
