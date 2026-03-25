# HANDOFF — Shortless (2026-03-24)

## Where We Are

| Platform | Version | Store | Status |
|----------|---------|-------|--------|
| Chrome | 1.1.2 | — | Ready locally (1.1.1 under CWS review) |
| Firefox | 1.1.2 | — | Ready locally (1.1.1 under AMO review) |
| iOS | 2.1.0 | App Store | Under review |
| iOS | 3.0.0 | — | Code complete, awaiting portal setup |

**Branch:** `master`
**Previous commit:** `f72404f` — cross-model audit (9 hardening fixes)

## What This Session Did

Hardening + tests sprint using Opus 4.6 + Gemini 3 Pro Preview (PAL MCP). 8 improvements across performance, security, DRY, and testability.

### Performance (2 fixes)
1. **`hideElements()` `:not()` optimization** — appends `:not([data-shortless-hidden])` to each selector before `querySelectorAll`, offloading filtering to the browser's CSS engine. Eliminates iterating thousands of already-processed elements on infinite scroll.
2. **Leading+trailing throttle + `takeRecords()`** — `createObserver()` now fires the callback immediately on the first mutation (leading edge), then throttles. `observer.takeRecords()` clears the MutationRecord queue to prevent memory buildup.

### Security (2 fixes)
3. **Auth meta tag removed after reading** — `getGuardToken()` in youtube.js now calls `meta.remove()` after extracting the token, reducing the exposure window from permanent to near-instant.
4. **Extension fingerprinting sentinel** — replaced `history.pushState.__shortlessPatched` (detectable by page scripts) with a closure-scoped `_historyPatched` variable.

### DRY Refactor (3 fixes)
5. **`unhideAll()` extracted to common.js** — was duplicated identically in youtube.js, instagram.js, snapchat.js. Now `S.unhideAll()`.
6. **`watchToggle()` extracted to common.js** — the `chrome.storage.onChanged` listener boilerplate was copy-pasted in all 3 platform scripts. Now `S.watchToggle(platform, { onEnable, onDisable })`.
7. **Dead `checkUrlAndRedirect()` removed** — exported by common.js but never used (all platforms implement custom redirect logic).

### Feature (1 addition)
8. **"Report Breakage" link in popup** — opens a pre-filled GitHub issue with extension version and browser info. No new permissions needed.

### Tests
- Test exports added to all 4 content scripts (matching background.js pattern)
- 41 new unit tests across 2 new test files:
  - `tests/unit/common.test.ts` — hideElements, unhideAll, sendBlockCount, isPlatformEnabled, watchToggle, interceptHistoryNav
  - `tests/unit/content-scripts.test.ts` — redirectShorts, hideChipsByText, redirectReels, collapseParentListItems, redirectSpotlight, selector exports
- Chrome mock factory updated: added `runtime.sendMessage`, `runtime.getManifest`, `tabs.create`, object-with-defaults support for `storage.sync.get`

### Test Results
- **91/91 unit tests** (Vitest) — up from 50
- **43/43 E2E tests** (Playwright offline)
- **Firefox lint: 0 errors, 0 warnings**

## Files Changed

| File | Lines | What |
|------|-------|------|
| `packages/shared/content-scripts/common.js` | +52 -23 | :not() optimization, leading+trailing throttle, takeRecords, unhideAll, watchToggle, remove checkUrlAndRedirect, fix fingerprinting, test exports |
| `packages/shared/content-scripts/youtube.js` | +17 -22 | S.unhideAll/S.watchToggle, remove meta tag after read, test exports |
| `packages/shared/content-scripts/instagram.js` | +13 -22 | S.unhideAll/S.watchToggle, test exports |
| `packages/shared/content-scripts/snapchat.js` | +13 -22 | S.unhideAll/S.watchToggle, test exports |
| `packages/shared/popup/popup.html` | +1 | Report Breakage link |
| `packages/shared/popup/popup.js` | +19 | setupReportBreakage() handler |
| `packages/shared/popup/popup.css` | +12 | .report-link styles |
| `tests/unit/common.test.ts` | +225 | **NEW** — 22 tests for common.js functions |
| `tests/unit/content-scripts.test.ts` | +228 | **NEW** — 19 tests for platform scripts |
| `tests/unit/mocks/chrome.ts` | +13 -3 | sendMessage, getManifest, tabs.create, object-with-defaults |
| `package.json` | +1 -1 | Version 1.1.2 |
| `packages/extension/manifest.json` | +1 -1 | Version 1.1.2 |
| `packages/extension-firefox/manifest.json` | +1 -1 | Version 1.1.2 |

## What Needs To Happen Next

### Perry's iOS Portal Steps (blocks v3.0.0 deploy)

Walkthrough: `C:\shortless-ios\docs\v3-portal-walkthrough.md`

1. Enable Family Controls on 3 App IDs
2. Configure App Groups on ActivityMonitor + ShieldConfig
3. Regenerate main app provisioning profile
4. Create 2 new provisioning profiles (ActivityMonitor, ShieldConfig)
5. Upload 3 profiles to GitHub Secrets (base64-encoded)

Then: `git tag v3.0.0 && git push origin v3.0.0` → triggers CI/CD deploy

### Browser Extension Next Sprint

| Item | Impact | Effort |
|------|--------|--------|
| **Facebook Reels** — DOM research spike, then 3-layer defense | High | Low-Med |
| **Snooze/scheduling** — "Allow shorts for 5 min" | Medium | Medium |
| **Reddit video** — DOM research spike | Low | Medium |

### Await Store Reviews
- **CWS v1.1.1:** https://chrome.google.com/webstore/devconsole
- **AMO v1.1.1:** https://addons.mozilla.org/developers/
- **App Store v2.1.0:** App Store Connect

## Commands

```bash
npm run build          # Build Chrome + Firefox
npm run build:chrome   # Chrome only
npm run build:firefox  # Firefox only
npm test               # Build + all Playwright tests
npm run test:offline   # Popup, manifest, toggle, parity tests
npm run test:unit      # Vitest unit tests (91 assertions)
npm run test:network   # Live blocking tests (flaky — real sites)
npm run lint:firefox   # web-ext lint
npm run firefox:dev    # Launch Firefox with extension
```

## Key Constraints

- **Edit `packages/shared/` only** — build script copies to platform dirs
- No new permissions beyond `declarativeNetRequest` + `storage`
- No data collection, no telemetry, no remote code
- Vanilla JS only — no frameworks, no bundlers
- Network tests hit real sites — platform DOM changes cause flaky failures
- **Xcode SDK deadline:** April 28, 2026 — all iOS apps must use iOS 26 SDK
