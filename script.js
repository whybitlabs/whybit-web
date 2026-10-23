/* ============================================================
   whybit. — script.js
   Plain JS, shared by every page. No framework, no build step.
   Pages are static HTML; this only adds the ambient behaviour:
   theme toggle, cursor glow, dot-grid tracking, scroll blur,
   product-card hover gradient, magnetic buttons.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- THEME ----------
     The pre-paint bootstrap in each page's <head> has already set
     data-theme. This wires the toggle and keeps things in sync. */
  var THEME_KEY = 'whybit-theme';
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function syncThemeColorMeta(t) {
    var color = t === 'dark' ? '#000000' : '#FAFAFA';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', color);
    });
  }

  function syncToggleLabel(t) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var label = t === 'dark' ? 'switch to light mode' : 'switch to dark mode';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', t === 'dark' ? 'light mode' : 'dark mode');
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    syncThemeColorMeta(t);
    syncToggleLabel(t);
  }

  applyTheme(currentTheme());

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  // Follow OS preference if the user hasn't expressed one
  if (prefersDark.addEventListener) {
    prefersDark.addEventListener('change', function (e) {
      try { if (localStorage.getItem(THEME_KEY)) return; } catch (err) {}
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  /* ---------- CURSOR ---------- */
  // Cursor position feeds the dot-grid mask and the glow (both CSS vars).
  function onMove(e) {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  }

  // Glow grows over anything interactive
  function onHoverable(e) {
    var glow = document.getElementById('cursor-glow');
    if (!glow) return;
    var target = e.target.closest('a, button, .product-card, [data-hover]');
    glow.classList.toggle('hovering', !!target);
  }

  if (!window.matchMedia('(hover: none)').matches) {
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousemove', onHoverable, { passive: true });
  }

  /* ---------- SCROLL VELOCITY → SUBTLE BLUR ---------- */
  var lastY = 0, lastT = performance.now(), rafId = null;
  window.addEventListener('scroll', function () {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      var y = window.scrollY;
      var t = performance.now();
      var v = Math.abs(y - lastY) / Math.max(1, t - lastT);
      var blur = Math.min(2, v * 0.8);
      document.documentElement.style.setProperty('--scroll-blur', blur + 'px');
      // Decay
      setTimeout(function () {
        document.documentElement.style.setProperty('--scroll-blur', '0px');
      }, 120);
      lastY = y; lastT = t; rafId = null;
    });
  }, { passive: true });

  /* ---------- PRODUCT CARD — cursor-tracked orange gradient ---------- */
  document.querySelectorAll('.product-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--cx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--cy', ((e.clientY - r.top) / r.height * 100) + '%');
    }, { passive: true });
  });

  /* ---------- MAGNETIC BUTTONS ---------- */
  document.querySelectorAll('.magnetic').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      if (window.matchMedia('(hover: none)').matches) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px');
      el.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.25) + 'px');
    }, { passive: true });
    el.addEventListener('mouseleave', function () {
      el.style.setProperty('--tx', '0px');
      el.style.setProperty('--ty', '0px');
    });
  });

  /* ---------- STARFIELD ----------
     Drawn into a canvas inside #dot-grid on every page. Star colour
     and brightness come from --star-rgb / --star-max in styles.css,
     so the field follows the theme. A few stars twinkle; the field
     drifts slightly with scroll (three depths) for a sense of space. */
  (function starfield() {
    var host = document.getElementById('dot-grid');
    if (!host) return;
    var cv = document.createElement('canvas');
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    host.appendChild(cv);
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stars = [], W = 0, H = 0, dpr = 1, rgb = '255,255,255', maxA = 0.9;

    function readTheme() {
      var cs = getComputedStyle(document.documentElement);
      rgb = (cs.getPropertyValue('--star-rgb') || '255,255,255').trim();
      maxA = parseFloat(cs.getPropertyValue('--star-max')) || 0.9;
    }
    function seed() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var n = Math.round(W * H / 5200);
      stars = [];
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.09;               // a few bright ones, like the reference
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: big ? 1.3 + Math.random() * 1.0 : 0.45 + Math.random() * 0.75,
          a: big ? 0.8 + Math.random() * 0.2 : 0.25 + Math.random() * 0.55,
          d: [0.02, 0.05, 0.1][i % 3],                  // scroll drift depth
          tw: Math.random() < 0.3 ? 0.6 + Math.random() * 1.6 : 0,  // twinkle speed (0 = steady)
          ph: Math.random() * Math.PI * 2
        });
      }
    }
    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var sy = window.scrollY || 0;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var y = ((s.y - sy * s.d) % H + H) % H;
        var a = s.a;
        if (s.tw && !still) a *= 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph);
        ctx.fillStyle = 'rgba(' + rgb + ',' + (a * maxA).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.2832); ctx.fill();
      }
    }
    var last = 0, raf = 0;
    function loop(t) {
      raf = 0;
      if (document.hidden) return;
      if (t - last > 40) { draw(t); last = t; }       // ~25 fps is plenty for a twinkle
      if (!still) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    readTheme(); seed(); draw(0); kick();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { seed(); draw(performance.now()); }, 120);
    });
    if (still) window.addEventListener('scroll', function () { draw(0); }, { passive: true });
    document.addEventListener('visibilitychange', kick);
    new MutationObserver(function () { readTheme(); draw(performance.now()); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  })();
})();
