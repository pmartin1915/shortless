import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = path.resolve(__dirname, '..', '..', 'packages', 'extension');
const FIREFOX_PATH = path.resolve(__dirname, '..', '..', 'packages', 'extension-firefox');

const chrome = JSON.parse(
  fs.readFileSync(path.join(CHROME_PATH, 'manifest.json'), 'utf-8')
);
const firefox = JSON.parse(
  fs.readFileSync(path.join(FIREFOX_PATH, 'manifest.json'), 'utf-8')
);

test.describe('Chrome/Firefox manifest parity', () => {
  test('same version number', () => {
    expect(firefox.version).toBe(chrome.version);
  });

  test('same name and description', () => {
    expect(firefox.name).toBe(chrome.name);
    expect(firefox.description).toBe(chrome.description);
  });

  test('same permissions', () => {
    expect(firefox.permissions.sort()).toEqual(chrome.permissions.sort());
  });

  test('same host_permissions', () => {
    expect(firefox.host_permissions.sort()).toEqual(chrome.host_permissions.sort());
  });

  test('same content_scripts', () => {
    expect(firefox.content_scripts).toEqual(chrome.content_scripts);
  });

  test('same declarative_net_request rulesets', () => {
    expect(firefox.declarative_net_request).toEqual(chrome.declarative_net_request);
  });

  test('same popup and icons', () => {
    expect(firefox.action.default_popup).toBe(chrome.action.default_popup);
    expect(firefox.action.default_icon).toEqual(chrome.action.default_icon);
    expect(firefox.icons).toEqual(chrome.icons);
  });

  test('expected background differences only', () => {
    // Chrome uses service_worker, Firefox uses scripts array
    expect(chrome.background.service_worker).toBe('background.js');
    expect(firefox.background.scripts).toContain('background.js');
    // Firefox should not have service_worker
    expect(firefox.background.service_worker).toBeUndefined();
    // Chrome should not have scripts
    expect(chrome.background.scripts).toBeUndefined();
  });

  test('Firefox has gecko settings, Chrome does not', () => {
    expect(firefox.browser_specific_settings).toBeDefined();
    expect(chrome.browser_specific_settings).toBeUndefined();
  });
});
