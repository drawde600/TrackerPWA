const CACHE_NAME = 'hello-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // Add any additional assets (CSS, JS, images) if needed.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached file or fetch from network if not available
        return response || fetch(event.request);
      })
  );
});
