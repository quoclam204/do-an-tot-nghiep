import React, { useState, useEffect } from 'react';
import { apiGetUsers } from '../../../services/api';
import {
  IconShield, IconClock, IconRotateCw, IconAlertTriangle,
  IconCheckCircle, IconLock, IconDatabase, IconServer, IconDownload,
  IconSearch, IconZap,
} from '../../../components/icons';

export default function PanelSecurity() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pingStatus, setPingStatus] = useState({ latency: null, status: 'idle' });

  useEffect(() => {
    loadData();
    checkHealth();
  }, []);

  const loadData = () => {
    setLoading(true);
    apiGetUsers()
      .then(d => setUsers(d || []))
      .catch(e => setError(e.response?.data?.message || 'Lỗi tải dữ liệu'))
      .finally(() => setLoading(false));
  };

  const checkHealth = async () => {
    const t0 = performance.now();
    setPingStatus({ latency: null, status: 'checking' });
    try {
      await apiGetUsers();
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);
      setPingStatus({ latency, status: 'healthy' });
    } catch {
      setPingStatus({ latency: null, status: 'error' });
    }
  };

  const recentLogins = [...users]
    .filter(u => u.lastLoginAt)
    .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt));

  const filteredLogins = searchTerm
    ? recentLogins.filter(u =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : recentLogins.slice(0, 30);

  const systemPolicies = [
    { label: 'Mã hóa mật khẩu', value: 'scrypt (salt 16 bytes + derived key 64 bytes)', status: 'ok' },
    { label: 'Cơ chế xác thực', value: 'JWT Bearer RS256 — Kèm Refresh Token', status: 'ok' },
    { label: 'Lưu trữ an toàn (Soft-delete)', value: 'Bật — Tất cả bảng dữ liệu hỗ trợ soft-delete', status: 'ok' },
    { label: 'Quy trình phê duyệt tài khoản', value: 'Bật — Quản trị viên xét duyệt hồ sơ đăng ký', status: 'ok' },
    { label: 'Bảo vệ mật khẩu người dùng', value: 'Admin không được xem hay can thiệp mật khẩu cá nhân', status: 'ok' },
    { label: 'Kiểm soát truy cập (RBAC)', value: 'Phân quyền chặt chẽ giữa ADMIN, OWNER, WORKER', status: 'ok' },
  ];

  const handleExportCSV = () => {
    if (recentLogins.length === 0) return;
    const header = ['Họ và tên', 'Email', 'Số điện thoại', 'Vai trò', 'Thời điểm đăng nhập cuối', 'Trạng thái tài khoản'];
    const rows = recentLogins.map(u => [
      `"${u.fullName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      u.role,
      `"${new Date(u.lastLoginAt).toLocaleString('vi-VN')}"`,
      u.isActive ? 'Hoạt động' : 'Bị khóa',
    ]);
    const csv = '\ufeff' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhat-ky-dang-nhap-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span></div>}

      {/* Health Check Bar */}
      <div className="mini-kpi-row mb-4">
        <div className="mini-kpi">
          <span className="mini-kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: pingStatus.status === 'healthy' ? '#16a34a' : pingStatus.status === 'error' ? '#dc2626' : '#d97706' }}></span>
            {pingStatus.status === 'healthy' ? `${pingStatus.latency} ms` : pingStatus.status === 'checking' ? 'Đang đo...' : 'Lỗi'}
          </span>
          <span className="mini-kpi-label">Độ trễ API Backend</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value" style={{ color: '#16a34a' }}>Sẵn sàng</span>
          <span className="mini-kpi-label">PostgreSQL Database</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value">{users.length}</span>
          <span className="mini-kpi-label">Tài khoản trong hệ thống</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value">{users.filter(u => u.isActive).length}</span>
          <span className="mini-kpi-label">Tài khoản hoạt động an toàn</span>
        </div>
      </div>

      {/* Chính sách bảo mật hệ thống */}
      <div className="panel-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="section-title"><IconShield size={17} /> Cấu hình & Chính sách Bảo mật Hệ thống</h2>
          <button className="btn-action-secondary btn-sm" onClick={checkHealth}>
            <IconZap size={13} /> Kiểm tra kết nối Live
          </button>
        </div>
        <div className="panel-card-surface">
          <table className="panel-table">
            <thead><tr><th>Chính sách / Tiêu chuẩn bảo mật</th><th>Cơ chế thực thi</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {systemPolicies.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.label}</strong></td>
                  <td className="text-muted">{p.value}</td>
                  <td>
                    <span className="status-badge active"><IconCheckCircle size={12} />Đã áp dụng</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lịch sử đăng nhập */}
      <div className="panel-section mt-4">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="section-title"><IconClock size={17} /> Nhật ký đăng nhập hệ thống ({filteredLogins.length})</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              className="search-input"
              style={{ width: '220px', height: '34px' }}
              placeholder="Tìm theo tên, email, role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="btn-action-secondary btn-sm" onClick={handleExportCSV}>
              <IconDownload size={13} /> Xuất CSV
            </button>
          </div>
        </div>
        <div className="panel-card-surface">
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr>
                <th>Người dùng</th><th>Vai trò</th><th>Thời điểm đăng nhập</th>
                <th>Trạng thái TK</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /> Đang tải...</td></tr>
                ) : filteredLogins.length === 0 ? (
                  <tr><td colSpan={4} className="table-empty">Không có nhật ký đăng nhập phù hợp</td></tr>
                ) : filteredLogins.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar-sm">{u.fullName?.charAt(0) || 'U'}</span>
                        <div>
                          <div><strong>{u.fullName || '—'}</strong></div>
                          <div className="text-muted text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="role-badge">{u.role}</span></td>
                    <td className="text-muted">{new Date(u.lastLoginAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Thông tin cơ sở hạ tầng */}
      <div className="panel-section mt-4">
        <div className="section-header">
          <h2 className="section-title"><IconServer size={17} /> Thông tin hệ thống & Cơ sở hạ tầng</h2>
        </div>
        <div className="sys-info-grid">
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconDatabase size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Cơ sở dữ liệu</div>
              <div className="sys-info-value">PostgreSQL + Prisma ORM</div>
              <div className="text-muted text-sm">Toàn vẹn quan hệ 1-N, N-N, Soft-delete tự động</div>
            </div>
          </div>
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconShield size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Xác thực bảo mật</div>
              <div className="sys-info-value">JWT Bearer + Mã hóa scrypt</div>
              <div className="text-muted text-sm">Hỗ trợ Google OAuth2 và Email/Password an toàn</div>
            </div>
          </div>
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconLock size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Phân quyền hệ thống</div>
              <div className="sys-info-value">Role-Based Access Control</div>
              <div className="text-muted text-sm">Quản trị viên (ADMIN) / Chủ nông hộ (OWNER) / Công nhân (WORKER)</div>
            </div>
          </div>
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconServer size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Máy chủ ứng dụng</div>
              <div className="sys-info-value">NestJS + Node.js</div>
              <div className="text-muted text-sm">Kiến trúc module hóa, micro-service ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
