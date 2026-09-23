const CACHE_NAME = 'mindwithfaz-v2';

const CORE_ASSETS = [
  'index.html',
  'about.html',
  'services.html',
  'blog.html',
  'blog-post.html',
  'faq.html',
  'book.html',
  'styles.css?v=2',
  'script.js?v=2',
  'manifest.json',
  'assets/logo-transparent.png',
  'assets/illustrations/sprig.svg',
  'assets/pwa-icon-192.png',
  'assets/pwa-icon-512.png',
  'assets/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve from cache instantly when available,
// refresh the cache in the background, and fall back to cache if offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
