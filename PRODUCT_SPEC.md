**FOCUS**

*Block the Scroll. Keep the Content.*

**PRODUCT TECHNICAL SPECIFICATION**

Version 1.0 · March 2026

Prepared by Perry & Walker

**1. Executive Summary**

Short-form content platforms --- Instagram Reels, YouTube Shorts,
TikTok, Snapchat Spotlight --- are deliberately engineered to be
addictive. The average user loses 30--60 unplanned minutes per day to
these feeds. Existing solutions (Freedom, Cold Turkey, One Sec) are
blunt instruments: they block entire apps, which forces users to choose
between productivity and legitimate use. Nobody has solved the surgical
problem.

FOCUS is a surgical content blocker. It allows users to watch a full
YouTube video, scroll the Instagram photo feed, and message friends on
Snapchat --- while making Reels, Shorts, and Spotlight completely
inaccessible. The long-form content you value stays. The doom-scroll
loop is severed.

+-----------------------------------------------------------------------+
| **Core Value Proposition**                                            |
|                                                                       |
| ✓ Watch YouTube videos --- YouTube Shorts blocked                     |
|                                                                       |
| ✓ Scroll Instagram photos --- Reels tab blocked                       |
|                                                                       |
| ✓ Use Snapchat stories --- Spotlight blocked                          |
|                                                                       |
| ✓ No data ever leaves the device --- local VPN only                   |
|                                                                       |
| ✓ No login required --- works out of the box                          |
+-----------------------------------------------------------------------+

  -------------------------- --------------------------------------------
  **Category**               **Detail**

  Product Name               FOCUS (working title)

  Target User                Adults seeking self-directed digital
                             wellness

  Primary Platform           Android (Phase 1), iOS (Phase 2)

  Quick Win                  Browser Extension --- ships first, zero
                             gatekeepers

  Business Model             Free core + optional Pro subscription
                             (\$2.99/mo)

  Tech Stack                 React Native + Native VPN Module (Android),
                             Swift (iOS)

  Differentiator             Surgical blocking --- no competitor does
                             this today
  -------------------------- --------------------------------------------

**2. Market Landscape**

**2.1 The Problem**

Short-form video platforms have invested billions in recommendation
algorithms optimized for time-on-app at the expense of user wellbeing.
The platforms know this: Instagram\'s own internal research (leaked in
2021) acknowledged that Reels worsened body image issues and attention
spans for a significant portion of users.

The core paradox: users want Instagram for photos and messaging but not
Reels. They want YouTube for documentaries and tutorials but not Shorts.
There is no native solution. Platform settings do not offer this level
of control.

**2.2 Competitive Analysis**

  ----------------------- ----------------------- -----------------------
  **App**                 **Approach**            **Gap**

  Freedom                 Blocks entire           Can\'t use any of
                          apps/sites              Instagram

  Cold Turkey             Full app/site blocking  All-or-nothing only

  One Sec                 Friction delay before   Doesn\'t actually block
                          opening app             content

  Screen Time (iOS)       App usage limits        Kills entire app, not
                                                  sub-features

  DigitalWellbeing        App timers              Same --- full app only
  (Android)                                       

  FOCUS (ours)            Surgical sub-feature    The gap nobody fills
                          blocking                
  ----------------------- ----------------------- -----------------------

**2.3 Market Size**

- \~4 billion social media users worldwide

- Studies show 60%+ of users report wanting to reduce short-form video
  consumption

- Digital wellness app market projected at \$10B+ by 2027

- Freemium conversion rate for productivity apps typically 3--8%

+-----------------------------------------------------------------------+
| **Strategic Insight**                                                 |
|                                                                       |
| There is no direct competitor doing surgical blocking today. This is  |
| a genuine first-mover opportunity.                                    |
|                                                                       |
| The browser extension MVP can validate the concept with zero App      |
| Store friction and reach iOS users via Safari immediately.            |
+-----------------------------------------------------------------------+

**3. Technical Architecture**

**3.1 The Core Problem: Apps Inside Apps**

The fundamental challenge is that short-form content doesn\'t live at a
separate URL or app --- it lives inside the same app as valuable
content. This means traditional app-level blocking fails. FOCUS must
intercept at the network traffic layer.

**3.2 Architecture: Local On-Device VPN**

The solution is a Local VPN --- a VPN tunnel that runs entirely on the
device and never routes data to an external server. All traffic passes
through FOCUS\'s local VPN service, which inspects each request against
a filter list and either allows or blocks it.

> User opens Instagram
>
> ↓
>
> Network request generated: GET instagram.com/reels/\...
>
> ↓
>
> FOCUS Local VPN intercepts request
>
> ↓
>
> Filter list check: /reels/\* → BLOCKED
>
> ↓
>
> Returns 204 No Content (silent block)
>
> ↓
>
> Instagram shows blank/empty Reels tab
>
> Meanwhile:
>
> GET instagram.com/feed/\* → ALLOWED (passes through)
>
> GET instagram.com/direct/\* → ALLOWED (passes through)

+-----------------------------------------------------------------------+
| **Privacy Guarantee**                                                 |
|                                                                       |
| The local VPN never routes traffic to FOCUS servers. It is a loopback |
| tunnel only.                                                          |
|                                                                       |
| No user data, browsing history, or content is ever transmitted        |
| externally.                                                           |
|                                                                       |
| This is architecturally identical to how AdGuard and 1Blocker work.   |
|                                                                       |
| This is a core product marketing point --- emphasize it prominently   |
| in all UI.                                                            |
+-----------------------------------------------------------------------+

**3.3 Technology Stack by Platform**

  ----------------------- ----------------------- ------------------------
  **Component**           **Technology**          **Notes**

  Browser Ext.            Manifest V3             Chrome + Safari
                          (JS/HTML/CSS)           compatible

  Android App Shell       React Native            Shared UI across
                                                  platforms

  Android VPN Module      Kotlin Native Module    Bridges RN to Android
                                                  VpnService

  iOS App Shell           React Native (future)   Shared UI reuse

  iOS VPN Module          Swift +                 NEPacketTunnelProvider
                          NetworkExtension        

  Filter List             JSON / YAML flat file   Open-source,
                                                  community-updateable

  Local Storage           AsyncStorage / SQLite   User settings, stats

  Subscription            RevenueCat SDK          Handles IAP for
                                                  Android + iOS
  ----------------------- ----------------------- ------------------------

**4. Phase 1 --- Browser Extension**

**4.1 Overview**

The browser extension is the fastest path to a working product. It runs
in Chrome, Edge, Firefox, and Safari (via Safari Web Extension on
macOS/iOS). It validates the core blocking logic and filter list before
you invest in native mobile development.

Build time estimate: 1--2 weekends for a functional v1.

**4.2 Folder Structure**

> focus-extension/
>
> ├── manifest.json \# Extension manifest (Manifest V3)
>
> ├── background.js \# Service worker --- core blocking logic
>
> ├── popup/
>
> │ ├── popup.html \# Extension popup UI
>
> │ ├── popup.js \# Popup interaction logic
>
> │ └── popup.css \# Styles
>
> ├── filters/
>
> │ └── filter-list.json \# The blocking rules database
>
> ├── icons/
>
> │ ├── icon16.png
>
> │ ├── icon48.png
>
> │ └── icon128.png
>
> └── options/ \# (Phase 2) Settings page

**4.3 manifest.json**

> {
>
> \"manifest_version\": 3,
>
> \"name\": \"FOCUS --- Block Short-Form Content\",
>
> \"version\": \"1.0.0\",
>
> \"description\": \"Block Reels, Shorts & Spotlight. Keep everything
> else.\",
>
> \"permissions\": \[\"declarativeNetRequest\", \"storage\"\],
>
> \"host_permissions\": \[\"\*://\*.youtube.com/\*\",
> \"\*://\*.instagram.com/\*\",
>
> \"\*://\*.tiktok.com/\*\", \"\*://\*.snapchat.com/\*\"\],
>
> \"background\": { \"service_worker\": \"background.js\" },
>
> \"action\": { \"default_popup\": \"popup/popup.html\" },
>
> \"declarative_net_request\": {
>
> \"rule_resources\": \[{
>
> \"id\": \"focus_rules\",
>
> \"enabled\": true,
>
> \"path\": \"filters/filter-list.json\"
>
> }\]
>
> }
>
> }

**4.4 Filter List Schema (filter-list.json)**

The filter list uses Chrome\'s declarativeNetRequest rule format. Each
rule has an ID, condition (URL pattern), and action (block or redirect).

> \[
>
> {
>
> \"id\": 1,
>
> \"priority\": 1,
>
> \"action\": { \"type\": \"block\" },
>
> \"condition\": {
>
> \"urlFilter\": \"\*youtube.com/shorts\*\",
>
> \"resourceTypes\": \[\"main_frame\", \"sub_frame\",
> \"xmlhttprequest\"\]
>
> }
>
> },
>
> {
>
> \"id\": 2,
>
> \"priority\": 1,
>
> \"action\": { \"type\": \"block\" },
>
> \"condition\": {
>
> \"urlFilter\": \"\*instagram.com/reels\*\",
>
> \"resourceTypes\": \[\"main_frame\", \"sub_frame\",
> \"xmlhttprequest\"\]
>
> }
>
> },
>
> {
>
> \"id\": 3,
>
> \"priority\": 1,
>
> \"action\": { \"type\": \"block\" },
>
> \"condition\": {
>
> \"urlFilter\": \"\*tiktok.com\*\",
>
> \"resourceTypes\": \[\"main_frame\"\]
>
> }
>
> }
>
> \]

**4.5 background.js --- Core Logic**

> // background.js
>
> // Handles toggle on/off and dynamic rule updates
>
> chrome.runtime.onInstalled.addListener(() =\> {
>
> chrome.storage.local.set({ focusEnabled: true });
>
> });
>
> // Listen for toggle from popup
>
> chrome.runtime.onMessage.addListener((msg) =\> {
>
> if (msg.action === \'toggle\') {
>
> chrome.storage.local.get(\'focusEnabled\', (data) =\> {
>
> const newState = !data.focusEnabled;
>
> chrome.storage.local.set({ focusEnabled: newState });
>
> // Enable/disable rule set based on toggle state
>
> chrome.declarativeNetRequest.updateEnabledRulesets({
>
> enableRulesetIds: newState ? \[\'focus_rules\'\] : \[\],
>
> disableRulesetIds: newState ? \[\] : \[\'focus_rules\'\],
>
> });
>
> });
>
> }
>
> });

**4.6 Popup UI**

The popup is the user\'s primary touchpoint. It should be dead simple: a
toggle, status indicator, and blocked count. Keep it under 300px wide.

- Large, clear ON/OFF toggle

- \"Blocked today\" counter (satisfying feedback loop)

- List of active rules (YouTube Shorts, Instagram Reels, etc.)

- Individual toggles per platform (power user feature)

+-----------------------------------------------------------------------+
| **Design Principle**                                                  |
|                                                                       |
| The popup should feel like a health tracker, not a parental control   |
| app.                                                                  |
|                                                                       |
| Use positive framing: \'Focus time saved: 47 min today\' not          |
| \'Blocked 23 times\'.                                                 |
|                                                                       |
| This is self-improvement tooling for adults --- the UX should reflect |
| that.                                                                 |
+-----------------------------------------------------------------------+

**5. Phase 2 --- Android App**

**5.1 Overview**

The Android app is a React Native shell with a Kotlin native module that
wraps Android\'s VpnService API. The VPN runs locally on-device ---
there is no VPN server. React Native handles all UI; the Kotlin module
handles the low-level packet interception.

  -------------------------- --------------------------------------------
  **Attribute**              **Detail**

  Language                   React Native (UI) + Kotlin (VPN Module)

  Min Android Version        Android 8.0 (API 26) --- covers 95%+ of
                             devices

  Play Store Category        Productivity / Digital Wellbeing

  Key Permission             BIND_VPN_SERVICE (required, triggers user
                             consent dialog)

  No Permission Needed       No internet, no contacts, no location

  Build Tool                 Expo (bare workflow) or React Native CLI
  -------------------------- --------------------------------------------

**5.2 Project Structure**

> focus-android/
>
> ├── App.tsx \# Root React Native component
>
> ├── src/
>
> │ ├── screens/
>
> │ │ ├── HomeScreen.tsx \# Main dashboard
>
> │ │ ├── RulesScreen.tsx \# Platform rule toggles
>
> │ │ ├── StatsScreen.tsx \# Blocks & time saved
>
> │ │ └── SettingsScreen.tsx
>
> │ ├── components/
>
> │ │ ├── FocusToggle.tsx \# Big on/off toggle
>
> │ │ └── PlatformCard.tsx \# Per-platform rule card
>
> │ ├── store/
>
> │ │ └── focusStore.ts \# Zustand state management
>
> │ └── utils/
>
> │ └── vpnBridge.ts \# RN \<-\> Kotlin bridge
>
> ├── android/
>
> │ └── app/src/main/java/
>
> │ └── com/focus/
>
> │ ├── FocusVpnService.kt \# Core VPN service
>
> │ ├── PacketFilter.kt \# Filtering logic
>
> │ └── VpnModule.kt \# RN Native Module bridge
>
> └── filters/
>
> └── filter-list.json \# Shared with extension

**5.3 Android VPN Architecture**

Android provides the VpnService API for building local VPN tunnels.
FOCUS uses this to create a tun interface that intercepts all device
traffic without routing it externally.

> // FocusVpnService.kt (simplified)
>
> class FocusVpnService : VpnService() {
>
> private var vpnInterface: ParcelFileDescriptor? = null
>
> override fun onStartCommand(intent: Intent?, flags: Int, startId:
> Int): Int {
>
> val builder = Builder()
>
> .addAddress(\"10.0.0.2\", 32) // Loopback tunnel address
>
> .addRoute(\"0.0.0.0\", 0) // Route ALL traffic through tunnel
>
> .setSession(\"FOCUS\")
>
> .setBlocking(true)
>
> vpnInterface = builder.establish() // Tunnel is live
>
> startFiltering() // Begin packet inspection
>
> return START_STICKY
>
> }
>
> private fun startFiltering() {
>
> // Read packets from tunnel
>
> // For HTTP/S: inspect SNI hostname in TLS ClientHello
>
> // Match against filter list
>
> // Allow: write packet to network
>
> // Block: drop packet (return 204/empty)
>
> }
>
> override fun onDestroy() {
>
> vpnInterface?.close() // Tunnel closed, all traffic resumes normally
>
> }
>
> }

**5.4 React Native ↔ Kotlin Bridge**

A React Native Native Module exposes VPN controls to the JavaScript
layer. This keeps all UI in React Native while the heavy lifting stays
in Kotlin.

> // VpnModule.kt
>
> \@ReactMethod
>
> fun startVpn(promise: Promise) {
>
> val intent = VpnService.prepare(reactApplicationContext)
>
> if (intent != null) {
>
> // Need user permission --- emit event to RN to show dialog
>
> promise.resolve(\"PERMISSION_REQUIRED\")
>
> } else {
>
> startService(Intent(reactApplicationContext,
> FocusVpnService::class.java))
>
> promise.resolve(\"STARTED\")
>
> }
>
> }
>
> \@ReactMethod
>
> fun stopVpn(promise: Promise) {
>
> stopService(Intent(reactApplicationContext,
> FocusVpnService::class.java))
>
> promise.resolve(\"STOPPED\")
>
> }
>
> // vpnBridge.ts (React Native side)
>
> import { NativeModules } from \'react-native\';
>
> const { VpnModule } = NativeModules;
>
> export const startFocus = () =\> VpnModule.startVpn();
>
> export const stopFocus = () =\> VpnModule.stopVpn();

**5.5 DNS-Based Blocking (Simpler Alternative)**

For a faster initial build, DNS-level blocking is a valid starting
point. Instead of full packet inspection, FOCUS runs a local DNS server
that returns NXDOMAIN (non-existent) for blocked domains/subdomains.
This is less surgical but ships faster.

  -------------------------- --------------------------------------------
  **Approach**               **Tradeoffs**

  DNS Blocking               Faster to build. Less surgical --- blocks
                             entire subdomains, not specific API paths.
                             Good MVP.

  Packet Inspection          More surgical. Can target specific API
                             endpoints. More complex to build. Better
                             long-term.

  Recommendation             Start with DNS blocking for v1.0, migrate to
                             packet inspection for v1.5
  -------------------------- --------------------------------------------

**6. Phase 3 --- iOS App**

**6.1 Overview**

iOS uses the NetworkExtension framework, specifically
NEPacketTunnelProvider, which is the Apple-sanctioned way to build local
VPN apps. This is how AdGuard, 1Blocker, and others operate. The React
Native UI from Phase 2 is largely reused; only the native VPN module
needs to be rewritten in Swift.

+-----------------------------------------------------------------------+
| **Prerequisite: Apple Developer Account**                             |
|                                                                       |
| Cost: \$99/year at developer.apple.com                                |
|                                                                       |
| Required for: App Store distribution AND TestFlight beta testing      |
|                                                                       |
| Required entitlement: com.apple.developer.networking.networkextension |
|                                                                       |
| This entitlement must be requested and approved by Apple --- budget   |
| 1-2 weeks                                                             |
|                                                                       |
| Network Extension entitlements are approved for legitimate use cases; |
| FOCUS qualifies                                                       |
+-----------------------------------------------------------------------+

**6.2 iOS Architecture**

> focus-ios/ (added to existing RN project)
>
> └── ios/
>
> ├── FocusApp/
>
> │ └── AppDelegate.swift
>
> └── FocusTunnel/ ← Separate app extension target
>
> ├── PacketTunnelProvider.swift \# Core NEPacketTunnelProvider
>
> ├── PacketFilter.swift \# Filtering logic (mirrors Kotlin)
>
> └── Info.plist \# Extension configuration

**6.3 PacketTunnelProvider.swift (Simplified)**

> import NetworkExtension
>
> class PacketTunnelProvider: NEPacketTunnelProvider {
>
> override func startTunnel(
>
> options: \[String: NSObject\]?,
>
> completionHandler: \@escaping (Error?) -\> Void
>
> ) {
>
> let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress:
> \"127.0.0.1\")
>
> settings.ipv4Settings = NEIPv4Settings(
>
> addresses: \[\"10.0.0.2\"\],
>
> subnetMasks: \[\"255.255.255.0\"\]
>
> )
>
> settings.ipv4Settings?.includedRoutes = \[NEIPv4Route.default()\]
>
> setTunnelNetworkSettings(settings) { error in
>
> if error == nil {
>
> self.beginFiltering() // Start reading + filtering packets
>
> }
>
> completionHandler(error)
>
> }
>
> }
>
> private func beginFiltering() {
>
> packetFlow.readPackets { packets, protocols in
>
> // Inspect each packet against filter list
>
> // Block: drop. Allow: write back to packetFlow
>
> self.beginFiltering() // Recursive read loop
>
> }
>
> }
>
> }

**6.4 iOS Screen Time API (FamilyControls)**

iOS 15+ offers a native Screen Time-like API called FamilyControls +
ManagedSettings. This approach is more limited than VPN-based blocking
(it can\'t target sub-features like Reels specifically), but it is worth
implementing as a complementary feature for users who want app-level
limits in addition to surgical blocking.

- Primary: NEPacketTunnelProvider for surgical blocking

- Secondary: FamilyControls for daily time limits on individual apps

- Together: the most complete parental/self-control suite on iOS

**7. Filter List Schema**

**7.1 Overview**

The filter list is the \'database\' of what FOCUS blocks. It is
platform-agnostic JSON that drives rules for both the browser extension
and the mobile apps. Over time, this becomes the core IP of the product
--- maintaining an accurate, up-to-date filter list is the primary
ongoing engineering task.

**7.2 Extended Filter List Schema**

> {
>
> \"version\": \"1.0.0\",
>
> \"updated\": \"2026-03-08\",
>
> \"rules\": \[
>
> {
>
> \"id\": \"yt-shorts-url\",
>
> \"platform\": \"youtube\",
>
> \"name\": \"YouTube Shorts (URL)\",
>
> \"description\": \"Blocks navigation to youtube.com/shorts\",
>
> \"type\": \"url\",
>
> \"patterns\": \[
>
> \"\*youtube.com/shorts\*\",
>
> \"\*youtube.com/\*/shorts\*\"
>
> \],
>
> \"enabled_by_default\": true
>
> },
>
> {
>
> \"id\": \"yt-shorts-api\",
>
> \"platform\": \"youtube\",
>
> \"name\": \"YouTube Shorts (API)\",
>
> \"description\": \"Blocks YouTube internal API calls for Shorts
> feed\",
>
> \"type\": \"api\",
>
> \"patterns\": \[
>
> \"\*youtubei.googleapis.com/youtubei/v1/browse\*browseId=FEshorts\*\",
>
> \"\*youtubei.googleapis.com/youtubei/v1/next\*shortFormVideoId\*\"
>
> \],
>
> \"enabled_by_default\": true
>
> },
>
> {
>
> \"id\": \"ig-reels-url\",
>
> \"platform\": \"instagram\",
>
> \"name\": \"Instagram Reels (URL)\",
>
> \"patterns\": \[\"\*instagram.com/reels\*\"\],
>
> \"enabled_by_default\": true
>
> },
>
> {
>
> \"id\": \"ig-reels-api\",
>
> \"platform\": \"instagram\",
>
> \"name\": \"Instagram Reels (API)\",
>
> \"patterns\": \[
>
> \"\*instagram.com/api/v1/clips/user\*\",
>
> \"\*i.instagram.com/api/v1/clips\*\"
>
> \],
>
> \"enabled_by_default\": true
>
> },
>
> {
>
> \"id\": \"tiktok-all\",
>
> \"platform\": \"tiktok\",
>
> \"name\": \"TikTok (Full App)\",
>
> \"description\": \"TikTok is entirely short-form; block everything\",
>
> \"patterns\": \[\"\*tiktok.com\*\", \"\*musical.ly\*\"\],
>
> \"enabled_by_default\": true
>
> },
>
> {
>
> \"id\": \"snap-spotlight\",
>
> \"platform\": \"snapchat\",
>
> \"name\": \"Snapchat Spotlight\",
>
> \"patterns\": \[
>
> \"\*snapchat.com/spotlight\*\",
>
> \"\*cf-st.sc-cdn.net/spotlight\*\"
>
> \],
>
> \"enabled_by_default\": true
>
> }
>
> \]
>
> }

**7.3 Filter List Maintenance Strategy**

Platforms update their internal API endpoints every few weeks,
especially after public scrutiny. Keeping the filter list accurate is
the primary engineering maintenance burden. Recommended strategies:

1.  Host the filter list on GitHub (open source --- community
    contributions welcome)

2.  Auto-update: apps check for filter list updates on launch
    (CDN-hosted JSON)

3.  Versioned list: apps ship with a bundled fallback, fetch updates
    async

4.  Community reporting: in-app \'Rule broken? Report it\' button

5.  Pro feature: real-time filter updates vs. 7-day lag for free users

**8. Monetization Model**

**8.1 Free vs. Pro Tier**

  ----------------------- ----------------------- -----------------------
  **Feature**             **Free**                **Pro (\$2.99/mo)**

  Core blocking (YT       ✓                       ✓
  Shorts, IG Reels,                               
  TikTok)                                         

  Snapchat Spotlight      ✓                       ✓
  blocking                                        

  On/Off toggle           ✓                       ✓

  Per-platform toggles    ✓                       ✓

  Basic block counter     ✓                       ✓

  Filter list updates     7-day lag               Real-time

  Custom URL rules        ---                     ✓

  Scheduled blocking      ---                     ✓
  (e.g. 9am--5pm)                                 

  Detailed stats          ---                     ✓
  (weekly/monthly charts)                         

  Cross-device sync       ---                     ✓

  Passcode lock           ---                     ✓
  (anti-circumvention)                            
  ----------------------- ----------------------- -----------------------

**8.2 Pricing**

  -------------------------- --------------------------------------------
  **Plan**                   **Price**

  Free                       \$0 --- forever, no credit card

  Pro Monthly                \$2.99 / month

  Pro Annual                 \$14.99 / year (save 58%)

  Lifetime (future)          \$29.99 one-time (if you add it later)
  -------------------------- --------------------------------------------

**8.3 RevenueCat Integration**

Use RevenueCat to handle in-app purchases across Android and iOS. It
abstracts the Google Play Billing API and Apple StoreKit into a single
SDK, dramatically reducing implementation complexity.

> // Install: npm install react-native-purchases
>
> import Purchases from \'react-native-purchases\';
>
> // Initialize on app start
>
> Purchases.configure({ apiKey: \'YOUR_REVENUECAT_KEY\' });
>
> // Check subscription status
>
> const customerInfo = await Purchases.getCustomerInfo();
>
> const isPro = customerInfo.entitlements.active\[\'pro\'\] !==
> undefined;
>
> // Show paywall
>
> const offerings = await Purchases.getOfferings();
>
> await Purchases.purchasePackage(offerings.current.monthly);

**9. App Store & Play Store Policy**

**9.1 The Landscape**

Both Apple and Google have reviewed and approved VPN-based content
blocking apps. AdGuard, 1Blocker, and DNS66 are all in their respective
stores. FOCUS follows an established, accepted pattern --- but there are
specific requirements and gotchas to know before submitting.

**9.2 Google Play --- Key Requirements**

+-----------------------------------------------------------------------+
| **⚠️ Critical: Play Store VPN Policy**                                |
|                                                                       |
| Apps using VpnService MUST disclose this in their store listing.      |
|                                                                       |
| Apps CANNOT use the VPN tunnel to collect or redirect user data for   |
| analytics.                                                            |
|                                                                       |
| Apps CANNOT use \'VPN\' in the app name unless it is actually a VPN   |
| service.                                                              |
|                                                                       |
| FOCUS complies with all of these: local-only, no data collection, not |
| named \'VPN\'.                                                        |
+-----------------------------------------------------------------------+

- Include a clear Privacy Policy URL in Play Console (required for
  VpnService apps)

- Add disclosure in store listing: \'Uses Android VPN service for local
  content filtering\'

- Target API level 34+ (Google Play requirement as of 2024)

- Test on Android 8--14 before submission

- Category: Tools or Health & Fitness

**9.3 Apple App Store --- Key Requirements**

+-----------------------------------------------------------------------+
| **⚠️ Critical: Network Extension Entitlement**                        |
|                                                                       |
| You must request the com.apple.developer.networking.networkextension  |
| entitlement.                                                          |
|                                                                       |
| Submit a request at developer.apple.com --- budget 1-2 weeks for      |
| approval.                                                             |
|                                                                       |
| In your request, describe the use case clearly: \'local content       |
| filtering, no data leaves device\'.                                   |
|                                                                       |
| Apple approves these routinely for parental control and content       |
| filter apps.                                                          |
+-----------------------------------------------------------------------+

- Privacy Policy required --- must state no data collection

- App Review may ask for a demo --- have a screen recording ready
  showing the local-only VPN

- Do NOT include TikTok blocking in the initial submission metadata ---
  describe as \'short-form video filtering\' to avoid App Review
  scrutiny over mentioning a specific competitor

- Category: Productivity or Health & Fitness

- Consider launching as a free app first --- paid apps face stricter
  review on first submission

**9.4 Privacy Policy (Required for Both Stores)**

You need a simple Privacy Policy hosted at a URL. Minimum content
required:

6.  What data is collected: none

7.  What the VPN is used for: local content filtering only

8.  Data never leaves the device

9.  No analytics, no crash reporting (unless you add it)

10. Contact email for privacy questions

Free options: GitHub Pages, Notion public page, or app.termly.io
(generates a policy).

**10. Development Roadmap**

**10.1 Recommended Build Order**

  ----------------------- ----------------------- -----------------------
  **Phase**               **Deliverable**         **Estimated Time**

  0 --- Research          Validate filter         1--2 days
                          patterns; test in       
                          browser                 

  1 --- Extension MVP     Chrome extension with   1--2 weekends
                          core filter list        

  1.1 --- Safari          Safari Web Extension    +1 weekend
                          port                    

  2 --- Android MVP       React Native app +      3--4 weeks
                          Kotlin VPN module       

  2.1 --- Play Store      Beta → Production       +1 week
                          release                 

  2.2 --- Stats           Block counter,          +1 weekend
                          time-saved UI           

  3 --- Pro Features      Schedule, custom rules, 2--3 weeks
                          RevenueCat              

  4 --- iOS               Swift VPN module +      3--4 weeks
                          Apple dev account       

  4.1 --- App Store       TestFlight beta → App   +2 weeks
                          Store submission        

  5 --- Cross-platform    Cloud sync, shared      2--3 weeks
                          filter list updates     
  ----------------------- ----------------------- -----------------------

**10.2 Milestones**

11. Week 2: Working Chrome extension shared with beta testers

12. Week 6: Android beta on Google Play (internal testing track)

13. Week 8: Android v1.0 public release

14. Month 3: iOS TestFlight beta

15. Month 4: iOS App Store submission

16. Month 5: Pro subscription launch

**11. Naming & Branding Directions**

**11.1 Candidate Names**

  -------------------------- --------------------------------------------
  **Name**                   **Rationale**

  FOCUS                      Clean, direct, aspirational. No negative
                             connotation. App store friendly.

  Snip                       Playful. \'Snip the scroll.\' Short,
                             memorable, unique.

  Longform                   Describes what you keep, not what you block.
                             Positions product positively.

  Clearview                  Implies clarity, seeing through the noise.
                             Works well for privacy angle too.

  Scroll Stop                Literal and descriptive. Easy to find via
                             search. Less premium feel.

  Curator                    Implies intentionality. \'You curate your
                             feed.\' Premium positioning.
  -------------------------- --------------------------------------------

+-----------------------------------------------------------------------+
| **Recommendation**                                                    |
|                                                                       |
| FOCUS is the strongest candidate for App Store discoverability and    |
| brand clarity.                                                        |
|                                                                       |
| Check App Store and Play Store for conflicts before committing.       |
|                                                                       |
| Domain: tryfocus.app or getfocus.app (focus.app is likely taken).     |
+-----------------------------------------------------------------------+

**11.2 Brand Voice**

- Positive framing --- \'time saved\' not \'blocked count\'

- Adult, not parental --- this is self-improvement, not restriction

- Privacy-first --- local VPN, zero data collection is a core message

- No guilt --- the app helps users, it doesn\'t shame them

**11.3 App Icon Direction**

- Minimal geometric design --- a stylized eye, shield, or scissors motif

- Dark background works well for both light and dark mode home screens

- Accent color: consider red/coral (urgency, attention) or deep teal
  (calm, focus)

- Avoid: brain icons (too clinical), lock icons (too
  restrictive/parental)

**12. Recommended Next Steps**

+-----------------------------------------------------------------------+
| **Start Here --- This Week**                                          |
|                                                                       |
| 1\. Open Chrome DevTools on YouTube and Instagram                     |
|                                                                       |
| → Record network requests when navigating to Shorts/Reels             |
|                                                                       |
| → Identify the exact URL patterns and API endpoints to block          |
|                                                                       |
| → This becomes your initial filter-list.json                          |
|                                                                       |
| 2\. Build the Chrome extension (Phase 1) --- it is 3 files            |
|                                                                       |
| → manifest.json, background.js, filter-list.json                      |
|                                                                       |
| → Get something blocking within a few hours                           |
|                                                                       |
| 3\. Share with Walker and your iOS friends via the Safari extension   |
|                                                                       |
| → Real user feedback before any mobile investment                     |
+-----------------------------------------------------------------------+

**12.1 Technical Resources**

  -------------------------- ----------------------------------------------------------------------
  **Resource**               **URL / Notes**

  Chrome                     developer.chrome.com/docs/extensions/reference/declarativeNetRequest
  DeclarativeNetRequest docs 

  Android VpnService docs    developer.android.com/reference/android/net/VpnService

  Apple NetworkExtension     developer.apple.com/documentation/networkextension
  docs                       

  RevenueCat React Native    docs.revenuecat.com/docs/react-native
  SDK                        

  AdGuard (open source       github.com/AdguardTeam/AdguardForiOS --- great architecture reference
  reference)                 

  filter-list format         adguard.com/kb/general/ad-filtering/create-own-filters
  reference                  
  -------------------------- ----------------------------------------------------------------------

**12.2 Open Questions to Resolve**

17. Which short-form platforms should v1.0 target? (Recommendation:
    YouTube Shorts + Instagram Reels as the high-value MVP, TikTok
    optional)

18. Will you open-source the filter list? (Recommended: yes ---
    community maintains it, reduces your burden)

19. App name final decision --- check App Store/Play Store for conflicts

20. Privacy policy URL --- set up a simple page before any beta release

21. Will Walker be an official co-founder, or is this Perry\'s project?
    Clarify early to avoid complications.

*End of Specification*

FOCUS v1.0 · March 2026 · Perry & Walker
