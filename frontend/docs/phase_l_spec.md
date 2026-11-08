# 📑 Phase L — Đặc Tả: PWA & Service Worker

> **Thời gian:** 1 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase K (IndexedDB)  
> **Tiếp theo:** Phase M (Sync)

---

## 1. Tổng Quan

Phase L biến ứng dụng React thành **Progressive Web App (PWA)** có thể:
- Cài đặt trên điện thoại như app native (Add to Home Screen).
- Cache toàn bộ App Shell (HTML, CSS, JS) để mở nhanh.
- Hoạt động khi mất mạng (kết hợp với IndexedDB từ Phase K).
- Nhận push notifications (tùy chọn, giai đoạn sau).

---

## 2. Công Cụ

| Thành phần | Lựa chọn | Lý do |
|-----------|----------|-------|
| **Service Worker** | Workbox (via vite-plugin-pwa) | Tích hợp sẵn với Vite, cấu hình đơn giản |
| **Manifest** | Web App Manifest | Chuẩn W3C cho PWA |
| **Icons** | PWA Asset Generator | Tạo icons đa kích thước |

### Cài đặt
```bash
cd frontend
npm install -D vite-plugin-pwa
```

---

## 3. Vite PWA Configuration

```typescript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'DalatAgri - Nhật Ký Canh Tác',
        short_name: 'DalatAgri',
        description: 'Ứng dụng quản lý nhật ký canh tác cây dài ngày, vật tư và chi phí nông nghiệp',
        theme_color: '#16a34a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        lang: 'vi',
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/dashboard.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard tổng quan'
          },
          {
            src: '/screenshots/mobile-diary.png',
            sizes: '375x812',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Nhật ký canh tác'
          }
        ]
      },
      workbox: {
        // Precache — cache tất cả assets khi build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        
        // Runtime caching strategies
        runtimeCaching: [
          {
            // API GET requests → Network First (ưu tiên server)
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60, // 1 giờ
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 năm
              },
            },
          },
          {
            // Images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 ngày
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

## 4. Caching Strategies

| Resource | Strategy | Mô tả | TTL |
|----------|----------|-------|-----|
| App Shell (HTML, JS, CSS) | **Precache** | Cache khi build, update khi deploy | Theo build version |
| API GET requests | **NetworkFirst** | Ưu tiên server, fallback cache nếu offline | 1 giờ |
| Google Fonts | **StaleWhileRevalidate** | Dùng cache, update ngầm | 1 năm |
| Images | **CacheFirst** | Dùng cache nếu có, chỉ fetch lần đầu | 30 ngày |
| API POST/PATCH/DELETE | **NetworkOnly + Queue** | Không cache, dùng SyncQueue (Phase K) | — |

---

## 5. Install Prompt (A2HS)

```typescript
// src/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Kiểm tra đã cài chưa
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, isInstalled, install };
}
```

### Install Banner Component
```jsx
// src/components/common/InstallBanner.jsx
function InstallBanner() {
  const { isInstallable, install } = useInstallPrompt();
  
  if (!isInstallable) return null;
  
  return (
    <div className="install-banner">
      <span>📱 Cài đặt DalatAgri để sử dụng nhanh hơn!</span>
      <button onClick={install}>Cài đặt</button>
      <button onClick={() => setDismissed(true)}>Để sau</button>
    </div>
  );
}
```

---

## 6. Update Notification

```typescript
// src/hooks/useServiceWorkerUpdate.ts
import { useRegisterSW } from 'virtual:pwa-register/react';

export function useServiceWorkerUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const update = () => {
    updateServiceWorker(true);
  };

  const dismiss = () => {
    setNeedRefresh(false);
  };

  return { needRefresh, update, dismiss };
}
```

### Update Toast Component
```jsx
function UpdateToast() {
  const { needRefresh, update, dismiss } = useServiceWorkerUpdate();
  
  if (!needRefresh) return null;
  
  return (
    <div className="update-toast">
      <span>🔄 Phiên bản mới khả dụng!</span>
      <button onClick={update}>Cập nhật ngay</button>
      <button onClick={dismiss}>Bỏ qua</button>
    </div>
  );
}
```

---

## 7. PWA Icons

### Kích thước cần có
| Size | Dùng cho |
|------|---------|
| 72x72 | Android (trước đây) |
| 96x96 | Android |
| 128x128 | Chrome Web Store |
| 144x144 | Windows tile |
| 152x152 | iOS |
| 192x192 | Android Chrome |
| 384x384 | Splash screen |
| 512x512 | Android, Splash screen |

### Thiết kế icon
- Logo: Hình lá cây / cây trồng + chữ "DA"
- Màu chính: Xanh lá (#16a34a)
- Nền: Xanh đậm (#0f172a)
- Maskable safe zone: 80% center

---

## 8. Lighthouse Audit Targets

| Category | Target Score |
|----------|-------------|
| Performance | ≥ 80 |
| Accessibility | ≥ 85 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |
| **PWA** | **≥ 90** |

### PWA Checklist (Lighthouse)
- [ ] Registers a service worker
- [ ] Responds with 200 when offline
- [ ] Has a `<meta name="viewport">` tag
- [ ] Contains start_url in manifest
- [ ] Has icons (192 + 512)
- [ ] Configured for a custom splash screen
- [ ] Sets a theme color

---

## 9. Tiêu Chí Hoàn Thành

- [ ] vite-plugin-pwa installed & configured
- [ ] manifest.json với tất cả icons
- [ ] Service Worker: precache + runtime caching
- [ ] App mở được khi offline (App Shell từ cache)
- [ ] Install prompt hiển thị trên mobile Chrome
- [ ] Update notification khi có bản mới
- [ ] Lighthouse PWA score ≥ 90
- [ ] Tested trên: Chrome desktop, Chrome Android, Safari iOS
