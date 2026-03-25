# Architectural Decisions — Shortless

Append-only log. Do not delete or modify existing entries.

---

## 2025-09-01: Three-layer defense architecture

**Decision:** Block short-form video content via 3 independent layers: L1 (declarativeNetRequest), L2 (CSS injection), L3 (MutationObserver).
**Why:** Each layer targets a different attack surface. If one layer fails (e.g., platform changes their DOM), the others still block.
**Implication:** All three layers must be maintained independently. Changes to one layer should not affect others.

## 2025-09-01: Vanilla JavaScript (no framework)

**Decision:** No React, Vue, Svelte, or any framework. Pure vanilla JS.
**Why:** Browser extensions must be lightweight. Framework overhead adds bundle size and complexity for what is essentially DOM manipulation.
**Implication:** Manual DOM manipulation, no virtual DOM, no build-time JSX transforms for content scripts.

## 2025-09-15: Chrome MV3 (Manifest V3)

**Decision:** Target Manifest V3 from the start, not MV2.
**Why:** Chrome is deprecating MV2. Starting with MV3 avoids a painful migration later.
**Implication:** Service worker (not background page), declarativeNetRequest (not webRequest), limited programmatic access.

## 2025-10-01: No telemetry, no data collection

**Decision:** Zero analytics, zero tracking, zero data sent anywhere.
**Why:** Privacy is the product's core value proposition. Users installing a distraction blocker expect privacy.
**Implication:** All filter logic is static JSON. No remote config, no phone-home, no usage stats.

## 2025-11-01: Per-platform toggles

**Decision:** Users can independently enable/disable blocking for each platform (YouTube, Instagram, TikTok, Snapchat).
**Why:** Some users want to block only YouTube Shorts but keep Instagram Reels.
**Implication:** Storage API stores per-platform toggle state. Each layer checks toggle before applying rules.

## 2026-01-15: YouTube fetch guard (MAIN world injection)

**Decision:** Inject `youtube-fetch-guard.js` into MAIN world (not ISOLATED) to intercept YouTube's fetch() API.
**Why:** YouTube loads Shorts data via fetch() before rendering. Blocking at the network level (L1.5) catches Shorts before they appear.
**Implication:** MAIN world scripts cannot access extension APIs. Communication via CustomEvent + cloneInto (Firefox).

## 2026-03-10: Firefox MV3 port

**Decision:** Port to Firefox using separate `packages/extension-firefox/` directory with Firefox-specific manifest.
**Why:** Firefox has its own MV3 implementation with differences (setBadgeTextColor, cross-world messaging, sidebar API).
**Implication:** Shared code in `packages/shared/`, platform-specific code in each extension directory. Firefox uses `cloneInto` for cross-world CustomEvent data.
