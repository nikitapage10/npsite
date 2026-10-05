// Crops each logo out of the source sheet to the bounding box of its visible (alpha) pixels, plus a margin.
// Usage: node tools/cropart.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const sheet = path.join(root, 'design', 'source-art', 'Watercolor Blueprint Logo Collection.png');
const W = 2172, H = 724, MARGIN = 10, ALPHA = 28;

// Read the alpha channel as raw 8-bit gray.
const alpha = execFileSync('ffmpeg', ['-v', 'error', '-i', sheet, '-vf', 'alphaextract', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: W * H + 1024 });

// Column ranges for each logo (the gaps between them on the sheet).
const regions = { kpmg: [0, 530], verizon: [530, 1110], microsoft: [1110, 1720], pennstate: [1720, W] };
for (const [name, [x0, x1]] of Object.entries(regions)) {
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
    if (alpha[y * W + x] > ALPHA) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const cx = Math.max(x0, minX - MARGIN), cy = Math.max(0, minY - MARGIN);
  const cw = Math.min(x1, maxX + MARGIN) - cx, ch = Math.min(H, maxY + MARGIN) - cy;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', sheet, '-vf', `crop=${cw}:${ch}:${cx}:${cy}`, '-quality', '90', path.join(root, 'assets', `logo-${name}.webp`)]);
  console.log(name, { x: cx, y: cy, w: cw, h: ch });
}
