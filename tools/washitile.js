// Generates assets/washi.webp: a seamless, mostly transparent rice-paper tile —
// fine pale fibers at random angles plus a few tiny warm flecks — laid over the hero footage.
// Usage: node tools/washitile.js
const { execFileSync } = require('child_process');
const path = require('path');
const N = 512;
let seed = 19;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const buf = Buffer.alloc(N * N * 4); // RGBA, starts fully transparent

function plot(x, y, rgb, a) {
  const xi = ((Math.round(x) % N) + N) % N, yi = ((Math.round(y) % N) + N) % N; // wrap = seamless
  const i = (yi * N + xi) * 4;
  const prev = buf[i + 3] / 255, add = a / 255, out = prev + add * (1 - prev);
  for (let c = 0; c < 3; c++) buf[i + c] = out ? Math.round((buf[i + c] * prev + rgb[c] * add * (1 - prev)) / out) : rgb[c];
  buf[i + 3] = Math.round(out * 255);
}

// Fibers: thin, slightly curved, fading at the ends.
for (let f = 0; f < 420; f++) {
  let x = rnd() * N, y = rnd() * N, ang = rnd() * Math.PI * 2;
  const len = 18 + rnd() * 90, bend = (rnd() - 0.5) * 0.05, alpha = 26 + rnd() * 46;
  for (let s = 0; s < len; s++) {
    const fade = Math.sin((s / len) * Math.PI);
    plot(x, y, [255, 254, 249], alpha * fade);
    x += Math.cos(ang); y += Math.sin(ang); ang += bend;
  }
}
// Tiny warm flecks.
for (let k = 0; k < 70; k++) {
  const x = rnd() * N, y = rnd() * N, a = 40 + rnd() * 60;
  plot(x, y, [168, 150, 120], a);
  if (rnd() < 0.4) plot(x + 1, y, [168, 150, 120], a * 0.6);
}
const out = path.join(__dirname, '..', 'assets', 'washi.webp');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${N}x${N}`, '-i', '-', '-lossless', '1', out], { input: buf });
console.log('wrote', out);
