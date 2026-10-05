// Generates assets/paper-mask.webp: a seamless, opaque warm paper tile (mottling, grain, fibers, flecks)
// used as the surface of the "Look closer" ink-reveal mask.
// Usage: node tools/papertile.js
const { execFileSync } = require('child_process');
const path = require('path');
const N = 384, BASE = [239, 233, 223];
let seed = 31;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Periodic value noise (wraps at N) for soft mottling.
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
const n1 = valueNoise(4), n2 = valueNoise(12), n3 = valueNoise(48);
const buf = Buffer.alloc(N * N * 3);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const m = (n1(x, y) - 0.5) * 10 + (n2(x, y) - 0.5) * 6 + (n3(x, y) - 0.5) * 4 + (rnd() - 0.5) * 7;
  const i = (y * N + x) * 3;
  buf[i] = BASE[0] + m; buf[i + 1] = BASE[1] + m; buf[i + 2] = BASE[2] + m * 1.1;
}
function plot(x, y, rgb, a) {
  const xi = ((Math.round(x) % N) + N) % N, yi = ((Math.round(y) % N) + N) % N, i = (yi * N + xi) * 3;
  for (let c = 0; c < 3; c++) buf[i + c] = Math.round(buf[i + c] * (1 - a) + rgb[c] * a);
}
// Fibers: light and dark, thin and slightly curved.
for (let f = 0; f < 260; f++) {
  let x = rnd() * N, y = rnd() * N, ang = rnd() * Math.PI * 2;
  const len = 12 + rnd() * 60, bend = (rnd() - 0.5) * 0.06, light = rnd() < 0.6, a = 0.18 + rnd() * 0.22;
  for (let s = 0; s < len; s++) {
    plot(x, y, light ? [252, 250, 244] : [196, 184, 164], a * Math.sin((s / len) * Math.PI));
    x += Math.cos(ang); y += Math.sin(ang); ang += bend;
  }
}
for (let k = 0; k < 50; k++) plot(rnd() * N, rnd() * N, [150, 132, 104], 0.35 + rnd() * 0.3);
const out = path.join(__dirname, '..', 'assets', 'paper-mask.webp');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${N}x${N}`, '-i', '-', '-lossless', '1', out], { input: buf });
console.log('wrote', out);
