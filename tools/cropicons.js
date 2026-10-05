// Crops the eight industry icons out of design/source-art/Industry Icons.webp (4x2 sheet)
// to the bounds of their opaque pixels and writes assets/icon-<name>.webp (the sheet is already transparent).
// Usage: node tools/cropicons.js
const { execFileSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');
const sheet = path.join(root, 'design', 'source-art', 'Industry Icons.webp');
const W = 1448, H = 1086, OPAQUE = 120, MARGIN = 18;
const alpha = execFileSync('ffmpeg', ['-v', 'error', '-i', sheet, '-vf', 'alphaextract', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: W * H + 1024 });

const cols = [[0, 372], [372, 748], [748, 1100], [1100, W]], rows = [[0, 560], [560, H]];
const names = ['banking', 'insurance', 'beauty', 'grocery', 'telecom', 'gaming', 'cloud', 'datacenter'];
let k = 0;
for (const [y0, y1] of rows) for (const [x0, x1] of cols) {
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (alpha[y * W + x] > OPAQUE) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  // square crop centred on the ink, so every icon sits the same way in its tile
  const side = Math.max(maxX - minX, maxY - minY) + MARGIN * 2;
  const cx = Math.round((minX + maxX) / 2 - side / 2), cy = Math.round((minY + maxY) / 2 - side / 2);
  const x = Math.max(0, Math.min(W - side, cx)), y = Math.max(0, Math.min(H - side, cy));
  const out = path.join(root, 'assets', `icon-${names[k]}.webp`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', sheet, '-vf', `crop=${side}:${side}:${x}:${y},scale=240:240`, '-quality', '92', out]);
  console.log(names[k], { x, y, side });
  k++;
}
