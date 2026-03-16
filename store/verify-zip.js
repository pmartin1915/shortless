const fs = require('fs');
const path = require('path');

// Parse central directory from zip to list all entries
const buf = fs.readFileSync(path.resolve(__dirname, 'shortless-firefox-1.0.0.zip'));

// Find End of Central Directory record (last 22+ bytes)
let eocdOffset = buf.length - 22;
while (eocdOffset >= 0 && buf.readUInt32LE(eocdOffset) !== 0x06054b50) eocdOffset--;

const cdOffset = buf.readUInt32LE(eocdOffset + 16);
const cdCount = buf.readUInt16LE(eocdOffset + 10);

let offset = cdOffset;
const entries = [];
for (let i = 0; i < cdCount; i++) {
  const nameLen = buf.readUInt16LE(offset + 28);
  const extraLen = buf.readUInt16LE(offset + 30);
  const commentLen = buf.readUInt16LE(offset + 32);
  const name = buf.toString('utf8', offset + 46, offset + 46 + nameLen);
  entries.push(name);
  offset += 46 + nameLen + extraLen + commentLen;
}

console.log('Zip entries:');
entries.forEach(e => console.log('  ' + e));
const hasBackslash = entries.some(e => e.includes('\\'));
console.log(`\nTotal: ${entries.length} entries`);
console.log(`Backslash check: ${hasBackslash ? 'FAIL — backslashes found' : 'PASS — all forward slashes'}`);
