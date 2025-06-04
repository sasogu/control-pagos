const CACHE_NAME = 'control-pagos-v1.1.22';
const FILES_TO_CACHE = [
  '/control-pagos/',
  '/control-pagos/index.html',
  '/control-pagos/src/styles.css',
  '/control-pagos/src/app.js',
  '/control-pagos/manifest.json',
  '/control-pagos/img/icon-192.png',
  '/control-pagos/img/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

