// Service Worker cho DalatAgri PWA
const CACHE_NAME = 'dalatagri-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon.svg',
  '/pwa-icon-maskable.svg',
  '/logo.png',
  '/favicon.svg'
];

// Cài đặt Service Worker và lưu trước tài nguyên cốt lõi (App Shell)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching asset error:', err);
      });
    })
  );
});

// Kích hoạt Service Worker và dọn dẹp cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Xử lý các yêu cầu mạng (Fetch)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Chỉ xử lý các request HTTP/HTTPS và phương thức GET
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (chuyển trang trong SPA, gõ URL thanh địa chỉ, F5):
  // Thử tải qua mạng trước, nếu mất mạng (Offline) thì nạp index.html từ Cache
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          const cachedIndex = (await cache.match('/index.html')) || (await cache.match('/'));
          if (cachedIndex) return cachedIndex;

          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>DalatAgri Ngoại Tuyến</title></head><body><h2>DalatAgri - Ngoại tuyến</h2><p>Vui lòng kết nối mạng một lần để tải ứng dụng.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // 2. Tài nguyên tĩnh (JS, CSS, Ảnh, Font, Manifest): Cache First, fallback Network
  const isStaticAsset =
    url.pathname.match(/\.(js|jsx|css|png|jpg|jpeg|svg|webp|woff|woff2|ico|json)$/i) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/src/');

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(req);
        if (cachedResponse) {
          // Nạp ngầm cập nhật mới nếu có mạng
          fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
          }).catch(() => {});
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
        }
      })()
    );
    return;
  }

  // 3. API requests: Network First, fallback Cache hoặc thông báo Offline JSON
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(req);
          if (cachedResponse) return cachedResponse;

          return new Response(
            JSON.stringify({ offline: true, message: 'Thiết bị đang ngoại tuyến' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      })()
    );
    return;
  }

  // 4. Mặc định: Network first với fallback cache an toàn
  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});
