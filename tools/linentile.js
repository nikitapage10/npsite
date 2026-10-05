// Generates assets/linen-white.webp: a seamless, very white linen tile for panel backgrounds.
// Usage: node tools/linentile.js
const { execFileSync } = require('child_process');
const path = require('path');
const N = 320;
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// One random strength per row (horizontal threads) and per column (vertical threads),
// lightly smoothed so threads vary in thickness. Indices wrap, so the tile repeats seamlessly.
function threads() {
  const raw = Array.from({ length: N }, () => rnd());
  return raw.map((_, i) => (raw[(i - 1 + N) % N] * 0.25 + raw[i] * 0.5 + raw[(i + 1) % N] * 0.25));
}
const rows = threads(), cols = threads();
const buf = Buffer.alloc(N * N * 3);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const v = 0.5 * rows[y] + 0.5 * cols[x] + (rnd() - 0.5) * 0.18; // ~0..1
  const k = Math.max(0, Math.min(1, v));
  const i = (y * N + x) * 3;
  buf[i] = Math.round(255 - (1 - k) * 12);    // R: 243..255
  buf[i + 1] = Math.round(254 - (1 - k) * 14); // G: 240..254
  buf[i + 2] = Math.round(250 - (1 - k) * 18); // B: 232..250 (warm)
}
const out = path.join(__dirname, '..', 'assets', 'linen-white.webp');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${N}x${N}`, '-i', '-', '-lossless', '1', out], { input: buf });
console.log('wrote', out);
