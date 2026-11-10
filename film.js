/* ============================================================
   whybit. — film.js
   A silent loop of the Lun-E launch film plays behind the
   pre-order section.

   - Nothing downloads until the section is close to the screen.
   - Phones get a lighter 720p file, larger screens 1080p.
   - H.264 mp4 where the browser has it, VP9 webm where it doesn't
     (some Linux Chromium / Firefox builds ship without H.264).
   - The poster frame shows until the video is ready, so the
     section is never an empty dark band.
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
  if (mq('(prefers-reduced-motion: reduce)') || saveData) return;   // the poster frame stays as a still background

  var loaded = false, inView = false;
  function load() {
    if (loaded) return; loaded = true;
    var name = mq('(max-width: 767px)') ? '/film/loop-720' : '/film/loop';
    var mp4 = video.canPlayType('video/mp4; codecs="avc1.640028"');
    var webm = video.canPlayType('video/webm; codecs="vp9"');
    video.src = name + (!mp4 && webm ? '.webm' : '.mp4');
  }
  function play() { var p = video.play(); if (p && p.catch) p.catch(function () {}); }   // blocked (e.g. low-power mode): the poster stays

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
