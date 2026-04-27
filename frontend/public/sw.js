// Service Worker for PWA offline support.
//
// Bump CACHE_NAME on any deploy that needs to invalidate the cache.
// The activate handler purges every cache that isn't in the whitelist,
// so old hashed JS bundles don't stick around and serve stale code.
const CACHE_NAME = 'revision-planner-v2';

const urlsToCache = [
  '/',
  '/list',
  '/calendar',
  '/topics',
  '/login',
];

// Install — pre-cache the app shell as an offline fallback.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((error) => console.log('Cache installation failed:', error))
  );
  self.skipWaiting();
});

// Fetch — network-first with cache fallback.
//
// Previously this was cache-first, which meant once a JS bundle was cached
// the user kept running it forever, even after a deploy with bug fixes.
// Now we always try the network, only falling back to the cache when offline
// or when the network errors out.
self.addEventListener('fetch', (event) => {
  // Only handle GETs; let POST/PATCH/DELETE go straight to the network.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Refresh the cache with the latest same-origin response so the
        // app can still load when the user goes offline.
        if (response && response.ok && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Activate — purge any cache that isn't the current version.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});
