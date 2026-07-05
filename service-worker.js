const CACHE_NAME = "durrat-erp-v3";

const localUrls = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./0.png",
  "./icons/196.png",
  "./icons/512.png",
  "./js/config/supabase.js",
  "./js/services/sync.engine.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(localUrls);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // لا تتدخل في الروابط الخارجية مثل cdnjs و jsdelivr و Supabase
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      return new Response("Offline Data Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" }
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});