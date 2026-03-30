/// <reference types="vitest/globals" />
// @vitest-environment jsdom

import path from 'path';

const GUARD_PATH = path.resolve(
  __dirname,
  '../../packages/shared/content-scripts/youtube-fetch-guard.js'
);

let fakeFetch: ReturnType<typeof vi.fn>;

/**
 * Set up a fake `window.fetch` and load the guard module.
 * The IIFE captures `window.fetch` as `originalFetch` at load time,
 * then overwrites `window.fetch` with its interceptor wrapper.
 * After loading, `window.fetch` is the guard; `fakeFetch` is the original.
 */
function loadGuard() {
  // Remove stale meta tags from previous loads
  document.querySelectorAll('meta[name="shortless-guard"]').forEach((el) => el.remove());

  // Set up the fake fetch that the guard will capture as "originalFetch"
  fakeFetch = vi.fn(() => Promise.resolve(new Response('ok')));
  vi.stubGlobal('fetch', fakeFetch);

  // Clear require cache so the IIFE re-executes with the new fake fetch
  const resolved = require.resolve(GUARD_PATH);
  delete require.cache[resolved];

  return require(GUARD_PATH);
}

/** Read the auth token the guard wrote to a <meta> tag. */
function getGuardToken(): string | null {
  const meta = document.querySelector('meta[name="shortless-guard"]');
  return meta ? meta.getAttribute('content') : null;
}

/** Dispatch a toggle event with the correct auth token. */
function dispatchToggle(enabled: boolean) {
  document.dispatchEvent(
    new CustomEvent('shortless-youtube-state', {
      detail: { enabled, _t: getGuardToken() },
    })
  );
}

// ---------------------------------------------------------------------------
// isShortsRequest()
// ---------------------------------------------------------------------------
describe('isShortsRequest()', () => {
  it('returns true for body with browseId "FEshorts"', () => {
    const guard = loadGuard();
    expect(guard.isShortsRequest(JSON.stringify({ browseId: 'FEshorts' }))).toBe(true);
  });

  it('returns false for body with different browseId', () => {
    const guard = loadGuard();
    expect(guard.isShortsRequest(JSON.stringify({ browseId: 'FEwhat_to_watch' }))).toBe(false);
  });

  it('returns false for null/undefined body', () => {
    const guard = loadGuard();
    expect(guard.isShortsRequest(null)).toBe(false);
    expect(guard.isShortsRequest(undefined)).toBe(false);
  });

  it('returns false for non-JSON string body', () => {
    const guard = loadGuard();
    expect(guard.isShortsRequest('not json at all')).toBe(false);
  });

  it('returns false for body missing browseId field', () => {
    const guard = loadGuard();
    expect(guard.isShortsRequest(JSON.stringify({ other: 'data' }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// emptyBrowseResponse()
// ---------------------------------------------------------------------------
describe('emptyBrowseResponse()', () => {
  it('returns a Response object with status 200', () => {
    const guard = loadGuard();
    const resp = guard.emptyBrowseResponse();
    expect(resp).toBeInstanceOf(Response);
    expect(resp.status).toBe(200);
  });

  it('has content-type application/json', () => {
    const guard = loadGuard();
    const resp = guard.emptyBrowseResponse();
    expect(resp.headers.get('content-type')).toBe('application/json');
  });

  it('body contains responseContext and contents', async () => {
    const guard = loadGuard();
    const resp = guard.emptyBrowseResponse();
    const body = await resp.json();
    expect(body).toEqual({ responseContext: {}, contents: {} });
  });
});

// ---------------------------------------------------------------------------
// Fetch interception
// ---------------------------------------------------------------------------
describe('fetch interception', () => {
  it('blocks POST to youtubei/v1/browse with FEshorts body', async () => {
    loadGuard();
    const resp = await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });

    // Should NOT have called through to the original fetch
    expect(fakeFetch).not.toHaveBeenCalled();
    // Should return an empty browse response
    const body = await resp.json();
    expect(body).toEqual({ responseContext: {}, contents: {} });
  });

  it('allows POST to youtubei/v1/browse with non-Shorts body', async () => {
    loadGuard();
    await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEwhat_to_watch' }),
    });

    expect(fakeFetch).toHaveBeenCalled();
  });

  it('allows GET to youtubei/v1/browse', async () => {
    loadGuard();
    await window.fetch('https://www.youtube.com/youtubei/v1/browse');

    expect(fakeFetch).toHaveBeenCalled();
  });

  it('allows POST to other YouTube endpoints', async () => {
    loadGuard();
    await window.fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });

    expect(fakeFetch).toHaveBeenCalled();
  });

  it('handles Request object as input with init body', async () => {
    loadGuard();
    // YouTube uses fetch(url, init) in practice; when a Request is used,
    // pass body via init so the guard can inspect it (Request.body is a
    // ReadableStream which the guard cannot synchronously parse).
    const req = new Request('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
    });
    const resp = await window.fetch(req, {
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });

    expect(fakeFetch).not.toHaveBeenCalled();
    const body = await resp.json();
    expect(body).toEqual({ responseContext: {}, contents: {} });
  });

  it('passes Blob body through untouched (non-string bodies are never Shorts)', async () => {
    loadGuard();
    const blob = new Blob([JSON.stringify({ browseId: 'FEshorts' })], {
      type: 'application/json',
    });
    await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: blob,
    });

    // Non-string bodies pass through without inspection — YouTube always
    // sends JSON strings for browse requests.
    expect(fakeFetch).toHaveBeenCalled();
  });

  it('passes through when enabled=false (toggle off)', async () => {
    loadGuard();
    // Disable via authenticated CustomEvent
    dispatchToggle(false);

    await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });

    // Should pass through to original fetch
    expect(fakeFetch).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Toggle state
// ---------------------------------------------------------------------------
describe('toggle state', () => {
  it('defaults to enabled (blocking)', async () => {
    loadGuard();
    const resp = await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });

    expect(fakeFetch).not.toHaveBeenCalled();
    expect(resp.status).toBe(200);
  });

  it('re-enables blocking after being disabled', async () => {
    loadGuard();

    // Disable
    dispatchToggle(false);
    await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });
    expect(fakeFetch).toHaveBeenCalled();

    fakeFetch.mockClear();

    // Re-enable
    dispatchToggle(true);
    await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it('rejects toggle events without valid auth token', async () => {
    loadGuard();

    // Spoofed event without token — should be ignored
    document.dispatchEvent(
      new CustomEvent('shortless-youtube-state', { detail: { enabled: false } })
    );

    const resp = await window.fetch('https://www.youtube.com/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({ browseId: 'FEshorts' }),
    });

    // Guard should still be enabled — spoof was rejected
    expect(fakeFetch).not.toHaveBeenCalled();
    const body = await resp.json();
    expect(body).toEqual({ responseContext: {}, contents: {} });
  });
});
