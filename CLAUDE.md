# Shortless — Project Context for AI Coding Agents

## What This Is

Shortless is a cross-platform tool that surgically blocks short-form addictive content (YouTube Shorts, Instagram Reels, TikTok, Snapchat Spotlight) while preserving normal app functionality. The Chrome extension is shipped (v1.1.0). Firefox port is in progress. iOS companion app exists at `C:\shortless-ios`.

**Stack:** Vanilla JS (Manifest V3 extension), Playwright for testing, TypeScript for build scripts and tests. No framework — the extension is intentionally lightweight.

The canonical design spec is `PRODUCT_SPEC.md`. The README has architecture and design decisions.

---

## Architecture: 3-Layer Defense

Every platform gets three blocking layers. All three are required for full coverage.

### L1 — `declarativeNetRequest` (Network Level)
- JSON rulesets in `packages/extension/filters/` (one per platform)
- Blocks/redirects requests before they complete (e.g., `/shorts/{id}` → `/watch?v={id}`)
- Fastest layer. Handles direct URL navigations.
- **Cannot catch SPA navigations** — that's what L2 and L3 are for.

### L2 — CSS Injection (`document_start`)
- Stylesheets in `packages/extension/styles/` (one per platform)
- Injected at `document_start` to hide UI elements before they render
- Prevents flash-of-blocked-content (FOBC)
- **Cannot handle dynamically injected elements** — that's L3's job.

### L3 — Content Scripts (`MutationObserver`)
- Scripts in `packages/extension/content-scripts/` (one per platform + common.js)
- `MutationObserver` catches SPA navigations and dynamic DOM injection
- Runs at `document_idle` — L2 has already hidden static elements by then
- `youtube-fetch-guard.js` runs in MAIN world at `document_start` to intercept fetch/XHR

### Why All Three Layers
L1 catches network requests. L2 hides static DOM. L3 watches dynamic DOM. Together: zero flicker, zero leakage. If you remove any layer, short-form content can briefly appear before being caught.

---

## Module Boundaries

```
packages/
├── extension/              # Chrome (Manifest V3)
│   ├── manifest.json       # Permissions, content scripts, DNR rules
│   ├── background.js       # Service worker (toggle state, rule management)
│   ├── popup/              # Extension popup UI (HTML/CSS/JS)
│   ├── content-scripts/    # L3: MutationObserver scripts per platform
│   │   ├── common.js       # Shared observer utilities
│   │   ├── youtube.js      # YouTube-specific DOM blocking
│   │   ├── instagram.js    # Instagram-specific DOM blocking
│   │   ├── snapchat.js     # Snapchat-specific DOM blocking
│   │   └── youtube-fetch-guard.js  # MAIN world fetch/XHR interception
│   ├── filters/            # L1: DNR JSON rulesets per platform
│   ├── styles/             # L2: CSS injection per platform
│   └── icons/
├── extension-firefox/      # Firefox port (Manifest V3)
│   └── (mirrors extension/ structure)
└── shared/                 # Cross-browser shared utilities
```

### Import Rules
- Content scripts are isolated per platform. `common.js` is the only shared dependency.
- `background.js` manages extension state (enabled/disabled per platform) via `chrome.storage.local`.
- Filter rules are static JSON. No runtime generation.
- The popup reads state from `chrome.storage.local` and sends messages to `background.js`.

---

## Commands

```bash
npm run build          # Build Chrome + Firefox extensions
npm run build:chrome   # Build Chrome only → store/
npm run build:firefox  # Build Firefox only → store/
npm test               # Build then run all Playwright tests
npm run test:offline   # Popup, manifest, toggle persistence tests
npm run test:unit      # Unit tests (Vitest — background.js, fetch guard)
npm run test:network   # Live platform blocking tests (YT, IG, TikTok, Snapchat)
npm run test:report    # Open Playwright HTML report
```

---

## Testing

**Frameworks:** Vitest (unit tests) + Playwright (E2E, two projects: `offline` and `network`)

| Project | Dir | What it tests | Timeout |
|---------|-----|---------------|---------|
| `unit` | tests/unit/ | background.js logic, fetch guard interception (Vitest) | 5s |
| `offline` | tests/offline/ | Popup UI, manifest validity, toggle persistence | 15s |
| `network` | tests/network/ | Live blocking on YouTube, Instagram, TikTok, Snapchat | 60s (2 retries) |

Network tests hit real sites — they can be flaky due to platform DOM changes. If a network test fails, check if the platform changed their DOM structure before assuming our code is broken.

Unit tests use Vitest with a Chrome API mock factory (`tests/unit/mocks/chrome.ts`). The fetch guard tests use the `jsdom` environment. Source files have conditional `module.exports` that are no-ops in browser contexts.

---

## Platform-Specific Notes

### YouTube
- Shorts URLs (`/shorts/{id}`) are redirected to `/watch?v={id}` via L1 DNR rules
- Shorts shelf on home page hidden via L2 CSS + L3 MutationObserver
- `youtube-fetch-guard.js` intercepts fetch/XHR in MAIN world to block Shorts data from loading

### Instagram
- Reels tab and Reels content hidden via L2 CSS + L3 MutationObserver
- No L1 network blocking (Reels are served from the same endpoints as other content)

### TikTok
- Full domain block via L1 DNR (TikTok is 100% short-form content)
- Includes `*.musical.ly` (legacy TikTok domain)

### Snapchat
- Spotlight content hidden via L2 CSS + L3 MutationObserver
- Stories and messaging remain functional

---

## Key Design Decisions

1. **Vanilla JS, no framework** — Extension must be lightweight and fast. No React, no bundler for content scripts.
2. **3-layer defense** — Any single layer has gaps. All three together = complete coverage.
3. **MAIN world for YouTube fetch guard** — Required to intercept the page's own fetch/XHR calls.
4. **Per-platform toggles** — Users can enable/disable blocking per platform independently.
5. **No data collection** — All blocking is on-device. No analytics, no telemetry.

---

## Privacy & Permissions

- `declarativeNetRequest` — Required for L1 network-level blocking
- `storage` — Stores toggle state (enabled/disabled per platform)
- Host permissions — Required for content script injection on target platforms
- **No `tabs`, no `webRequest`, no remote code** — minimal permission surface

---

## iOS Companion (C:\shortless-ios)

Separate Swift/Xcode project. Uses XcodeGen (`project.yml`). Targets:
- Safari Content Blocker (JSON rules, like L1)
- Safari Web Extension (like L2+L3)
- VPN Extension (for native app blocking)
- Widget

Not automatable via CLI — requires Xcode for build/test.

---

## Opus → Sonnet Delegation

Use Task tool with `model: "sonnet"` for:
- Codebase exploration (grep, find usages, list files)
- Running tests and reporting results
- Manifest validation
- Documentation updates
- Mechanical refactors (rename, move, search-replace)

Keep for yourself (never delegate):
- Architecture decisions (new blocking layers, new platforms)
- Content script logic (MutationObserver patterns, DOM selectors)
- DNR rule authoring (incorrect rules break normal browsing)
- Privacy/permissions review
- Cross-platform sync decisions (Chrome ↔ Firefox ↔ Safari)

## Cross-Model Audit

After changes, audit via PAL MCP:
- Extension code: `pal codereview`
- Manifest/permissions: `pal secaudit`
- Quick check: `pal chat`

## State

@ai/STATE.md
@ai/DECISIONS.md
