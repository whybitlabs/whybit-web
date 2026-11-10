/* ============================================================
   whybit. — film.js
   A silent loop of the Lun-E launch film plays behind the
   pre-order section.

   - Nothing downloads until the section is close to the screen.
   - Phones get a lighter 720p file, larger screens 1080p.
   - Plays only while the section is on screen.
   - Reduced motion or data saver: the still poster frame only.
   ============================================================ */

(function () {
  'use strict';

  var section = document.querySelector('.po-cinema');
  var video = section && section.querySelector('.po-bg-video');
  if (!video) return;

  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var saveData = navigator.connection && navigator.connection.saveData;
  if (mq('(prefers-reduced-motion: reduce)') || saveData) {
    video.classList.add('is-on');                     // the poster frame stays as a still background
    return;
  }

  var loaded = false, inView = false;
  function load() {
    if (loaded) return; loaded = true;
    video.src = mq('(max-width: 767px)') ? '/film/loop-720.mp4' : '/film/loop.mp4';
    video.addEventListener('playing', function () { video.classList.add('is-on'); }, { once: true });
  }
  function play() { var p = video.play(); if (p && p.catch) p.catch(function () { video.classList.add('is-on'); }); }

  if (!('IntersectionObserver' in window)) { load(); play(); return; }

  // start loading a screen early so the first frame is ready when it arrives
  new IntersectionObserver(function (es, o) {
    if (es[0].isIntersecting) { load(); o.disconnect(); }
  }, { rootMargin: '100% 0px' }).observe(section);

  new IntersectionObserver(function (es) {
    inView = es[0].isIntersecting;
    if (inView) { load(); play(); } else { video.pause(); }
  }, { threshold: 0.1 }).observe(section);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause(); else if (inView) play();
  });
})();
