// Lun-E Drive — service worker. Makes /drive/ work with no internet once it
// has been opened (or installed) one time. Bluetooth to the rover never needs
// the internet; this only keeps the page itself available offline.
//
// Strategy: serve from cache straight away, refresh the cache in the
// background when online (stale-while-revalidate). A new version of the page
// therefore shows up on the launch after it was deployed.
// Bump CACHE when this file's precache list changes.

const CACHE = 'lune-drive-v2';
const PRECACHE = [
  '/drive/',
  '/drive/manifest.webmanifest',
  '/drive/icons/icon-192.png',
  '/drive/icons/icon-512.png',
  '/drive/icons/icon-maskable-512.png',
  '/drive/icons/apple-touch-icon.png',
  '/styles.css',
  '/script.js',
  '/favicon/favicon.svg',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lune-drive-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheable(res) {
  // Opaque (no-cors) responses are fine for the Google Fonts stylesheet.
  return res && (res.ok || res.type === 'opaque') && !res.redirected;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  // Any navigation inside /drive/ (with or without ?query) is the app shell.
  const key = req.mode === 'navigate' ? '/drive/' : req;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const network = fetch(req)
      .then((res) => {
        if (cacheable(res)) cache.put(key, res.clone());
        return res;
      })
      .catch(() => null);
    if (cached) {
      event.waitUntil(network);  // refresh in the background
      return cached;
    }
    const res = await network;
    return res || new Response('offline', { status: 503, statusText: 'offline' });
  })());
});
