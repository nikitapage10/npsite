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
  "b5360270dc6eb750d2b86e9442880db9": "assets/logo-kpmg.webp",
  "5c7caef4d028e1be7162fe6600842a59": "assets/logo-verizon.webp",
  "6e6e4ee7241539803da1c1f1ca6c7815": "assets/logo-microsoft.webp",
  "04f85a432abd15b9cac3cce0bba4b0e4": "assets/logo-pennstate.webp",
  "6747b2e537495b8eb81140492364b6fa": "assets/place-ukraine.webp",
  "9cc050a7dc10fa2bfe350bce49462615": "assets/place-denver.webp",
  "7aa36a380905ff8f5c8903141063361a": "assets/place-newyork.webp",
  "c235aa94a0af30c07212e4d57f2261d5": "assets/bg-topo.webp",
  "99cb99de82ed61c988c9a80fe8f2fb90": "assets/logo-mountain.webp",
  "3b87fb250a686f592abddf1d7929424c": "assets/track-cover.webp",
  "a378f43a05d4124142e84b4ac01885fe": "assets/hero-poster.webp",
  "3415aa425ddd9e431d0abaa0a737ff9a": "assets/work-evidence.webp",
  "31432c3e8a34120a2325c508c727bb9d": "assets/work-enablement.webp",
  "4cefba8785268eb628d6f7fdc83338a0": "assets/work-migration.webp",
  "7bdd5f0eaca0940a9cea751541684b90": "assets/work-securedev.webp",
  "1ca8eacf17c61511b80495ad3bfcfec2": "assets/approach-system.webp",
  "5a799255273e51b591df1fc25d8fe70b": "assets/approach-shared.webp",
  "81976d1b13c9fe451785a1a34783cfb9": "assets/approach-decision.webp",
  "2d8607db39b3308f61d413a6845bde88": "assets/icon-banking.webp",
  "dc18bd209393014f1ee6f209f4a6d8f5": "assets/icon-insurance.webp",
  "6e757c3502ea6cf78701968c4eb19057": "assets/icon-beauty.webp",
  "c78eaef20efca6b30d9d0c6e8460ea92": "assets/icon-grocery.webp",
  "74f109ea85044b85cdd8095db588e1d4": "assets/icon-telecom.webp",
  "3159d5df4b3c4d8f53a8ac761598dc3a": "assets/icon-gaming.webp",
  "21f5931d4f7e4063d56095fecdfc613c": "assets/icon-cloud.webp",
  "8442f3ca21abf64702488e3d67ce399d": "assets/icon-datacenter.webp",
  "3f5c8a8555059b0b40c4b5fbf9d8ec85": "assets/logo-signature.webp",
  "037b59ccffbaf6bee1fac4662a5de4a2": "assets/paper-white.webp",
  "9bdec23150a5e336244130a3dc3de770": "assets/paper-mask.webp",
  "b3a1907df41a6bf570eb5a69b37ebbfc": "assets/washi.webp",
  "8dad07a8a984ef5ac4efacfe031593d2": "Nikita-Page-Resume.pdf",
  "1304cfc3e2ce87a20acb009b002041a6": "assets/hero-sketch.webp",
  "5db6549ef343e29132bd97ed73ca7dfd": "assets/hero-paint.webp"
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
    .replace(/\{\{paperOpacity\}\}/g, '0.35')
    .replace(/\{\{microOp\}\}/g, '1').replace(/\{\{washiOp\}\}/g, '0').replace(/\{\{parchOp\}\}/g, '0').replace(/\{\{coldOp\}\}/g, '0').replace(/\{\{linenOp\}\}/g, '0').replace(/\{\{grainOp\}\}/g, '0')
    .replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => { if (!BLOBS[id]) throw new Error('unmapped blob ' + id); return BLOBS[id]; })
    .replace(/href="Resume\.dc\.html"/g, 'href="resume.html"');
  // Drafts (e.g. unapproved testimonials) live on the design canvas only.
  body = body.replace(/<figure [^>]*data-draft="true"[^>]*>[\s\S]*?<\/figure>\n?/g, '');
  body = body.replace(/<a class="track" data-spotify="([^"]+)"[\s\S]*?<\/a>/g, (_, id) => '<iframe class="track-embed" title="Spotify player: Take What You Want (feat. Manno)" src="https://open.spotify.com/embed/track/' + id + '?utm_source=generator&amp;theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>');
  body = body.replace(/<img (?![^>]*\bloading=)(?![^>]*class="brand-logo")/g, '<img loading="lazy" decoding="async" ');
  // Live SVG turbulence filters repaint every frame under the animated canvases; use pre-rendered images instead
  // (assets/grain-tile.webp and assets/look-paper.webp are renders of the np-micro and np-paper-mottle/grain filters).
  body = body.replace(/<svg aria-hidden="true" style="position: absolute; inset: 0; width: 100%; height: 100%; mix-blend-mode: soft-light;[\s\S]*?<\/svg>/,
    '<div aria-hidden="true" style="position: absolute; inset: 0; background: url(assets/grain-tile.webp) repeat; background-size: 512px; mix-blend-mode: soft-light; opacity: 0.35; pointer-events: none"></div>');
  body = body.replace(/<svg aria-hidden="true" style="position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; mix-blend-mode: multiply; opacity: 0.5; pointer-events: none">[\s\S]*?<\/svg>/,
    '<img src="assets/look-paper.webp" alt="" aria-hidden="true" style="position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; opacity: 0.5; pointer-events: none">');
  if (/\{\{/.test(body)) throw new Error('unconverted hole in ' + file);
  const opens = (body.match(/<div[\s>]/g) || []).length, closes = (body.match(/<\/div>/g) || []).length;
  if (opens !== closes) throw new Error(file + ': ' + opens + ' <div> vs ' + closes + ' </div>, markup is unbalanced');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://db.onlinewebfonts.com" crossorigin>${file === 'Main.dc.html' ? '\n<link rel="preload" as="image" href="assets/hero-sketch.webp">\n<link rel="preload" as="image" href="assets/hero-paint.webp">' : ''}
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

// The hero ink effect lives in its own module; strip its header comments before inlining.
const heroInk = fs.readFileSync(path.join(__dirname, 'heroink.js'), 'utf8').replace(/^\/\/.*\n/gm, '');
const script = `<script>
(function () {
${heroInk}
  var $ = function (n) { return document.querySelector('[data-np="' + n + '"]'); };
  var root = $('root'), track = $('track'), zoom = $('zoom');
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
    var path = $('path');
    if (path) {
      var vh = root.clientHeight, rootTop = root.getBoundingClientRect().top;
      var box = path.getBoundingClientRect();
      path.style.setProperty('--t', String(clamp((vh * 0.6 - (box.top - rootTop)) / box.height)));
      var items = path.querySelectorAll('.tlx-item');
      for (var j = 0; j < items.length; j++) {
        var top = items[j].getBoundingClientRect().top - rootTop;
        items[j].style.setProperty('--e', String(easeOut(clamp((vh * 0.9 - top) / (vh * 0.35)))));
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
    var testis = $('testis'); if (testis) { var tilt = [1.8, -2.4, 1.1]; testis.querySelectorAll('.testi').forEach((el, k) => { var qt = easeOut(clamp((p - 0.34 - k * 0.14) / 0.24)); el.style.opacity = String(qt); el.style.transform = 'translate(' + (-300 * (1 - qt)) + 'px,' + (-220 * (1 - qt)) + 'px) scale(' + (0.6 + 0.4 * qt) + ') rotate(' + (tilt[k] * qt) + 'deg)'; }); var lbl = testis.querySelector('.testis-k'); if (lbl) lbl.style.opacity = String(easeOut(clamp((p - 0.34) / 0.24))); }
  }
  function npInk(canvas, video) {
    var MASK = [239, 233, 223], LIFETIME = 1100, R_START = 10, R_VARY = 0.45, STEP = 10, MAX = 140, SEG = 24;
    var WOB = [0.14, 0.08, 0.05], INNER = 0.2, STOPS = [0.95, 0.88, 0];
    var band = canvas.parentElement, ctx = canvas.getContext('2d');
    var stamps = [], running = false, last = null, w = 0, h = 0, brush = 120, lastUser = 0, inView = false, dead = false;
    function paper() { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = pattern || 'rgb(' + MASK.join(',') + ')'; ctx.fillRect(0, 0, w, h); }
    var pattern = null, tex = new Image();
    tex.onload = function () { pattern = ctx.createPattern(tex, 'repeat'); if (!running) paper(); };
    if (canvas.getAttribute('data-tex')) tex.src = canvas.getAttribute('data-tex');
    function resize() {
      var dpr = 1, rect = band.getBoundingClientRect();   // soft ink edges do not need high-density pixels
      w = rect.width; h = rect.height; brush = Math.max(80, Math.min(160, w * 0.08));
      var art = band.querySelector('.look-art');
      if (art) { var sc = Math.max(w / 1672, h / 941), aw = 1672 * sc, ah = 941 * sc; art.style.width = aw + 'px'; art.style.height = ah + 'px'; art.style.left = ((w - aw) * 0.5) + 'px'; art.style.top = ((h - ah) * 0.28) + 'px'; }
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
      var spots = band.querySelectorAll('.ann');
      if (spots.length && Math.random() < 0.65) { var sp = spots[Math.floor(Math.random() * spots.length)].getBoundingClientRect(), bb = band.getBoundingClientRect(); x0 = sp.left - bb.left - dir * w * 0.12; y0 = sp.top - bb.top; }
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
  function npDeck(container) {
    var cards = [].slice.call(container.querySelectorAll('.deck-card'));
    var tabs = [].slice.call(container.querySelectorAll('.deck-tab'));
    var stack = container.querySelector('.deck-stack'), count = container.querySelector('.deck-count');
    var n = cards.length, active = 0, auto = true, hover = false, inView = false, timer = 0, dead = false;
    function pad(x) { return (x < 10 ? '0' : '') + x; }
    function fit() {
      var h = 0;
      cards.forEach(function (c) { c.style.minHeight = '0'; h = Math.max(h, c.offsetHeight); });
      cards.forEach(function (c) { c.style.minHeight = h + 'px'; });
      stack.style.height = h + 'px';
    }
    function set(i, user) {
      active = (i + n) % n;
      cards.forEach(function (c, k) {
        var pos = (k - active + n) % n;
        c.setAttribute('data-pos', String(Math.min(pos, 3) === 3 || pos === n - 1 ? 3 : pos));
        c.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === active ? 'true' : 'false'); });
      if (count) count.textContent = pad(active + 1) + ' / ' + pad(n);
      if (user) { auto = false; container.classList.remove('autoplay'); }
      if (user && window.innerWidth < 900) {
        var row = container.querySelector('.deck-tabs'), tab = tabs[active];
        if (row && tab) row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
        var top = container.getBoundingClientRect().top, sc = container.parentNode;
        while (sc && sc.nodeType === 1 && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentNode;
        if (top < 72 && sc && sc.nodeType === 1) sc.scrollTo({ top: sc.scrollTop + top - sc.getBoundingClientRect().top - 72, behavior: 'smooth' });
      }
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (!auto) return;
      var bar = tabs[active] && tabs[active].querySelector('.deck-tab-bar');
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      timer = setTimeout(function () { if (!dead && auto && inView && !hover) set(active + 1); else restart(); }, 7000);
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { set(k, true); }); });
    cards.forEach(function (c, k) { c.addEventListener('click', function () { if (k !== active) set(k, true); }); });
    container.querySelector('.deck-prev').addEventListener('click', function () { set(active - 1, true); });
    container.querySelector('.deck-next').addEventListener('click', function () { set(active + 1, true); });
    container.addEventListener('mouseenter', function () { hover = true; });
    container.addEventListener('mouseleave', function () { hover = false; });
    var sx = null;
    stack.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    stack.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) set(active + (dx < 0 ? 1 : -1), true);
    });
    var io = new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.35 });
    io.observe(container);
    var ro = new ResizeObserver(fit); ro.observe(stack.parentNode);
    container.classList.add('autoplay');
    fit(); set(0);
    return function () { dead = true; clearTimeout(timer); io.disconnect(); ro.disconnect(); };
  }
  if ($('deck')) npDeck($('deck'));
  function npMenu(nav, menu) {
    var btn = nav.querySelector('.menu-btn');
    if (!btn || !menu) return function () {};
    function toggle(open) { menu.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    function onBtn() { toggle(btn.getAttribute('aria-expanded') !== 'true'); }
    function onMenu(e) { if (e.target.closest('a')) toggle(false); }
    function onKey(e) { if (e.key === 'Escape') toggle(false); }
    btn.addEventListener('click', onBtn); menu.addEventListener('click', onMenu); document.addEventListener('keydown', onKey);
    return function () { btn.removeEventListener('click', onBtn); menu.removeEventListener('click', onMenu); document.removeEventListener('keydown', onKey); };
  }
  npMenu($('nav'), $('menu'));
  function npCount(scope) {
    var els = [].slice.call(scope.querySelectorAll('[data-count]')), t0 = performance.now(), D = 1400;
    function step(now) {
      var k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      els.forEach(function (el) { el.textContent = String(Math.round(+el.getAttribute('data-count') * e)); });
      if (k < 1) requestAnimationFrame(step);
    }
    els.forEach(function (el) { el.textContent = '0'; });
    setTimeout(function () { requestAnimationFrame(step); }, 500);
  }
  npCount(panel);
  function npXlat(container) {
    var tabs = [].slice.call(container.querySelectorAll('.xl-tab'));
    var views = [].slice.call(container.querySelectorAll('.xl-v'));
    var items = [].slice.call(container.querySelectorAll('.xl-f'));
    var f = 0, v = 'eng', touched = false, hinted = false;
    function render() {
      container.setAttribute('data-v', v);
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === f ? 'true' : 'false'); });
      views.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false'); });
      items.forEach(function (it, k) {
        it.classList.toggle('is-on', k === f);
        it.setAttribute('aria-hidden', k === f ? 'false' : 'true');
        it.querySelector('.xl-eng').classList.toggle('is-on', v === 'eng');
        it.querySelector('.xl-exec').classList.toggle('is-on', v === 'exec');
      });
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { touched = true; f = k; render(); }); });
    views.forEach(function (b) { b.addEventListener('click', function () { touched = true; v = b.getAttribute('data-v'); render(); }); });
    // One gentle flip when the section first comes into view, so the toggle explains itself.
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || hinted) return;
      hinted = true;
      setTimeout(function () { if (!touched) { v = 'exec'; render(); } }, 1600);
    }, { threshold: 0.5 });
    io.observe(container);
    render();
    return function () { io.disconnect(); };
  }
  if ($('xlat')) npXlat($('xlat'));
  var raf = 0;
  function onScroll() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; applyScroll(); }); }
  root.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  applyScroll();

  var heroInk = $('heroink');
  if (heroInk) npHeroInk(heroInk, heroInk.closest('section'), $('nav'), heroInk.getAttribute('data-sketch'), heroInk.getAttribute('data-paint'));
})();
</script>`;

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(out + '/index.html', convert('Main.dc.html', 'Nikita Page | Security and technology leadership', script));
fs.writeFileSync(out + '/resume.html', convert('Resume.dc.html', 'Nikita Page — Resume', ''));
console.log('wrote index.html and resume.html');
