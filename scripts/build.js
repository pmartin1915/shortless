#!/usr/bin/env node
/**
 * Build script for Shortless browser extensions.
 *
 * Copies shared source files into platform-specific output directories,
 * preserving each platform's unique manifest.json.
 *
 * Usage:
 *   node scripts/build.js           # build both
 *   node scripts/build.js chrome    # build Chrome only
 *   node scripts/build.js firefox   # build Firefox only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHARED = path.join(ROOT, 'packages', 'shared');

const TARGETS = {
  chrome:  path.join(ROOT, 'packages', 'extension'),
  firefox: path.join(ROOT, 'packages', 'extension-firefox'),
};

// Directories / files to skip when copying shared → target
const SKIP = new Set(['manifest.json', '_metadata']);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function buildTarget(name) {
  const target = TARGETS[name];
  if (!target) {
    console.error(`Unknown target: ${name}`);
    process.exit(1);
  }

  // Ensure target dir exists
  fs.mkdirSync(target, { recursive: true });

  // Copy every entry from shared/ into target/, skipping manifest.json and _metadata
  let copied = 0;
  for (const entry of fs.readdirSync(SHARED)) {
    if (SKIP.has(entry)) continue;

    const src = path.join(SHARED, entry);
    const dest = path.join(target, entry);
    copyRecursive(src, dest);
    copied++;
  }

  // Verify manifest.json exists in target
  const manifest = path.join(target, 'manifest.json');
  if (!fs.existsSync(manifest)) {
    console.error(`Missing manifest.json in ${target}`);
    process.exit(1);
  }

  console.log(`  ${name}: ${copied} entries copied → ${path.relative(ROOT, target)}`);
}

// --- Main ---
const args = process.argv.slice(2);
const targets = args.length > 0 ? args : ['chrome', 'firefox'];

console.log('Building Shortless extensions...');
for (const t of targets) {
  buildTarget(t);
}
console.log('Done.');
