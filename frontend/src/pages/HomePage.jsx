import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconSprout,
  IconZoomIn,
  IconPenLine,
  IconWarehouse,
  IconLogIn,
  IconUserPlus,
  IconCheckCircle,
  IconWifiOff,
  IconShieldCheck,
  IconClipboardList,
  IconLeaf,
  IconFlask,
  IconCalculator,
  IconBookOpen,
  IconCircleDollar,
  IconArrowRight,
  IconSmartphone,
  IconLineChart,
  IconFileText,
  IconXCircle,
  IconHelpCircle,
  IconHeadphones,
  IconPhoneCall,
  IconMapPin,
} from '../components/icons';
import { useAuth } from '../context/AuthContext';
import '../styles/HomePage.css';

function HomePage() {
  const { user } = useAuth();
  const [isLargeFont, setIsLargeFont] = useState(false);

  return (
    <div className={`elder-home-page ${isLargeFont ? 'font-large' : ''}`}>
      {/* ── THANH TIỆN ÍCH ĐẦU TRANG ── */}
      <div className="elder-top-bar">
        <div className="container elder-top-inner">
          <span className="elder-top-badge">
            <IconSprout size={18} strokeWidth={2.2} className="top-badge-icon" />
            <span>Hệ thống quản lý nhật ký canh tác nông nghiệp Đà Lạt</span>
          </span>
          <div className="font-size-toggle">
            <span className="toggle-label">Cỡ chữ:</span>
            <button
              type="button"
              className={`toggle-btn ${!isLargeFont ? 'active' : ''}`}
              onClick={() => setIsLargeFont(false)}
              aria-label="Cỡ chữ vừa vặn"
            >
              Vừa vặn
            </button>
            <button
              type="button"
              className={`toggle-btn btn-big ${isLargeFont ? 'active' : ''}`}
              onClick={() => setIsLargeFont(true)}
              aria-label="Cỡ chữ to dễ đọc"
            >
              <IconZoomIn size={16} strokeWidth={2.2} />
              <span>Chữ to dễ đọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PHẦN ĐẦU TRANG (HERO) ── */}
      <section className="elder-hero">
        <div className="container elder-hero-container">
          <div className="elder-hero-content">
            <div className="welcome-tag">
              <IconSprout size={16} strokeWidth={2.2} />
              <span>Sổ Tay Nông Nghiệp Đà Lạt</span>
            </div>

            {user ? (
              <div className="user-welcome-box">
                <h1 className="elder-hero-title">
                  Xin chào, <span>{user.fullName}</span>!
                </h1>
                <p className="elder-hero-desc">
                  Chúc bạn một ngày làm việc thuận lợi và mùa màng bội thu. Bạn có thể kiểm tra vườn tược hoặc ghi chép các công việc hôm nay.
                </p>
                <div className="elder-hero-actions">
                  <Link to="/dashboard" className="elder-btn elder-btn-primary">
                    <IconPenLine size={20} strokeWidth={2.2} />
                    <span>Mở Sổ Ghi Nhật Ký Hôm Nay</span>
                  </Link>
                  <Link to="/farms" className="elder-btn elder-btn-secondary">
                    <IconWarehouse size={20} strokeWidth={2.2} />
                    <span>Xem Vườn Canh Tác</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="elder-hero-title">
                  Sổ ghi chép nông trại <span>đơn giản, dễ dùng</span>
                </h1>
                <p className="elder-hero-desc">
                  Ghi lại lịch bón phân, tưới nước, xịt thuốc và chi tiêu vụ mùa hàng ngày. Chữ to, nút bấm lớn, thao tác dễ dàng và quản lý rõ ràng.
                </p>

                <div className="elder-hero-actions">
                  <Link to="/login" className="elder-btn elder-btn-primary">
                    <IconLogIn size={20} strokeWidth={2.2} />
                    <span>Bấm Vào Đây Để Đăng Nhập</span>
                  </Link>
                  <Link to="/register" className="elder-btn elder-btn-secondary">
                    <IconUserPlus size={20} strokeWidth={2.2} />
                    <span>Đăng Ký Tài Khoản Mới</span>
                  </Link>
                </div>

                <div className="elder-reassurance">
                  <span className="reassure-item">
                    <IconCheckCircle size={18} strokeWidth={2.2} className="reassure-icon" />
                    <span>Miễn phí sử dụng</span>
                  </span>
                  <span className="reassure-item">
                    <IconWifiOff size={18} strokeWidth={2.2} className="reassure-icon" />
                    <span>Mất mạng vẫn ghi chép được</span>
                  </span>
                  <span className="reassure-item">
                    <IconShieldCheck size={18} strokeWidth={2.2} className="reassure-icon" />
                    <span>Dữ liệu an toàn không lo mất sổ</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="elder-hero-highlight-card">
            <div className="card-header-simple">
              <IconClipboardList size={20} strokeWidth={2.2} className="header-simple-icon" />
              <strong>Sổ Tay Hôm Nay Có Gì?</strong>
            </div>
            <ul className="quick-checklist">
              <li>
                <div className="check-icon-wrap">
                  <IconLeaf size={22} strokeWidth={2} />
                </div>
                <div>
                  <strong>Theo dõi vườn & luống rau</strong>
                  <p>Biết rõ luống nào vừa tỉa cành, luống nào sắp thu hoạch</p>
                </div>
              </li>
              <li>
                <div className="check-icon-wrap">
                  <IconFlask size={22} strokeWidth={2} />
                </div>
                <div>
                  <strong>Quản lý phân bón & thuốc</strong>
                  <p>Nhớ chính xác ngày xịt thuốc để cách ly an toàn trước khi hái</p>
                </div>
              </li>
              <li>
                <div className="check-icon-wrap">
                  <IconCalculator size={22} strokeWidth={2} />
                </div>
                <div>
                  <strong>Tự tính tiền lời - chi tiêu</strong>
                  <p>Hệ thống tự động cộng chi phí vật tư, không cần tính toán thủ công</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 4 Ô LỐI TẮT CHỨC NĂNG CHÍNH ── */}
      <section className="elder-features-section">
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="elder-section-title">Chọn Công Việc Cần Thực Hiện</h2>
            <p className="elder-section-desc">
              Bấm trực tiếp vào các mục bên dưới để truy cập nhanh chức năng:
            </p>
          </div>

          <div className="elder-cards-grid">
            <Link to="/dashboard" className="elder-card card-journal">
              <div className="card-top">
                <div className="elder-card-icon">
                  <IconBookOpen size={28} strokeWidth={2} />
                </div>
                <span className="card-badge">Hay dùng nhất</span>
              </div>
              <h3 className="elder-card-title">Ghi Chép Nhật Ký Mùa Vụ</h3>
              <p className="elder-card-desc">
                Hôm nay tưới nước bao lâu, bón loại phân gì, xịt thuốc sâu nào. Ghi nhanh chỉ mất 1 phút.
              </p>
              <div className="elder-card-action">
                <span>Vào ghi sổ ngay</span>
                <IconArrowRight size={18} strokeWidth={2.4} className="arrow-sym" />
              </div>
            </Link>

            <Link to="/farms" className="elder-card card-farm">
              <div className="card-top">
                <div className="elder-card-icon">
                  <IconWarehouse size={28} strokeWidth={2} />
                </div>
                <span className="card-badge">Vườn tược</span>
              </div>
              <h3 className="elder-card-title">Quản Lý Vườn & Thửa Đất</h3>
              <p className="elder-card-desc">
                Xem danh sách các mảnh vườn, nhà kính, diện tích canh tác của nông trại tại Đà Lạt.
              </p>
              <div className="elder-card-action">
                <span>Xem danh sách vườn</span>
                <IconArrowRight size={18} strokeWidth={2.4} className="arrow-sym" />
              </div>
            </Link>

            <Link to="/crops" className="elder-card card-crop">
              <div className="card-top">
                <div className="elder-card-icon">
                  <IconSprout size={28} strokeWidth={2} />
                </div>
                <span className="card-badge">Cây giống</span>
              </div>
              <h3 className="elder-card-title">Danh Mục Các Cây Trồng</h3>
              <p className="elder-card-desc">
                Danh sách các loại rau hoa quen thuộc: Cà phê, súp lơ, dâu tây, ớt chuông, atisô...
              </p>
              <div className="elder-card-action">
                <span>Tra cứu cây trồng</span>
                <IconArrowRight size={18} strokeWidth={2.4} className="arrow-sym" />
              </div>
            </Link>

            <Link to="/dashboard" className="elder-card card-money">
              <div className="card-top">
                <div className="elder-card-icon">
                  <IconCircleDollar size={28} strokeWidth={2} />
                </div>
                <span className="card-badge">Sổ thu chi</span>
              </div>
              <h3 className="elder-card-title">Tính Tiền Lời & Chi Phí</h3>
              <p className="elder-card-desc">
                Biết vụ mùa này đã chi bao nhiêu tiền phân thuốc, thu hoạch bán được bao nhiêu, lời hay lỗ.
              </p>
              <div className="elder-card-action">
                <span>Xem sổ thu chi</span>
                <IconArrowRight size={18} strokeWidth={2.4} className="arrow-sym" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3 BƯỚC SỬ DỤNG ── */}
      <section className="elder-steps-section">
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="elder-section-title">Chỉ Với 3 Bước Đơn Giản</h2>
            <p className="elder-section-desc">
              Giao diện trực quan, rõ ràng, dễ dàng sử dụng ngay từ lần đầu:
            </p>
          </div>

          <div className="elder-steps-grid">
            <div className="elder-step-box">
              <div className="step-circle">1</div>
              <div className="step-illustration">
                <IconSmartphone size={32} strokeWidth={2} />
              </div>
              <h3 className="step-title">Mở Ứng Dụng & Đăng Nhập</h3>
              <p className="step-text">
                Đăng nhập bằng tài khoản hoặc số điện thoại. Ứng dụng tự động lưu phiên để không cần nhập lại nhiều lần.
              </p>
            </div>

            <div className="elder-step-box">
              <div className="step-circle">2</div>
              <div className="step-illustration">
                <IconPenLine size={32} strokeWidth={2} />
              </div>
              <h3 className="step-title">Bấm Nút "Ghi Nhật Ký"</h3>
              <p className="step-text">
                Chọn mảnh vườn đang làm, chọn hoạt động (Bón phân, Tưới nước, Thu hoạch) rồi bấm Lưu.
              </p>
            </div>

            <div className="elder-step-box">
              <div className="step-circle">3</div>
              <div className="step-illustration">
                <IconLineChart size={32} strokeWidth={2} />
              </div>
              <h3 className="step-title">Xem Lại Bất Cứ Lúc Nào</h3>
              <p className="step-text">
                Dữ liệu được lưu trữ an toàn. Cuối vụ chỉ cần mở ra là thấy toàn bộ thu chi và sản lượng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SO SÁNH: SỔ GIẤY VÀ DALATAGRI ── */}
      <section className="elder-comparison-section">
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="elder-section-title">Lợi Ích Khi Dùng DalatAgri Thay Cho Sổ Giấy</h2>
          </div>

          <div className="comparison-grid">
            <div className="compare-card old-way">
              <div className="compare-header">
                <div className="compare-icon-wrap old">
                  <IconFileText size={24} strokeWidth={2} />
                </div>
                <h3>Dùng Sổ Giấy Truyền Thống</h3>
              </div>
              <ul className="compare-list">
                <li>
                  <IconXCircle size={18} strokeWidth={2.2} className="compare-bullet old" />
                  <span>Sổ dễ bị ướt mưa khi mang ra vườn, bị rách hay thất lạc.</span>
                </li>
                <li>
                  <IconXCircle size={18} strokeWidth={2.2} className="compare-bullet old" />
                  <span>Đến cuối vụ phải ngồi bấm máy tính cộng từng trang rất mỏi mắt.</span>
                </li>
                <li>
                  <IconXCircle size={18} strokeWidth={2.2} className="compare-bullet old" />
                  <span>Muốn tìm lại vụ năm ngoái bón phân gì vào tháng nào rất khó tra cứu.</span>
                </li>
                <li>
                  <IconXCircle size={18} strokeWidth={2.2} className="compare-bullet old" />
                  <span>Khó chia sẻ sổ sách cho các thành viên trong gia đình cùng theo dõi.</span>
                </li>
              </ul>
            </div>

            <div className="compare-card new-way">
              <div className="compare-header">
                <div className="compare-icon-wrap new">
                  <IconCheckCircle size={24} strokeWidth={2} />
                </div>
                <h3>Dùng Sổ Điện Tử DalatAgri</h3>
              </div>
              <ul className="compare-list">
                <li>
                  <IconCheckCircle size={18} strokeWidth={2.2} className="compare-bullet new" />
                  <span>Luôn nằm gọn trong điện thoại, không sợ rách, không lo mất dữ liệu.</span>
                </li>
                <li>
                  <IconCheckCircle size={18} strokeWidth={2.2} className="compare-bullet new" />
                  <span>Ứng dụng tự động cộng tổng tiền phân thuốc và sản lượng thu hoạch.</span>
                </li>
                <li>
                  <IconCheckCircle size={18} strokeWidth={2.2} className="compare-bullet new" />
                  <span>Mất sóng internet ngoài đồi vẫn ghi được, khi có mạng máy tự lưu.</span>
                </li>
                <li>
                  <IconCheckCircle size={18} strokeWidth={2.2} className="compare-bullet new" />
                  <span>Chữ to, giao diện tiếng Việt rõ ràng, dễ đọc và dễ dùng.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CÂU HỎI THƯỜNG GẶP (FAQ) ── */}
      <section className="elder-faq-section">
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="elder-section-title">Giải Đáp Thắc Mắc Thường Gặp</h2>
            <p className="elder-section-desc">Một số câu hỏi thường gặp khi bắt đầu sử dụng:</p>
          </div>

          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-q-row">
                <IconHelpCircle size={22} strokeWidth={2.2} className="faq-icon" />
                <h3 className="faq-question">Giao diện có dễ đọc và dễ nhìn không?</h3>
              </div>
              <p className="faq-answer">
                Ứng dụng được thiết kế phông chữ to, độ tương phản cao, các nút bấm lớn giúp thao tác dễ dàng. Bạn cũng có thể bấm nút <strong>"Chữ to dễ đọc"</strong> ở đầu trang để phóng to thêm bất cứ lúc nào.
              </p>
            </div>

            <div className="faq-item">
              <div className="faq-q-row">
                <IconHelpCircle size={22} strokeWidth={2.2} className="faq-icon" />
                <h3 className="faq-question">Nếu bấm nhầm hoặc ghi sai thì có sửa được không?</h3>
              </div>
              <p className="faq-answer">
                Hoàn toàn được. Mọi dòng nhật ký đã ghi đều có nút <strong>"Sửa"</strong> hoặc <strong>"Xóa"</strong> để cập nhật lại thông tin đúng bất cứ lúc nào.
              </p>
            </div>

            <div className="faq-item">
              <div className="faq-q-row">
                <IconHelpCircle size={22} strokeWidth={2.2} className="faq-icon" />
                <h3 className="faq-question">Nếu quên mật khẩu thì phải làm sao?</h3>
              </div>
              <p className="faq-answer">
                Ở trang Đăng nhập có mục <strong>"Quên mật khẩu"</strong>, chỉ cần nhập email đăng ký để nhận liên kết đặt lại mật khẩu mới nhanh chóng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── KHUNG TRỢ GIÚP & LIÊN HỆ ── */}
      <section className="elder-support-section">
        <div className="container">
          <div className="support-card">
            <div className="support-icon-wrap">
              <IconHeadphones size={40} strokeWidth={2} />
            </div>
            <div className="support-content">
              <h3 className="support-title">Bạn Cần Hỗ Trợ Kỹ Thuật?</h3>
              <p className="support-desc">
                Nếu gặp khó khăn khi đăng ký, ghi nhật ký hoặc cần hướng dẫn chi tiết từng bước, đội ngũ DalatAgri luôn sẵn sàng đồng hành hỗ trợ.
              </p>
              <div className="support-contact-badges">
                <span className="contact-badge">
                  <IconPhoneCall size={15} strokeWidth={2.2} />
                  <span>Hỗ trợ kỹ thuật: Dự án Đồ án tốt nghiệp DalatAgri</span>
                </span>
                <span className="contact-badge">
                  <IconMapPin size={15} strokeWidth={2.2} />
                  <span>Thành phố Đà Lạt, Lâm Đồng</span>
                </span>
              </div>
            </div>
            <div className="support-action">
              {user ? (
                <Link to="/dashboard" className="elder-btn elder-btn-primary">
                  <span>Vào Ghi Sổ Ngay</span>
                  <IconArrowRight size={18} strokeWidth={2.4} />
                </Link>
              ) : (
                <Link to="/login" className="elder-btn elder-btn-primary">
                  <span>Bắt Đầu Dùng Ngay</span>
                  <IconArrowRight size={18} strokeWidth={2.4} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
