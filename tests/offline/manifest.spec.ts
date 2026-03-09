import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '..', '..', 'packages', 'extension');
const manifest = JSON.parse(
  fs.readFileSync(path.join(EXTENSION_PATH, 'manifest.json'), 'utf-8')
);

test.describe('Manifest validation', () => {
  test('is Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
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

  test('declares background service worker', () => {
    expect(manifest.background.service_worker).toBe('background.js');
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

  test('JS content scripts run at document_idle', () => {
    const jsScripts = manifest.content_scripts.filter(
      (cs: any) => cs.js?.length > 0
    );
    for (const cs of jsScripts) {
      expect(cs.run_at).toBe('document_idle');
    }
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
    // Popup and background
    expect(
      fs.existsSync(path.join(EXTENSION_PATH, manifest.action.default_popup))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(EXTENSION_PATH, manifest.background.service_worker))
    ).toBe(true);
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
