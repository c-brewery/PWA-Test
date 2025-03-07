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

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  event.respondWith(
    caches.match(event.request)
      .then(cacheResponse => {
        if (cacheResponse) {
          return cacheResponse;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            if (event.request.url.indexOf('.html') > -1) {
              return caches.match('/index.html');
            }
            // Return offline fallback for other resources
            return new Response('Offline content not available');
          });
      })
  );
});

// Handle API requests
function handleApiRequest(event) {
  // If online, try network first
  if (navigator.onLine) {
    return fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      });
  } else {
    // If offline, return from cache
    return caches.match(event.request)
      .then(response => {
        return response || new Response(JSON.stringify({
          error: 'You are offline. Changes will be synced when you are back online.'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      });
  }
}

// Handle offline data sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

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
      const endpoint = '/api/inventory'; // Update with your actual API endpoint

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
        // Clear the successful change from pending store
        const clearTx = db.transaction(['pendingChanges'], 'readwrite');
        const clearStore = clearTx.objectStore('pendingChanges');
        await clearStore.delete(change.id);
      }
    }

    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
}
