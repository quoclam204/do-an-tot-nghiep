import { Link } from 'react-router-dom';
import {
  IconSprout,
  IconMapPin,
  IconPhoneCall,
  IconMail,
  IconShieldCheck,
} from './icons';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        {/* Cột 1: Thông tin thương hiệu */}
        <div className="footer-col footer-col-brand">
          <Link to="/" className="footer-logo">
            <img src="/logo.png" alt="DalatAgri logo" className="footer-logo-img" />
            <span>DalatAgri</span>
          </Link>
          <p className="footer-tagline">
            Hệ thống quản lý nhật ký canh tác nông nghiệp thông minh. Giải pháp số toàn diện đồng hành cùng nhà nông Đà Lạt nâng cao năng suất và chất lượng nông sản.
          </p>
          <div className="footer-badges">
            <span className="footer-badge">
              <IconSprout size={14} /> Nông nghiệp số
            </span>
            <span className="footer-badge">
              <IconMapPin size={14} /> Đà Lạt - Lâm Đồng
            </span>
            <span className="footer-badge">
              <IconShieldCheck size={14} /> Dữ liệu an toàn
            </span>
          </div>
        </div>

        {/* Cột 2: Điều hướng nhanh */}
        <div className="footer-col">
          <h4 className="footer-heading">Điều hướng nhanh</h4>
          <ul className="footer-links">
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/dashboard">Nhật ký canh tác</Link></li>
            <li><Link to="/seasons">Kế hoạch mùa vụ</Link></li>
            <li><Link to="/reports">Báo cáo & Tài chính</Link></li>
            <li><Link to="/account">Tài khoản nông hộ</Link></li>
          </ul>
        </div>

        {/* Cột 3: Quản lý nghiệp vụ */}
        <div className="footer-col">
          <h4 className="footer-heading">Danh mục quản lý</h4>
          <ul className="footer-links">
            <li><Link to="/crops">Cây trồng & Chu kỳ</Link></li>
            <li><Link to="/farms">Vườn trại & Phân lô</Link></li>
            <li><Link to="/materials">Vật tư & Phân bón</Link></li>
            <li><Link to="/inventory">Quản lý kho tồn</Link></li>
            <li><Link to="/harvest">Thu hoạch & Doanh thu</Link></li>
          </ul>
        </div>

        {/* Cột 4: Hỗ trợ & Liên hệ */}
        <div className="footer-col footer-col-contact">
          <h4 className="footer-heading">Hỗ trợ & Liên hệ</h4>
          <div className="footer-contact-item">
            <div className="footer-contact-icon">
              <IconPhoneCall size={16} />
            </div>
            <div>
              <div className="footer-contact-label">Hotline tư vấn kỹ thuật</div>
              <div className="footer-contact-value">1900 6868 / 0263 3822 999</div>
            </div>
          </div>

          <div className="footer-contact-item">
            <div className="footer-contact-icon">
              <IconMail size={16} />
            </div>
            <div>
              <div className="footer-contact-label">Hộp thư hỗ trợ</div>
              <div className="footer-contact-value">hotro@dalatagri.vn</div>
            </div>
          </div>

          <div className="footer-contact-item">
            <div className="footer-contact-icon">
              <IconMapPin size={16} />
            </div>
            <div>
              <div className="footer-contact-label">Vùng canh tác trọng điểm</div>
              <div className="footer-contact-value">TP. Đà Lạt & các huyện nông nghiệp Lâm Đồng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dòng bản quyền dưới cùng */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2026 DalatAgri. Tất cả quyền được bảo lưu.</p>
          <div className="footer-bottom-links">
            <span>Chính sách bảo mật</span>
            <span>•</span>
            <span>Điều khoản dịch vụ</span>
            <span>•</span>
            <span>Sổ tay hướng dẫn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;