
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('canteen-cache-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/student/index.html',
        '/canteen_admin/admin.html',
        '/css/style.css',
        '/js/app.js',
        '/assets/icon-192x192.png',
        '/assets/icon-512x512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
