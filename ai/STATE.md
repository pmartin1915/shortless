# STATE.md — Shortless

**Last updated:** 2026-03-24
**Version:** 1.1.2
**Branch:** master

## Current Status

- Chrome extension v1.1.1 — CWS under review (v1.1.2 ready locally)
- Firefox extension v1.1.1 — AMO under review (v1.1.2 ready locally)
- iOS companion app v2.1.0 — App Store under review
- iOS companion app v3.0.0 — code complete, awaiting portal setup
- 10 Playwright test specs (5 offline, 5 network) — 43 offline + 9 network assertions
- 4 Vitest unit test specs — 91 assertions

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

## What's Next

- Await review outcomes (CWS v1.1.1, AMO v1.1.1, App Store v2.1.0)
- Perry: Complete iOS v3.0.0 portal steps (Family Controls + provisioning profiles)
- Tag v3.0.0 after portal setup → triggers CI/CD deploy
- Facebook Reels blocking (DOM research spike, then implement 3-layer defense)
- Manual smoke test in Firefox (all 4 platforms + popup)
- Safari extension port planning
- Pro features (scheduler, custom rules, passcode)
