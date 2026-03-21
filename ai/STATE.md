# STATE.md — Shortless

**Last updated:** 2026-03-21
**Version:** 1.1.0
**Branch:** master

## Current Status

- Chrome extension shipped (v1.1.0) — CWS under review
- Firefox MV3 port tested and ready — AMO zip built, awaiting submission
- iOS companion app at C:\shortless-ios (v2.1.0) — awaiting CI → deploy → submission
- 10 Playwright test specs (5 offline, 5 network) — 43 offline + 9 network assertions

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
  - AMO submission zip at `store/shortless_block_short-form_content-1.1.0.zip`
  - `web-ext` tooling: `npm run lint:firefox`, `npm run firefox:dev`

## What's Next

- Submit Firefox extension to AMO (zip ready)
- Manual smoke test in Firefox (all 4 platforms + popup)
- Safari extension port planning
- Pro features (scheduler, custom rules, passcode)
