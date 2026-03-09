# Surgical blocking of short-form video: a technical reference

**The most reliable cross-platform strategy combines three layers: network-level URL interception via `declarativeNetRequest`, CSS injection at `document_start` for instant visual hiding, and `MutationObserver`-based content scripts for dynamically loaded elements.** Each platform presents unique challenges — YouTube offers the richest set of stable selectors through its custom web components, while Instagram and Facebook rely on obfuscated React class names that demand structural and text-based detection instead. This report documents every verified URL pattern, API endpoint, and DOM selector across all five platforms, with false-positive risk assessments drawn from analysis of dozens of open-source extensions, uBlock Origin filter lists, and reverse-engineered API schemas.

---

## YouTube Shorts: the most complex and best-documented target

YouTube Shorts blocking benefits from YouTube's use of Polymer web components, which expose stable custom element names and data attributes. The ecosystem of open-source blockers — particularly the **gijsdev/ublock-hide-yt-shorts** filter list (1,900+ stars) and multiple Manifest V3 extensions — provides battle-tested selectors verified through early 2026.

### URL patterns

All Shorts URLs follow a consistent path structure. The canonical desktop pattern is `https://www.youtube.com/shorts/{videoId}` where the video ID is an 11-character alphanumeric string `[a-zA-Z0-9_-]{11}`. Mobile web uses `https://m.youtube.com/shorts/{videoId}` with identical path structure. The privacy-enhanced embed domain `youtube-nocookie.com/shorts/{videoId}` also exists but is rarely encountered. Embeds of Shorts use the standard `/embed/{videoId}` path — there is no `/shorts/`-specific embed URL, which means **embedded Shorts cannot be distinguished from regular video embeds by URL alone**. Short links via `youtu.be/{videoId}` always resolve to `/watch`, never `/shorts/`. For `declarativeNetRequest` rules, the match patterns `*://www.youtube.com/shorts/*` and `*://m.youtube.com/shorts/*` with `resourceTypes: ["main_frame"]` provide clean interception with **zero false-positive risk** (confidence: HIGH).

### API endpoints and the critical shared-vs-exclusive distinction

YouTube's internal InnerTube API at `youtubei.googleapis.com` uses several endpoints, and correctly classifying them is essential to avoid breaking normal browsing.

**Safe to block (Shorts-exclusive, very low false-positive risk):**

The entire `/youtubei/v1/reel/` path prefix is exclusively used for Shorts. Two confirmed endpoints exist: **`/youtubei/v1/reel/reel_watch_sequence`** fetches the next batch of Shorts in the vertical scroll feed using a `sequenceParams` continuation token, and **`/youtubei/v1/reel/reel_item_watch`** fetches player data and metadata for individual Shorts within the Shorts player interface. Both are safe to block entirely via `declarativeNetRequest` with the rule `{"urlFilter": "*/youtubei/v1/reel/*", "resourceTypes": ["xmlhttprequest"]}`. No regular YouTube feature uses these endpoints.

**Requires body inspection (cannot block at network level):**

The **`/youtubei/v1/browse`** endpoint is shared across all YouTube navigation. The Shorts feed specifically sends `browseId: "FEshorts"` in the POST body, but `declarativeNetRequest` cannot inspect POST bodies. Other `browseId` values serve the homepage (`FEwhat_to_watch`), subscriptions (`FEsubscriptions`), trending (`FEtrending`), channels (`UC...` prefix), and playlists (`VL...` prefix). Blocking this endpoint entirely would **catastrophically break** all YouTube navigation. The only option is content-script-level `fetch`/`XMLHttpRequest` interception to filter requests where `browseId` equals `FEshorts`.

**Must not block (extreme false-positive risk):**

The `/youtubei/v1/next` endpoint (video recommendations and comments), `/youtubei/v1/player` (all video playback), `/youtubei/v1/search` (all search), and `/youtubei/v1/guide` (sidebar navigation) are fully shared. These return Shorts content mixed with regular content. Shorts-specific response renderers — `reelShelfRenderer`, `reelItemRenderer`, `reelWatchEndpoint`, and the newer `shortsLockupViewModel` — can be pruned from JSON responses using content script interception, similar to uBlock Origin's `json-prune` approach, but the endpoints themselves must never be blocked.

### DOM selectors for desktop (www.youtube.com)

The **most reliable per-item indicator** is the `[overlay-style="SHORTS"]` attribute on `ytd-thumbnail-overlay-time-status-renderer` elements. This attribute is present on Shorts thumbnails across all contexts — homepage, search results, subscriptions, and sidebar recommendations — and has been stable since its introduction. Combined with parent element targeting, it enables surgical removal:

- **Homepage Shorts shelf:** `ytd-rich-shelf-renderer[is-shorts]` (the `is-shorts` boolean attribute is Shorts-specific, confidence: HIGH) or `ytd-reel-shelf-renderer` (a Shorts-exclusive web component, confidence: HIGH, zero false-positive risk)
- **Individual Shorts in feeds:** `ytd-rich-item-renderer:has([overlay-style="SHORTS"])`, `ytd-video-renderer:has([overlay-style="SHORTS"])`, `ytd-grid-video-renderer:has([overlay-style="SHORTS"])`
- **Search results:** `ytd-reel-shelf-renderer` within search, plus `ytd-video-renderer:has([overlay-style="SHORTS"])` for individual results
- **Sidebar recommendations:** `ytd-compact-video-renderer:has([overlay-style="SHORTS"])`
- **Subscriptions page:** Scoped selectors like `ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer:has([overlay-style="SHORTS"])`
- **Channel Shorts tab:** `yt-tab-shape:has-text(/^Shorts$/)` (current style) or the legacy `tp-yt-paper-tab:has-text(Shorts)` (being phased out)
- **Sidebar navigation:** `ytd-guide-entry-renderer:has-text(Shorts)` and `ytd-mini-guide-entry-renderer:has-text(Shorts)` for the mini sidebar
- **Category filter chip:** `yt-chip-cloud-chip-renderer:has(yt-formatted-string:has-text(/^Shorts$/i))`
- **Shorts player page:** `ytd-shorts` is the main Shorts player element; URL detection via `location.pathname.startsWith('/shorts/')` is equally reliable
- **Newer UI variant:** `grid-shelf-view-model` with `.shelf-header-layout-wiz__title:has-text(Shorts)` targets the updated 2025+ layout

A critical caution: on `/watch?v=...` pages, use only `ytd-reel-shelf-renderer` (for "Shorts remixing this video" sections) — **do not apply broad Shorts selectors** that could inadvertently hide regular recommendations.

### DOM selectors for mobile web (m.youtube.com)

Mobile web components use the `ytm-` prefix instead of `ytd-`. The key selector difference is that mobile uses **`[data-style="SHORTS"]`** rather than desktop's `[overlay-style="SHORTS"]`. Core mobile selectors include `ytm-reel-shelf-renderer` for Shorts shelves, `ytm-video-with-context-renderer:has([data-style="SHORTS"])` for individual Shorts, `ytm-pivot-bar-item-renderer:has(.pivot-shorts)` for the bottom navigation bar's Shorts button, and `.single-column-browse-results-tabs>a:has-text(Shorts)` for channel page tabs.

### SPA navigation events

YouTube's Single Page Application fires custom events that content scripts must handle. **`yt-navigate-finish`** is the most widely used event (stable since 2021), fired when navigation completes and `window.location.href` is updated. **`yt-page-data-updated`** fires when page data is injected into the DOM and is more reliable for content inspection. The recommended pattern combines these events with History API patching (`history.pushState`/`replaceState` monkey-patching plus `popstate` listener) and a `MutationObserver` on `document.body` with `{childList: true, subtree: true}` as a belt-and-suspenders approach for catching dynamically loaded Shorts during infinite scroll.

---

## Instagram Reels: obfuscated React demands structural detection

Instagram presents a fundamentally different challenge from YouTube. Its React-based frontend uses **heavily obfuscated class names** (e.g., `x7a106z`, `_ab6k`) that change with every deployment. No class-name-based selector should be considered stable.

### URL patterns

Confirmed patterns include `/reels/` (Reels tab/feed), `/reel/{shortcode}/` (individual Reel), `/reels/audio/{audio_id}/` (Reels by audio), `/reels/topics/{topic}/` (topic-filtered Reels), and `/{username}/reels/` (user's Reels tab on their profile). A **critical false-positive risk** exists because Reels can also be accessed via `/p/{shortcode}/` URLs — the same URL format used for regular photo and video posts. Blocking all `/p/` URLs would break normal Instagram browsing entirely. The distinction exists only in API metadata: Reels have `media_type=2` with `product_type="clips"`, while regular videos have `product_type="feed"`. For URL-level blocking, match only `/reels/` and `/reel/` paths. Instagram is also testing making Reels the default home screen in some markets (India, South Korea), which means the root `/` URL may serve Reels-first content for some users in 2026.

### API endpoints

Instagram internally refers to Reels as **"clips."** The private mobile API at `i.instagram.com` exposes `/api/v1/clips/user/` (user's Reels), `/api/v1/clips/trending/` (trending Reels), and `/api/v1/feed/reels_tray/` (Reels tray). The web GraphQL endpoints use `instagram.com/graphql/query/` (legacy, with `query_hash`) and `instagram.com/api/graphql` (newer, with `doc_id`). Reels-specific `doc_id` values have been observed (e.g., `25981206651899035`) but **change every 2–4 weeks**, making them unsuitable for long-term blocking rules. For the extension, intercepting any request containing `/clips/` in the path is the most stable API-level signal.

There is **no CDN-level differentiation** between Reels and regular video posts. Both use identical CDN paths on `scontent-*.cdninstagram.com` with the `t50.2886-16` video prefix. CDN blocking is not viable for selective Reels filtering.

### DOM detection strategy

Given the obfuscation, the proven approaches used by extensions like IGPlus, Antigram, and FocusTube are:

- **URL-based detection** as the primary method: `window.location.pathname` matching against `/reels/` and `/reel/` patterns, checked via both `MutationObserver` (watching `document.body` for subtree changes that indicate URL updates) and History API interception
- **Navigation link hiding:** `a[href="/reels/"]` targets the Reels navigation link in both sidebar (desktop) and bottom bar (mobile) — this is a stable semantic selector
- **Feed Reels detection:** Watch for `<article>` elements containing `a[href*="/reel/"]` links — this identifies Reels mixed into the main feed without relying on obfuscated classes
- **Polling fallback:** IGPlus uses `setInterval` at 200–300ms as a safety net alongside `MutationObserver`, since Instagram's virtual rendering during infinite scroll can cause missed mutations

Instagram's SPA handles navigation via `history.pushState`/`replaceState`. The extension should override both and listen for `popstate`, checking the new URL against Reels patterns after each navigation event.

---

## TikTok: domain-level blocking with a comprehensive domain list

Since TikTok is entirely short-form video content, blocking operates at the domain level. The challenge is ensuring complete coverage of TikTok's distributed infrastructure across multiple CDN providers.

### Core domains (all HIGH confidence)

The primary domains are **`tiktok.com`** (main site and all subdomains including `vm.tiktok.com` for short links, `webapp-va.tiktok.com` for the web app), **`tiktokcdn.com`** (primary video CDN with dozens of `pull-*` subdomains for HLS, FLV, and CMAF streaming), **`tiktokv.com`** (API endpoints, especially `api16-core-*` through `api22-core-*` subdomains), **`tiktokcdn-us.com`** (US-region CDN), **`tiktokv.us`** and **`tiktokw.us`** (US-specific API and web endpoints), and **`musical.ly`** (legacy pre-rebrand domain). Additional infrastructure domains include `ttdns2.com` (DNS) and `tiktokvideo.com`.

### ByteDance infrastructure domains (MEDIUM confidence for false positives)

ByteDance operates shared infrastructure domains: `ibytedtos.com` (CDN/storage), `byteimg.com` (image CDN), `bytedance.map.fastly.net`, and `bplslb.com` (load balancer). **Blocking these risks false positives** because they also serve CapCut, Lark, and other ByteDance products. For a browser extension focused on TikTok web access, blocking `*.tiktok.com` at the request level is sufficient — the CDN and ByteDance infrastructure domains matter more for network-level (DNS/firewall) blocking.

### URL patterns for reference

Standard video links follow `tiktok.com/@{user}/video/{id}`, short share links use `tiktok.com/t/{shortcode}` or `vm.tiktok.com/{shortcode}`, and embeds use `tiktok.com/embed/v2/{id}`.

### Recommended `declarativeNetRequest` rules

```json
[
  {"id": 1, "priority": 1, "action": {"type": "block"},
   "condition": {"urlFilter": "||tiktok.com", "resourceTypes": ["main_frame", "sub_frame"]}},
  {"id": 2, "priority": 1, "action": {"type": "block"},
   "condition": {"urlFilter": "||tiktokcdn.com", "resourceTypes": ["media", "xmlhttprequest"]}},
  {"id": 3, "priority": 1, "action": {"type": "block"},
   "condition": {"urlFilter": "||musical.ly", "resourceTypes": ["main_frame", "sub_frame"]}}
]
```

---

## Snapchat Spotlight: limited web surface, URL matching is sufficient

Snapchat Spotlight has the smallest web footprint of all five platforms. It is available at **`www.snapchat.com/spotlight`** (main feed) and **`www.snapchat.com/spotlight/{id}`** (individual videos), as well as within **`web.snapchat.com`** (Snapchat for Web). The `story.snapchat.com/{username}` pattern is for public Stories — a different feature from Spotlight.

Snapchat's CDN operates through `sc-cdn.net` subdomains including `cf-st.sc-cdn.net` (CloudFront-backed), `bolt-gcdn.sc-cdn.net` (Google CDN), `mem-d.sc-cdn.net`, and `gcs.sc-cdn.net` (Google Cloud Storage). However, **no Spotlight-specific CDN path has been confirmed** — `sc-cdn.net` serves all Snapchat content including Snaps, Stories, and Lenses. Blocking at the CDN level would break all Snapchat media. Other Snapchat domains include `sc-static.net` (static assets), `sc-gw.com` (gateway/API), `sc-prod.net` (production infrastructure), and the legacy `feelinsonice.com`.

DOM selectors for Spotlight on web are poorly documented. Snapchat's web app is a React SPA with no public documentation of its component structure. For embed detection, Snapchat uses `<blockquote class="snapchat-embed" data-snapchat-embed-url="https://www.snapchat.com/spotlight/...">`. **The most reliable blocking strategy is pure URL path matching** on `/spotlight` — this carries zero false-positive risk and requires no DOM inspection (confidence: HIGH).

---

## Facebook Reels: localization-aware text matching in an obfuscated DOM

Facebook Reels shares Instagram's challenge of obfuscated React class names but adds the complication of **localized `aria-label` attributes** that vary by user language.

### URL patterns

Confirmed patterns are `facebook.com/reel/{video_id}` (individual Reel), `facebook.com/reels/` (Reels discovery), `facebook.com/reels/create/` (creation page), and mobile equivalents at `m.facebook.com`. The `fb.watch/{shortcode}` domain serves both regular videos and Reels — it is **not Reels-specific** and cannot be used for selective blocking (false-positive risk: HIGH). The special URL `facebook.com/reel/?s=ifu_see_more` is used for "See more Reels" links in the feed.

### API endpoints

Facebook's public Graph API provides `graph.facebook.com/{page-id}/video_reels` for Reel publishing. Internally, Facebook's web app uses `facebook.com/api/graphql/` with obfuscated `doc_id` parameters that rotate frequently. No stable Reels-specific GraphQL `doc_id` values are publicly known. Like Instagram, Facebook Reels share the same CDN infrastructure (`fbcdn.net`) as all other Facebook content — no CDN-level blocking is possible.

### DOM selectors

The most effective selectors combine `aria-label` attributes with structural targeting, validated across multiple open-source extensions:

- **`div[aria-label="Reels"]`** targets Reels section containers
- **`div[aria-label="Reels and short videos"]`** targets the mixed Reels/short video sections in the feed
- **`[role="feed"]>div:has-text(/^Reels and short videos/)`** uses uBlock-style text matching for feed-level removal
- **`a[href*="/reel/"]`** and specifically `a[href="/reel/?s=ifu_see_more"]` target Reels links

The **critical localization problem** means `aria-label="Reels"` only works for English-language users. For international support, extensions like mrinc/F-B-Hide-Recommendations-and-Reels maintain a `langs.ts` file mapping translated strings across languages (e.g., Polish uses "rolka"). A text-content-based approach using `MutationObserver` to scan for `<span>` elements containing "Reels and short videos" (or localized equivalents) within feed units is more robust than pure attribute matching.

Facebook Reels in the DOM are distinguishable from regular videos by the presence of `/reel/` in associated links, the "Reels and short videos" section header, and the vertical 9:16 aspect ratio — though aspect ratio is a visual cue, not a reliable DOM selector. Regular Facebook videos link to `/watch/` or `/videos/` paths instead.

---

## Recommended multi-layer architecture

The optimal browser extension architecture, validated across the most successful open-source implementations, uses four complementary layers:

- **Layer 1 — `declarativeNetRequest` (background, fires before page load):** Redirect YouTube `/shorts/{id}` to `/watch?v={id}`, block all `/youtubei/v1/reel/*` XHR requests, redirect Instagram `/reels/` and `/reel/` to `/`, redirect Facebook `/reel/` and `/reels/` to `/`, block TikTok domains entirely, and redirect Snapchat `/spotlight` to `/`
- **Layer 2 — CSS injection (content script at `document_start`):** Immediately hide `ytd-reel-shelf-renderer`, `ytd-rich-shelf-renderer[is-shorts]`, `ytd-shorts`, Shorts sidebar navigation, `a[href="/reels/"]` on Instagram, and `div[aria-label="Reels and short videos"]` on Facebook
- **Layer 3 — `MutationObserver` content script:** Watch `document.body` with `{childList: true, subtree: true}` to catch dynamically loaded content across all platforms; remove elements matching `[overlay-style="SHORTS"]` on YouTube, `a[href*="/reel/"]`-containing articles on Instagram, and Reels feed sections on Facebook
- **Layer 4 — SPA navigation interception:** Listen for `yt-navigate-finish` and `yt-page-data-updated` on YouTube; monkey-patch `history.pushState`/`replaceState` and listen for `popstate` on all platforms; optionally use `setInterval` polling at 200–300ms as a fallback

### Edge cases to handle

**Embedded players** present mixed challenges: YouTube Shorts embeds use standard `/embed/{videoId}` URLs and cannot be distinguished from regular embeds without checking video metadata. Instagram and Facebook embeds similarly use shared embed infrastructure. **PWA/AMP pages** generally use the same URL patterns as their web counterparts. **Thumbnail/preview loading** occurs through shared CDN infrastructure on all platforms except TikTok, so thumbnail blocking is only viable for TikTok's dedicated CDN domains.

## Conclusion

YouTube provides the most stable blocking surface thanks to its custom web components — `ytd-reel-shelf-renderer` and `[overlay-style="SHORTS"]` have survived multiple redesigns. The `/youtubei/v1/reel/*` API path is the only cross-platform example of a fully Shorts-exclusive API namespace that can be safely blocked at the network level. Instagram and Facebook demand fundamentally different approaches: structural DOM traversal, URL-path matching, and text-content scanning rather than stable element identifiers. TikTok's domain-level blocking is straightforward but requires maintaining a current domain list as ByteDance's infrastructure evolves. Snapchat Spotlight's minimal web presence makes it the simplest target — pure URL matching suffices. The most durable blocking strategy treats URL patterns as the foundation (highest stability, zero false positives) while layering DOM-based detection for in-feed content where URL patterns alone cannot distinguish short-form from regular content.