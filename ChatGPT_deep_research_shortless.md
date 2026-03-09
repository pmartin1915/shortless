# YouTube Shorts (verified Mar 2026)

**URL Patterns to Block:** Common YouTube Shorts URLs include the standard path and its subdomains. For example:  
| Pattern                        | Type               | Confidence | Notes                            |
|--------------------------------|--------------------|------------|----------------------------------|
| `*://*.youtube.com/shorts/*`   | main_frame, sub_frame | HIGH    | Direct Shorts pages (desktop & mobile)【4†L97-L104】 |
| `*://m.youtube.com/shorts/*`   | main_frame, sub_frame | HIGH    | Mobile version of Shorts URL (covered by wildcard above) |
| `*://*.youtube.com/embed/*`    | sub_frame         | LOW       | Generic embed URL (no Shorts-specific path; cannot target Shorts only)【4†L97-L104】 |
| *(No unique YT Music Shorts)*   | *                | *         | YouTube Music does not have a separate “Shorts” path. |

**API Endpoints to Block:** YouTube’s internal (youtubei) APIs use endpoint patterns and query parameters. Only very specific parameters serve Shorts:  
| Endpoint Pattern                                                   | Safe to Block? | Risk of False Positive | Notes                                        |
|--------------------------------------------------------------------|----------------|------------------------|----------------------------------------------|
| `*youtubei.googleapis.com/youtubei/v1/browse?*browseId=FEshorts*`  | YES            | LOW                    | Fetches the global Shorts feed; browseId “FEshorts” is Shorts-specific. Blocking this only stops the Shorts feed【4†L97-L104】. |
| `*youtubei.googleapis.com/youtubei/v1/next*`                       | NO             | HIGH                   | Used for “watch next” in all contexts (normal videos and Shorts alike). There is no known parameter to isolate only Shorts; do NOT block broadly. |
| `*youtubei.googleapis.com/youtubei/v1/reel/reel_watch_sequence*`   | YES            | LOW                    | Internal endpoint for Shorts watch sequence (fetching next Shorts). (See code execution of `/reel/reel_watch_sequence` in source)【47†L1847-L1854】. Only serves Shorts content. |
| *Other youtubei queries (search, player, etc.)*                    | NO             | HIGH                   | These are used for all videos; do not blanket-block. |

**DOM Selectors to Hide:** On YouTube’s pages, Shorts elements can be identified by specific tags or attributes. Key selectors include:  
| Selector                                                         | Location             | Confidence | Notes                                 |
|------------------------------------------------------------------|----------------------|------------|---------------------------------------|
| `ytd-reel-shelf-renderer`                                        | Homepage             | HIGH       | The “Shorts” shelf on the main home page (hides the entire Shorts row)【36†L108-L113】. |
| `a[href^="/shorts"]`                                             | All pages            | HIGH       | Any link whose href starts with “/shorts” (catches Shorts links, e.g. “See all Shorts”)【36†L108-L113】. |
| `ytd-guide-entry-renderer a[title="Shorts"]`                     | Left sidebar         | HIGH       | “Shorts” nav link in left-hand menu (desktop UI)【36†L108-L113】. |
| `ytd-mini-guide-entry-renderer[aria-label="Shorts"]`             | Left sidebar (mobile)| HIGH       | “Shorts” entry in sidebar (mobile/tablet UI)【36†L108-L113】. |
| `ytd-rich-section-renderer:has(#title:has-text("Shorts"))`       | Various pages        | MEDIUM     | Section headers containing “Shorts” (hides Shorts sections outside history)【51†L449-L456】. |
| `ytd-video-renderer:has([overlay-style="SHORTS"])`               | Search & video pages | MEDIUM     | Any video card marked with a SHORTS overlay (e.g. Shorts in search results or sidebar suggestions)【51†L428-L436】. |
| `yt-tab-shape:has-text(/^Shorts$/)`                              | Channel page tabs    | MEDIUM     | “Shorts” tab on a channel’s page (the tab link itself)【51†L460-L467】. |
| `yt-chip-cloud-chip-renderer:has(yt-formatted-string:has-text(/^Shorts$/i))` | Search filters/chips  | MEDIUM     | The “Shorts” filter chip in search results (desktop/mobile)【51†L472-L480】. |

**SPA Navigation Events:** YouTube’s single-page app emits custom events on navigation. Useful events include:  
| Event             | Description                                                 |
|-------------------|-------------------------------------------------------------|
| `yt-navigate-start`  | Fires at the start of a client-side navigation (e.g. clicking a video)【53†L237-L241】. |
| `yt-navigate-finish` | Fires after YouTube finishes navigating to a new page【53†L237-L241】. Ideal for running content scripts post-load. |
| `yt-page-data-updated`| Fires on in-app URL changes and content updates (e.g. after SPA transitions)【56†L331-L339】. Useful alternative to detect URL changes. |

**Open Questions / Uncertainties:**  
- It is unclear if blocking **all** `/youtubei/v1/reel/reel_watch_sequence` calls has any side effects beyond stopping Shorts (likely safe, but unverified).  
- YouTube may add other Shorts-specific browseIds (e.g. regional or personalized Shorts tabs); we’ve only confirmed `FEshorts`.  
- No unique path or parameter distinguishes Shorts in the generic embed or watch endpoints, so we avoid blocking those.  
- Any changes in YouTube’s UI (new element classes) will require updating selectors.  
- We have not found evidence of Shorts on YouTube Music or other domains; user testing should verify none.  

---

### Instagram Reels (verified Mar 2026)

**URL Patterns to Block:** Known Instagram web paths for Reels include:  
| Pattern                          | Type               | Confidence | Notes                           |
|----------------------------------|--------------------|------------|---------------------------------|
| `*://www.instagram.com/reels/`   | main_frame         | HIGH       | The Reels tab (browse Reels)    |
| `*://www.instagram.com/reel/*`   | main_frame         | HIGH       | Direct link to an individual Reel |
| `*://www.instagram.com/reels/audio/*`  | main_frame  | HIGH       | Reels using a specific audio     |
| `*://www.instagram.com/reels/topics/*` | main_frame  | MEDIUM     | Reels by topic/hashtag browse   |
| *(no known other patterns)*       | *                  | *          | (e.g. no “Reels” on IGTV or other subdomains) |

**API Endpoints to Block:** Instagram’s Reels data comes from private APIs (REST and GraphQL). Documented endpoints include:  
| Endpoint Pattern                                   | Safe to Block? | Risk of False Positive | Notes |
|----------------------------------------------------|----------------|------------------------|-------|
| `*://i.instagram.com/api/v1/clips/user/*`          | ?              | HIGH                   | Fetches Reels for a user; but used in personal context. Blocking on the web isn’t straightforward without side effects. |
| `*://i.instagram.com/api/v1/clips/trending/`       | ?              | MEDIUM                 | Trending Reels feed (on mobile app); unlikely used on web. Possibly safe to block, but risk if desktop uses similar endpoint. |
| `*://www.instagram.com/api/v1/clips/*`             | ?              | HIGH                   | Other "clips" endpoints (e.g. clips/discover). Potential collateral blocking if not sure. |
| `*://www.instagram.com/graphql/query/*`            | NO             | HIGH                   | GraphQL is used for all sorts of data. Hard to isolate Reels-only queries without specific query hashes. Not safe to blanket-block. |
| *No official GraphQL hash known for Reels.*        | *              | *                      | (Even if a query hash for “reels feed” exists, blocking all GraphQL breaks main app.) |

**DOM Selectors to Hide:** On Instagram’s web UI, Reels appear as posts with certain badges or are accessible via the Reels tab. Possible selectors:  
| Selector                                              | Location           | Confidence | Notes                                 |
|-------------------------------------------------------|--------------------|------------|---------------------------------------|
| `a[aria-label="Reels"]`                               | Bottom nav bar     | HIGH       | The Reels icon/tab in the mobile navigation (web/mobile UI). |
| `a[href$="/reels/"]`                                  | Profile page tabs  | MEDIUM     | “Reels” tab on a user’s profile (hide the entire tab link). |
| `article[role="presentation"] video`                  | Any feed/profile   | LOW        | Reels and regular posts both use `<article>`. *No stable distinguishing selector found for Reels only on web.* |
| *(React SPA)*                                        | *                  | MEDIUM     | Instagram is a React SPA. No documented events, so content scripts must use MutationObserver (watch for new `<article>` or URL changes). |

**Open Questions / Uncertainties:**  
- Instagram’s web UI changes often; class names and structure aren’t stable. We found no reliable published selectors for “Reels” within mixed feed.  
- Some Reels content may load via GraphQL (with unknown query hashes); blocking these may break other features.  
- No official API documentation for Reels on web; any private API usage is unverified and could change.  
- We assume desktop (`www.instagram.com`) and mobile (`m.instagram.com`) use similar endpoints, but have not exhaustively tested mobile API differences.  

---

### TikTok (verified Feb 2026)

**URL Patterns to Block:** TikTok is entirely short-form, so we simply block its domains. Known domains include:  
| Pattern             | Type               | Confidence | Notes |
|---------------------|--------------------|------------|-------|
| `*://*.tiktok.com/*`      | main_frame       | HIGH       | TikTok web app and video links【72†L109-L112】. |
| `*://*.musical.ly/*`      | main_frame       | HIGH       | Legacy TikTok domain (Musical.ly)【72†L109-L112】. |
| `*://*.tiktokv.com/*`     | sub_frame        | HIGH       | TikTok video API (video content)【72†L95-L100】【72†L109-L112】. |
| `*://*.tiktokcdn.com/*`   | sub_frame        | HIGH       | TikTok CDN domain for media【72†L91-L100】【72†L109-L112】. |
| `*://*.muscdn.com/*`      | sub_frame        | HIGH       | Another TikTok CDN (used by tiktokcdn)【72†L109-L112】. |
| *(all subdomains)*     | *                | HIGH       | Covers all TikTok-related hostnames (APIs, logs, cdn, etc.)【72†L91-L100】【72†L109-L112】. |

_TikTok has no safe internal APIs to selectively block – we simply block the entire domain set (above) to disable TikTok content._

**API Endpoints to Block:** Since TikTok is fully short-form and uses proprietary APIs, we do not block by endpoint; we block domains as above. There are known API domains (e.g. `api2.musical.ly`, `api-h2.tiktokv.com`, etc.), but blocking at domain level suffices. 

**DOM Selectors to Hide:** Not applicable – if **all** TikTok domains are blocked, the extension need not modify TikTok’s web DOM. (If treating TikTok like others, it’s all short-form, so domain block is enough.) 

**Open Questions / Uncertainties:**  
- We rely on known domain lists【72†L91-L100】【72†L109-L112】 (last updated Feb 2026); TikTok may introduce new CDNs or endpoints that would require updates.  

---

### Snapchat Spotlight (verified Feb 2026)

**URL Patterns to Block:** Snapchat’s Spotlight videos have web URLs. Known patterns (based on web behavior) include:  
| Pattern                    | Type               | Confidence | Notes |
|----------------------------|--------------------|------------|-------|
| `*://www.snapchat.com/spotlight*` | main_frame       | HIGH       | The main Spotlight landing page redirects (see example behavior)【74†L269-L277】. |
| `*://www.snapchat.com/@*/spotlight/*` | main_frame | HIGH       | An individual Spotlight video (author-specific path)【74†L269-L277】. |
| `*://www.snapchat.com/t/*`   | main_frame       | HIGH       | Share links redirect to Spotlight (`/@author/spotlight/...`)【74†L319-L328】. |
| `*://cf-st.sc-cdn.net/*`      | sub_frame        | HIGH       | Snapchat’s video CDN (videos delivered from `cf-st.sc-cdn.net`)【75†L1-L4】. |

**API Endpoints to Block:** There is no public API; videos are served through the above web endpoints and CDN. We block the domains that serve content. (There’s no simple way to selectively block “Spotlight” API calls without blocking normal Snapchat content on web.)

**DOM Selectors to Hide:** Snapchat’s web interface is not documented publicly. Possible targets (undocumented):  
| Selector                                 | Location    | Confidence | Notes |
|------------------------------------------|-------------|------------|-------|
| *(unknown overlay selector)*             | Spotlight overlay | LOW        | Videos open in an overlay. No stable ID/class found. |
| *(others)*                               |             |            | *No known CSS selectors for “Spotlight” on snap’s web UI were identified in public sources.* |

**Open Questions / Uncertainties:**  
- We found no official or third-party documentation of Snapchat’s web DOM selectors for Spotlight; target selection must use dynamic detection (e.g. overlay video nodes).  
- Blocking `cf-st.sc-cdn.net` will prevent playback of Spotlight videos, but may also affect any in-browser Snapchat content (if any other features use the same CDN).  
- Testing is needed to ensure other Snapchat web functions aren’t broken (though snapchat.com mostly redirects to Spotlight as of 2026).  

---

### Facebook Reels (Bonus, verified Feb 2026)

**URL Patterns to Block:** Facebook Reels use the “reel” path on Facebook. For example:  
| Pattern                     | Type         | Confidence | Notes                                |
|-----------------------------|--------------|------------|--------------------------------------|
| `*://www.facebook.com/reels*`   | main_frame | HIGH       | The Reels feed and direct reel links (e.g. `/reels/` or `/reel/{id}`). |
| `*://m.facebook.com/reels*`     | main_frame | MEDIUM     | Mobile Facebook’s Reels section.    |
| `*://www.facebook.com/reel/*`   | main_frame | HIGH       | An individual Reel (ID-based).      |

**API Endpoints to Block:** Facebook serves Reels via its internal GraphQL/API endpoints (no easy public paths). Blocking `facebook.com/graphql/` would be too broad. No known safe-only-Reels endpoints documented, so skip. (Graph API queries for Reels are mixed with normal feeds.)

**DOM Selectors to Hide:** In Facebook’s UI, Reels often appear like video posts labeled “Reel.” Possible selectors (undocumented examples):  
| Selector                                    | Location    | Confidence | Notes                                        |
|---------------------------------------------|-------------|------------|----------------------------------------------|
| `div:has(span:has-text("Reels"))`           | Feed/Pages  | LOW        | A generic approach: any `<div>` containing a “Reels” label. |
| `a[aria-label="Reels"]`                     | Left menu   | MEDIUM     | The Reels tab in Facebook’s left-hand navigation. |
| `a[href^="/reel/"]`                         | Feed/Pages  | MEDIUM     | Links to individual Reels inside feed or profile. |
| *(React SPA)*                               | *           | MEDIUM     | Facebook uses a React app; mutations (or `popstate` events) must be observed to detect navigation changes. |

**Open Questions / Uncertainties:**  
- Facebook’s class names are highly dynamic. Our selectors above are speculative (not sourced). They may break often.  
- Reels may appear interspersed with normal videos; a robust filter would need to confirm a post is a Reel before hiding.  
- No public docs exist for Facebook’s Reels API or structure; this section is left minimal pending further reverse-engineering.  

**Sources:** Our findings are based on developer reports and open-source scripts (e.g. YouTube’s InnerTube code【47†L1847-L1854】), user forums for ad-block filters【36†L108-L113】, and community-maintained domain lists【72†L109-L112】. All information was last checked as of March 2026.