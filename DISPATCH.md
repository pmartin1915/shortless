# DISPATCH.md — Shortless (Browser Extension)

> Async task protocol for Claude Dispatch.
> No CLAUDE.md yet — use README.md and PRODUCT_SPEC.md for context.

---

## Pre-Approved Tasks (No Confirmation Needed)

| Task Keyword | Command | Success Criteria |
|-------------|---------|-----------------|
| `test` | `npm test` (builds then runs Playwright) | All 8 specs pass |
| `test:offline` | `npm run test:offline` | Offline specs pass (popup, manifest, toggle) |
| `test:network` | `npm run test:network` | Network specs pass (YouTube, IG, TikTok, Snapchat) |
| `build` | `npm run build` | Chrome + Firefox builds succeed |
| `build:chrome` | `npm run build:chrome` | Chrome build in store/ |
| `build:firefox` | `npm run build:firefox` | Firefox build in store/ |
| `audit` | `pal codereview` on packages/ | Report findings |
| `clean` | Remove dead code, unused CSS | Tests pass, commit |

## Guided Tasks (Plan First, Then Execute)

| Task Keyword | Description |
|-------------|-------------|
| `fix <issue>` | Diagnose and fix a specific bug |
| `add-filter <platform>` | Add new content blocking filter rules |
| `add-tests <target>` | Add Playwright specs for untested flows |
| `update-manifest` | Update extension manifest (version, permissions) |
| `firefox-sync` | Sync Chrome extension changes to Firefox port |

## Requires Confirmation (Never Auto-Execute)

- `publish` — Chrome Web Store or Firefox Add-ons submission
- `delete` — Remove files, branches, or data
- `permissions` — Changes to extension manifest permissions
- `privacy` — Changes affecting PRIVACY_POLICY.md compliance

## Project Structure Quick Reference

```
packages/
  extension/         → Chrome (Manifest V3)
  extension-firefox/ → Firefox (Manifest V3)
  shared/            → Shared utilities
tests/
  offline/           → Popup, manifest, toggle persistence
  network/           → Platform blocking (YT, IG, TikTok, Snapchat)
scripts/
  build.js           → Build pipeline
store/               → Built .zip artifacts
```

## iOS Companion (C:/shortless-ios)

iOS project uses XcodeGen (project.yml). Not Dispatch-automatable from CLI yet.
Manual Xcode build required. Targets: Safari Content Blocker, Safari Web Extension, VPN Extension, Widget.
