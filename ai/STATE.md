# STATE.md — Shortless

**Last updated:** 2026-03-22
**Version:** 1.1.1
**Branch:** master

## Current Status

- Chrome extension v1.1.1 — CWS under review
- Firefox extension v1.1.1 — AMO under review
- iOS companion app v2.1.0 — App Store under review
- 10 Playwright test specs (5 offline, 5 network) — 43 offline + 9 network assertions
- 2 Vitest unit test specs — 49 assertions (background.js + youtube-fetch-guard.js)

## What's Done

- 3-layer defense system (DNR + CSS + MutationObserver)
- Per-platform toggles (YouTube, Instagram, TikTok, Snapchat)
- YouTube fetch guard (MAIN world interception)
- Playwright test infrastructure (offline + network projects)
- Firefox MV3 port complete and tested in Firefox 148
  - Fixed `setBadgeTextColor` (unsupported in Firefox MV3)
  - Fixed cross-world CustomEvent with `cloneInto` for ISOLATED → MAIN communication
  - `web-ext lint` passes with zero errors/warnings
  - 22 new offline tests (Firefox manifest validation + Chrome/Firefox parity)
  - AMO submission zip at `store/shortless_block_short-form_content-1.1.1.zip`
  - `web-ext` tooling: `npm run lint:firefox`, `npm run firefox:dev`
- Phase C: Unit tests for background.js and youtube-fetch-guard.js
  - Vitest framework with jsdom environment for fetch-guard tests
  - Chrome API mock factory at `tests/unit/mocks/chrome.ts`
  - 32 tests for background.js (state management, DNR toggle, block counting, badge, message handlers)
  - 17 tests for youtube-fetch-guard.js (isShortsRequest, emptyBrowseResponse, fetch interception, toggle state)
  - Conditional `module.exports` in source files (no-op in browser contexts)

## What's Next

- Await review outcomes (CWS, AMO, App Store)
- Manual smoke test in Firefox (all 4 platforms + popup)
- Safari extension port planning
- Pro features (scheduler, custom rules, passcode)
