# Privacy Policy — Shortless: Block Short-Form Content

**Last updated:** March 9, 2026

## Overview

Shortless is a browser extension that blocks short-form video content (YouTube Shorts, Instagram Reels, TikTok, and Snapchat Spotlight). It is designed with privacy as a core principle: the extension collects no personal data whatsoever.

## Data Collection

Shortless does **not** collect, store, or transmit any personal data. Specifically:

- No analytics or telemetry
- No tracking of any kind
- No cookies
- No user accounts or sign-up
- No external network requests are made by the extension
- No browsing history is accessed or recorded

## How Blocking Works

All content blocking happens entirely on your device. The extension uses three mechanisms, all of which operate locally:

1. **Chrome's declarativeNetRequest API** — Static network-level rules that block or redirect requests before they reach your browser. These rules are bundled with the extension and never phone home.
2. **CSS injection** — Stylesheets injected at page load to hide short-form content elements.
3. **Content scripts** — JavaScript that monitors the page for dynamically loaded short-form content and hides it.

None of these mechanisms send data off your device.

## Data Stored Locally

Shortless uses two Chrome storage APIs:

- **chrome.storage.sync** — Saves your per-platform preferences (which platforms you have enabled or disabled). This data syncs across your Chrome browsers using Chrome's built-in sync infrastructure, not any server operated by us. The only data stored is simple on/off toggles for each supported platform.
- **chrome.storage.local** — Stores a daily count of blocked content items. This counter never leaves your device.

No other data is stored.

## Third-Party Services

Shortless does not integrate with, send data to, or receive data from any third-party services, APIs, or servers.

## Open Source

The filter rules used by Shortless are open source and can be inspected in the extension's source code.

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in the extension's GitHub repository with an updated date.

## Contact

For questions or concerns about this privacy policy, please open an issue on the GitHub repository:

https://github.com/pmartin1915/shortless
