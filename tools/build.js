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
  "010bacbf9d5036f7558695618084ce6c": "assets/bg-topo.webp",
  "99cb99de82ed61c988c9a80fe8f2fb90": "assets/logo-mountain.webp",
  "3b87fb250a686f592abddf1d7929424c": "assets/track-cover.webp",
  "a378f43a05d4124142e84b4ac01885fe": "assets/hero-poster.webp",
  "625c720a8950450a578a8ee1de40d8b9": "assets/work-evidence.svg",
  "3b5f22f71158f3815cefdbb1c3cf66f2": "assets/work-ai-standard.svg",
  "6969f0866d59a68c2d674a4ed0d70e20": "assets/work-enablement.svg",
  "313d4143aabfcc90c7d3d87433b2aed8": "assets/work-migration.svg",
  "c3fe8825c023819a4d960e157c94c7cd": "assets/work-securedev.svg",
  "2fa6abb27397ba5aa2222c98759fc44c": "assets/approach-system.svg",
  "5b745b5941d122c68afaff451fade4f8": "assets/approach-shared.svg",
  "22de51a210b6659b1f93a221fb84cc8e": "assets/approach-decision.svg",
  "2d8607db39b3308f61d413a6845bde88": "assets/icon-banking.webp",
  "dc18bd209393014f1ee6f209f4a6d8f5": "assets/icon-insurance.webp",
  "6e757c3502ea6cf78701968c4eb19057": "assets/icon-beauty.webp",
  "c78eaef20efca6b30d9d0c6e8460ea92": "assets/icon-grocery.webp",
  "74f109ea85044b85cdd8095db588e1d4": "assets/icon-telecom.webp",
  "3159d5df4b3c4d8f53a8ac761598dc3a": "assets/icon-gaming.webp",
  "21f5931d4f7e4063d56095fecdfc613c": "assets/icon-cloud.webp",
  "8442f3ca21abf64702488e3d67ce399d": "assets/icon-datacenter.webp",
  "3f5c8a8555059b0b40c4b5fbf9d8ec85": "assets/logo-signature.webp",
  "11a29463c5a4146d4ba61944fded2723": "assets/paper-white.webp",
  "9bdec23150a5e336244130a3dc3de770": "assets/paper-mask.webp",
  "b3a1907df41a6bf570eb5a69b37ebbfc": "assets/washi.webp",
  "8dad07a8a984ef5ac4efacfe031593d2": "Nikita-Page-Resume.pdf",
  "fd6c4d19b1fd4c298d9684f30dfe05ee": "assets/hero-sketch.webp",
  "92434a94f618a14baa1c6650adf268a0": "assets/hero-paint.webp"
};

// Link previews (LinkedIn, Slack, iMessage, email) and the browser-tab icon.
const SITE = 'https://www.nikita.page/';
const SHARE_DESC = 'Technology and risk leader at Microsoft. I bring clarity to complex technology decisions, working with engineers, aligning stakeholders, and helping leaders decide what happens next.';
const SHARE = `
<meta name="description" content="${SHARE_DESC}">
<link rel="canonical" href="${SITE}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}">
<meta property="og:site_name" content="Nikita Page">
<meta property="og:title" content="Nikita Page | Security and technology leadership">
<meta property="og:description" content="${SHARE_DESC}">
<meta property="og:image" content="${SITE}assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Pencil sketch of Nikita Page beside the title I bring clarity to complex technology decisions.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}assets/og-image.jpg">
<link rel="icon" type="image/png" sizes="64x64" href="assets/favicon-64.png">
<link rel="apple-touch-icon" href="assets/favicon-180.png">`;

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
    .replace(/href="Resume\.dc\.html"/g, 'href="Nikita-Page-Resume.pdf" target="_blank" rel="noopener"');   // the designed PDF resume
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
<meta name="viewport" content="width=device-width, initial-scale=1">${file === 'Main.dc.html' ? SHARE : ''}
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
        items[j].style.setProperty('--a', (1 - clamp(Math.abs(top + items[j].offsetHeight / 2 - vh * 0.5) / (vh * 0.45))).toFixed(3));
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
  function npContact(form) {
    var btn = form.querySelector('.ct-btn'), status = form.querySelector('.ct-status');
    function onSubmit(e) {
      e.preventDefault();
      if (form._honey && form._honey.value) return;
      var data = {}; [].forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.value; });
      btn.disabled = true; status.className = 'ct-status'; status.textContent = 'Sending…';
      fetch('https://formsubmit.co/ajax/connect@nikita.page', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'failed'); }); })
        .then(function () { form.reset(); status.className = 'ct-status ok'; status.textContent = 'Thanks, your message is on its way.'; })
        .catch(function (err) {   // show the service's own message (e.g. the one-time activation notice) when there is one
          var why = err && err.message && err.message !== 'failed' && !/fetch/i.test(err.message) ? err.message + ' ' : '';
          status.className = 'ct-status err'; status.textContent = why + 'You can also email connect@nikita.page.'; })
        .then(function () { btn.disabled = false; });
    }
    form.addEventListener('submit', onSubmit);
    return function () { form.removeEventListener('submit', onSubmit); };
  }
  if ($('contact')) npContact($('contact'));
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
        var pg = it.querySelector('.xl-prog'); if (pg) pg.classList.toggle('is-on', v === 'prog');
      });
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { touched = true; f = k; render(); }); });
    views.forEach(function (b) { b.addEventListener('click', function () { touched = true; v = b.getAttribute('data-v'); render(); }); });
    // One gentle flip when the section first comes into view, so the toggle explains itself.
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || hinted) return;
      hinted = true;
      setTimeout(function () { if (!touched) { v = 'prog'; render(); } }, 1600);
    }, { threshold: 0.5 });
    io.observe(container);
    render();
    return function () { io.disconnect(); };
  }
  if ($('xlat')) npXlat($('xlat'));
  function npReveal(scope) {
    if (!scope || !('IntersectionObserver' in window)) return;
    var els = [].slice.call(scope.querySelectorAll('[data-reveal]'));
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: 0.2 });
    els.forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }
  npReveal(root);
  function npFlow(el) {
    if (!el) return;
    var steps = [].slice.call(el.querySelectorAll('.fl-step')), n = steps.length, cur = 1, auto = true, inView = false, timer = 0, dead = false;
    function set(k, user) {
      cur = k; el.setAttribute('data-step', String(k));
      steps.forEach(function (st, i) { st.setAttribute('aria-selected', i + 1 === k ? 'true' : 'false'); });
      if (user) { auto = false; el.classList.remove('fl-auto'); }
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (!auto) return;
      var bar = steps[cur - 1].querySelector('.fl-bar');
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      timer = setTimeout(function () { if (dead) return; if (auto && inView) set(cur % n + 1); else restart(); }, 6500);
    }
    steps.forEach(function (st, i) { st.addEventListener('click', function () { set(i + 1, true); }); });
    el.classList.add('fl-armed', 'fl-auto');
    if (window.matchMedia && window.matchMedia('(max-width:767px)').matches) {
      auto = false; el.classList.remove('fl-auto');
      var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) set(steps.indexOf(e.target) + 1, true); }); }, { rootMargin: '-62% 0px -18% 0px' });
      steps.forEach(function (st) { sio.observe(st); });
    }
    var io = new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (inView && !el.classList.contains('fl-seen')) { el.classList.add('fl-seen'); set(cur); }
    }, { threshold: 0.35 });
    io.observe(el);
  }
  npFlow($('flow'));
  function npMobileInit(root) {
    if (!root || !window.matchMedia || !window.matchMedia('(max-width:767px)').matches) return function () {};
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var words = [].slice.call(root.querySelectorAll('.ms-text .w'));
    var ms = root.querySelector('[data-mstory="words"]'), mn = root.querySelector('[data-mstory="nums"]');
    var stats = mn ? [].slice.call(mn.querySelectorAll('.mn-stat')) : [], dots = mn ? [].slice.call(mn.querySelectorAll('.mn-dots i')) : [];
    var shown = -1, raf = 0;
    function prog(sec) { var r = sec.getBoundingClientRect(), vh = root.clientHeight; return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh))); }
    function count(stat) {
      var val = stat.querySelector('.mn-val'), to = +stat.getAttribute('data-to'), t0 = 0;
      if (reduce) { val.textContent = to; return; }
      function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 900); val.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    }
    var mh = root.querySelector('[data-mstory="hero"]'), mj = root.querySelector('[data-mstory="journey"]');
    var jcards = mj ? [].slice.call(mj.querySelectorAll('.mj-card')) : [], jbig = mj ? mj.querySelector('.mj-big-v') : null, jtrack = mj ? mj.querySelector('.mj-track') : null, jlast = -1;
    function seg(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function heroFrame() {
      if (!mh) return;
      var p = reduce ? 1 : prog(mh), z = ease(seg(p, 0.28, 0.72)), st = mh.style;
      st.setProperty('--s', (3.2 - 2.2 * z).toFixed(4));
      st.setProperty('--tx', (-15 * (1 - z)).toFixed(3) + 'vw');
      var rr = ease(seg(p, 0.06, 0.5)) * 130;
      st.setProperty('--r', rr.toFixed(2));
      st.setProperty('--po', rr > 0.5 ? '1' : '0');
      st.setProperty('--o1', (1 - seg(p, 0.02, 0.18)).toFixed(3));
      st.setProperty('--o2', ease(seg(p, 0.6, 0.74)).toFixed(3));
      st.setProperty('--o2b', ease(seg(p, 0.65, 0.79)).toFixed(3));
      st.setProperty('--o2c', ease(seg(p, 0.7, 0.84)).toFixed(3));
      st.setProperty('--o3', ease(seg(p, 0.78, 0.9)).toFixed(3));
      st.setProperty('--o4', ease(seg(p, 0.84, 0.96)).toFixed(3));
    }
    function journeyFrame() {
      if (!mj || !jtrack) return;
      var lc = jcards[jcards.length - 1], p = prog(mj), max = Math.max(0, lc.offsetLeft + lc.offsetWidth + 28 - root.clientWidth), q = seg(p, 0.05, 0.92);
      mj.style.setProperty('--jx', (-max * ease(q)).toFixed(1) + 'px');
      mj.style.setProperty('--jp', q.toFixed(3));
      var k = Math.min(jcards.length - 1, Math.round(ease(q) * (jcards.length - 1)));
      if (k !== jlast) { jcards.forEach(function (c, i) { c.classList.toggle('on', i === k); }); if (jbig) jbig.textContent = jcards[k].getAttribute('data-big'); jlast = k; }
    }
    function frame() {
      raf = 0;
      heroFrame(); journeyFrame();
      if (ms) { var n = Math.round(prog(ms) * 1.25 * words.length); words.forEach(function (w, i) { w.classList.toggle('on', reduce || i < n); }); }
      if (mn && stats.length) {
        var k = Math.min(stats.length - 1, Math.floor(prog(mn) * stats.length * 0.999));
        if (mn.getBoundingClientRect().top > root.clientHeight * 0.5) k = -1;
        if (k !== shown) {
          stats.forEach(function (st, i) { st.classList.toggle('on', i === k); st.classList.toggle('past', i < k); });
          dots.forEach(function (d, i) { d.classList.toggle('on', i === k); });
          if (k >= 0) count(stats[k]);
          shown = k;
        }
      }
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(frame); }
    root.addEventListener('scroll', onScroll, { passive: true }); frame();
    // swipe rows: which card is centred
    var tracks = [].slice.call(root.querySelectorAll('[data-mw]')), offs = [];
    tracks.forEach(function (tr) {
      var cards = [].slice.call(tr.children), ds = [].slice.call(tr.parentNode.querySelectorAll('.mw-dots i'));
      function upd() { var c = tr.scrollLeft + tr.clientWidth / 2, best = 0, bd = 1e9; cards.forEach(function (cd, i) { var d = Math.abs(cd.offsetLeft + cd.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } }); cards.forEach(function (cd, i) { cd.classList.toggle('on', i === best); }); ds.forEach(function (d, i) { d.classList.toggle('on', i === best); }); }
      tr.addEventListener('scroll', upd, { passive: true }); upd(); offs.push(function () { tr.removeEventListener('scroll', upd); });
    });
    // rise-in: timeline cards and section headings
    root.querySelectorAll('section h2, section .serif[style*="font-size: 18px"], .tlx-edu, .bey-k').forEach(function (el) { if (!el.closest('.m-story')) el.classList.add('m-rise'); });
    root.classList.add('m-armed');
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('m-in'); io.unobserve(e.target); } }); }, { root: root, rootMargin: '0px 0px -12% 0px' });
    root.querySelectorAll('.m-rise, .tlx-item').forEach(function (el) { io.observe(el); });
    return function () { root.removeEventListener('scroll', onScroll); io.disconnect(); offs.forEach(function (f) { f(); }); root.classList.remove('m-armed'); };
  }
  npMobileInit(root);
  function npInd(grid) {
    if (!grid) return;
    document.addEventListener('click', function (e) { var pop = e.target.closest && e.target.closest('.ind-pop'); if (pop) { pop.parentNode.open = false; return; } if (!e.target.closest || !e.target.closest('.ind-d')) grid.querySelectorAll('.ind-d[open]').forEach(function (d) { d.open = false; }); });
    grid.addEventListener('toggle', function (e) { var d = e.target; if (d.open) grid.querySelectorAll('.ind-d[open]').forEach(function (o) { if (o !== d) o.open = false; }); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') grid.querySelectorAll('.ind-d[open]').forEach(function (d) { d.open = false; }); });
  }
  npInd(chips);
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
fs.writeFileSync(out + '/index.html', convert('Main.dc.html', 'Nikita Page | Technology programs, risk and applied AI', script));
// Older links to resume.html forward to the PDF resume.
fs.writeFileSync(out + '/resume.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Nikita Page - Resume</title>' +
  '<meta http-equiv="refresh" content="0; url=Nikita-Page-Resume.pdf"></head><body><p><a href="Nikita-Page-Resume.pdf">Open the resume (PDF)</a></p></body></html>\n');
console.log('wrote index.html and resume.html');
