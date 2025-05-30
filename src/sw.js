const CACHE_NAME = 'control-pagos-v1.1.12';  // Cambia la versión según sea necesario
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/src/styles.css',
  '/src/app.js',
  '/manifest.json',
  // Añade aquí los iconos si los tienes, por ejemplo:
  '/img/icon-192.png',
  '/img/icon-512.png'
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