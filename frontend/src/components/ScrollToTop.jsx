import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Tự động cuộn trang lên đầu mượt mà mỗi khi người dùng chuyển sang bất kỳ trang nào.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Nếu có gắn thẻ neo hash (#id), cuộn tới vị trí đó mượt mà
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Cuộn mượt mà lên đỉnh trang (smooth scroll)
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, 0);
    }

    // Cuộn các khung chứa nếu có cuộn riêng
    if (document.documentElement && document.documentElement.scrollTop > 0) {
      try {
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        document.documentElement.scrollTop = 0;
      }
    }

    if (document.body && document.body.scrollTop > 0) {
      try {
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        document.body.scrollTop = 0;
      }
    }

    const mainContainer = document.querySelector('.main, .app, .dashboard-layout');
    if (mainContainer && mainContainer.scrollTop > 0) {
      try {
        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        mainContainer.scrollTop = 0;
      }
    }
  }, [pathname, search, hash]);

  return null;
}
