// Builds index.html and resume.html at the repo root from the design/*.dc.html sources.
// Usage: node tools/build.js
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'design') + '/';
const out = process.argv[2] || path.join(__dirname, '..');

function convert(file, title, extraScript) {
  let s = fs.readFileSync(src + file, 'utf8');
  const helmet = s.match(/<helmet>([\s\S]*?)<\/helmet>/)[1];
  let body = s.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1].replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  body = body
    .replace(/ref="\{\{set(\w+)\}\}"/g, (_, n) => `data-np="${n.toLowerCase()}"`)
    .replace(/ onScroll="\{\{onScroll\}\}"/g, '')
    .replace(/muted="\{\{yes\}\}"/g, 'muted')
    .replace(/playsInline="\{\{yes\}\}"/g, 'playsinline')
    .replace(/autoPlay="\{\{yes\}\}"/g, 'autoplay')
    .replace(/loop="\{\{yes\}\}"/g, 'loop')
    .replace(/\{\{paperOpacity\}\}/g, '0.55')
    .replace(/src="\/_blob\/[0-9a-f]+"/g, 'src="hero-loop.mp4"')
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
    var path = $('path');
    if (path) {
      var vh = root.clientHeight, top = path.getBoundingClientRect().top - root.getBoundingClientRect().top;
      path.style.setProperty('--t', String(clamp((vh * 0.92 - top) / (vh * 0.55))));
    }
    var total = Math.max(1, track.offsetHeight - root.clientHeight);
    var p = clamp(root.scrollTop / total);
    var roots = $('roots'), arc = $('arc'), arcMask = $('arcmask'), arcDot = $('arcdot');
    if (roots) {
      var rvh = root.clientHeight, rtop = roots.getBoundingClientRect().top - root.getBoundingClientRect().top;
      var r = easeInOut(clamp((rvh * 0.85 - rtop) / (rvh * 0.55)));
      arcMask.style.strokeDashoffset = String(1 - r);
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
