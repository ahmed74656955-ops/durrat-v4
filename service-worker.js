const CACHE_NAME = "durrat-erp-v20260706-final-guard";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./admin.html",
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.map((name) => {
        if (name !== CACHE_NAME) return caches.delete(name);
      })))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // لا نتدخل في CDN أو Supabase أو أي مصدر خارجي حتى لا تتكرر أخطاء PROXY/CDN
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate" || request.destination === "document";
  const isFreshAsset = /\.(html|css|js|json)$/i.test(url.pathname);

  // الصفحات وملفات CSS/JS بنمط Network First حتى لا ترجع نسخة قديمة عند العودة من admin.html
  if (isNavigation || isFreshAsset) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // الصور والأيقونات بنمط Cache First مع تحديث خلفي
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => null);

      return cached || networkFetch || new Response("Offline Data Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    })
  );
});
