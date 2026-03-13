const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Run build first to ensure output is up to date
execSync('node scripts/build.js chrome', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });

const src = path.resolve(__dirname, '..', 'packages', 'extension');
const dest = path.resolve(__dirname, 'shortless-1.1.0.zip');

if (fs.existsSync(dest)) fs.unlinkSync(dest);

const output = fs.createWriteStream(dest);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Created: ${dest} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);
// Exclude _metadata (Chrome-generated indexed rulesets)
archive.directory(src, false, (entry) => entry.name.startsWith('_metadata') ? false : entry);
archive.finalize();
