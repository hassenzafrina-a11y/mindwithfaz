const CACHE_NAME = 'mindwithfaz-v20';

const CORE_ASSETS = [
  'index.html',
  'about.html',
  'services.html',
  'blog.html',
  'blog-post.html',
  'faq.html',
  'book.html',
  'styles.css?v=17',
  'script.js?v=11',
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

// Pages, CSS and JS: always try the network first so visitors get the
// current version. Cache is only a fallback for genuinely offline use.
function isCoreDocument(request) {
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.destination === 'style' ||
    request.destination === 'script'
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (isCoreDocument(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Images and other static assets: stale-while-revalidate for speed —
  // low cost if briefly out of date, and this keeps the site fast.
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
