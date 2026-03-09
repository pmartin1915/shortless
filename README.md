# Shortless

> **Block the Scroll. Keep the Content.**

Cross-platform tool that surgically blocks short-form addictive content (YouTube Shorts, Instagram Reels, TikTok, Snapchat Spotlight) while preserving normal app functionality.

---

## How It Works

| Platform | Mechanism | Blocking Level |
|---|---|---|
| **Chrome / Edge** | `declarativeNetRequest` + CSS injection + content scripts | ✅ Surgical (3-layer defense) |
| **Safari (iOS + macOS)** | Safari Web Extension | 🔲 Planned |
| **Firefox** | MV3 port | 🔲 Planned |
| **Android native apps** | AccessibilityService + overlay | 🔲 Planned |
| **iOS native apps** | FamilyControls / ManagedSettings | 🔲 Planned |
| **TikTok (all)** | Full domain block | ✅ Complete (100% short-form) |

## Architecture

The browser extension uses a **3-layer defense system**:

- **L1 — `declarativeNetRequest`:** 4 per-platform rulesets that block/redirect at the network level (e.g. `/shorts/{id}` redirected to `/watch?v={id}`)
- **L2 — CSS injection:** Injected at `document_start` to hide short-form UI elements before they render (prevents flash-of-blocked-content)
- **L3 — `MutationObserver` content scripts:** Catches SPA navigations and dynamically injected content that bypass L1 and L2

```
packages/
└── extension/           # Chrome extension (Manifest V3)
    ├── manifest.json
    ├── background.js
    ├── popup/
    ├── content-scripts/
    │   ├── youtube.js
    │   ├── instagram.js
    │   ├── snapchat.js
    │   └── common.js
    ├── filters/         # DNR rulesets (one per platform)
    ├── styles/          # CSS injection stylesheets
    └── icons/
```

## Development Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 0 | DevTools research (map URLs + DOM selectors) | ✅ Complete |
| 1 | Chrome extension MVP | ✅ Complete |
| 1.1 | Firefox MV3 port | 🔧 In progress |
| 1.2 | Safari extension port | 🔲 Not started |
| 2 | Android Accessibility MVP | 🔲 Not started |
| 3 | Pro features (scheduler, custom rules, passcode) | 🔲 Not started |
| 4 | iOS app (FamilyControls + Safari bundle) | 🔲 Not started |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/pmartin1915/shortless.git
cd shortless

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the packages/extension/ directory
```

## Key Design Decisions

**Why three layers in the browser extension?**
Short-form content is embedded via JavaScript after page load. L1 (network-level DNR rules) catches requests before they complete, but misses SPA navigations. L2 (CSS injection at `document_start`) hides UI elements instantly so users never see a flash of blocked content. L3 (`MutationObserver` content scripts) catches anything that slips through — dynamically injected elements, SPA route changes, and platform-specific edge cases. All three layers together = full coverage with zero visual flicker.

**Why AccessibilityService on Android (not VPN)?**
HTTPS encryption + certificate pinning means a VPN can only see hostnames, not URL paths. We can block `i.instagram.com` entirely, but not `/reels/*` specifically. The Accessibility API reads the UI tree instead — a fundamentally different approach.

**Why FamilyControls on iOS (not Accessibility)?**
iOS sandboxing prevents any app from inspecting another app's UI. FamilyControls is the only Apple-sanctioned mechanism for app-level controls. For surgical blocking on iOS, the Safari Web Extension is the answer.

## Privacy

- No data collected, stored, or transmitted
- All blocking happens on-device
- No analytics (unless explicitly added and disclosed)
- Open source filter rules

## License

[TBD — discuss with Walker]

---

*Built by Perry & Walker • 2026*
