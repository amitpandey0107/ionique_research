/* ==========================================================================
   Ionique Research — main script (vanilla JS, no dependencies)
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header state + scroll progress ---------- */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.progress');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 20);
    var max = document.body.scrollHeight - window.innerHeight;
    if (progress && max > 0) progress.style.transform = 'scaleX(' + Math.min(y / max, 1) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
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

  /* ---------- Scroll spy ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  // Map sub-sections to their nav group
  var spyMap = {
    applications: 'applications', transport: 'applications', education: 'applications',
    datacentres: 'applications', ai: 'applications',
    products: 'products', partners: 'partners', about: 'about', contact: 'contact'
  };
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var target = spyMap[entry.target.id];
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(spyMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    var heroEl = document.getElementById('top');
    if (heroEl) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) navLinks.forEach(function (l) { l.classList.remove('is-active'); });
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(heroEl);
    }
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = end + suffix; return; }
    var start = performance.now(), dur = 1600;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Copy-to-clipboard ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.setAttribute('data-copied', '');
        setTimeout(function () { btn.removeAttribute('data-copied'); }, 1400);
      };
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

  /* ---------- Year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Data centre scale explorer ---------- */
  var tabs = document.querySelectorAll('.scale-tab');
  var grid = document.querySelector('.gpu-grid');
  var capCount = document.getElementById('stage-count');
  var capLabel = document.getElementById('stage-label');

  // Visual representation: real GPU count shown up to a cap; for 1,000 we draw a dense field
  var scales = [
    { draw: 1, cols: 1, size: 96, gap: 0, count: '1 GPU', label: 'Office · studio' },
    { draw: 64, cols: 16, size: 30, gap: 7, count: '8–64 GPUs', label: 'Campus · edge rack' },
    { draw: 1000, cols: 50, size: 11, gap: 3, count: 'Up to 1,000 GPUs', label: 'Mini data centre' }
  ];

  function renderScale(i) {
    if (!grid) return;
    var s = scales[i];
    var stage = grid.parentElement;
    var availW = stage.clientWidth - 80;
    var availH = Math.max(stage.clientHeight, 300) - 110;
    var cols = s.cols, size = s.size, gap = s.gap;
    // on narrow screens use fewer columns (more rows)
    if (s.draw > 1 && availW < 560) cols = Math.round(cols * 0.5);
    var rows = Math.ceil(s.draw / cols);
    // shrink tiles until the whole grid fits inside the stage
    function fits() {
      return cols * size + (cols - 1) * gap <= availW && rows * size + (rows - 1) * gap <= availH;
    }
    while (!fits() && size > 3) {
      size -= 1;
      if (gap > 1 && size < s.size * 0.6) gap -= 1;
    }
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', ' + size + 'px)';
    grid.style.gap = gap + 'px';
    grid.style.setProperty('--g', size + 'px');

    var frag = document.createDocumentFragment();
    var stagger = s.draw > 100 ? 0.6 / s.draw : 0.012;
    for (var k = 0; k < s.draw; k++) {
      var d = document.createElement('i');
      d.className = 'gpu' + (Math.random() < 0.06 || s.draw === 1 ? ' hot' : '');
      if (s.draw === 1) d.style.borderRadius = '14px';
      d.style.animationDelay = reduceMotion ? '0s' : (k * stagger) + 's';
      frag.appendChild(d);
    }
    grid.innerHTML = '';
    grid.appendChild(frag);
    if (capCount) capCount.textContent = s.count;
    if (capLabel) capLabel.textContent = s.label;
  }

  var currentScale = 0;
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectScale(i, true); });
    tab.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (n !== null) { e.preventDefault(); selectScale(n, true); tabs[n].focus(); }
    });
  });
  function selectScale(i, user) {
    currentScale = i;
    tabs.forEach(function (t, j) {
      t.setAttribute('aria-selected', j === i ? 'true' : 'false');
      t.setAttribute('tabindex', j === i ? '0' : '-1');
    });
    renderScale(i);
    if (user) stopAutoCycle();
  }
  // Auto-cycle while in view until the user interacts
  var cycleTimer = null;
  function stopAutoCycle() { if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; } }
  if (tabs.length) {
    selectScale(0, false);
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var userTouched = false;
      tabs.forEach(function (t) { t.addEventListener('click', function () { userTouched = true; }); });
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !userTouched && !cycleTimer) {
          cycleTimer = setInterval(function () { selectScale((currentScale + 1) % tabs.length, false); }, 3200);
        } else if (!entries[0].isIntersecting) {
          stopAutoCycle();
        }
      }, { threshold: 0.4 }).observe(grid.parentElement);
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { renderScale(currentScale); }, 200); });
  }

  /* ---------- Hero: neuromorphic network canvas ---------- */
  var canvas = document.getElementById('neural-canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, nodes = [], links = [], pulses = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;

    function build() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var area = W * H;
      var count = Math.max(40, Math.min(130, Math.round(area / 11000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        // bias nodes to the right on wide screens so text stays readable
        var bx = W > 900 ? Math.pow(Math.random(), 0.6) : Math.random();
        nodes.push({
          x: bx * W, y: Math.random() * H,
          ox: 0, oy: 0,
          vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
          r: Math.random() * 1.6 + 1, z: Math.random() * 0.7 + 0.3,
          fire: 0
        });
      }
      // connect each node to its nearest neighbours
      links = [];
      var maxD = Math.min(190, Math.max(120, W / 9));
      for (var a = 0; a < nodes.length; a++) {
        var near = [];
        for (var b = 0; b < nodes.length; b++) {
          if (a === b) continue;
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) near.push({ b: b, d: d });
        }
        near.sort(function (p, q) { return p.d - q.d; });
        for (var k = 0; k < Math.min(3, near.length); k++) {
          if (a < near[k].b) links.push([a, near[k].b]);
        }
      }
      pulses = [];
    }

    function spawnPulse(fromIdx) {
      var options = links.filter(function (l) { return l[0] === fromIdx || l[1] === fromIdx; });
      if (!options.length) return;
      var l = options[(Math.random() * options.length) | 0];
      var to = l[0] === fromIdx ? l[1] : l[0];
      pulses.push({ a: fromIdx, b: to, t: 0, speed: 0.006 + Math.random() * 0.01, hops: (Math.random() * 4) | 0 });
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      // move nodes
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20 || n.x > W + 20) n.vx *= -1;
        if (n.y < -20 || n.y > H + 20) n.vy *= -1;
        // mouse repulsion (parallax-ish)
        var dx = n.x - mouse.x, dy = n.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) {
          var f = (1 - d2 / 22000) * 18 * n.z;
          n.ox += ((dx / Math.sqrt(d2 + 1)) * f - n.ox) * 0.08;
          n.oy += ((dy / Math.sqrt(d2 + 1)) * f - n.oy) * 0.08;
          if (Math.random() < 0.004) { n.fire = 1; spawnPulse(i); }
        } else {
          n.ox *= 0.94; n.oy *= 0.94;
        }
        n.fire *= 0.95;
      }

      // links
      ctx.lineWidth = 1;
      for (var j = 0; j < links.length; j++) {
        var A = nodes[links[j][0]], B = nodes[links[j][1]];
        var ax = A.x + A.ox, ay = A.y + A.oy, bx = B.x + B.ox, by = B.y + B.oy;
        var len = Math.hypot(ax - bx, ay - by);
        var alpha = Math.max(0, 0.32 - len / 900) * ((A.z + B.z) / 2);
        ctx.strokeStyle = 'rgba(150,165,225,' + (alpha * 0.8).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }

      // random spontaneous firing
      if (Math.random() < 0.035 && pulses.length < 18) {
        var idx = (Math.random() * nodes.length) | 0;
        nodes[idx].fire = 1; spawnPulse(idx);
      }

      // pulses (spikes travelling along synapses)
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pu = pulses[p];
        pu.t += pu.speed;
        var PA = nodes[pu.a], PB = nodes[pu.b];
        var px = (PA.x + PA.ox) + ((PB.x + PB.ox) - (PA.x + PA.ox)) * pu.t;
        var py = (PA.y + PA.oy) + ((PB.y + PB.oy) - (PA.y + PA.oy)) * pu.t;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 7);
        g.addColorStop(0, 'rgba(245,200,140,0.9)');
        g.addColorStop(1, 'rgba(233,169,92,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
        if (pu.t >= 1) {
          PB.fire = 1;
          if (pu.hops > 0) {
            var opts = links.filter(function (l) { return (l[0] === pu.b || l[1] === pu.b); });
            if (opts.length) {
              var nl = opts[(Math.random() * opts.length) | 0];
              var nb = nl[0] === pu.b ? nl[1] : nl[0];
              pulses.push({ a: pu.b, b: nb, t: 0, speed: pu.speed, hops: pu.hops - 1 });
            }
          }
          pulses.splice(p, 1);
        }
      }

      // nodes
      for (var m = 0; m < nodes.length; m++) {
        var N = nodes[m], x = N.x + N.ox, y = N.y + N.oy;
        if (N.fire > 0.05) {
          var halo = ctx.createRadialGradient(x, y, 0, x, y, 22 * N.fire + 4);
          halo.addColorStop(0, 'rgba(233,169,92,' + (0.4 * N.fire).toFixed(3) + ')');
          halo.addColorStop(1, 'rgba(233,169,92,0)');
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(x, y, 22 * N.fire + 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = m % 7 === 0 ? 'rgba(246,243,237,' + (0.35 + N.z * 0.45) + ')' : 'rgba(174,188,245,' + (0.25 + N.z * 0.45) + ')';
        ctx.beginPath(); ctx.arc(x, y, N.r * N.z + N.fire * 1.5, 0, Math.PI * 2); ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    build();
    if (reduceMotion) {
      running = true; frame(); running = false; // draw one static frame
    } else {
      requestAnimationFrame(frame);
      // pause when hero off-screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          var vis = entries[0].isIntersecting;
          if (vis && !running) { running = true; requestAnimationFrame(frame); }
          else if (!vis) running = false;
        }).observe(canvas);
      }
    }

    var heroSection = canvas.parentElement;
    heroSection.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    heroSection.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    var resizeT, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      // ignore mobile URL-bar height changes
      if (Math.abs(window.innerWidth - lastW) < 2 && canvas.clientHeight === H) return;
      lastW = window.innerWidth;
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        build();
        if (reduceMotion) { running = true; frame(); running = false; }
      }, 200);
    });
  }
})();
