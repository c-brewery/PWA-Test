const CACHE_NAME = 'pwa-test-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/styles/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/html5-qrcode.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(error => {
        // Network is down and no cache available
        console.error('Fetch failed; offline?', error);
        // Return offline page if available
        return caches.match('/index.html');
      })
  );
});
