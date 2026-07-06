const CACHE_NAME = "durrat-erp-v20260706-final-admin-3";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./style.css",
  "./css/enterprise.css",
  "./0.png",
  "./icons/196.png",
  "./icons/512.png",
  "./js/config/supabase.js",
  "./js/enterprise/auth-core.js",
  "./js/enterprise/admin-core.js",
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

  // لا يتدخل في CDN أو Supabase أو Telegram أو أي مصدر خارجي
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate" || request.destination === "document";
  const isCodeAsset = /\.(html|css|js|json)$/i.test(url.pathname);

  // الصفحات والكود: Network First لمنع الرجوع لنسخة قديمة بعد صفحة الإدارة
  if (isNavigation || isCodeAsset) {
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

  // الصور والأيقونات: Cache First مع تحديث خلفي
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
