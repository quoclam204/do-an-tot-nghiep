import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Đăng ký Service Worker cho Progressive Web App (PWA)
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker đăng ký thành công với scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Lỗi đăng ký Service Worker:', error);
      });
  });
}
