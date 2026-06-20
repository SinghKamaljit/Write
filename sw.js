/* =====================================================
   PageCraft Service Worker
   Cache version: pagecraft-v1
   ===================================================== */

const CACHE = 'pagecraft-v1';

const ASSETS = [
  './wb7.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.7/purify.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.3/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/16.3.0/lib/marked.umd.min.js'
];

// ── INSTALL — cache everything upfront ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE — remove old caches ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH — cache-first, fallback to network ─────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Only cache valid responses for same-origin or CDN
        if (
          response &&
          response.status === 200 &&
          (response.type === 'basic' || response.type === 'cors')
        ) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return the main app page
        if (event.request.mode === 'navigate') {
          return caches.match('./wb7.html');
        }
      });
    })
  );
});
