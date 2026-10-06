// Hero ink effect: the pencil sketch sits at rest; the cursor drops ink blots that reveal the painting.
// Single source of truth. tools/build.js inlines this function into index.html, and
// tools/sync-heroink.js copies its body into the npHeroInk method in design/Main.dc.html.
// canvas: the hero <canvas>; area: element that receives pointer events; nav: the fixed nav (the
// sketch's top construction line is placed just below it); sketchSrc/paintSrc: aligned images;
// opts: optional style overrides (see the defaults below) plus demo: true for a self-drawing stroke when idle.
function npHeroInk(canvas, area, nav, sketchSrc, paintSrc, opts) {
  var gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  if (!gl) { canvas.style.background = 'url(' + sketchSrc + ') 78% 0 / cover'; return function () {}; }
  var IMG_W = 1672, IMG_H = 941, LINE_Y = 0.069;   // image size and the y of the top construction line (fraction)
  // Defaults: watercolor bleed (feathered, wicking edges) at a size between it and the broad wash.
  var O = { brush: 0.1, flow: 0.05, spread: 0.05, life: 7.0, grow: 0.42, stretch: 0.3, warp: 0.6, ragged: 0.3,
    gap: 1.4, sat: 0.4, rim: 0.2, halo: 1.0, soft: 0.14, demo: false };
  for (var key in (opts || {})) O[key] = opts[key];
  function f(x) { return (+x).toFixed(3); }   // number literal for GLSL
  var BRUSH = O.brush, FLOW = O.flow, SPREAD = O.spread, LIFE = O.life, SIM_SCALE = 0.5, MAXS = 48;
  var half = gl.getExtension('OES_texture_half_float'), halfLin = gl.getExtension('OES_texture_half_float_linear');
  var TYPE = half && halfLin ? half.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;

  var vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var noise = 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.07+17.1;a*=.5;}return s;}';

  // Simulation: ink drifts in a slow current, soaks outward along the paper grain, dries unevenly; new blots bloom in.
  var simFS = 'precision highp float;varying vec2 v;' +
    'uniform sampler2D prev;uniform float asp,t,dt,flow,spread,life;uniform vec4 st[' + MAXS + '];' + noise +
    'vec2 curl(vec2 p){float e=.01;return vec2(fbm(p+vec2(0.,e))-fbm(p-vec2(0.,e)),-(fbm(p+vec2(e,0.))-fbm(p-vec2(e,0.))))/(2.*e);}' +
    'void main(){vec2 s=vec2(asp,1.);vec2 P=v*s;' +
    'vec2 vel=(curl(P*2.4+vec2(t*.07,t*.05))+.6*curl(P*5.+vec2(-t*.11,t*.09)+40.))*flow;' +
    'vec2 src=v-vel*dt/s;float m=texture2D(prev,src).r;float r=spread*dt;' +
    'float nb=max(max(texture2D(prev,src+vec2(r,0.)/s).r,texture2D(prev,src-vec2(r,0.)/s).r),max(texture2D(prev,src+vec2(0.,r)/s).r,texture2D(prev,src-vec2(0.,r)/s).r));' +
    'float fib=fbm(P*38.)*.65+fbm(P*9.+5.)*.35;m=max(m,nb*mix(.80,.995,smoothstep(.35,.7,fib))*smoothstep(.05,.5,nb));' +
    'm-=dt/life*(.55+.9*fbm(P*5.));' +
    'for(int i=0;i<' + MAXS + ';i++){if(st[i].z<0.)continue;float age=t-st[i].z;if(age<0.)continue;' +
    'float g2=1.-pow(1.-clamp(age/.7,0.,1.),3.);float R=st[i].w*(g2+' + f(O.grow) + '*min(age,7.5));' +   // grows from nothing, fast at first, then eases   // quick bloom, then keeps creeping outward
    'float amt=1.-smoothstep(6.5,8.5,age);' +   // stop feeding ink after ~6s so it can dry and fade
    'vec2 c=st[i].xy*s;if(length(P-c)>st[i].w*(1.2+' + f(O.grow) + '*min(t-st[i].z,7.5))*(1.6+' + f(O.stretch + O.warp * 0.4) + '))continue;float sd=fract(st[i].z*7.13+float(i)*.618)*100.;' +
    'float ang=h(vec2(sd,1.))*6.283,str=1.+h(vec2(sd,2.))*' + f(O.stretch) + ';' +
    'vec2 lp=(P-c)/st[i].w;lp=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*lp;lp.x/=str;' +
    'lp+=(vec2(fbm(lp*1.7+sd),fbm(lp*1.7+sd+31.))-.5)*' + f(O.warp) + ';' +
    'float d=length(lp)*st[i].w*(1.+' + f(O.ragged) + '*(fbm(lp*3.2+sd+7.)-.5));m=max(m,amt*smoothstep(R,R*.6,d));}' +
    'gl_FragColor=vec4(clamp(m,0.,1.),0.,0.,1.);}';

  // Display: sketch at rest, painting under the ink, darker pigment at the rim and a pale bleed just past it.
  var showFS = 'precision highp float;varying vec2 v;' +
    'uniform sampler2D sketch,paint,mask;uniform vec2 sc,off,tx;uniform float ia,t;' + noise +
    'vec3 sharp(sampler2D s,vec2 p){vec3 c=texture2D(s,p).rgb;vec3 b=(texture2D(s,p+vec2(tx.x,0.)).rgb+texture2D(s,p-vec2(tx.x,0.)).rgb+texture2D(s,p+vec2(0.,tx.y)).rgb+texture2D(s,p-vec2(0.,tx.y)).rgb)*.25;return clamp(c+(c-b)*.6,0.,1.);}' +
    // Above the image top (the image sits lower so its construction line clears the nav), fill with a
    // mirror-tiled patch of blank paper from the sketch; the left frame line carries on upward.
    'float tri(float x){return 1.-abs(fract(x*.5)*2.-1.);}' +
    'vec2 fillUV(vec2 q){return vec2(q.x<.07?q.x:.10+.25*tri((q.x-.10)/.25),.09+.18*tri(-q.y/.18));}' +
    'void main(){vec2 uv=vec2(v.x,1.-v.y);vec2 q=uv*sc+off;vec2 a=vec2(q.x*ia,q.y);vec2 iq=vec2(q.x,max(q.y,0.));vec2 fq=fillUV(q);float fw=1.-smoothstep(-.004,.03,q.y);' +
    'float raw=texture2D(mask,v).r;float g=fbm(a*22.+vec2(t*.12,-t*.09))*.12+n(a*160.)*.05;' +
    'float m=smoothstep(.29-' + f(O.soft / 2) + ',.29+' + f(O.soft / 2) + ',raw+g-.06);float rim=m*(1.-smoothstep(.31,.46,raw+g-.06));' +
    'float halo=smoothstep(.16,.27,raw+g-.06)*(1.-m);' +
    'vec3 sk=mix(sharp(sketch,iq),texture2D(sketch,fq).rgb,fw),pt=mix(texture2D(paint,iq).rgb,texture2D(paint,fq).rgb,fw);float gran=n(a*420.)*.5+n(a*900.)*.5;' +
    'vec3 ink=mix(pt,pt*pt*1.02,' + f(O.rim) + '*rim)*(1.-.06*(gran-.5));vec3 col=mix(sk,ink,m);' +
    'col=mix(col,mix(sk,pt,.35),' + f(O.halo) + '*halo);gl_FragColor=vec4(col,1.);}';

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  function prog(fsrc, names) {
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fsrc));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    var u = {}; names.forEach(function (k) { u[k] = gl.getUniformLocation(p, k); }); return { p: p, u: u };
  }
  var SIM = prog(simFS, ['prev', 'asp', 't', 'dt', 'flow', 'spread', 'life', 'st']);
  var SHOW = prog(showFS, ['sketch', 'paint', 'mask', 'sc', 'off', 'ia', 't', 'tx']);
  if (!gl.getProgramParameter(SHOW.p, gl.LINK_STATUS) || !gl.getProgramParameter(SIM.p, gl.LINK_STATUS)) {
    canvas.style.background = 'url(' + sketchSrc + ') 78% 0 / cover'; return function () {};
  }
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function target(w, h) {
    var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, TYPE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE && TYPE !== gl.UNSIGNED_BYTE) { TYPE = gl.UNSIGNED_BYTE; return target(w, h); }
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { t: tx, f: f, w: w, h: h };
  }
  function image(src, cb) {
    var tx = gl.createTexture(), im = new Image();
    im.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      cb(tx);
    };
    im.src = src;
  }

  var A = null, B = null, sketchT = null, paintT = null, scv = [1, 1], offv = [0, 0];
  // Cover-fit the image to the canvas, leaning right so the figure stays in frame on narrow screens,
  // then shift it vertically so the sketch's top construction line lands just below the nav.
  // Uses untransformed sizes so the scroll zoom never shifts the image; data-scale is the wrapper's resting scale.
  function layout() {
    var w = canvas.clientWidth, hgt = canvas.clientHeight; if (!w || !hgt) return;
    var ra = w / hgt, ia = IMG_W / IMG_H, k = parseFloat(canvas.getAttribute('data-scale')) || 1;
    scv = ra > ia ? [1, ia / ra] : [ra / ia, 1];
    offv[0] = ra > ia ? 0 : (1 - scv[0]) * 0.78;
    var want = (nav ? nav.offsetHeight - 16 : hgt * 0.12) / k;   // px below the canvas top, in canvas units
    offv[1] = Math.min(1 - scv[1], LINE_Y - scv[1] * want / hgt);
  }
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);   // full sharpness on high-density screens
    canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr);
    var w = Math.max(64, Math.round(canvas.clientWidth * SIM_SCALE)), h = Math.max(64, Math.round(canvas.clientHeight * SIM_SCALE));   // the ink mask stays cheap at any pixel density
    A = target(w, h); B = target(w, h); layout();
  }

  // Blots are laid evenly along the cursor path; some get small satellite drops; a resting cursor slowly pools.
  var stamps = new Float32Array(MAXS * 4), si = 0, lastDrop = null, here = null, lastMove = 0, lastPool = 0, t0 = performance.now();
  for (var i = 0; i < MAXS; i++) stamps[i * 4 + 2] = -1;
  function clock() { return (performance.now() - t0) / 1000; }
  function stamp(x, y, r, delay) { var o = si * 4; stamps[o] = x; stamps[o + 1] = y; stamps[o + 2] = clock() + (delay || 0); stamps[o + 3] = r; si = (si + 1) % MAXS; }
  function blot(x, y) {
    var asp = canvas.width / canvas.height, r = BRUSH * (0.5 + Math.random() * 1.1);
    stamp(x + (Math.random() - 0.5) * r / asp * 1.2, y + (Math.random() - 0.5) * r * 1.2, r, 0);
    if (Math.random() < O.sat) {
      for (var k = 0, nn = 1 + (Math.random() < 0.4 ? 1 : 0); k < nn; k++) {
        var a = Math.random() * 6.283, d = r * (1.1 + Math.random() * 0.9);
        stamp(x + Math.cos(a) * d / asp, y + Math.sin(a) * d, r * (0.18 + Math.random() * 0.22), 0.15 + Math.random() * 0.35);
      }
    }
  }
  var lastUser = 0;
  function onMove(e) {
    var r = canvas.getBoundingClientRect();
    var p = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    if (p[0] < 0 || p[0] > 1 || p[1] < 0 || p[1] > 1) return;
    lastUser = performance.now(); move(p);
  }
  function move(p) {
    here = p; lastMove = performance.now();
    if (!lastDrop) { lastDrop = p.slice(); blot(p[0], p[1]); return; }
    var asp = canvas.width / canvas.height, gap = BRUSH * O.gap;
    var d = Math.hypot((p[0] - lastDrop[0]) * asp, p[1] - lastDrop[1]);
    while (d >= gap) {
      var f = gap / d; lastDrop = [lastDrop[0] + (p[0] - lastDrop[0]) * f, lastDrop[1] + (p[1] - lastDrop[1]) * f]; blot(lastDrop[0], lastDrop[1]);
      d = Math.hypot((p[0] - lastDrop[0]) * asp, p[1] - lastDrop[1]);
    }
  }
  function onLeave() { here = null; lastDrop = null; }
  area.addEventListener('pointermove', onMove, { passive: true });
  area.addEventListener('pointerleave', onLeave);
  // Demo mode: when nobody is moving the cursor, trace a slow looping stroke so the style can be judged hands-free.
  var demo = O.demo ? setInterval(function () {
    if (performance.now() - lastUser < 2500 || !visible) return;
    var k = performance.now() / 1000;
    move([0.5 + 0.32 * Math.sin(k * 0.55), 0.5 + 0.28 * Math.sin(k * 0.9 + 1.3)]);
  }, 33) : 0;

  var raf = 0, last = performance.now(), visible = true, dead = false;
  function frame(now) {
    raf = 0; if (dead) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    if (here && now - lastMove > 400 && now - lastPool > 900) { lastPool = now; stamp(here[0], here[1], BRUSH * (1 + Math.random() * 0.6), 0); }
    gl.useProgram(SIM.p);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, null);   // never sample the texture being written
    gl.bindFramebuffer(gl.FRAMEBUFFER, B.f); gl.viewport(0, 0, B.w, B.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(SIM.u.prev, 0);
    gl.uniform1f(SIM.u.asp, canvas.width / canvas.height); gl.uniform1f(SIM.u.t, t); gl.uniform1f(SIM.u.dt, dt);
    gl.uniform1f(SIM.u.flow, FLOW); gl.uniform1f(SIM.u.spread, SPREAD); gl.uniform1f(SIM.u.life, LIFE); gl.uniform4fv(SIM.u.st, stamps);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    var tmp = A; A = B; B = tmp;
    gl.useProgram(SHOW.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sketchT);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, paintT);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, A.t);
    gl.uniform1i(SHOW.u.sketch, 0); gl.uniform1i(SHOW.u.paint, 1); gl.uniform1i(SHOW.u.mask, 2);
    gl.uniform2f(SHOW.u.sc, scv[0], scv[1]); gl.uniform2f(SHOW.u.off, offv[0], offv[1]);
    gl.uniform1f(SHOW.u.ia, IMG_W / IMG_H); gl.uniform1f(SHOW.u.t, t); gl.uniform2f(SHOW.u.tx, 1 / IMG_W, 1 / IMG_H);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (visible) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && visible && sketchT && paintT && !dead) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  // Only animate while the hero is on screen.
  var track = area.parentElement, onScreen = true;
  function check() { var r = track.getBoundingClientRect(); visible = onScreen && r.top > -0.5 * window.innerHeight; wake(); }
  var io = new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; check(); }, { threshold: 0 });
  io.observe(canvas);
  document.addEventListener('scroll', check, { capture: true, passive: true });
  var ro = new ResizeObserver(function () { resize(); wake(); }); ro.observe(canvas);
  resize();
  image(sketchSrc, function (tx) { sketchT = tx; wake(); });
  image(paintSrc, function (tx) { paintT = tx; wake(); });
  return function () {
    dead = true; clearInterval(demo); io.disconnect(); ro.disconnect(); document.removeEventListener('scroll', check, true);
    area.removeEventListener('pointermove', onMove); area.removeEventListener('pointerleave', onLeave);
  };
}
