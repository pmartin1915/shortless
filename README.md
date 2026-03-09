# FOCUS

> **Block the Scroll. Keep the Content.**

Cross-platform tool that surgically blocks short-form addictive content (YouTube Shorts, Instagram Reels, TikTok, Snapchat Spotlight) while preserving normal app functionality.

⚠️ **Naming Note:** "FOCUS" is a working title. There is an existing Chrome/Firefox extension called "Focus — Remove Shorts & Reels." We need to rename before publishing. See `docs/NAMING.md`.

---

## How It Works

| Platform | Mechanism | Blocking Level |
|---|---|---|
| **Chrome / Edge / Firefox** | `declarativeNetRequest` + content scripts | ✅ Surgical (URL path + DOM) |
| **Safari (iOS + macOS)** | Safari Web Extension | ✅ Surgical (URL path + DOM) |
| **Android native apps** | AccessibilityService + overlay | ✅ Feature-level (UI detection) |
| **iOS native apps** | FamilyControls / ManagedSettings | ⚠️ App-level only (Apple limitation) |
| **TikTok (all)** | Full domain block | ✅ Complete (100% short-form) |

## Architecture

```
packages/
├── shared/              # Shared filter rules + types
│   ├── filter-rules.json
│   ├── platforms.ts
│   └── types.ts
├── extension/           # Browser extension (Chrome, Firefox, Safari)
│   ├── manifest.json
│   ├── background.js
│   ├── popup/
│   ├── content-scripts/
│   │   ├── youtube.js
│   │   ├── instagram.js
│   │   └── common.js
│   ├── filters/
│   │   └── filter-list.json
│   └── icons/
├── android/             # React Native + Kotlin AccessibilityService
│   ├── App.tsx
│   ├── src/
│   └── android/app/src/main/java/com/focus/
│       ├── FocusAccessibilityService.kt
│       ├── OverlayManager.kt
│       ├── RuleEngine.kt
│       └── AccessibilityModule.kt
└── ios/                 # Swift FamilyControls + Safari Extension
    ├── Focus/
    └── SafariExtension/
```

## Development Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 0 | DevTools research (map URLs + DOM selectors) | 🔲 Not started |
| 1 | Chrome extension MVP | 🔲 Not started |
| 1.1 | Safari extension port | 🔲 Not started |
| 1.2 | Firefox MV3 port | 🔲 Not started |
| 2 | Android Accessibility MVP | 🔲 Not started |
| 3 | Pro features (scheduler, custom rules, passcode) | 🔲 Not started |
| 4 | iOS app (FamilyControls + Safari bundle) | 🔲 Not started |

## Quick Start (Extension Development)

```bash
# Clone the repo
git clone https://github.com/pmartin1915/focus.git
cd focus

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the packages/extension/ directory
```

## Key Design Decisions

**Why two layers in the browser extension?**
Short-form content is embedded via JavaScript after page load. A network block alone misses SPA navigations. A DOM script alone misses API calls. Both layers together = full coverage.

**Why AccessibilityService on Android (not VPN)?**
HTTPS encryption + certificate pinning means a VPN can only see hostnames, not URL paths. We can block `i.instagram.com` entirely, but not `/reels/*` specifically. The Accessibility API reads the UI tree instead — a fundamentally different approach.

**Why FamilyControls on iOS (not Accessibility)?**
iOS sandboxing prevents any app from inspecting another app's UI. FamilyControls is the only Apple-sanctioned mechanism for app-level controls. For surgical blocking on iOS, the Safari Web Extension is the answer.

## Privacy

- No data collected, stored, or transmitted
- All blocking happens on-device
- No analytics (unless explicitly added and disclosed)
- Open source filter rules

## Contributing

Filter list contributions welcome! See `docs/FILTER_MAINTENANCE.md`.

## License

[TBD — discuss with Walker]

---

*Built by Perry & Walker • 2026*
