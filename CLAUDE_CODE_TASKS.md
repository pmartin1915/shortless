# CLAUDE_CODE_TASKS.md

> **Opus/Sonnet Delegation Plan for FOCUS Browser Extension MVP**
>
> This file is designed to be fed directly to Claude Code running on Opus.
> Opus plans and reviews. Sonnet subagents execute the mechanical tasks.

---

## Context

FOCUS is a browser extension that blocks short-form video content (YouTube Shorts, Instagram Reels, TikTok, Snapchat Spotlight) using a two-layer approach:
- **Layer 1:** `declarativeNetRequest` — blocks/redirects network requests before they leave the browser
- **Layer 2:** `content_scripts` — removes residual DOM elements injected by JavaScript after page load

The full product spec is in `docs/PRODUCT_SPEC_V2.md`. The repo lives at `https://github.com/pmartin1915/focus.git`.

---

## Pre-Flight Checklist

Before starting Sprint 1, complete Phase 0 research manually:

1. Open Chrome DevTools > Network tab on `youtube.com`
   - Navigate to Shorts. Record every request URL containing `/shorts/` or `youtubei`
   - Confirm the XHR calls that load the Shorts feed
2. Same on `instagram.com`
   - Click the Reels tab. Record requests containing `/clips` or `/reels`
3. Open DevTools > Elements tab on YouTube homepage
   - Verify `ytd-reel-shelf-renderer` selector matches the Shorts shelf
   - Run: `document.querySelectorAll('ytd-reel-shelf-renderer')` in console
4. Document findings in `docs/PHASE0_RESEARCH.md`

---

## Sprint 1: Chrome Extension MVP

### Task 1 — Scaffold Project Structure
**Executor:** Sonnet (boilerplate)
**Instructions:**
```
Create the following directory structure inside packages/extension/:

packages/extension/
├── manifest.json          (MV3, see spec section 3.4 for complete JSON)
├── background.js          (empty service worker placeholder)
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content-scripts/
│   ├── youtube.js         (placeholder)
│   ├── instagram.js       (placeholder)
│   └── common.js          (placeholder)
├── filters/
│   └── filter-list.json   (placeholder empty array)
└── icons/
    └── (placeholder icon files — use simple colored squares for dev)

Copy the manifest.json content exactly from the product spec section 3.4.
Ensure all file paths in manifest.json match the directory structure.
```

### Task 2 — Build Filter Rules
**Executor:** Opus (architectural — this is core IP)
**Instructions:**
```
Create filters/filter-list.json based on the spec section 4.2.
Review each rule for:
- False positive risk (will rule 3 blocking youtubei browse API break normal YouTube browsing?)
- Completeness (are there API endpoints we're missing?)
- Rule ID conflicts
- Correct resourceTypes for each pattern

IMPORTANT DECISIONS:
- Rule 3 (blocking youtubei browse API) is aggressive — it may break the YouTube
  homepage entirely. Consider limiting this to a Pro feature or adding more specific
  URL patterns. Research the actual XHR URLs from Phase 0 before finalizing.
- Consider adding Facebook Reels rules (competitors support this, spec does not).
- TikTok rules should include all known domains: tiktok.com, musical.ly,
  tiktokv.com, tiktokcdn.com

Output: filters/filter-list.json with comments explaining each rule block.
Note: JSON doesn't support comments — use a separate FILTER_RULES_EXPLAINED.md.
```

### Task 3 — YouTube Content Script
**Executor:** Sonnet (from spec)
**Instructions:**
```
Create content-scripts/youtube.js based on spec section 3.5.

Requirements:
1. Define SHORTS_SELECTORS array with all selectors from the spec
2. Implement removeShorts() function that hides matching elements
3. Run removeShorts() immediately on load
4. Set up MutationObserver on document.body for SPA re-renders
5. Listen for 'yt-navigate-finish' event for YouTube's custom SPA navigation
6. Add a URL check: if current URL contains /shorts/, redirect to youtube.com
7. Use el.style.display = 'none' and mark with data-focus-hidden attribute
8. Add a short debounce (100ms) to the MutationObserver callback to prevent
   excessive DOM queries

Save to: packages/extension/content-scripts/youtube.js
```

### Task 4 — Instagram Content Script
**Executor:** Sonnet (from spec, parallel with Task 3)
**Instructions:**
```
Create content-scripts/instagram.js based on spec section 3.6.

Requirements:
1. Define REELS_SELECTORS array with all selectors from the spec
2. Implement removeReels() function
3. Navigate to closest container (li or [role="listitem"]) before hiding
4. MutationObserver for SPA re-renders
5. Same debounce pattern as youtube.js
6. URL check: if current URL contains /reels/, redirect to instagram.com

Save to: packages/extension/content-scripts/instagram.js
```

### Task 5 — Popup UI
**Executor:** Sonnet (UI boilerplate, parallel with Tasks 3-4)
**Instructions:**
```
Create a clean, minimal popup with:

popup.html:
- Header with extension name and version
- Toggle switch for each platform: YouTube, Instagram, TikTok, Snapchat
- Each toggle shows platform name + icon placeholder + on/off state
- "Blocks today: X" counter at the bottom
- Link to "Settings" (future)
- Width: 320px, clean design, no frameworks

popup.js:
- Load toggle states from chrome.storage.sync
- Save toggle states on change
- Send message to background.js when toggles change
- Display block count from chrome.storage.local

popup.css:
- Dark mode by default (dark gray background, white text)
- Accent color: #2E75B6
- Toggle switches styled as pill shapes
- Clean typography (system font stack)
- Mobile-friendly touch targets (min 44px)

Save to: packages/extension/popup/
```

### Task 6 — Background Service Worker
**Executor:** Sonnet (from spec)
**Instructions:**
```
Create background.js:

1. On install: set default toggle states (all enabled) in chrome.storage.sync
2. Listen for messages from popup to enable/disable specific platform rules
3. Use chrome.declarativeNetRequest.updateEnabledRulesets() to toggle filter rules
   OR use chrome.declarativeNetRequest.updateDynamicRules() for per-platform control
4. Track block count: listen for chrome.declarativeNetRequest.onRuleMatchedDebug
   (dev only) or estimate from rule matches
5. Badge text: show block count on extension icon

Save to: packages/extension/background.js
```

### Task 7 — Integration Review
**Executor:** Opus (review + QA)
**Instructions:**
```
After Tasks 1-6 complete:
1. Read every file in packages/extension/
2. Verify manifest.json paths match actual file locations
3. Verify content script selectors match current YouTube/Instagram DOM
4. Check for console errors in background.js logic
5. Verify popup correctly communicates with background
6. Test: Load extension in Chrome, navigate to youtube.com/shorts/, verify redirect
7. Test: Load extension, visit youtube.com homepage, verify Shorts shelf hidden
8. Test: Visit instagram.com, verify Reels tab hidden
9. Document any issues found and fix directly or delegate fixes to Sonnet
```

### Task 8 — Store Listing Assets
**Executor:** Sonnet (template)
**Instructions:**
```
Create the following:

1. privacy-policy/index.html — minimal privacy policy page stating:
   - No personal data collected, stored, or transmitted
   - Extension operates entirely on-device
   - No analytics or crash reporting
   - Contact email for privacy inquiries: [PLACEHOLDER]
   - Host-ready static HTML

2. docs/STORE_LISTING.md with:
   - Extension name: [PLACEHOLDER - pending rename]
   - Short description (132 char limit for Chrome Web Store)
   - Full description (paragraphs, not bullets)
   - Category: Productivity
   - Required screenshots dimensions: 1280x800 or 640x400

Save to respective paths.
```

---

## Sprint 1.1: Safari Extension Port

After Chrome extension is working:

```
1. Install Xcode (if not already)
2. Run: xcrun safari-web-extension-converter packages/extension/
3. This generates an Xcode project wrapping the Chrome extension
4. Build and test in Safari on macOS
5. Test in Safari on iOS Simulator
6. Note: Full App Store distribution requires $99/yr Apple Developer account
```

---

## Sprint 1.2: Firefox Port

Minimal changes needed for Firefox MV3:
```
1. Copy packages/extension/ to packages/extension-firefox/
2. Adjust manifest.json:
   - Add "browser_specific_settings": { "gecko": { "id": "[email]" } }
   - Firefox MV3 supports declarativeNetRequest (since Firefox 128+)
3. Test in Firefox using about:debugging
```

---

## Notes for Claude Code

- The product spec document (`docs/PRODUCT_SPEC_V2.md`) is the source of truth for all implementation details
- When in doubt about a selector or URL pattern, refer to Phase 0 research findings
- All content scripts should be defensive — if a selector doesn't match, fail silently (no console errors)
- The popup should work well at mobile widths since this will also be the Safari extension popup on iOS
- Filter rules should be conservative initially — it's better to miss blocking something than to break normal site functionality
