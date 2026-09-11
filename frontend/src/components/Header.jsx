import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconLogIn,
  IconUserPlus,
  IconLogOut,
  IconMenu,
  IconX,
  IconWarehouse,
  IconScale,
  IconCalendar,
  IconSprout,
  IconFlask,
  IconClipboardList,
  IconChevronDown,
  IconHome,
  IconLineChart,
  IconUser,
  IconLayers,
} from './icons';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 250);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Tự động đóng các menu mobile khi đổi trang
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSheetOpen(false);
  }, [location.pathname]);

  // Danh mục gom vào Dropdown / Bottom Sheet Quản lý
  const managementLinks = [
    { path: '/farms', label: 'Lô & Nông hộ', desc: 'Vườn trại & phân bổ diện tích', icon: IconWarehouse },
    { path: '/crops', label: 'Cây trồng', desc: 'Giống cây & chu kỳ sinh trưởng', icon: IconSprout },
    { path: '/seasons', label: 'Mùa vụ', desc: 'Kế hoạch mùa vụ canh tác', icon: IconCalendar },
    { path: '/materials', label: 'Vật tư', desc: 'Phân bón, thuốc BVTV & hạt giống', icon: IconFlask },
    { path: '/inventory', label: 'Tồn kho', desc: 'Theo dõi xuất nhập tồn vật tư', icon: IconClipboardList },
    { path: '/harvest', label: 'Thu hoạch', desc: 'Sản lượng, đơn giá & doanh thu', icon: IconScale },
  ];

  const isManagementActive = managementLinks.some((item) => location.pathname.startsWith(item.path));

  return (
    <>
      <header className="header">
        <div className="container header-container">
          <Link to="/" className="logo">
            <img src="/logo.png" className="logo-img" alt="DalatAgri logo" />
            <span>DalatAgri</span>
          </Link>

          {/* Desktop Navigation - Tối giản, gọn gàng với Dropdown */}
          <nav className="nav desktop-nav">
            <Link to="/" className={isActive('/') ? 'active-nav-link' : ''}>
              Trang chủ
            </Link>

            <Link to="/dashboard" className={isActive('/dashboard') || isActive('/logs') ? 'active-nav-link' : ''}>
              Nhật ký
            </Link>

            {/* Menu Dropdown Quản lý trên Desktop */}
            <div
              className={`nav-dropdown ${dropdownOpen ? 'open' : ''}`}
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`nav-dropdown-trigger ${isManagementActive ? 'active-nav-link' : ''}`}
                onClick={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setDropdownOpen((prev) => !prev);
                }}
                aria-expanded={dropdownOpen}
              >
                <span>Quản lý</span>
                <IconChevronDown
                  size={14}
                  className={`dropdown-arrow ${dropdownOpen ? 'rotated' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown-menu">
                  <div className="dropdown-grid">
                    {managementLinks.map((item) => {
                      const Icon = item.icon;
                      const itemActive = location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`dropdown-item ${itemActive ? 'active' : ''}`}
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="dropdown-item-icon">
                            <Icon size={18} strokeWidth={2} />
                          </div>
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">{item.label}</span>
                            <span className="dropdown-item-desc">{item.desc}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link to="/reports" className={isActive('/reports') ? 'active-nav-link' : ''}>
              Báo cáo
            </Link>
          </nav>

          {/* User Auth Buttons */}
          <div className="header-auth">
            {user ? (
              <>
                <Link to="/account" className="user-menu-btn" title="Tài khoản của tôi">
                  <span className="user-avatar-hdr">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="user-name-hdr">{user.fullName}</span>
                </Link>
                <button
                  className="logout-btn-hdr"
                  onClick={handleLogout}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconLogOut size={15} />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  className="login-btn"
                  to="/login"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconLogIn size={15} />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  className="register-btn"
                  to="/register"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconUserPlus size={15} />
                  <span>Đăng ký</span>
                </Link>
              </>
            )}

            {/* Mobile hamburger button */}
            <button
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              <IconMenu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Slide-in Drawer Menu với Backdrop mờ */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <div className="logo" style={{ fontSize: '18px' }}>
                  <img src="/logo.png" className="logo-img" alt="DalatAgri logo" style={{ height: '28px' }} />
                  <span>DalatAgri</span>
                </div>
                <button
                  className="mobile-sheet-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Đóng menu"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Thông tin tài khoản trong Drawer */}
              {user ? (
                <div className="mobile-drawer-user">
                  <span className="user-avatar-hdr" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{user.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#15803d' }}>{user.role === 'ADMIN' ? 'Quản trị viên' : 'Chủ nông hộ'}</div>
                  </div>
                </div>
              ) : null}

              <div className="mobile-nav-list" style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                <Link
                  to="/"
                  className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <IconHome size={18} />
                  <span>Trang chủ</span>
                </Link>

                <Link
                  to="/dashboard"
                  className={`mobile-nav-link ${isActive('/dashboard') || isActive('/logs') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <IconClipboardList size={18} />
                  <span>Nhật ký canh tác</span>
                </Link>

                <div className="mobile-nav-group-title">Danh mục Quản lý</div>
                {managementLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`mobile-nav-link mobile-nav-sublink ${isActive(item.path) ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="mobile-nav-group-title">Báo cáo & Thống kê</div>
                <Link
                  to="/reports"
                  className={`mobile-nav-link ${isActive('/reports') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <IconLineChart size={18} />
                  <span>Báo cáo & Tài chính</span>
                </Link>

                <div className="mobile-nav-group-title">Tài khoản</div>
                {user ? (
                  <>
                    <Link
                      to="/account"
                      className={`mobile-nav-link ${isActive('/account') ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconUser size={18} />
                      <span>Hồ sơ & Nông trại</span>
                    </Link>
                    <button
                      type="button"
                      className="mobile-nav-link"
                      style={{ background: '#fef2f2', color: '#dc2626', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', marginTop: '8px' }}
                      onClick={handleLogout}
                    >
                      <IconLogOut size={18} />
                      <span>Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`mobile-nav-link ${isActive('/login') ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconLogIn size={18} />
                      <span>Đăng nhập</span>
                    </Link>
                    <Link
                      to="/register"
                      className={`mobile-nav-link ${isActive('/register') ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconUserPlus size={18} />
                      <span>Đăng ký tài khoản</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ================= THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHO DI ĐỘNG (MOBILE BOTTOM NAV) ================= */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-tab ${isActive('/') ? 'active' : ''}`}>
          <div className="mobile-nav-tab-icon">
            <IconHome size={20} />
          </div>
          <span>Trang chủ</span>
        </Link>

        <Link
          to="/dashboard"
          className={`mobile-nav-tab ${isActive('/dashboard') || isActive('/logs') ? 'active' : ''}`}
        >
          <div className="mobile-nav-tab-icon">
            <IconClipboardList size={20} />
          </div>
          <span>Nhật ký</span>
        </Link>

        {/* Nút mở Bottom Sheet Quản lý */}
        <button
          type="button"
          className={`mobile-nav-tab ${isManagementActive || mobileSheetOpen ? 'active' : ''}`}
          onClick={() => setMobileSheetOpen((prev) => !prev)}
        >
          <div className="mobile-nav-tab-icon">
            <IconLayers size={20} />
          </div>
          <span>Quản lý</span>
        </button>

        <Link to="/reports" className={`mobile-nav-tab ${isActive('/reports') ? 'active' : ''}`}>
          <div className="mobile-nav-tab-icon">
            <IconLineChart size={20} />
          </div>
          <span>Báo cáo</span>
        </Link>

        {user ? (
          <Link to="/account" className={`mobile-nav-tab ${isActive('/account') ? 'active' : ''}`}>
            <div className="mobile-nav-tab-icon">
              <IconUser size={20} />
            </div>
            <span>Tài khoản</span>
          </Link>
        ) : (
          <Link to="/login" className={`mobile-nav-tab ${isActive('/login') ? 'active' : ''}`}>
            <div className="mobile-nav-tab-icon">
              <IconLogIn size={20} />
            </div>
            <span>Đăng nhập</span>
          </Link>
        )}
      </nav>

      {/* ================= BOTTOM SHEET QUẢN LÝ CHO DI ĐỘNG ================= */}
      {mobileSheetOpen && (
        <div className="mobile-sheet-backdrop" onClick={() => setMobileSheetOpen(false)}>
          <div className="mobile-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-header">
              <div className="mobile-sheet-title">Danh mục Quản lý nông trại</div>
              <button
                className="mobile-sheet-close"
                onClick={() => setMobileSheetOpen(false)}
                aria-label="Đóng"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="mobile-sheet-grid">
              {managementLinks.map((item) => {
                const Icon = item.icon;
                const itemActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-sheet-card ${itemActive ? 'active' : ''}`}
                    onClick={() => setMobileSheetOpen(false)}
                  >
                    <div className="mobile-sheet-card-icon">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <div className="mobile-sheet-card-title">{item.label}</div>
                    <div className="mobile-sheet-card-desc">{item.desc}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;


