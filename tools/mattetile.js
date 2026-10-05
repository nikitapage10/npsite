// Generates assets/paper-white.webp: a seamless, near-white matte paper tile for text panels —
// a fine, softened tooth and faint tonal variation, no fibers or threads.
// Usage: node tools/mattetile.js
const { execFileSync } = require('child_process');
const path = require('path');
const N = 256, BASE = [252, 251, 247];
let seed = 47;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function valueNoise(cells) {
  const g = Array.from({ length: cells * cells }, () => rnd());
  const at = (x, y) => g[((y % cells) + cells) % cells * cells + ((x % cells) + cells) % cells];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / N) * cells, fy = (y / N) * cells, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = sm(fx - x0), ty = sm(fy - y0);
    const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx, b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return a * (1 - ty) + b * ty;
  };
}
// Raw grain, then a 3x3 wrap-around blur so the tooth reads soft and matte rather than speckled.
const raw = Float32Array.from({ length: N * N }, () => rnd() - 0.5);
const soft = new Float32Array(N * N);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  let sum = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += raw[((y + dy + N) % N) * N + ((x + dx + N) % N)];
  soft[y * N + x] = sum / 9;
}
const tone = valueNoise(6), fine = valueNoise(32);
const buf = Buffer.alloc(N * N * 3);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const m = soft[y * N + x] * 9 + (tone(x, y) - 0.5) * 2.5 + (fine(x, y) - 0.5) * 2;
  const i = (y * N + x) * 3;
  for (let c = 0; c < 3; c++) buf[i + c] = Math.max(0, Math.min(255, Math.round(BASE[c] + m)));
}
const out = path.join(__dirname, '..', 'assets', 'paper-white.webp');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${N}x${N}`, '-i', '-', '-lossless', '1', out], { input: buf });
console.log('wrote', out);
