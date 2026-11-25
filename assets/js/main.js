/* ==========================================================================
   Ionique Research — main script
   Uses (from assets/plugins): three.js (3D hero), GSAP + ScrollTrigger
   (scroll animation). Scrolling itself is native — no wheel hijacking. Every feature degrades
   gracefully if a plugin is missing or the user prefers reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger) && !reduceMotion;
  root.classList.toggle('has-gsap', hasGSAP);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  var header = document.querySelector('.site-header');
  var headerH = function () { return header ? header.offsetHeight : 0; };

  /* ======================================================================
     Scrolling: the mouse wheel / trackpad use the browser's native scroll,
     so the page follows input 1:1 with no easing delay. Only in-page
     menu links glide (native smooth scroll) with a header offset.
     ====================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = id === '#top' ? 0 : -headerH() + 1;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset + offset, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ======================================================================
     Header state + scroll progress
     ====================================================================== */
  var progress = document.querySelector('.progress');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 40);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && max > 0) progress.style.transform = 'scaleX(' + Math.min(y / max, 1) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ======================================================================
     Mobile nav
     ====================================================================== */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('site-nav');
  function closeNav() {
    document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* ======================================================================
     Scroll spy
     ====================================================================== */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var spyMap = {
    top: null, applications: 'applications', transport: 'applications', education: 'applications',
    datacentres: 'applications', ai: 'applications',
    products: 'products', partners: 'partners', about: 'about', contact: 'contact'
  };
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var target = spyMap[entry.target.id];
        navLinks.forEach(function (l) { l.classList.toggle('is-active', !!target && l.getAttribute('href') === '#' + target); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(spyMap).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ======================================================================
     Reveal on scroll (cards etc.) — with automatic sibling stagger
     ====================================================================== */
  var reveals = document.querySelectorAll('.reveal');
  reveals.forEach(function (el) {
    if (el.style.getPropertyValue('--d')) return;
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ======================================================================
     Counters
     ====================================================================== */
  function runCounter(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) { el.textContent = end; return; }
    var start = performance.now(), dur = 1800;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  document.querySelectorAll('[data-count]').forEach(function (c) { setTimeout(function () { runCounter(c); }, 900); });

  /* ======================================================================
     Copy-to-clipboard + year
     ====================================================================== */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { btn.setAttribute('data-copied', ''); setTimeout(function () { btn.removeAttribute('data-copied'); }, 1400); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { /* ignore */ }
        document.body.removeChild(ta);
      }
    });
  });
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ======================================================================
     Data centre scale explorer
     ====================================================================== */
  (function scaleExplorer() {
    var tabs = document.querySelectorAll('.scale-tab');
    var grid = document.querySelector('.gpu-grid');
    if (!tabs.length || !grid) return;
    var capCount = document.getElementById('stage-count');
    var capLabel = document.getElementById('stage-label');
    var scales = [
      { draw: 1, cols: 1, size: 96, gap: 0, count: '1 GPU', label: 'Office · studio' },
      { draw: 64, cols: 16, size: 30, gap: 7, count: '8–64 GPUs', label: 'Campus · edge rack' },
      { draw: 1000, cols: 50, size: 11, gap: 3, count: 'Up to 1,000 GPUs', label: 'Mini data centre' }
    ];
    var current = 0, timer = null, touched = false;

    function render(i) {
      var s = scales[i], stage = grid.parentElement;
      var availW = stage.clientWidth - 80;
      var availH = Math.max(stage.clientHeight, 300) - 110;
      var cols = s.cols, size = s.size, gap = s.gap;
      if (s.draw > 1 && availW < 560) cols = Math.round(cols * 0.5);
      var rows = Math.ceil(s.draw / cols);
      var fits = function () { return cols * size + (cols - 1) * gap <= availW && rows * size + (rows - 1) * gap <= availH; };
      while (!fits() && size > 3) { size -= 1; if (gap > 1 && size < s.size * 0.6) gap -= 1; }
      grid.style.gridTemplateColumns = 'repeat(' + cols + ', ' + size + 'px)';
      grid.style.gap = gap + 'px';
      grid.style.setProperty('--g', size + 'px');
      var frag = document.createDocumentFragment();
      var stagger = s.draw > 100 ? 0.7 / s.draw : 0.014;
      for (var k = 0; k < s.draw; k++) {
        var d = document.createElement('i');
        d.className = 'gpu' + (Math.random() < 0.05 || s.draw === 1 ? ' hot' : '');
        if (s.draw === 1) d.style.borderRadius = '14px';
        d.style.animationDelay = reduceMotion ? '0s' : (k * stagger) + 's';
        frag.appendChild(d);
      }
      grid.innerHTML = '';
      grid.appendChild(frag);
      if (capCount) capCount.textContent = s.count;
      if (capLabel) capLabel.textContent = s.label;
    }
    function select(i, user) {
      current = i;
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.setAttribute('tabindex', j === i ? '0' : '-1');
      });
      render(i);
      if (user) { touched = true; if (timer) { clearInterval(timer); timer = null; } }
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, true); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); select(n, true); tabs[n].focus(); }
      });
    });
    select(0, false);
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !touched && !timer) {
          timer = setInterval(function () { select((current + 1) % tabs.length, false); }, 3400);
        } else if (!entries[0].isIntersecting && timer) { clearInterval(timer); timer = null; }
      }, { threshold: 0.4 }).observe(grid.parentElement);
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { render(current); }, 200); });
  })();

  /* ======================================================================
     GSAP scroll choreography
     ====================================================================== */
  var heroProgress = { p: 0 };

  if (hasGSAP) {
    // --- Split headings into words, then rise them in on scroll
    function splitWords(el) {
      var out = [];
      (function walk(node, parent) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var parts = child.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var outer = document.createElement('span'); outer.className = 'sw';
              var inner = document.createElement('span'); inner.textContent = part;
              outer.appendChild(inner); frag.appendChild(outer); out.push(inner);
            });
            child.parentNode.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') {
            walk(child);
          }
        });
      })(el);
      return out;
    }
    document.querySelectorAll('[data-split]').forEach(function (h) {
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      var words = splitWords(h);
      words.forEach(function (w) { w.parentNode.setAttribute('aria-hidden', 'true'); });
      gsap.from(words, {
        yPercent: 115, rotate: 3, duration: 1.3, ease: 'expo.out', stagger: 0.07,
        scrollTrigger: { trigger: h, start: 'top 88%' }
      });
    });

    // --- Photo reveal: clip wipe upward + image settles
    gsap.utils.toArray('.media[data-reveal]').forEach(function (fig) {
      var img = fig.querySelector('img');
      var tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%' } });
      tl.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.6, ease: 'expo.inOut' })
        .from(img, { scale: 1.4, duration: 2, ease: 'expo.out' }, 0.1);
    });

    // --- Cinema photo widens to full bleed while scrolling
    var cinema = document.querySelector('.cinema');
    if (cinema) {
      gsap.fromTo(cinema, { clipPath: 'inset(0% 8% 0% 8% round 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: cinema, start: 'top 95%', end: 'top 20%', scrub: true }
      });
      gsap.from(cinema.querySelectorAll('figcaption > *'), {
        y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: cinema, start: 'top 55%' }
      });
    }

    // --- Parallax for photos with data-speed
    gsap.utils.toArray('img[data-speed]').forEach(function (img) {
      var sp = parseFloat(img.getAttribute('data-speed')) || 0.1;
      var box = img.parentElement;
      if (!img.closest('.cinema') && !img.closest('.partners-bg')) gsap.set(img, { scale: 1.14 });
      gsap.fromTo(img, { yPercent: -sp * 40 }, {
        yPercent: sp * 40, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // --- Hero: content drifts up and fades as you leave; 3D scene follows progress
    gsap.to('.hero-inner', {
      yPercent: -18, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom top',
      onUpdate: function (self) { heroProgress.p = self.progress; }
    });

    // Recalculate once fonts and images have settled
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ======================================================================
     HERO 3D — a neuromorphic "brain" of nodes, synapses and firing spikes
     ====================================================================== */
  var heroBox = document.getElementById('hero-3d');

  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  function initHero3D(box) {
    if (!window.THREE || !webglAvailable()) return false;
    var T = window.THREE;
    var W = box.clientWidth, H = box.clientHeight;
    var small = W < 760;

    var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    box.appendChild(renderer.domElement);

    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x0b1433, 0.075);
    var camera = new T.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 10);

    var group = new T.Group();
    scene.add(group);
    function placeGroup() {
      var wide = box.clientWidth > 960;
      group.position.set(wide ? 2.7 : 0, wide ? 0.05 : 0.9, 0);
      var sc = wide ? 1 : 0.82;
      group.scale.setScalar(sc);
    }
    placeGroup();

    // soft round sprite
    function sprite() {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d');
      var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.25, 'rgba(255,255,255,.85)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      var tex = new T.CanvasTexture(c);
      return tex;
    }
    var dot = sprite();

    // --- Nodes, shaped like two brain hemispheres with folds
    var N = small ? 750 : 1400;
    var pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    var cPeri = new T.Color(0xaebcf5), cWhite = new T.Color(0xf6f3ed), cAmber = new T.Color(0xe9a95c), cBlue = new T.Color(0x6f83e0);
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i;
      var x = Math.cos(th) * rad, z = Math.sin(th) * rad;
      var phi = Math.atan2(z, x);
      var fold = 0.1 * Math.sin(7 * Math.acos(y)) * Math.cos(6 * phi) + 0.05 * Math.sin(13 * phi + 3 * y);
      var r = 2.55 * (1 + fold);
      if (i % 7 === 0) r *= 0.45 + Math.random() * 0.45; // interior nodes
      var px = x * r * 1.22, py = y * r * 0.92, pz = z * r * 1.02;
      px += (px >= 0 ? 1 : -1) * 0.14;                     // hemispheric gap
      if (py < -1.2) { px *= 0.8; pz *= 0.85; }            // narrower base
      pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
      var roll = Math.random(), c = roll < 0.05 ? cAmber : roll < 0.14 ? cWhite : roll < 0.45 ? cBlue : cPeri;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var nodeGeo = new T.BufferGeometry();
    nodeGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
    nodeGeo.setAttribute('color', new T.BufferAttribute(col, 3));
    var nodeMat = new T.PointsMaterial({
      size: small ? 0.085 : 0.075, map: dot, vertexColors: true, transparent: true, opacity: 0.95,
      depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true
    });
    group.add(new T.Points(nodeGeo, nodeMat));

    // --- Synapses: connect each node to its nearest neighbours
    var adj = []; for (var a0 = 0; a0 < N; a0++) adj.push([]);
    var edges = [];
    var maxD2 = 0.62 * 0.62;
    for (var a = 0; a < N; a++) {
      var best = [];
      var ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
      for (var b = 0; b < N; b++) {
        if (a === b) continue;
        var dx = ax - pos[b * 3], dy = ay - pos[b * 3 + 1], dz = az - pos[b * 3 + 2];
        var d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < maxD2) best.push([d2, b]);
      }
      best.sort(function (p, q) { return p[0] - q[0]; });
      for (var k = 0; k < Math.min(3, best.length); k++) {
        var bb = best[k][1];
        if (adj[a].indexOf(bb) === -1) { adj[a].push(bb); adj[bb].push(a); edges.push(a, bb); }
      }
    }
    var lpos = new Float32Array(edges.length * 3);
    for (var e = 0; e < edges.length; e++) {
      lpos[e * 3] = pos[edges[e] * 3]; lpos[e * 3 + 1] = pos[edges[e] * 3 + 1]; lpos[e * 3 + 2] = pos[edges[e] * 3 + 2];
    }
    var lineGeo = new T.BufferGeometry();
    lineGeo.setAttribute('position', new T.BufferAttribute(lpos, 3));
    var lineMat = new T.LineBasicMaterial({ color: 0x7f8fd6, transparent: true, opacity: 0.2, depthWrite: false, blending: T.AdditiveBlending });
    group.add(new T.LineSegments(lineGeo, lineMat));

    // --- Spikes travelling along synapses
    var P = small ? 40 : 80;
    var spikePos = new Float32Array(P * 3);
    var spikes = [];
    function newSpike(s) {
      var from = (Math.random() * N) | 0;
      if (!adj[from].length) from = edges[0];
      s.a = from; s.b = adj[from][(Math.random() * adj[from].length) | 0];
      s.t = Math.random(); s.v = 0.012 + Math.random() * 0.02; s.hops = 3 + ((Math.random() * 8) | 0);
      return s;
    }
    for (var s0 = 0; s0 < P; s0++) spikes.push(newSpike({}));
    var spikeGeo = new T.BufferGeometry();
    spikeGeo.setAttribute('position', new T.BufferAttribute(spikePos, 3));
    var spikeMat = new T.PointsMaterial({
      size: small ? 0.2 : 0.17, map: dot, color: 0xf2bd7a, transparent: true, opacity: 1,
      depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true
    });
    group.add(new T.Points(spikeGeo, spikeMat));

    // --- Orbit rings with travelling markers
    var rings = new T.Group();
    group.add(rings);
    var ringDefs = [[3.9, 0.35, 0.2], [4.5, -0.5, 0.9], [5.2, 1.1, -0.4]];
    var markers = [];
    ringDefs.forEach(function (d, idx) {
      var pts = new T.EllipseCurve(0, 0, d[0], d[0] * 0.98, 0, Math.PI * 2).getPoints(180);
      var g = new T.BufferGeometry().setFromPoints(pts.map(function (p) { return new T.Vector3(p.x, p.y, 0); }));
      var m = new T.LineBasicMaterial({ color: idx === 1 ? 0xe9a95c : 0x8f9ee0, transparent: true, opacity: idx === 1 ? 0.18 : 0.12, depthWrite: false });
      var loop = new T.LineLoop(g, m);
      loop.rotation.set(d[1] + Math.PI / 2.4, d[2], 0);
      rings.add(loop);
      var mk = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3)),
        new T.PointsMaterial({ size: 0.2, map: dot, color: idx === 1 ? 0xf2bd7a : 0xdfe4ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      loop.add(mk);
      markers.push({ pt: mk, r: d[0], speed: 0.12 + idx * 0.05, off: idx * 2 });
    });

    // --- Ambient dust
    var D = small ? 350 : 700;
    var dpos = new Float32Array(D * 3);
    for (var di = 0; di < D; di++) {
      var rr = 6 + Math.random() * 10, t1 = Math.random() * Math.PI * 2, t2 = Math.acos(2 * Math.random() - 1);
      dpos[di * 3] = rr * Math.sin(t2) * Math.cos(t1);
      dpos[di * 3 + 1] = rr * Math.cos(t2) * 0.6;
      dpos[di * 3 + 2] = rr * Math.sin(t2) * Math.sin(t1) - 4;
    }
    var dust = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(dpos, 3)),
      new T.PointsMaterial({ size: 0.05, map: dot, color: 0xaebcf5, transparent: true, opacity: 0.45, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(dust);

    // --- Interaction
    var mouse = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (ev) {
      mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (ev.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    var clock = new T.Clock();
    var running = true, visible = true;

    function updateSpikes(dt) {
      for (var i2 = 0; i2 < P; i2++) {
        var sp = spikes[i2];
        sp.t += sp.v * dt * 60;
        if (sp.t >= 1) {
          if (--sp.hops <= 0) newSpike(sp);
          else { var nx = adj[sp.b]; sp.a = sp.b; sp.b = nx[(Math.random() * nx.length) | 0]; sp.t = 0; }
        }
        var A = sp.a * 3, B = sp.b * 3, tt = sp.t;
        spikePos[i2 * 3] = pos[A] + (pos[B] - pos[A]) * tt;
        spikePos[i2 * 3 + 1] = pos[A + 1] + (pos[B + 1] - pos[A + 1]) * tt;
        spikePos[i2 * 3 + 2] = pos[A + 2] + (pos[B + 2] - pos[A + 2]) * tt;
      }
      spikeGeo.attributes.position.needsUpdate = true;
    }

    function frame() {
      if (!running) return;
      var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      updateSpikes(dt);
      cur.x += (mouse.x - cur.x) * 0.04; cur.y += (mouse.y - cur.y) * 0.04;
      group.rotation.y = t * 0.09 + cur.x * 0.45;
      group.rotation.x = -0.12 + cur.y * 0.22;
      rings.rotation.z = t * 0.05;
      markers.forEach(function (m) {
        var ang = t * m.speed + m.off, arr = m.pt.geometry.attributes.position.array;
        arr[0] = Math.cos(ang) * m.r; arr[1] = Math.sin(ang) * m.r * 0.98; arr[2] = 0;
        m.pt.geometry.attributes.position.needsUpdate = true;
      });
      dust.rotation.y = -t * 0.015;
      nodeMat.opacity = 0.85 + Math.sin(t * 1.3) * 0.1;
      // scroll: dolly in and lift as the hero leaves
      var p = heroProgress.p;
      camera.position.z = 10 - p * 3;
      camera.position.y = -p * 1.4;
      renderer.render(scene, camera);
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    function setRunning(on) {
      if (on && !running) { running = true; clock.getDelta(); requestAnimationFrame(frame); }
      else if (!on) running = false;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRunning(visible && !document.hidden); }).observe(box);
    }
    document.addEventListener('visibilitychange', function () { setRunning(visible && !document.hidden); });

    var rT;
    window.addEventListener('resize', function () {
      clearTimeout(rT);
      rT = setTimeout(function () {
        var w = box.clientWidth, h = box.clientHeight;
        renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); placeGroup();
        if (reduceMotion) renderer.render(scene, camera);
      }, 150);
    });

    frame();
    return true;
  }

  /* --- 2D canvas fallback when WebGL / three.js isn't available --- */
  function initHero2D(box) {
    var canvas = document.createElement('canvas');
    box.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, nodes = [], links = [];
    function build() {
      W = box.clientWidth; H = box.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(40, Math.min(120, Math.round(W * H / 12000)));
      nodes = []; links = [];
      for (var i = 0; i < count; i++) nodes.push({ x: (W > 900 ? Math.pow(Math.random(), 0.6) : Math.random()) * W, y: Math.random() * H, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12 });
      for (var a = 0; a < count; a++) for (var b = a + 1; b < count; b++) {
        if (Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) < 140) links.push([a, b]);
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(function (n) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; });
      ctx.strokeStyle = 'rgba(150,165,225,.14)';
      links.forEach(function (l) { var A = nodes[l[0]], B = nodes[l[1]]; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); });
      ctx.fillStyle = 'rgba(174,188,245,.7)';
      nodes.forEach(function (n) { ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2); ctx.fill(); });
      if (!reduceMotion) requestAnimationFrame(draw);
    }
    build(); draw();
    window.addEventListener('resize', build);
  }

  if (heroBox) {
    var ok = false;
    try { ok = initHero3D(heroBox); } catch (err) { ok = false; heroBox.innerHTML = ''; }
    if (!ok) initHero2D(heroBox);
  }
})();
