/**
 * generate-noise.js
 * Generates a 256x256 tileable value-noise PNG (grayscale, R channel).
 * Pure Node.js - no dependencies.
 * Run: node scripts/generate-noise.js
 * Output: public/assets/noise-256.png
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;
const GRID = 32;

// Seeded pseudo-random
function seededRand(seed) {
  let s = seed >>> 0;
  return function() {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 4294967296;
  };
}

// Fade + lerp
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + (b - a) * t; }

const rand = seededRand(42);
const gridW = SIZE / GRID;   // 8
const gridH = SIZE / GRID;   // 8
const grid = new Float32Array(gridW * gridH);
for (let i = 0; i < grid.length; i++) grid[i] = rand();

function gridVal(gx, gy) {
  return grid[((gy % gridH + gridH) % gridH) * gridW + ((gx % gridW + gridW) % gridW)];
}

// Build raw pixel data (grayscale)
const pixels = new Uint8Array(SIZE * SIZE);
for (let py = 0; py < SIZE; py++) {
  for (let px = 0; px < SIZE; px++) {
    const fx = px / GRID;
    const fy = py / GRID;
    const gx0 = Math.floor(fx);
    const gy0 = Math.floor(fy);
    const tx = fade(fx - gx0);
    const ty = fade(fy - gy0);
    const v = lerp(
      lerp(gridVal(gx0, gy0), gridVal(gx0 + 1, gy0), tx),
      lerp(gridVal(gx0, gy0 + 1), gridVal(gx0 + 1, gy0 + 1), tx),
      ty
    );
    pixels[py * SIZE + px] = Math.round(v * 255);
  }
}

// -- Minimal PNG writer (grayscale, 8-bit) --
function crc32(buf) {
  const table = crc32.table || (() => {
    const t = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return (crc32.table = t);
  })();
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, data]);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4); crcBuf.writeInt32BE(crcVal, 0);
  return Buffer.concat([len, body, crcBuf]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 0;   // colour type: grayscale
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// IDAT - filter type 0 (None) per scanline
const raw = Buffer.alloc(SIZE * (SIZE + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE + 1)] = 0; // filter type None
  Buffer.from(pixels.slice(y * SIZE, (y + 1) * SIZE)).copy(raw, y * (SIZE + 1) + 1);
}
const compressed = zlib.deflateSync(raw, { level: 9 });

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.join(__dirname, '..', 'public', 'assets', 'noise-256.png');
fs.writeFileSync(outPath, png);
console.log('noise-256.png written (' + png.length + ' bytes)');
