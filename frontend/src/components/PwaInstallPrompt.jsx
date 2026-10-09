import { useState, useEffect } from 'react';
import { IconX, IconCheckCircle } from './icons';
import './PwaInstallPrompt.css';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Kiểm tra xem ứng dụng đã được chạy dưới dạng Standalone (đã cài đặt) chưa
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isAppStandalone) {
      setIsStandalone(true);
      return;
    }

    // Kiểm tra nếu người dùng đã từng tắt thông báo trong 24h qua
    const dismissedTime = localStorage.getItem('dalatagri_pwa_prompt_dismissed');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Bắt sự kiện beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Kiểm tra xem có phải iOS Safari không
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|opios/.test(userAgent);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Hiển thị gợi ý sau 3 giây trên iOS nếu chưa cài
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Lắng nghe khi app đã được cài đặt thành công
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('[PWA] Ứng dụng DalatAgri đã được cài đặt!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Người dùng đã lựa chọn: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem('dalatagri_pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      <div className="pwa-install-banner">
        <div className="pwa-banner-content">
          <img src="/pwa-icon.svg" alt="DalatAgri Icon" className="pwa-app-icon" />
          <div className="pwa-text-group">
            <div className="pwa-title">Cài đặt DalatAgri Mobile</div>
            <div className="pwa-desc">
              Thao tác nhanh chóng, mở toàn màn hình mượt mà như app tải từ kho ứng dụng.
            </div>
          </div>
        </div>

        <div className="pwa-actions">
          <button
            type="button"
            className="pwa-install-btn"
            onClick={handleInstallClick}
          >
            Cài đặt ngay
          </button>
          <button
            type="button"
            className="pwa-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Đóng thông báo"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* Modal Hướng dẫn cài đặt cho người dùng iPhone / iPad */}
      {showIosGuide && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-ios-modal-header">
              <div className="pwa-ios-title">Cài đặt DalatAgri trên iPhone</div>
              <button
                type="button"
                className="pwa-ios-close"
                onClick={() => setShowIosGuide(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="pwa-ios-body">
              <p className="pwa-ios-step">
                <span className="pwa-step-num">1</span>
                <span>
                  Bấm vào biểu tượng <strong>Chia sẻ (Share 📤)</strong> ở thanh công cụ dưới đáy Safari.
                </span>
              </p>
              <p className="pwa-ios-step">
                <span className="pwa-step-num">2</span>
                <span>
                  Cuộn xuống và chọn mục <strong>"Thêm vào MH chính" (Add to Home Screen ➕)</strong>.
                </span>
              </p>
              <p className="pwa-ios-step">
                <span className="pwa-step-num">3</span>
                <span>
                  Bấm <strong>"Thêm" (Add)</strong> ở góc trên bên phải. Icon DalatAgri sẽ xuất hiện trên màn hình điện thoại!
                </span>
              </p>
            </div>
            <button
              type="button"
              className="pwa-ios-done-btn"
              onClick={() => setShowIosGuide(false)}
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
