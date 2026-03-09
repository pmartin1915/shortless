**FOCUS**

*Block the Scroll. Keep the Content.*

**COMPETITIVE ANALYSIS & PROJECT PLAN**

Market Research \| Competitor Mapping \| Go-to-Market Strategy

Prepared for Perry & Walker • March 2026

# 1. Executive Summary

FOCUS is a cross-platform tool that surgically blocks short-form
addictive content (YouTube Shorts, Instagram Reels, TikTok, Snapchat
Spotlight) while preserving normal app functionality. This document maps
the competitive landscape, identifies gaps, and outlines the project
structure for development.

## Key Findings

- **Naming conflict:** There is an existing Chrome/Firefox extension
  called *\"Focus --- Remove Shorts & Reels\"* already in both stores.
  You must rename before publishing.

- **Browser extension space is crowded but shallow:** 10+ extensions
  exist, but most are DOM-only scripts without network-level blocking.
  Your two-layer approach (declarativeNetRequest + content scripts) is
  technically superior.

- **Mobile is where the real value lives:** NoScroll has 1.2M Android
  downloads. one sec is the market leader with peer-reviewed research.
  Both validate massive demand for sub-feature blocking on mobile.

- **No one owns the cross-platform story:** Every competitor is either
  browser-only or mobile-only. A unified browser extension + Android
  app + iOS app with shared branding and filter lists is genuinely
  differentiated.

- **The \"honest limitations\" angle is a real moat:** Competitor
  reviews are full of complaints about apps that promise surgical
  blocking and fail. Being transparent about what iOS can and cannot do
  builds trust and reduces churn.

# 2. Competitive Landscape

## 2.1 Browser Extensions

The browser extension market has many entrants, but most are lightweight
DOM-hiding scripts maintained by solo developers. Quality and
reliability vary significantly.

  ----------------- ----------- ------------ --------------- ----------------------
  **Extension**     **Users**   **Rating**   **Platforms**   **Notes**

  **Remove YouTube  200,000     4.6 / 5      YouTube only    Largest. Has companion
  Shorts**                                                   Android app
                                                             (BlockScroll).
                                                             YouTube-only.

  **Focus ---       \~5,000     3.6 / 5      YT + IG + FB    NAMING CONFLICT. Uses
  Remove Shorts &                                            Mellowtel monetization
  Reels**                                                    (controversial).
                                                             Multi-platform.

  **SocialFocus**   \~10,000    4.6 / 5      YT + IG + FB +  Most comprehensive
                                             Reddit +        feature set (115+
                                             LinkedIn + X    toggles). Broad but
                                                             complex.

  **ShortShield     Open source N/A          YT + IG +       Well-architected OSS
  (GitHub)**                                 TikTok          project. TypeScript +
                                                             tests. Good reference
                                                             codebase.

  **FocusTube**     Small       N/A          YT + IG + FB +  Open source. Includes
                                             TikTok          Pomodoro timer.
                                                             Another naming
                                                             competitor.
  ----------------- ----------- ------------ --------------- ----------------------

**Takeaway:** The browser extension alone is not a defensible business.
It validates the filter rules and serves as the foundation for the
mobile products, which is where real monetization potential lives.
However, the Safari Web Extension reaching iOS users is a strategic
advantage no competitor leverages well.

## 2.2 Mobile Apps (Android)

Android sub-feature blocking is a proven category. All successful apps
use the AccessibilityService API --- the same approach your V2 spec
proposes.

  ----------------- --------------- ------------ ------------- ---------------------------
  **App**           **Downloads**   **Rating**   **Pricing**   **Key Observations**

  **one sec**       500K+           4.5 / 5      Freemium      Market leader.
                                                 \~\$5/mo      Peer-reviewed research (57%
                                                               usage reduction).
                                                               Psychology-based approach.
                                                               Sub-feature blocking
                                                               Android only --- explicit
                                                               they CANNOT do it on iOS.

  **NoScroll**      1.2M            4.6 / 5      Free + IAP    Largest install base for
                                                               Shorts/Reels blocking. 15+
                                                               platforms. Reviews note
                                                               reliability issues after
                                                               platform updates. Android
                                                               only.

  **AppBlock**      1M+             4.2 / 5      Free + Pro    Established app blocker
                                                               that added sub-feature
                                                               blocking in v7.5. Broad
                                                               feature set (schedules,
                                                               passwords). Android only
                                                               for sub-features.

  **WallHabit**     100K+           4.5 / 5      Free + Pro    Uses \"hold to unlock\"
                                                               psychology. Both Android
                                                               (Accessibility) and iOS
                                                               (claims sub-feature
                                                               blocking --- mechanism
                                                               unclear). Good App Store
                                                               positioning.

  **ScrollGuard**   Moderate        4.3 / 5      Free          By BreakTheScroll.
                                                               Completely free. Both
                                                               Android and iOS. Blocks
                                                               Reels/Shorts on IG, YT,
                                                               Reddit, LinkedIn. Detecting
                                                               doom-scrolling patterns.
  ----------------- --------------- ------------ ------------- ---------------------------

**Takeaway:** Massive proven demand (NoScroll at 1.2M downloads alone).
The AccessibilityService approach works and is accepted by Google Play.
Key competitive risk: platform UI changes break detection, requiring
ongoing maintenance. one sec's research-backed approach at \~\$5/month
validates the \$2.99/month Pro tier.

## 2.3 iOS Landscape

iOS sub-feature blocking is the **weakest part of every competitor's
offering**. one sec explicitly states they cannot do it. Most
Android-first apps either skip iOS entirely or offer only blunt
app-level blocking. This is actually good news --- expectations are low,
and your Safari Web Extension strategy is genuinely novel.

# 3. Your Competitive Advantages

### 3.1 Cross-Platform Unified Experience

No competitor ships a browser extension + Android app + iOS app under
one brand with shared filter rules. Browser extensions and mobile apps
exist in separate silos. FOCUS can be the first to offer a single
subscription that covers all your devices.

### 3.2 Two-Layer Browser Blocking

Most browser extensions use only content scripts (DOM manipulation).
Your declarativeNetRequest + content script two-layer approach blocks at
both the network and DOM level, catching content that single-layer
extensions miss (API calls, XHR requests, SPA navigations).

### 3.3 Safari Web Extension as iOS Strategy

This is your most underappreciated advantage. Every competitor gives up
on surgical iOS blocking. You can offer full URL-path blocking in Safari
on iPhone/iPad --- reaching the same content through the browser where
you have full control. Pair this with FamilyControls time limits on
native apps, and your iOS offering is materially better than anyone
else's.

### 3.4 Radical Honesty as Brand Identity

Competitor app reviews are full of one-star complaints about promised
features that don't work. Your spec explicitly documents what each
platform can and cannot do. Marketing this honesty ("We tell you exactly
what FOCUS can do on each platform, because we respect your
intelligence") builds trust and reduces refund requests.

# 4. Critical Action Items Before Development

## 4.1 Rename the Product

**\"FOCUS\"** is taken in the Chrome Web Store and Firefox Add-ons.
There's also a \"FocusTube\" extension. You need a distinct name before
publishing. Some directions to consider:

- **Action-oriented:** DeScroll, UnReel, ClipGuard, ShortCircuit,
  FeedBreak

- **Metaphorical:** Levee (blocks the flood), Sieve (filters the noise),
  Aperture (controls what gets through)

- **Direct:** NoReels (also taken), ScrollStop, ReelBlock, ClipCut

**Recommendation:** Pick a name, then immediately check Chrome Web
Store, Firefox Add-ons, Apple App Store, Google Play Store, GitHub, and
do a trademark search on USPTO TESS. The name must be available on *all*
platforms you plan to ship on.

## 4.2 Clarify Perry & Walker's Working Relationship

Before any code is written or any store accounts are created, document
the basics:

1.  Who owns the GitHub repo and developer accounts (Apple, Google,
    Chrome Web Store)?

2.  How is revenue split? (50/50? Based on contributions? Perry as
    majority since he's the developer?)

3.  What happens if one person wants to stop working on it?

4.  Who is the decision-maker for product direction?

A simple one-page agreement now prevents painful conversations later.
This is especially true for family businesses.

## 4.3 Validate Before Over-Building

Ship the Chrome extension in 1--2 weekends. Get it into the Chrome Web
Store. See if anyone installs it. Then build the Safari port. Only after
browser validation should you invest weeks in the Android Accessibility
service. The spec's phased roadmap is correct --- resist the temptation
to build everything at once.

# 5. Project Structure for Development

The following monorepo structure supports all three platforms with
shared configuration. This is ready for Claude Code with an Opus/Sonnet
workflow.

focus/ ├── README.md ├── LICENSE ├── .github/ │ └── workflows/ │ └──
ci.yml ├── docs/ │ ├── PRODUCT_SPEC_V2.md │ ├── COMPETITIVE_ANALYSIS.md
│ ├── FILTER_MAINTENANCE.md │ └── PARTNERSHIP_AGREEMENT.md ├── packages/
│ ├── shared/ │ │ ├── filter-rules.json │ │ ├── platforms.ts │ │ └──
types.ts │ ├── extension/ ← Phase 1: Browser Extension │ │ ├──
manifest.json │ │ ├── background.js │ │ ├── popup/ │ │ ├──
content-scripts/ │ │ ├── filters/ │ │ └── icons/ │ ├── android/ ← Phase
2: React Native + Kotlin │ │ ├── App.tsx │ │ ├── src/ │ │ └── android/ │
└── ios/ ← Phase 3: Swift + Safari Extension │ ├── Focus/ │ └──
SafariExtension/ └── privacy-policy/ └── index.html

# 6. Claude Code Development Plan

The following task breakdown is designed for an Opus/Sonnet delegation
workflow in Claude Code. Opus handles architecture and review; Sonnet
executes the mechanical work.

## Sprint 1: Chrome Extension MVP (1--2 weekends)

  -------- -------------------------- ------------------- --------------------
  **\#**   **Task**                   **Executor**        **Dependencies**

  1        Scaffold manifest.json     Sonnet              None
           with MV3 config            (boilerplate)       

  2        Build filter-list.json     Opus                Task 1
           with all URL patterns      (architectural)     

  3        Write youtube.js content   Sonnet (from spec)  Task 1
           script                                         

  4        Write instagram.js content Sonnet (from spec)  Task 1
           script                                         

  5        Build popup UI (toggle per Sonnet (UI          Task 1
           platform)                  boilerplate)        

  6        Background service         Sonnet (from spec)  Tasks 2--5
           worker + storage                               

  7        Integration test: load in  Opus (review + QA)  All above
           Chrome, verify blocking                        

  8        Chrome Web Store listing + Sonnet (template)   Task 7
           privacy policy                                 
  -------- -------------------------- ------------------- --------------------

**Sprint 1 Note:** Tasks 3, 4, and 5 can run as parallel Sonnet agents
since they modify independent files. Task 2 should be Opus because the
filter rules are the core IP and need careful architectural thought
about false positives and maintenance.

## Sprint 1.1: Safari Extension Port (+1 weekend)

Wrap the Chrome extension for Safari using Apple's
safari-web-extension-converter tool. This unlocks iOS Safari blocking
with no Apple Developer Account required for development. Note:
distribution through the App Store does require the \$99/year account.

## Sprint 2+: See V2.0 Product Spec

The full Android and iOS development roadmap is covered in detail in the
V2.0 Product Technical Specification. Do not begin Sprint 2 until the
browser extension has been published and has user signal.

# 7. Bottom Line

This is a buildable product with proven demand. The technical spec is
sound, the market is validated (1.2M+ downloads across competitors), and
the cross-platform angle is genuinely differentiated. The browser
extension can ship in days, not months.

**Three things to do this week:**

5.  **Pick a new name** and verify availability across all stores and
    trademark databases.

6.  **Do the Phase 0 DevTools research** (30 minutes in Chrome DevTools
    recording network traffic on YouTube and Instagram).

7.  **Build and load the Chrome extension locally** using Claude Code.
    The MVP is roughly 100 lines of code.

*End of Document*

FOCUS • Perry & Walker • March 2026
