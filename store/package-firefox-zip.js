const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const src = path.resolve(__dirname, '..', 'packages', 'extension-firefox');
const dest = path.resolve(__dirname, 'shortless-firefox-1.1.0.zip');

if (fs.existsSync(dest)) fs.unlinkSync(dest);

const output = fs.createWriteStream(dest);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Created: ${dest} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);
archive.directory(src, false); // false = don't wrap in a subfolder
archive.finalize();
