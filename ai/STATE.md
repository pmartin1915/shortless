# STATE.md — Shortless

**Last updated:** 2026-03-25
**Version:** 1.1.5
**Branch:** master

## Current Status

- Chrome extension v1.1.1 — CWS under review (v1.1.5 ready locally)
- Firefox extension v1.1.4 — AMO under review (v1.1.5 ready locally)
- iOS companion app v2.1.0 — App Store review (Information Needed response sent)
- iOS companion app v3.0.0 — code complete, awaiting portal setup
- 10 Playwright test specs (5 offline, 5 network) — 43 offline + 9 network assertions
- 4 Vitest unit test specs — 118 assertions

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
  - `web-ext` tooling: `npm run lint:firefox`, `npm run firefox:dev`
- v1.1.1: Cross-model audit (Opus 4.6 + Gemini 3 Pro Preview) — 9 hardening fixes
  - Auth token, live toggle parity, popup single source of truth, trailing-edge throttle
  - Platform validation, block count cap, observer lifecycle, history idempotency
- v1.1.2: Hardening + tests sprint (Opus 4.6 + Gemini 3 Pro Preview)
  - Performance: `hideElements()` `:not()` selector optimization (skip already-hidden)
  - Performance: Leading+trailing throttle + `takeRecords()` in `createObserver()`
  - Security: Auth meta tag removed from DOM after reading
  - Security: Extension fingerprinting sentinel moved to closure-scoped variable
  - DRY: `unhideAll()` and `watchToggle()` extracted to common.js (removed 3x duplication)
  - Dead code: `checkUrlAndRedirect()` removed (unused)
  - Feature: "Report Breakage" link in popup (pre-filled GitHub issue)
  - Tests: Test exports added to all 4 content scripts
  - Tests: 41 new unit tests (common.js + platform redirect/hide/toggle logic)
  - Total: 91 Vitest assertions (up from 50), 43 Playwright offline assertions
- v1.1.3: Hardening sprint (Opus 4.6 + Gemini 3 Pro Preview cross-model audit)
  - Accessibility: Added aria-labels to all 4 popup toggle checkboxes (WCAG 2.1 AA)
  - Performance: Debounced `sendBlockCount()` IPC — 2s local accumulator prevents message flooding
  - DRY: Removed duplicated `getTodayKey()` from popup; uses `GET_BLOCK_COUNT` message API
  - Resilience: Error boundary wrapping popup init (each setup function isolated via try-catch)
  - Bug fix: Report breakage now sends full `navigator.userAgent` (not fragile `.pop()`)
  - i18n: YouTube chip text fallback expanded to 4 locales (Shorts, Cortos, Curtas, ショート)
  - Performance: `pagehide` listener flushes pending block counts before page destruction
  - Resilience: Storage listener triggers `loadBlockCount()` refresh (handles midnight rollover)
  - Robustness: Chip text match uses `startsWith` to tolerate injected badge text
  - Tests: 6 createObserver tests (incl. coalescing invariant), 6 sendBlockCount debounce tests, 2 i18n chip tests
  - Total: 103 Vitest assertions (up from 91), 43 Playwright offline assertions
- v1.1.4: Gemini 3 Pro Preview full audit (Opus 4.6 + Gemini 3 Pro Preview codereview)
  - Performance: `hideChipsByText()` marks innocent chips with `data-shortless-checked` (skip on re-scan)
  - Bug fix: Fetch guard caches `originalArgs` — passes original untouched Request instead of reconstructing
  - Resilience: `_pendingIncrement` capped at 100,000 on storage failure (prevents unbounded memory growth)
  - Robustness: Instagram `collapseParentListItems` now includes `[data-testid="reels-tab"]` selector
  - Robustness: Snapchat selector split into exact `/spotlight` + prefix `/spotlight/` (no false positives)
  - Tests: 5 new tests (Portuguese + Japanese chip i18n, badge injection, checked optimization, context invalidation)
  - Total: 109 Vitest assertions (up from 103), 43 Playwright offline assertions
- v1.1.5: Gemini 3 Pro Preview audit hardening sprint (Opus 4.6 + Gemini 3 Pro Preview codereview)
  - Bug fix: Fetch guard non-string body passthrough — removed destructive `body.text()` reconstruction that changed body type from Blob to string
  - Performance: `createObserver()` disconnect clears trailing-edge timeout — prevents ghost callbacks on detached DOM
  - Robustness: Snapchat `redirectSpotlight()` tightened from `startsWith('/spotlight')` to exact + prefix match (no false positives on `/spotlightshow`)
  - Coverage: Instagram `/reels` (no trailing slash) blocked at all 3 layers — L1 DNR rule 104, L2 CSS `a[href="/reels"]`, L3 selector + redirect
  - Maintenance: `cleanupOldBlockKeys()` removes block count keys older than 30 days on install/update (prevents unbounded storage growth)
  - Security: Auth token upgraded from base-36 (8 bytes, ~41 bits) to hex (16 bytes, 128 bits)
  - Readability: YouTube chip text matching uses `startsWith()` instead of `indexOf()===0`
  - Tests: 9 new tests (observer disconnect x2, Snapchat false-positive x2, Instagram /reels, storage cleanup x4)
  - Total: 118 Vitest assertions (up from 109), 43 Playwright offline assertions

## What's Next

- Await review outcomes (CWS v1.1.1, AMO v1.1.1, App Store v2.1.0)
- Perry: Complete iOS v3.0.0 portal steps (Family Controls + provisioning profiles)
- Tag v3.0.0 after portal setup → triggers CI/CD deploy
- Facebook Reels blocking (DOM research spike, then implement 3-layer defense)
- Manual smoke test in Firefox (all 4 platforms + popup)
- Safari extension port planning
- Pro features (scheduler, custom rules, passcode)
