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
    var color = t === 'dark' ? '#0A0A0A' : '#FAFAFA';
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
})();
