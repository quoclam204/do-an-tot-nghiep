import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PanelOverview from './panels/PanelOverview';
import PanelUsers from './panels/PanelUsers';
import PanelFarms from './panels/PanelFarms';
import PanelCatalog from './panels/PanelCatalog';
import PanelLogs from './panels/PanelLogs';
import PanelSync from './panels/PanelSync';
import PanelReports from './panels/PanelReports';
import PanelSecurity from './panels/PanelSecurity';
import PanelNotifications from './panels/PanelNotifications';
import {
  IconHome, IconUsers, IconWarehouse, IconLeaf, IconClipboardList,
  IconWifi, IconBarChart, IconShield, IconBell, IconArrowLeft,
  IconMenu, IconLogOut, IconChevronDown,
} from '../../components/icons';
import UserAvatar from '../../components/UserAvatar';
import './AdminDashboardPage.css';

const NAV_ITEMS = [
  {
    key: 'overview',
    label: 'Tổng quan',
    icon: IconHome,
    desc: 'Tổng quan hệ thống',
    group: 'main',
  },
  {
    key: 'users',
    label: 'Người dùng',
    icon: IconUsers,
    desc: 'Quản lý tài khoản & phân quyền',
    group: 'management',
  },
  {
    key: 'farms',
    label: 'Nông hộ & Vườn',
    icon: IconWarehouse,
    desc: 'Giám sát nông trại toàn hệ thống',
    group: 'management',
  },
  {
    key: 'catalog',
    label: 'Danh mục',
    icon: IconLeaf,
    desc: 'Cây trồng, vật tư, công việc',
    group: 'management',
  },
  {
    key: 'logs',
    label: 'Nhật ký',
    icon: IconClipboardList,
    desc: 'Giám sát hoạt động canh tác',
    group: 'monitoring',
  },
  {
    key: 'sync',
    label: 'Đồng bộ',
    icon: IconWifi,
    desc: 'Theo dõi trạng thái offline-sync',
    group: 'monitoring',
  },
  {
    key: 'reports',
    label: 'Báo cáo',
    icon: IconBarChart,
    desc: 'Báo cáo tài chính & thống kê',
    group: 'analytics',
  },
  {
    key: 'security',
    label: 'Bảo mật',
    icon: IconShield,
    desc: 'Audit log, cấu hình hệ thống',
    group: 'system',
  },
  {
    key: 'notifications',
    label: 'Thông báo',
    icon: IconBell,
    desc: 'Gửi & quản lý thông báo',
    group: 'system',
  },
];

const NAV_GROUPS = {
  main: 'Tổng quan',
  management: 'Quản lý',
  monitoring: 'Giám sát',
  analytics: 'Phân tích',
  system: 'Hệ thống',
};

const PANEL_COMPONENTS = {
  overview: PanelOverview,
  users: PanelUsers,
  farms: PanelFarms,
  catalog: PanelCatalog,
  logs: PanelLogs,
  sync: PanelSync,
  reports: PanelReports,
  security: PanelSecurity,
  notifications: PanelNotifications,
};

const PANEL_TITLES = {
  overview: 'Tổng quan hệ thống',
  users: 'Quản lý người dùng & Phân quyền',
  farms: 'Nông hộ & Vườn/Lô',
  catalog: 'Danh mục dùng chung',
  logs: 'Nhật ký & Giám sát dữ liệu',
  sync: 'Giám sát đồng bộ Offline',
  reports: 'Báo cáo tổng hợp',
  security: 'Bảo mật & Cấu hình hệ thống',
  notifications: 'Thông báo & Hỗ trợ',
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  // Group nav items by group
  const groupedNav = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const ActivePanelComponent = PANEL_COMPONENTS[activePanel] || PanelOverview;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('dalat-agri-token');
    navigate('/');
  };

  // ─── THÔNG BÁO ĐƠN GIẢN, GẦN GŨI CHO NÔNG DÂN KHI VÀO TRANG ADMIN ───
  if (user?.role !== 'ADMIN') {
    return (
      <div className="farmer-notice-screen">
        <div className="farmer-notice-card">
          <div className="farmer-notice-icon">🌿</div>
          <h1 className="farmer-notice-title">Trang này dành riêng cho Quản trị viên</h1>
          <p className="farmer-notice-desc">
            Chào <strong>{user?.fullName || 'bạn'}</strong>, trang này dùng để quản trị kỹ thuật toàn hệ thống. Để ghi chép nhật ký và quản lý mùa vụ, bạn vui lòng quay về trang quản lý vườn của mình nhé!
          </p>

          <button className="btn-farmer-back" onClick={() => navigate('/dashboard')}>
            <IconHome size={20} />
            <span>Quay về Quản lý Vườn của tôi</span>
          </button>

          <div className="farmer-notice-links">
            <button className="link-farmer-action" onClick={() => navigate('/')}>
              Trang chủ DalatAgri
            </button>
            <span className="dot-sep">•</span>
            <button className="link-farmer-action danger" onClick={handleLogout}>
              Đăng xuất tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ─── SIDEBAR ─── */}
      <aside className="admin-sidebar">
        {/* Logo & Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo" onClick={() => navigate('/')} title="Về trang chủ DalatAgri" style={{ cursor: 'pointer' }}>
            <img src="/logo.png" alt="DalatAgri Logo" className="brand-logo-img" />
            {!sidebarCollapsed && (
              <div className="brand-text">
                <span className="brand-name">DalatAgri</span>
                <span className="brand-sub">Quản trị hệ thống</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            <IconMenu size={18} />
          </button>
        </div>

        {/* Back to Home */}
        <div className="sidebar-back-section">
          <button className="btn-back-home" onClick={() => navigate('/')} title="Trở về trang chính DalatAgri">
            <IconArrowLeft size={16} />
            {!sidebarCollapsed && <span>Trang chủ website</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {Object.entries(groupedNav).map(([groupKey, items]) => (
            <div key={groupKey} className="nav-group">
              {!sidebarCollapsed && (
                <div className="nav-group-label">{NAV_GROUPS[groupKey]}</div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    className={`nav-item ${activePanel === item.key ? 'active' : ''}`}
                    onClick={() => setActivePanel(item.key)}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="nav-item-icon"><Icon size={20} /></span>
                    {!sidebarCollapsed && (
                      <span className="nav-item-label">{item.label}</span>
                    )}
                    {activePanel === item.key && <span className="nav-active-bar"></span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User info & Logout */}
        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="sidebar-user-info">
              <div className="user-avatar-wrap">
                <UserAvatar user={user} size={36} className="user-avatar-sidebar" />
                <div className="user-info-text">
                  <span className="user-display-name">{user?.fullName || 'Admin'}</span>
                  <span className="user-display-role">Quản trị viên</span>
                </div>
              </div>
            </div>
          )}
          <button className="admin-logout-btn" onClick={handleLogout} title="Đăng xuất">
            <IconLogOut size={16} />
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="admin-main">
        {/* Page Header */}
        <div className="admin-page-header">
          <div className="page-header-left">
            <div className="page-breadcrumb">
              <span className="breadcrumb-admin">Admin Portal</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{PANEL_TITLES[activePanel]}</span>
            </div>
            <h1 className="page-title">{PANEL_TITLES[activePanel]}</h1>
          </div>
          <div className="page-header-right">
            <button
              className="btn-header-fullscreen"
              onClick={toggleFullScreen}
              title={isFullScreen ? 'Thu nhỏ cửa sổ' : 'Bật chế độ toàn màn hình (F11)'}
            >
              {isFullScreen ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  <span>Toàn màn hình</span>
                </>
              )}
            </button>
            <div className="header-time">
              {new Date().toLocaleString('vi-VN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Panel Content */}
        <div className="admin-panel-area">
          <ActivePanelComponent />
        </div>
      </main>
    </div>
  );
}
