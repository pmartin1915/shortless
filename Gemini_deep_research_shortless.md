Short-Form Content Blocking: URL, API, 
and DOM Research Report 
The proliferation of algorithmic, short-form video content across major social media platforms 
has fundamentally altered user interaction paradigms, engineering digital environments 
optimized for infinite scrolling and continuous dopamine delivery. As of March 2026, platforms 
such as YouTube, Meta (Instagram and Facebook), TikTok, and Snapchat have deeply integrated 
short-form delivery mechanisms into their core web architectures. For developers engineering 
browser extensions to surgically excise this content while preserving the underlying platform 
utility, the technical challenge is formidable. Modern web applications employ Single Page 
Application (SPA) frameworks, atomic CSS generation, and complex GraphQL or proprietary 
internal APIs that dynamically inject content directly into the Document Object Model (DOM) 
without triggering traditional browser navigation events. 
To achieve surgical blocking without triggering false positives—which would render the primary 
application unusable—an intervention strategy must operate across multiple strata of the 
browser environment. This requires network-layer interception via modern extension APIs like 
Declarative Net Request (DNR), DOM mutation observation to hide dynamically rendered 
nodes, and JavaScript execution environment modification to sanitize pre-loaded initial state 
objects. The transition to Manifest V3 (MV3) architectures further complicates this endeavor, as 
the deprecation of blocking web requests forces developers to rely heavily on static rule sets 
and localized content script execution rather than dynamic background payload inspection. 
This comprehensive analysis provides an exhaustive technical mapping of the URL patterns, 
Application Programming Interface (API) endpoints, and DOM selectors required to neutralize 
short-form content across five primary platforms. The research is grounded in the current 
architectural state of these platforms, reflecting major codebase alterations, React hydration 
strategies, and UI redesigns observed through the first quarter of 2026. 
Platform 1: YouTube Shorts 
The underlying architecture of YouTube relies on the proprietary Polymer framework for 
rendering the DOM and the internal InnerTube API (youtubei) for data fetching.1 Short-form 
content on YouTube presents a unique challenge for surgical extraction because Shorts are 
technically standard YouTube videos, differentiated primarily by metadata—specifically a 
duration of under sixty seconds and a vertical aspect ratio—and specific routing directives.3 
When a user navigates to the YouTube homepage, the platform frequently embeds the initial 
application state directly into the HTML document via a massive JSON object assigned to the 
window.ytInitialData variable.5 Consequently, network-level blocking alone is insufficient for the 
initial page load, as the short-form data has already bypassed the browser's request 
interception mechanisms by being delivered synchronously with the main HTML document. 
Furthermore, YouTube's SPA architecture dictates that traditional page load events do not fire 
as the user navigates between a standard video, a channel page, and the homepage. The 
routing is handled client-side, updating the URL and fetching differential data payloads via the 
InnerTube API without refreshing the browser window. 
To successfully mitigate Shorts exposure, an intervention strategy must simultaneously 
intercept specific InnerTube network requests, hide Polymer DOM elements using deep CSS 
combinators, and listen for YouTube's custom synthetic routing events. The URL routing for 
Shorts is explicitly partitioned under the /shorts/ path. However, the underlying video identifier 
remains functionally identical to standard videos. This allows for a programmatic redirection 
strategy where the /shorts/{videoId} path is dynamically rewritten to the standard 
/watch?v={videoId} path.6 This redirection forces the platform to load the Short within the 
classical desktop player interface, effectively stripping away the infinite-scroll user interface 
and returning control to the user.8 
At the network layer, YouTube utilizes the youtubei.googleapis.com/youtubei/v1/browse 
endpoint for populating feeds. The payload contains a browseId parameter, which is crucial for 
identification. A browseId value of FEshorts explicitly denotes a request for the dedicated 
Shorts feed, making this specific parameter combination safe to block at the network level.1 
Conversely, the youtubei/v1/next endpoint serves recommendations for all videos. Blocking this 
endpoint entirely would categorically break the algorithmic suggestion engine for standard 
long-form videos. Instead, the response payload must be inspected for objects matching the 
shortsLockupViewModel, which dictates the rendering of Shorts within the recommendation 
sidebar.9 
The DOM layer requires constant monitoring due to A/B testing and localized rollouts of new 
Polymer components. The historical selector ytd-reel-shelf-renderer remains highly prevalent 
for targeting the horizontal Shorts carousels injected into the homepage and search results.10 
However, recent UI updates have introduced the ytd-rich-section-renderer.yte-hide-shorts 
container within the modern rich grid layout.12 Targeting the navigation sidebar requires 
isolating the a.yt-simple-endpoint element to prevent users from actively seeking the 
dedicated tab.13 Furthermore, channel pages underwent a structural revision in early 2026, 
transitioning the tab navigation architecture to utilize yt-tab-group-shape elements. Hiding the 
Shorts tab on a creator's profile now requires targeting yt-tab-shape.14 
Because of the SPA architecture, standard DOMContentLoaded listeners are ineffective after 
the initial navigation. The extension environment must instead hook into YouTube's proprietary 
synthetic events. The yt-navigate-finish event fires after a client-side route change completes 
and the new DOM is established, serving as the primary trigger for re-evaluating CSS 
injections.15 Additionally, the yt-page-data-updated event is dispatched when the context of 
the current view refreshes, such as during infinite scrolling pagination or dynamic content 
swaps without a strict URL change.17 
YouTube Shorts 
URL Patterns to Block: 
 
Pattern 
Type 
Confidence 
Notes 
*youtube.com/short
s/* 
main_frame, 
sub_frame 
HIGH 
Direct Shorts 
navigation. 
Recommended 
intervention is a 
URL rewrite to 
/watch?v= to 
preserve video 
access without the 
addictive UI.7 
*m.youtube.com/sh
orts/* 
main_frame, 
sub_frame 
HIGH 
Mobile web specific 
routing for Shorts 
navigation.7 
*music.youtube.co
m/shorts/* 
main_frame 
HIGH 
Crossover routing 
pattern applied to 
the YouTube Music 
application. Less 
frequent but strictly 
adheres to the 
regex standards.19 
*youtube.com/emb
ed/* with ?shorts=1 
sub_frame 
MEDIUM 
Embedded Shorts 
players deployed 
on external 
domains 
occasionally utilize 
specific query 
parameters to force 
the vertical UI. 
API Endpoints to Block: 
 
Endpoint Pattern 
Safe to Block? 
Risk of False 
Positive 
Notes 
*youtubei*/browse*
browseId=FEshorts
* 
YES 
LOW 
Exclusively serves 
the infinite-scroll 
Shorts feed. Safe 
for network-level 
blocking via DNR.1 
*youtubei*/v1/next* 
NO 
HIGH 
Serves all video 
recommendations. 
Cannot be blocked. 
Payload must be 
intercepted and 
sanitized of 
shortsLockupView
Model objects.9 
*youtubei*/v1/searc
h* 
NO 
HIGH 
Global search 
endpoint serving 
both standard 
videos and Shorts. 
The JSON response 
must be filtered 
rather than the 
request blocked.21 
*youtubei*/v1/reel/r
eel_watch_sequenc
e* 
YES 
LOW 
Endpoint 
specifically 
designated for 
maintaining the 
sequence state of 
watched reels and 
shorts. 
DOM Selectors to Hide: 
 
Selector 
Location 
Confidence 
Notes 
ytd-reel-shelf-rend
Homepage / Search 
HIGH 
The legacy and 
erer 
primary horizontal 
shelf container for 
Shorts.10 
ytd-rich-section-re
nderer.yte-hide-sho
rts 
Homepage 
HIGH 
Modern rich grid 
section 
implementation 
containing Shorts 
carousels.12 
a.yt-simple-endpoi
nt 
Sidebar Guide 
HIGH 
Sidebar navigation 
button targeting 
the title attribute.13 
ytd-browse[page-s
ubtype="channels"][
role="tab"]:nth-of-t
ype(3):has-text(Sho
rts) 
Channel Page 
MEDIUM 
Legacy selector. 
Tab position is 
highly variable 
based on creator 
settings; utilizing 
the :has-text 
pseudo-class 
provides stability.11 
yt-tab-group-shap
e yt-tab-shape 
Channel Page 
HIGH 
Updated selector 
for the March 2026 
channel page tab UI 
overhaul.14 
`` 
Thumbnails 
HIGH 
Attribute applied 
directly to standard 
video renderers 
specifically when 
the targeted video 
is classified as a 
Short.11 
ytd-rich-item-rend
erer:has() 
Subscription Feed 
HIGH 
Removes the 
parent grid 
container entirely if 
it hosts a Shorts 
overlay, preventing 
empty gaps in the 
UI layout.11 
SPA Navigation Events: 
 
Event/Method 
Description 
yt-navigate-finish 
Dispatched upon completion of YouTube's 
internal SPA routing. The optimal hook for 
re-applying DOM hiding logic.15 
yt-page-data-updated 
Dispatched when the underlying data 
context refreshes, such as during infinite 
scroll pagination or dynamic state 
alterations.17 
yt-navigate-start 
Fires before the virtual DOM begins 
rendering. Optimal hook for intercepting 
navigation intents to /shorts/ and executing 
immediate redirects to /watch?v=.8 
Open Questions / Uncertainties: The primary uncertainty regarding YouTube lies in the 
parameter pp=sAQA, which has been observed appended to various URLs across index-style 
pages. This parameter alters behavioral tracking and state management, and its specific 
interaction with the Shorts recommendation algorithm remains partially obscured.22 
Furthermore, if DOM manipulation causes layout reflow degradation (jank), developers may 
need to pursue the significantly more complex route of intercepting and modifying the 
window.ytInitialData JSON blob before the Polymer framework mounts. 
Platform 2: Instagram Reels 
Meta’s web infrastructure for Instagram operates as a highly optimized React Single Page 
Application utilizing a Relay-based GraphQL client.23 Unlike legacy REST architectures where 
endpoints clearly define the requested resource (e.g., /api/users or /api/posts), Instagram 
consolidates data fetching through a centralized /graphql/query/ endpoint.25 To differentiate 
between a request for user profile data, a standard static feed post, or an algorithmic Reel, the 
platform relies heavily on the concept of Persisted Queries. 
Persisted queries function by passing a specific doc_id (document identifier) or query_hash 
from the client, which is mapped on Meta's backend servers to a massive, predefined GraphQL 
query structure.23 This architectural choice drastically reduces network overhead by requiring 
the client to only send the identifier and a lightweight JSON string of variables, such as a post 
shortcode. In a significant infrastructure shift observed between late 2024 and early 2026, 
Meta aggressively deprecated the older query_hash format in favor of the Relay doc_id 
system.28 
Isolating Instagram Reels at the network layer requires precise parsing of the POST body of 
these GraphQL requests to identify the specific doc_id values associated with the 
xdt_shortcode_media GraphQL extraction, which is utilized for serving video and Reel 
content.23 Document ID 8845758582119845 is highly correlated with extracting direct 
shortcode media URLs for Reels, while 17867389474812335 is another known identifier for Reel 
content fetching.23 However, blocking GraphQL requests entails severe risks. For instance, 
doc_id=7950326061742207 fetches timeline media that mixes static posts and Reels. Blocking 
this request outright would break the standard chronological timeline.25 
On the DOM presentation layer, Instagram employs rigorous CSS modules that hash class 
names on every build compilation (e.g., generating strings like .x1i10hfl). This renders traditional 
class-based CSS selectors entirely obsolete for extension developers, as a selector working 
today will break upon the next platform deployment.32 Consequently, the only robust and 
sustainable method for identifying Reels components within the DOM is through W3C 
Accessibility (ARIA) attributes and semantic HTML elements natively required for screen 
readers. Meta is functionally obligated to maintain accurate accessibility labels. 
Therefore, targeting aria-label="Reels" on SVG icons or intercepting specific internal testing 
identifiers like [data-testid="reels-tab"] provides a stable anchor for DOM manipulation.33 
Because Instagram's React router does not reliably emit window events during client-side 
navigation, an aggressive MutationObserver targeting document.body is required to monitor 
for DOM insertions, combined with intercepting the History.pushState API to block 
programmatic navigation to the /reels/ URL path.34 
Instagram Reels 
URL Patterns to Block: 
 
Pattern 
Type 
Confidence 
Notes 
*instagram.com/ree
ls/* 
main_frame, 
xmlhttprequest 
HIGH 
The dedicated 
algorithmic Reels 
discovery tab.34 
*instagram.com/ree
l/* 
main_frame 
HIGH 
Routing for an 
individual Reel 
URL.36 
*instagram.com/api
/v1/clips/* 
xmlhttprequest 
HIGH 
Legacy REST 
fallback endpoint 
for clips and reels 
data encompassing 
user-specific and 
trending content.37 
*instagram.com/ree
ls/audio/* 
main_frame 
HIGH 
Feed aggregation 
of Reels utilizing a 
specific audio track. 
API Endpoints to Block: 
 
Endpoint Pattern 
Safe to Block? 
Risk of False 
Positive 
Notes 
*graphql/query/* 
with POST body 
doc_id=884575858
2119845 
YES 
LOW 
Specifically fetches 
the 
xdt_shortcode_me
dia object mapping 
to video/reel URLs. 
Highly specific to 
Reels delivery.23 
*graphql/query/* 
with POST body 
doc_id=1786738947
4812335 
YES 
LOW 
Established 
document ID 
explicitly tied to 
standalone Reel 
content fetching.30 
*graphql/query/* 
with POST body 
doc_id=795032606
1742207 
NO 
HIGH 
Often fetches 
mixed timeline 
media. Blocking this 
doc_id could 
inadvertently break 
the rendering of 
standard photo 
timelines.25 
*graphql/query/* 
with variables 
NO 
MEDIUM 
A complex query 
fetching 
containing 
latest_besties_reel_
media 
relationship graph 
info alongside reels 
data; blocking may 
affect friend list 
functionality.25 
DOM Selectors to Hide: 
 
Selector 
Location 
Confidence 
Notes 
a[href^="/reels/"] 
Bottom/Side Nav 
HIGH 
The core anchor 
link facilitating 
navigation to the 
Reels tab.34 
svg 
Navigation 
HIGH 
The scalable vector 
graphic icon. Highly 
stable due to strict 
ARIA standard 
enforcement.33 
[data-testid="reels-
tab"] 
Navigation 
HIGH 
Specific testing 
attribute utilized by 
Meta engineers for 
automated QA, 
providing a stable 
target.34 
div[role="menuitem
"]:has(a[href^="/reel
s/"]) 
Sidebar Nav 
HIGH 
Hides the entire 
menu container 
leveraging the :has 
pseudo-class to 
prevent visual 
layout gaps.34 
article:has(a[href*="
/reel/"]) 
Main Feed 
MEDIUM 
Hides individual 
algorithmic reels 
dynamically 
injected into the 
primary scrolling 
timeline. 
SPA Navigation Events: 
 
Event/Method 
Description 
MutationObserver on document.body 
Instagram's React implementation 
bypasses standard DOM events. A highly 
optimized MutationObserver actively 
looking for specific DOM insertions is 
mandatory for timely hiding.34 
History.pushState interception 
Hooking into the browser's History API 
allows the extension environment to detect 
intent to navigate to the Reels tab and 
immediately force a redirect back to the 
home feed.34 
Open Questions / Uncertainties: The primary risk factor with Instagram is the extreme 
volatility of Document IDs. The doc_id values update frequently—often every two to four weeks 
during Meta's continuous integration release cycles.27 Maintaining a static, hardcoded list of 
doc_id values directly within the extension's background script will result in the blocker 
breaking silently. This necessitates an architecture where the extension polls a dynamic remote 
configuration file to fetch the latest IDs, bypassing the prolonged review delays inherent to 
browser extension stores. Furthermore, Meta is actively experimenting with merging standard 
video and reel objects entirely on the backend architecture.38 If standard videos are delivered 
with media_type=REELS, differentiating them from algorithmic short-form content at the 
GraphQL layer may become impossible. 
Platform 3: TikTok 
Unlike legacy social platforms that bolted short-form video onto existing text or image-based 
architectures, TikTok is structurally homogenous. It exists entirely to serve short-form 
algorithmic video. Consequently, surgical extraction of specific features is unnecessary; the 
objective shifts from DOM manipulation to domain-level network annihilation. 
However, effectively blocking TikTok across a network or via a browser extension is remarkably 
complex due to Bytedance's expansive Content Delivery Network (CDN) infrastructure, 
regional domain partitioning, and highly aggressive network evasion tactics employed by both 
the mobile applications and desktop web clients. A rudimentary block of tiktok.com will 
successfully prevent direct web access via the browser address bar, but embedded players, 
telemetry scripts, and background video pre-fetching modules utilize a massive, rotating matrix 
of alternative domains.39 
Furthermore, TikTok is documented to utilize DNS over HTTPS (DoH) and DNS over TLS (DoT) 
protocols. These protocols deliberately bypass traditional local DNS filtering mechanisms by 
tunneling name resolution requests directly to public resolvers (such as 8.8.8.8 or 1.1.1.1) over 
encrypted port 443 connections.40 While mitigating encrypted DNS is primarily a concern for 
hardware firewall and router-level blocking, browser extensions must still account for the sheer 
volume of CDN domains to ensure that embedded videos served via cross-origin iframes on 
third-party websites (such as news articles, blogs, or forums) do not render or track the user. 
Bytedance distributes video assets globally through localized domains like bytecdn.cn and 
byteoversea.com, while also heavily leveraging shared enterprise CDNs like Akamai and 
Fastly.42 When blocking shared CDN domains (e.g., p16-tiktokcdn-com.akamaized.net), strict 
string matching must be enforced to avoid inadvertently breaking benign third-party websites 
that also utilize Akamai infrastructure. 
TikTok 
URL Patterns to Block: 
 
Pattern 
Type 
Confidence 
Notes 
*tiktok.com* 
all 
HIGH 
The primary web 
application and 
centralized routing 
domain.42 
*tiktokcdn.com* 
media, sub_frame 
HIGH 
The primary 
dedicated CDN for 
delivering raw video 
assets and 
algorithmic 
thumbnails.39 
*tiktokv.com* 
all 
HIGH 
Alternative core API 
and routing domain 
frequently utilized 
by the mobile web 
client.42 
*byteoversea.com* 
all 
HIGH 
Bytedance global 
infrastructure and 
telemetry domain.42 
*ibytedtos.com* 
all 
HIGH 
Bytedance internal 
data transfer and 
analytics domain.42 
*.akamaized.net 
(with TikTok prefix) 
media 
MEDIUM 
Shared CDN space; 
the regex must 
strictly match 
TikTok-specific 
prefixes (e.g., 
p16-tiktokcdn-com) 
to avoid 
catastrophic false 
positives on other 
sites.42 
*musical.ly* 
all 
HIGH 
Legacy architecture 
domains still utilized 
for routing, 
telemetry, and 
backward 
compatibility for 
older embeds.42 
*bytecdn.cn* 
all 
HIGH 
Chinese-based 
internal CDN 
infrastructure 
utilized for asset 
delivery.42 
API Endpoints to Block: Given that the entire domain matrix is targeted for absolute blocking, 
granular API endpoint blocking is functionally redundant. However, for organizations applying 
network-level regex filtering, explicit attention should be directed to the 
api16-core-*.tiktokv.com and api19-core-*.tiktokv.com patterns, which facilitate core 
algorithmic feed delivery.44 
DOM Selectors to Hide: 
Because the intervention strategy relies on absolute domain resolution failure, no DOM 
manipulation is required on TikTok's proprietary properties. For third-party platforms hosting 
embedded content, utilizing a CSS injection to hide iframe[src*="tiktok.com/embed"] effectively 
collapses the rendering space of the blocked iframe. 
SPA Navigation Events: 
Not applicable, as the application state will fail to initialize. 
Open Questions / Uncertainties: The primary complication with Bytedance's architecture is 
the extreme volatility of their CDN subdomain generation. New subdomains, such as 
sf19-ads-format-sign.tiktokcdn.com, are instantiated rapidly to bypass localized blocks.45 A 
wildcard DNS block (*.tiktokcdn.com) is critical for coverage, but continuously tracking the 
evolution of edge-case domains on shared CDNs like Akamai and Fastly remains a relentless 
moving target.41 
Platform 4: Snapchat Spotlight 
Historically confined to the mobile application ecosystem, Snapchat’s web presence has 
expanded significantly, bringing its short-form algorithmic feature, "Spotlight," to desktop and 
mobile web browsers. The web architecture utilizes standard React application patterns 
combined with an expansive, unified internal API routed through businessapi.snapchat.com, 
which handles both public creator profile metrics and raw content delivery.46 
Spotlights are permanently retained, vertical video Snaps specifically intended for algorithmic 
viral discovery, rendering them functionally distinct from the ephemeral, chronologically driven 
Stories format.47 The routing logic for this content is highly localized to the /spotlight path 
structure. Because Snapchat's web client relies on complex, auto-generated class names 
created during the Webpack compilation process (resulting in classes like 
ModelSearch__spotlight#jJ), DOM targeting via CSS classes is highly unstable.48 The 
intervention strategy must therefore rely heavily on stable attribute targeting, specifically 
focusing on href link attributes, aria-labels for accessibility, and data-testid attributes 
purposefully left in the DOM by developers for integration testing.48 
Snapchat Spotlight 
URL Patterns to Block: 
 
Pattern 
Type 
Confidence 
Notes 
*snapchat.com/spo
tlight* 
main_frame, 
sub_frame 
HIGH 
Direct routing 
navigation to the 
Spotlight web user 
interface. 
*snapchat.com/em
bed/spotlight/* 
sub_frame 
HIGH 
Official embed URL 
paths for rendering 
Spotlight videos 
within iframes on 
third-party 
domains.49 
API Endpoints to Block: 
 
Endpoint Pattern 
Safe to Block? 
Risk of False 
Positive 
Notes 
*businessapi.snapc
hat.com/v1/public_p
rofiles/*/spotlights* 
YES 
LOW 
The primary 
backend endpoint 
responsible for 
fetching Spotlight 
array content and 
associated 
engagement 
metrics.46 
DOM Selectors to Hide: 
 
Selector 
Location 
Confidence 
Notes 
a[href^="/spotlight"] 
Global Nav 
HIGH 
Direct HTML anchor 
tags facilitating 
navigation into the 
Spotlight view 
environment. 
[data-testid="spotli
ght-tab"] 
Web App 
HIGH 
High-confidence 
QA hook utilized for 
rendering the 
Spotlight navigation 
element across 
viewports. 
div[class*="spotligh
t"] 
Main UI 
MEDIUM 
While exact classes 
are hashed, the 
substring "spotlight" 
is frequently 
maintained within 
the hash generation 
(e.g., 
ModelSearch__spot
light) allowing for 
partial attribute 
matching.48 
SPA Navigation Events: 
Event/Method 
Description 
History.pushState 
Analogous to Instagram, Snapchat relies 
heavily on React Router for view management. 
Hooking the History API is necessary to 
intercept and block client-side virtual 
navigation into the /spotlight view context. 
Open Questions / Uncertainties: 
Snapchat’s underlying CDN infrastructure for video delivery is highly obfuscated and 
dynamically generated. Attempting to block the underlying media storage URLs (such as those 
hosted on cf-st.sc-cdn.net) presents an incredibly high risk of inadvertently breaking private, 
direct-message Snaps and standard Stories. Therefore, the extension's intervention must 
remain strictly confined to the UI rendering and API routing layers, rather than targeting the raw 
media CDNs. 
Platform 5: Facebook Reels 
Facebook shares a unified backend infrastructure with Instagram, specifically relying on Meta's 
Relay GraphQL clients and the "Comet" React architecture for frontend rendering. In 2025, 
Meta instituted a monumental architectural shift, formally announcing that all video content 
uploaded to the Facebook platform is now categorically classified and delivered as Reels. This 
effectively obliterates the historical technical distinction between standard long-form video 
posts and algorithmic, short-form discovery content.50 
This backend unification presents a catastrophic challenge for surgical content blocking. 
Because every video object is now technically instantiated as a Reel (media_type=REELS), 
blocking the Graph API endpoints or the specific GraphQL doc_id associated with Reels will 
result in the total disruption of all video playback functionality across the entire platform, 
including user-to-user video sharing.38 Consequently, network-layer intervention is rendered 
completely unviable. 
The extension logic must pivot entirely to spatial DOM recognition. The objective becomes 
identifying and hiding the specific "Reels and short videos" horizontal carousels and vertical 
shelves that are aggressively injected into the main algorithmic news feed. Because Facebook’s 
DOM compilation process generates unique, non-semantic, one-to-two letter CSS classes for 
every element, scraping and ad-blocking communities have entirely abandoned class 
targeting. Instead, developers rely on the strict enforcement of W3C Accessibility (ARIA) 
standards.52 Facebook is legally required to maintain accurate aria-label and role attributes to 
ensure compliance with screen readers for visually impaired users. These accessibility labels 
inadvertently provide extension developers with a permanent, semantically accurate map of 
the otherwise heavily obfuscated DOM tree.32 
Facebook Reels 
URL Patterns to Block: 
Pattern 
Type 
Confidence 
Notes 
*facebook.com/reel/* 
main_frame, 
sub_frame 
HIGH 
The direct viewer 
routing path for 
individual Facebook 
Reels. 
*facebook.com/reels/
* 
main_frame 
HIGH 
The primary 
algorithmic Reels 
discovery and 
infinite-scroll feed. 
API Endpoints to Block: 
 
Endpoint Pattern 
Safe to Block? 
Risk of False 
Positive 
Notes 
*graphql/query* 
NO 
HIGH 
Because Meta 
(Reel specific 
doc_id) 
unified the video 
architecture, 
blocking the data 
fetch for Reels will 
fundamentally 
break all video 
functionality across 
Facebook.51 
*graph.facebook.co
m/*/media* with 
media_type=REELS 
NO 
HIGH 
Utilized extensively 
by the official API. 
Exceedingly high 
risk for broad 
network blocking 
due to the unified 
video 
infrastructure.38 
DOM Selectors to Hide: 
 
Selector 
Location 
Confidence 
Notes 
div 
Global Nav/Feed 
HIGH 
Targets the explicit, 
legally mandated 
ARIA label assigned 
to the Reels tab and 
surrounding feed 
modules.55 
div[role="region"] 
Main Feed 
HIGH 
Accurately targets 
the scrollable 
parent shelf 
container injected 
into the user 
timeline.53 
a[href*="/reel/"] 
General 
HIGH 
Any hyperlink 
actively routing to 
the reel view 
context. 
div:nth-of-type(8):h
as-text(Reels and 
short videos) 
Main Feed 
LOW 
A highly brittle 
structural selector. 
It is heavily reliant 
on the exact 
positioning of 
elements within the 
feed array, but is 
documented 
historically as a 
fallback 
mechanism.56 
[src*="/reel/"] 
Third-party 
MEDIUM 
Specifically targets 
embedded 
Facebook reels 
rendered on 
external websites 
via the social plugin 
iframe.57 
SPA Navigation Events: 
 
Event/Method 
Description 
MutationObserver 
Facebook’s endless scroll architecture 
heavily and continuously modifies the DOM 
structure. The observer must watch for 
new `` injections and execute hiding 
protocols immediately to prevent UI 
"flickering".55 
Open Questions / Uncertainties: A severe technical complication arises when interacting with 
Facebook's React state manager. When an extension attempts to block a Reel by physically 
removing the node from the DOM, the state manager detects the discrepancy between the 
virtual DOM and the actual DOM, and aggressively attempts to re-inject the missing element. 
This causes a rapid loop resulting in severe visual UI flickering that degrades the user 
experience.55 The extension must circumvent this by applying display: none!important via 
injected CSS stylesheets, thereby hiding the element visually while allowing React to believe the 
node still successfully exists within the document tree. 
Architectural Synthesis and Strategic Outlook 
As of March 2026, the architectural landscape of major social media platforms has evolved into 
an environment explicitly hostile to client-side modification and data extraction. The continuous 
escalation between platform infrastructure engineers and browser extension developers has 
rendered historical ad-blocking and content-filtering techniques—such as matching static CSS 
class strings or blocking broad REST API endpoints—entirely obsolete. 
The comprehensive mapping of these five platforms indicates a clear strategic pivot that is 
absolutely necessary for the successful and sustainable blocking of short-form algorithmic 
content: 
1.​ Absolute Reliance on Accessibility Signatures: The transition to atomic CSS generation 
via frameworks like React, Polymer, and Comet has intentionally obfuscated the visual 
structure of the web. However, rigorous legal requirements for web accessibility (such as 
the ADA and EAA) force platforms to embed highly stable, semantic metadata via 
aria-label, aria-controls, and role attributes. These accessibility standards are currently the 
primary, un-obfuscatable lifelines for surgical DOM intervention, providing a reliable 
anchor point that platform engineers cannot easily randomize without breaking screen 
reader compatibility.52 
2.​ GraphQL Persisted Queries and ID Volatility: The industry-wide shift away from 
semantic REST APIs to GraphQL Relay clients utilizing doc_id systems means that network 
requests no longer contain human-readable routing parameters. Maintaining a 
network-layer blocker requires constant, automated monitoring of platform traffic to map 
new, randomized numeric IDs to specific content types (e.g., Instagram Reels) as they 
cycle frequently during standard release cycles.27 
3.​ Mandatory SPA Event Hooking: Standard window.onload or DOMContentLoaded 
execution is entirely insufficient for modern web applications. Extensions must 
aggressively intercept History API state pushes or hook into proprietary, platform-specific 
router events (such as YouTube's yt-navigate-finish) to re-evaluate the DOM state upon 
every client-side virtual navigation.16 
4.​ The Convergence of Video Formats: Meta's decision to classify all video content on 
Facebook strictly as Reels signals a broader industry trend toward unifying traditional and 
short-form video architectures.50 As backend data models merge to streamline content 
delivery, network-layer blocking will become increasingly dangerous due to the high 
probability of catastrophic false positives. This evolution is forcing content blockers to rely 
almost exclusively on spatial, contextual DOM hiding rather than preventing the initial data 
payload delivery. 
To maintain operational efficacy in this environment, a browser extension's architecture must 
strictly decouple its rule execution engine from its static environment. Utilizing dynamic, 
over-the-air payload updates for fetching the latest GraphQL doc_id lists and ARIA selectors 
will be required, ensuring the tool can adapt to platform infrastructure shifts rapidly without 
being throttled by prolonged browser extension store review cycles. 
Works cited 
1.​ yourTube/yourTube/KBYourTube.m at master · lechium/yourTube - GitHub, 
accessed March 9, 2026, 
https://github.com/lechium/yourTube/blob/master/yourTube/KBYourTube.m 
2.​ Search YouTube for video IDs, using YouTube Internal API (youtubei)? - Stack 
Overflow, accessed March 9, 2026, 
https://stackoverflow.com/questions/76613751/search-youtube-for-video-ids-usin
g-youtube-internal-api-youtubei 
3.​ Remove the shorts tab for a youtube channel - Stack Overflow, accessed March 
9, 2026, 
https://stackoverflow.com/questions/78883476/remove-the-shorts-tab-for-a-you
tube-channel 
4.​ Is it possible to upload YouTube shorts via the API? - Stack Overflow, accessed 
March 9, 2026, 
https://stackoverflow.com/questions/68537601/is-it-possible-to-upload-youtube-
shorts-via-the-api 
5.​ varshneydevansh/FilterTube: Filter YouTube videos by keywords, channels, and 
categories - GitHub, accessed March 9, 2026, 
https://github.com/varshneydevansh/FilterTube 
6.​ How to embed a YouTube short? : r/webdev - Reddit, accessed March 9, 2026, 
https://www.reddit.com/r/webdev/comments/1idsj8f/how_to_embed_a_youtube_s
hort/ 
7.​ Youtube-shorts block - Chrome Web Store, accessed March 9, 2026, 
https://chromewebstore.google.com/detail/youtube-shorts-block/jiaopdjbehhjgo
kpphdfgmapkobbnmjp 
8.​ uBlock filter list to hide all YouTube Shorts - Hacker News, accessed March 9, 
2026, https://news.ycombinator.com/item?id=47016443 
9.​ Youtube S | PDF - Scribd, accessed March 9, 2026, 
https://www.scribd.com/document/852140899/youtube-s 
10.​Show HN: I built an app to block Shorts and Reels | Hacker News, accessed March 
9, 2026, https://news.ycombinator.com/item?id=44923520 
11.​Youtube tweaks with uBO & Adguard and Scripts - Vivaldi Forum, accessed March 
9, 2026, 
https://forum.vivaldi.net/topic/91210/youtube-tweaks-with-ubo-adguard-and-scri
pts 
12.​uBlock Origin Custom filters | Ad block | Adblock list | Pure Youtube experience - 
GitHub Gist, accessed March 9, 2026, 
https://gist.github.com/aggarwalsushant/9461f3b09d6a08c9f03f74071a066996?p
ermalink_comment_id=5852771 
13.​YouTube Will Help You Quit Watching Shorts - Slashdot, accessed March 9, 2026, 
https://news.slashdot.org/story/25/10/22/192225/youtube-will-help-you-quit-watc
hing-shorts 
14.​Filters for uBlock Origin I use to block annoying elements on YouTube · GitHub, 
accessed March 9, 2026, 
https://gist.github.com/tadwohlrapp/722bbe97cb20bb34da8df73675415cae?per
malink_comment_id=5743242 
15.​YouTube ＰＯＰ—ＵＰSKIP（Ready to shop?）ＡＬＬADS - зыходны код - Greasy Fork, 
accessed March 9, 2026, 
https://greasyfork.org/be/scripts/560984-youtube-%EF%BD%90%EF%BD%8F%E
F%BD%90-%EF%BD%95%EF%BD%90skip-ready-to-shop-%EF%BD%81%EF%BD
%8C%EF%BD%8Cads/code 
16.​Redirect YouTube Shorts to Watch - Greasy Fork, accessed March 9, 2026, 
https://greasyfork.org/de/scripts/468363-redirect-youtube-shorts-to-watch 
17.​JavaScript to listen for URL changes in YouTube HTML5 Player - Stack Overflow, 
accessed March 9, 2026, 
https://stackoverflow.com/questions/24297929/javascript-to-listen-for-url-chang
es-in-youtube-html5-player 
18.​7ktTube 3.5.2 -> 3.5.3 - Diffchecker, accessed March 9, 2026, 
https://www.diffchecker.com/YpR7E2n8/ 
19.​Regex for youtube URL - Stack Overflow, accessed March 9, 2026, 
https://stackoverflow.com/questions/19377262/regex-for-youtube-url 
20.​Obsidian YouTube Link not working - Bug graveyard, accessed March 9, 2026, 
https://forum.obsidian.md/t/obsidian-youtube-link-not-working/60907 
21.​How to Scrape YouTube Search Results: Complete Guide - Decodo, accessed 
March 9, 2026, https://decodo.com/blog/how-to-scrape-youtube-search-results 
22.​Ask HN: Why is YouTube adding “&pp=sAQA” to video URLs? | Hacker News, 
accessed March 9, 2026, https://news.ycombinator.com/item?id=28005638 
23.​Instagram reels fail to download · Issue #11151 · yt-dlp/yt-dlp - GitHub, accessed 
March 9, 2026, https://github.com/yt-dlp/yt-dlp/issues/11151 
24.​How to get data from a public Instagram profile | by Carlos Henrique Reis - 
Medium, accessed March 9, 2026, 
https://carloshenriquereis-17318.medium.com/how-to-get-data-from-a-public-in
stagram-profile-edc6704c9b45 
25.​401 "Please wait a few minutes" back for all get_posts() requests, anyone else also 
struggling? · Issue #2501 - GitHub, accessed March 9, 2026, 
https://github.com/instaloader/instaloader/issues/2501 
26.​How to Scrape Instagram in 2025: A Complete Guide - Live Proxies, accessed 
March 9, 2026, https://liveproxies.io/blog/instagram-scraping 
27.​How to Scrape Instagram in 2026: Complete Guide | DataDwip Blog, accessed 
March 9, 2026, https://datadwip.com/blog/how-to-scrape-instagram 
28.​400 Bad Request · Issue #2384 - GitHub, accessed March 9, 2026, 
https://github.com/instaloader/instaloader/issues/2384 
29.​[Instagram] AttributeError - 'InstagramGraphqlAPI' object has no attribute 'item' · 
Issue #5920 · mikf/gallery-dl - GitHub, accessed March 9, 2026, 
https://github.com/mikf/gallery-dl/issues/5920 
30.​Cannot download posts by shortcode · Issue #2389 - GitHub, accessed March 9, 
2026, https://github.com/instaloader/instaloader/issues/2389 
31.​Is it possible to get JSON data of a public instagram video without requiring API 
access tokens? - Stack Overflow, accessed March 9, 2026, 
https://stackoverflow.com/questions/77816541/is-it-possible-to-get-json-data-of
-a-public-instagram-video-without-requiring-ap 
32.​HELP: Facebook Marketplace ever-changing CSS class names - Community 
Forum - Distill, accessed March 9, 2026, 
https://forums.distill.io/t/help-facebook-marketplace-ever-changing-css-class-n
ames/1683 
33.​Instagram 2014 - Source code - Greasy Fork, accessed March 9, 2026, 
https://greasyfork.org/en/scripts/446358-instagram-2014/code 
34.​Instagram anti-doomscroll tampermonkey script (Claude vibes) - GitHub Gist, 
accessed March 9, 2026, 
https://gist.github.com/nikspyratos/3c5b82d24e835d63419700d26db0e696 
35.​flurrux/insta-loader: chrome extension for downloading media from instagram - 
GitHub, accessed March 9, 2026, https://github.com/flurrux/insta-loader 
36.​Instagram Graph API - reels available but what is the format? - Stack Overflow, 
accessed March 9, 2026, 
https://stackoverflow.com/questions/72871367/instagram-graph-api-reels-availab
le-but-what-is-the-format 
37.​Blog - M7 (millermedia7), accessed March 9, 2026, 
https://millermedia7.com/blog-digital-collective-for-a-new-future/ 
38.​Instagram Graph API: "Media created with media_type=VIDEO is a carousel item" 
error even when using media_type=REELS - Stack Overflow, accessed March 9, 
2026, 
https://stackoverflow.com/questions/79897074/instagram-graph-api-media-creat
ed-with-media-type-video-is-a-carousel-item-er 
39.​Blocking all TikTok domains using FlashStart, accessed March 9, 2026, 
https://flashstart.com/blocking-all-tiktok-domains-using-flashstart/ 
40.​M4jx/TikTokBlockList: A comprehensive list of TikTok IP addresses, domains and 
ASNs, designed to block the TikTok application on the network. - GitHub, 
accessed March 9, 2026, https://github.com/M4jx/TikTokBlockList 
41.​How can i block every domain with Bytedance in name using regex/wildcard? - 
Reddit, accessed March 9, 2026, 
https://www.reddit.com/r/pihole/comments/ypuydk/how_can_i_block_every_dom
ain_with_bytedance_in/ 
42.​TikTok Domains - gists · GitHub, accessed March 9, 2026, 
https://gist.github.com/Cr4zyFl1x/2527be1a809a317f10e94040aec2ec2a 
43.​Tiktok app block - Cisco Community, accessed March 9, 2026, 
https://community.cisco.com/t5/opendns/tiktok-app-block/td-p/5173350 
44.​How to block the TikTok app on the router? - pcWRT, accessed March 9, 2026, 
https://portal.pcwrt.com/blog/2020/08/26/how-to-block-the-tiktok-app-on-the-
router/ 
45.​sf19-ads-format-sign.tiktokcdn.com · Issue #9285 · hagezi/dns-blocklists - 
GitHub, accessed March 9, 2026, 
https://github.com/hagezi/dns-blocklists/issues/9285 
46.​Metrics - Snap for Developers, accessed March 9, 2026, 
https://developers.snap.com/api/marketing-api/Public-Profile-API/Metrics 
47.​Public Profile API - Snap for Developers, accessed March 9, 2026, 
https://developers.snap.com/api/marketing-api/Public-Profile-API/Introduction 
48.​Dom Tree | Dashboard | CheckPhish Platform, accessed March 9, 2026, 
https://checkphish.bolster.ai/dom/1757997307983/8168f085a6a31864f2df663fabc
ef224df06869f4a9b359f6fa62dba8a192fb6 
49.​How to Embed Snapchat for Web Content - Snap for Developers, accessed 
March 9, 2026, 
https://developers.snap.com/api/snapchat-for-web/social-plugins/embedding-we
b-content 
50.​Facebook Reels in 2026: Definitive Guide for Marketers - QuickFrame, accessed 
March 9, 2026, 
https://quickframe.mountain.com/blog/facebook-reels-guide-for-marketers/ 
51.​Facebook Reels Size & Dimensions Guide (Updated 2026) - PostFast, accessed 
March 9, 2026, https://postfa.st/sizes/facebook/reels 
52.​Labeling an Element using aria-label - DigitalA11Y, accessed March 9, 2026, 
https://www.digitala11y.com/academy/labeling-an-element-using-aria-label/ 
53.​ARIA: feed role - MDN - Mozilla, accessed March 9, 2026, 
https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles
/feed_role 
54.​How to Make Facebook Updates Timeline Single Column and A, accessed March 
9, 2026, 
https://lifetips.alibaba.com/tech-efficiency/facebook-updates-timeline-makes-it-
single-column-and-a 
55.​Blocking facebook reels and suggested contents : r/uBlockOrigin - Reddit, 
accessed March 9, 2026, 
https://www.reddit.com/r/uBlockOrigin/comments/1ao5fpd/blocking_facebook_re
els_and_suggested_contents/ 
56.​My uBlock Origin filters to remove distractions - Hacker News, accessed March 9, 
2026, https://news.ycombinator.com/item?id=37584134 
57.​Wow, I Didn't Realize That My Vagina Had A Shelf Life Until Now...? - Upworthy, 
accessed March 9, 2026, 
https://www.upworthy.com/wow-i-didnt-realize-that-my-vagina-had-a-shelf-life
-until-now-5/ 
58.​safwat-fathi/facebook-reels-blocker - GitHub, accessed March 9, 2026, 
https://github.com/safwat-fathi/facebook-reels-blocker 
