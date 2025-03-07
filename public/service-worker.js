const CACHE_NAME = 'pwa-test-cache-v2';
const STATIC_CACHE_NAME = 'static-cache-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/blog.html',
  '/assets/styles/style.css',
  '/script.js',
  '/main.js',
  '/qrScanner.js',
  '/fileHandler.js',
  '/modalHandler.js',
  '/offlineDB.js',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2',
  '/stock.json'
];

// Install Event - Cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => {
        return Promise.all(
          keys.map(key => {
            if (!key.includes(STATIC_CACHE_NAME) && !key.includes(DYNAMIC_CACHE_NAME)) {
              console.log('Deleting old cache', key);
              return caches.delete(key);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch Event - Cache first for static assets, Network first for API requests
self.addEventListener('fetch', event => {
  // Handle navigation requests differently
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event));
    return;
  }

  // Handle all other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request.clone())
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }

            // Cache the response
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Return a custom offline response for different file types
            if (event.request.url.endsWith('.js')) {
              return new Response('console.log("Offline mode - JS file not available");', {
                headers: { 'Content-Type': 'application/javascript' }
              });
            } else if (event.request.url.endsWith('.css')) {
              return new Response('/* Offline mode - CSS file not available */', {
                headers: { 'Content-Type': 'text/css' }
              });
            } else {
              return new Response('Offline content not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain',
                  'Cache-Control': 'no-store'
                })
              });
            }
          });
      })
  );
});

// Handle API requests separately
async function handleApiRequest(event) {
  // If online, try network first
  if (navigator.onLine) {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const responseToCache = response.clone();
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        await cache.put(event.request, responseToCache);
        return response;
      }
    } catch (error) {
      console.log('Network request failed, falling back to cache');
    }
  }

  // If offline or network failed, try cache
  const cachedResponse = await caches.match(event.request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cached response, return offline JSON response
  return new Response(JSON.stringify({
    error: 'You are offline. Changes will be synced when you are back online.',
    offline: true,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Function to sync data with server
async function syncData() {
  try {
    const db = await new Promise((resolve) => {
      const request = indexedDB.open('inventoryDB');
      request.onsuccess = (event) => resolve(event.target.result);
    });

    const transaction = db.transaction(['pendingChanges'], 'readonly');
    const store = transaction.objectStore('pendingChanges');
    const changes = await new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });

    // Process each pending change
    for (const change of changes) {
      let response;
      const endpoint = '/api/inventory';

      try {
        switch (change.type) {
          case 'add':
          case 'update':
            response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(change.item)
            });
            break;
          case 'delete':
            response = await fetch(`${endpoint}/${change.qrCode}`, {
              method: 'DELETE'
            });
            break;
        }

        if (response && response.ok) {
          // Clear the successful change
          const clearTx = db.transaction(['pendingChanges'], 'readwrite');
          const clearStore = clearTx.objectStore('pendingChanges');
          await clearStore.delete(change.id);
        }
      } catch (error) {
        console.error(`Failed to sync change: ${change.id}`, error);
        // Keep the change in the pending store to try again later
      }
    }

    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
}
