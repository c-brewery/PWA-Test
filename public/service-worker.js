const CACHE_NAME = 'pwa-test-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';

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
      // Ensure the service worker takes control immediately
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
            if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache', key);
              return caches.delete(key);
            }
          })
        );
      }),
      // Ensure the service worker takes control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch Event - Network first with cache fallback for API requests, Cache first for static assets
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event));
    return;
  }

  // Handle static assets and other requests
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response immediately
          return cachedResponse;
        }

        // If not in cache, try network
        return fetch(event.request.clone())
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
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
          .catch(() => {
            // If network fails and it's an HTML request, return offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For other resources, return a simple offline response
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-store'
              })
            });
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
