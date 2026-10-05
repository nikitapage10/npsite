// Builds index.html and resume.html at the repo root from the design/*.dc.html sources.
// Usage: node tools/build.js
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'design') + '/';
const out = process.argv[2] || path.join(__dirname, '..');
// Canvas asset ids -> files in this repo.
const BLOBS = {
  "f1ef867ba998411a2993a50cc89ab517": "hero-loop.mp4",
  "788ba417914b44bc1ffcae86b9596440": "assets/presenting.webp",
  "69bcc0f2cbdbc380f72e5818cb2568e0": "assets/logo-kpmg.webp",
  "26bee8262bf1481e4decc1f906e60f6e": "assets/logo-verizon.webp",
  "db1050991f56983ccfd09adedc1a08bd": "assets/logo-microsoft.webp",
  "64f1445fea8ba8d46809934864d62ddd": "assets/logo-pennstate.webp",
  "6747b2e537495b8eb81140492364b6fa": "assets/place-ukraine.webp",
  "9cc050a7dc10fa2bfe350bce49462615": "assets/place-denver.webp",
  "7aa36a380905ff8f5c8903141063361a": "assets/place-newyork.webp",
  "c235aa94a0af30c07212e4d57f2261d5": "assets/bg-topo.webp",
  "035e867d91cf354a165c1e00cba24dcf": "assets/logo-wordmark.webp"
};

function convert(file, title, extraScript) {
  let s = fs.readFileSync(src + file, 'utf8');
  const helmet = s.match(/<helmet>([\s\S]*?)<\/helmet>/)[1].replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => BLOBS[id] || _);
  let body = s.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1].replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  body = body
    .replace(/ref="\{\{set(\w+)\}\}"/g, (_, n) => `data-np="${n.toLowerCase()}"`)
    .replace(/ onScroll="\{\{onScroll\}\}"/g, '')
    .replace(/muted="\{\{yes\}\}"/g, 'muted')
    .replace(/playsInline="\{\{yes\}\}"/g, 'playsinline')
    .replace(/autoPlay="\{\{yes\}\}"/g, 'autoplay')
    .replace(/loop="\{\{yes\}\}"/g, 'loop')
    .replace(/\{\{paperOpacity\}\}/g, '0.8')
    .replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => { if (!BLOBS[id]) throw new Error('unmapped blob ' + id); return BLOBS[id]; })
    .replace(/href="Resume\.dc\.html"/g, 'href="resume.html"');
  if (/\{\{/.test(body)) throw new Error('unconverted hole in ' + file);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${helmet.trim()}
</head>
<body>
${body.trim()}
${extraScript || ''}
</body>
</html>
`;
}

const script = `<script>
(function () {
  var $ = function (n) { return document.querySelector('[data-np="' + n + '"]'); };
  var root = $('root'), track = $('track'), zoom = $('zoom'), video = $('video');
  var hero = $('hero'), panel = $('panel'), intro = $('intro'), chips = $('chips'), quote = $('quote');
  function enter(el, q, dx, dy) {
    el.style.opacity = String(q);
    el.style.transform = 'translate(' + (dx * (1 - q)) + 'px,' + (dy * (1 - q)) + 'px) scale(' + (0.6 + 0.4 * q) + ')';
  }
  var ZOOM_DEPTH = 1.9;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  var easeInOut = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  function applyScroll() {
    var path = $('path'), hsStage = $('hsstage'), hsRoll = $('hsroll');
    var hsBlocks = [$('hsblock0'), $('hsblock1'), $('hsblock2'), $('hsblock3')];
    if (path && hsStage && window.innerWidth >= 768) {
      var vh = root.clientHeight;
      var top = path.getBoundingClientRect().top - root.getBoundingClientRect().top;
      var f = clamp(-top / Math.max(1, path.offsetHeight - vh)) * 4 - 0.0001;
      var i = Math.max(0, Math.min(3, Math.floor(f)));
      var t = i < 3 ? easeInOut(clamp((f - i - 0.8) / 0.2)) : 0;
      var r = i + t;
      hsStage.style.setProperty('--r', String(r));
      if (hsRoll) hsRoll.style.transform = 'translateY(' + (-r * (hsRoll.firstElementChild ? hsRoll.firstElementChild.offsetHeight : 0)) + 'px)';
      for (var j = 0; j < 4; j++) {
        var el = hsBlocks[j];
        if (!el) continue;
        var local = f - j;
        var exit = j < 3 ? clamp((local - 0.82) / 0.16) : 0;
        el.style.setProperty('--lp', String(clamp(local / 0.55)));
        el.style.opacity = String(local < 0 ? 0 : 1 - exit);
        el.style.transform = 'translateY(' + (-48 * exit) + 'px)';
      }
    }
    var total = Math.max(1, track.offsetHeight - root.clientHeight);
    var p = clamp(root.scrollTop / total);
    var roots = $('roots'), arc = $('arc'), arcMask = $('arcmask'), arcDot = $('arcdot');
    if (roots) {
      var rvh = root.clientHeight, rtop = roots.getBoundingClientRect().top - root.getBoundingClientRect().top;
      var r = easeInOut(clamp((rvh * 0.85 - rtop) / (rvh * 0.55)));
      arcMask.style.strokeDashoffset = String(1 - r);
      roots.style.setProperty('--r', String(r));
      var pt = arc.getPointAtLength(arc.getTotalLength() * r);
      arcDot.setAttribute('cx', pt.x); arcDot.setAttribute('cy', pt.y);
      arcDot.setAttribute('opacity', r > 0.02 && r < 0.98 ? '1' : '0');
    }
    var nav = $('nav'), solid = root.scrollTop > total + root.clientHeight * 0.6;
    nav.style.backgroundColor = solid ? 'rgba(255,255,255,0.92)' : 'transparent';
    nav.style.boxShadow = solid ? '0 1px 0 #e5e7eb' : 'none';
    nav.style.backdropFilter = solid ? 'blur(8px)' : 'none';
    zoom.style.transform = 'scale(' + (1 + (ZOOM_DEPTH - 1) * easeInOut(p)) + ')';
    var out = clamp(p / 0.35);
    hero.style.opacity = String(1 - out);
    hero.style.transform = 'translateY(' + (-60 * easeOut(out)) + 'px)';
    panel.style.opacity = String(1 - clamp(p / 0.3));
    panel.style.transform = 'translateY(' + (140 * easeOut(clamp(p / 0.4))) + 'px)';
    enter(intro, easeOut(clamp((p - 0.2) / 0.4)), -280, -220);
    chips.style.setProperty('--q', String(clamp((p - 0.4) / 0.4)));
    enter(quote, easeOut(clamp((p - 0.58) / 0.36)), -360, -280);
  }
  function npInk(canvas, video) {
    var MASK = [239, 233, 223], LIFETIME = 1100, R_START = 10, R_VARY = 0.45, STEP = 10, MAX = 240, SEG = 36;
    var WOB = [0.14, 0.08, 0.05], INNER = 0.2, STOPS = [0.95, 0.88, 0];
    var band = canvas.parentElement, ctx = canvas.getContext('2d');
    var stamps = [], running = false, last = null, w = 0, h = 0, brush = 120, lastUser = 0, inView = false, dead = false;
    function paper() { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgb(' + MASK.join(',') + ')'; ctx.fillRect(0, 0, w, h); }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), rect = band.getBoundingClientRect();
      w = rect.width; h = rect.height; brush = Math.max(80, Math.min(160, w * 0.08));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); paper();
    }
    function carve(x, y, r, seed, alpha) {
      var g = ctx.createRadialGradient(x, y, r * INNER, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,' + STOPS[0] * alpha + ')');
      g.addColorStop(0.5, 'rgba(0,0,0,' + STOPS[1] * alpha + ')');
      g.addColorStop(1, 'rgba(0,0,0,' + STOPS[2] * alpha + ')');
      ctx.fillStyle = g; ctx.beginPath();
      for (var i = 0; i <= SEG; i++) {
        var a = (i / SEG) * Math.PI * 2;
        var wob = 0.78 + WOB[0] * Math.sin(a * 3 + seed) + WOB[1] * Math.sin(a * 5 + seed * 2.1) + WOB[2] * Math.sin(a * 7 + seed * 0.7);
        var px = x + Math.cos(a) * r * wob, py = y + Math.sin(a) * r * wob;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    function addStamp(x, y) {
      if (stamps.length >= MAX) stamps.shift();
      stamps.push({ x: x, y: y, born: performance.now(), seed: Math.random() * Math.PI * 2, rmax: brush * (1 - R_VARY + Math.random() * R_VARY) });
    }
    function stampAlong(x, y) {
      if (!last) addStamp(x, y);
      else {
        var dx = x - last.x, dy = y - last.y, steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / STEP));
        for (var i = 1; i <= steps; i++) addStamp(last.x + dx * i / steps, last.y + dy * i / steps);
      }
      last = { x: x, y: y };
      if (!running) { running = true; requestAnimationFrame(loop); }
    }
    function loop() {
      if (dead) return;
      var now = performance.now();
      paper(); ctx.globalCompositeOperation = 'destination-out';
      for (var i = stamps.length - 1; i >= 0; i--) {
        var t = (now - stamps[i].born) / LIFETIME;
        if (t >= 1) { stamps.splice(i, 1); continue; }
        var r = R_START + (stamps[i].rmax - R_START) * (1 - Math.pow(1 - t, 3));
        carve(stamps[i].x, stamps[i].y, r, stamps[i].seed, 1 - t * t);
      }
      if (stamps.length) requestAnimationFrame(loop); else running = false;
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function onEnter(e) { var p = pos(e); last = p; lastUser = Date.now(); stampAlong(p.x, p.y); }
    function onMove(e) { var p = pos(e); lastUser = Date.now(); stampAlong(p.x, p.y); }
    function onLeave() { last = null; }
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    // Idle strokes, so touch screens and still cursors still see the effect.
    var idle = setInterval(function () {
      if (!inView || Date.now() - lastUser < 3000) return;
      var x0 = w * (0.15 + Math.random() * 0.7), y0 = h * (0.25 + Math.random() * 0.5), dir = Math.random() < 0.5 ? -1 : 1;
      last = null;
      for (var i = 0; i < 22; i++) (function (i) {
        setTimeout(function () { if (!dead) stampAlong(x0 + dir * i * w * 0.012, y0 + Math.sin(i / 3.5) * h * 0.06); }, i * 28);
      })(i);
      setTimeout(function () { last = null; }, 22 * 28 + 10);
    }, 2600);
    var io = new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView && video && video.paused) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); } }, { threshold: 0.2 });
    io.observe(band);
    var ro = new ResizeObserver(resize); ro.observe(band);
    resize();
    if (video) { video.muted = true; var pr0 = video.play(); if (pr0 && pr0.catch) pr0.catch(function () {}); }
    return function () {
      dead = true; clearInterval(idle); io.disconnect(); ro.disconnect();
      canvas.removeEventListener('pointerenter', onEnter); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave);
    };
  }
  if ($('ink')) npInk($('ink'), $('inkvideo'));
  var raf = 0;
  function onScroll() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; applyScroll(); }); }
  root.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  applyScroll();

  video.muted = true;
  function play() { if (video.paused) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); } }
  video.addEventListener('canplay', play);
  document.addEventListener('visibilitychange', play);
  play();
})();
</script>`;

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(out + '/index.html', convert('Main.dc.html', 'Nikita Page', script));
fs.writeFileSync(out + '/resume.html', convert('Resume.dc.html', 'Nikita Page — Resume', ''));
console.log('wrote index.html and resume.html');
