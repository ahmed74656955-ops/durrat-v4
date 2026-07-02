// service-worker.js
const CACHE_NAME = "waybill-erp-enterprise-v1";

// الملفات المحلية الحرجة
const localUrls = [
  "./",
  "./index.html",
  "./manifest.json",
  "./0.png",
  "./icons/196.png",
  "./icons/512.png",
  "./js/config/supabase.js",
  "./js/services/sync.engine.js"
];

// المكتبات الخارجية
const externalUrls = [
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
  "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(localUrls);
      externalUrls.forEach(url => {
          fetch(url).then(response => {
              if (response.ok) cache.put(url, response);
          }).catch(err => console.warn('Failed to cache external resource:', url));
      });
    })
  );
  self.skipWaiting();
});

// تطبيق استراتيجية Stale-While-Revalidate
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // تحديث الكاش بالصمت في الخلفية إذا توفر إنترنت
          if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
      }).catch(() => {});

      // عرض المخبأ فوراً للسرعة، أو انتظار الرد من الشبكة
      return cachedResponse || fetchedResponse || new Response('Offline Data Unavailable');
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
    })
  );
});
