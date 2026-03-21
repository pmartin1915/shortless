import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '..', '..', 'packages', 'extension-firefox');
const manifest = JSON.parse(
  fs.readFileSync(path.join(EXTENSION_PATH, 'manifest.json'), 'utf-8')
);

test.describe('Firefox manifest validation', () => {
  test('is Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  test('has Gecko browser_specific_settings', () => {
    expect(manifest.browser_specific_settings).toBeDefined();
    expect(manifest.browser_specific_settings.gecko).toBeDefined();
    expect(manifest.browser_specific_settings.gecko.id).toBe('shortless@pmartin1915.dev');
    expect(manifest.browser_specific_settings.gecko.strict_min_version).toBe('142.0');
  });

  test('does not use service_worker (Firefox uses scripts)', () => {
    expect(manifest.background.service_worker).toBeUndefined();
    expect(manifest.background.scripts).toContain('background.js');
  });

  test('has required permissions', () => {
    expect(manifest.permissions).toContain('declarativeNetRequest');
    expect(manifest.permissions).toContain('storage');
  });

  test('declares all four platform rulesets', () => {
    const rulesetIds = manifest.declarative_net_request.rule_resources.map(
      (r: any) => r.id
    );
    expect(rulesetIds).toContain('youtube_rules');
    expect(rulesetIds).toContain('instagram_rules');
    expect(rulesetIds).toContain('tiktok_rules');
    expect(rulesetIds).toContain('snapchat_rules');
  });

  test('all rulesets enabled by default', () => {
    for (const ruleset of manifest.declarative_net_request.rule_resources) {
      expect(ruleset.enabled).toBe(true);
    }
  });

  test('declares popup action', () => {
    expect(manifest.action.default_popup).toBe('popup/popup.html');
  });

  test('content scripts cover YouTube, Instagram, and Snapchat', () => {
    const allMatches = manifest.content_scripts.flatMap((cs: any) => cs.matches);
    expect(allMatches).toContain('*://*.youtube.com/*');
    expect(allMatches).toContain('*://*.instagram.com/*');
    expect(allMatches).toContain('*://*.snapchat.com/*');
  });

  test('CSS injected at document_start', () => {
    const cssScripts = manifest.content_scripts.filter(
      (cs: any) => cs.css?.length > 0
    );
    for (const cs of cssScripts) {
      expect(cs.run_at).toBe('document_start');
    }
  });

  test('JS content scripts run at correct timing', () => {
    const jsScripts = manifest.content_scripts.filter(
      (cs: any) => cs.js?.length > 0
    );
    for (const cs of jsScripts) {
      if (cs.world === 'MAIN') {
        expect(cs.run_at).toBe('document_start');
      } else {
        expect(cs.run_at).toBe('document_idle');
      }
    }
  });

  test('declares MAIN world fetch guard for YouTube', () => {
    const mainWorldScripts = manifest.content_scripts.filter(
      (cs: any) => cs.world === 'MAIN'
    );
    expect(mainWorldScripts.length).toBeGreaterThanOrEqual(1);
    const ytGuard = mainWorldScripts.find((cs: any) =>
      cs.js?.includes('content-scripts/youtube-fetch-guard.js')
    );
    expect(ytGuard).toBeDefined();
    expect(ytGuard.run_at).toBe('document_start');
    expect(ytGuard.matches).toContain('*://*.youtube.com/*');
  });

  test('all referenced files exist on disk', () => {
    // Ruleset files
    for (const rs of manifest.declarative_net_request.rule_resources) {
      expect(fs.existsSync(path.join(EXTENSION_PATH, rs.path))).toBe(true);
    }
    // Content script files
    for (const cs of manifest.content_scripts) {
      for (const file of [...(cs.css || []), ...(cs.js || [])]) {
        expect(
          fs.existsSync(path.join(EXTENSION_PATH, file)),
          `Missing: ${file}`
        ).toBe(true);
      }
    }
    // Popup
    expect(
      fs.existsSync(path.join(EXTENSION_PATH, manifest.action.default_popup))
    ).toBe(true);
    // Background scripts
    for (const script of manifest.background.scripts) {
      expect(
        fs.existsSync(path.join(EXTENSION_PATH, script)),
        `Missing background script: ${script}`
      ).toBe(true);
    }
  });

  test('DNR rule files contain valid rule arrays', () => {
    for (const rs of manifest.declarative_net_request.rule_resources) {
      const content = fs.readFileSync(
        path.join(EXTENSION_PATH, rs.path),
        'utf-8'
      );
      const parsed = JSON.parse(content);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      for (const rule of parsed) {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('action');
        expect(rule).toHaveProperty('condition');
      }
    }
  });
});
