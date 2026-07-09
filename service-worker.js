const CACHE_NAME = "durrat-erp-v14-desktop-ultimate-20260709";

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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => name !== CACHE_NAME ? caches.delete(name) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isNavigation = request.mode === "navigate" || request.destination === "document";
  const isFreshAsset = /\.(html|css|js|json)$/i.test(url.pathname);
  if (isNavigation || isFreshAsset) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => null);
      return cached || networkFetch || new Response("Offline Data Unavailable", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    })
  );
});
