import React, { useState, useEffect } from 'react';
import { apiGetUsers } from '../../../services/api';
import {
  IconShield, IconClock, IconRotateCw, IconAlertTriangle,
  IconCheckCircle, IconLock, IconDatabase, IconServer,
} from '../../../components/icons';

export default function PanelSecurity() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiGetUsers()
      .then(d => setUsers(d || []))
      .catch(e => setError(e.response?.data?.message || 'Lỗi tải dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

  const recentLogins = [...users]
    .filter(u => u.lastLoginAt)
    .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt))
    .slice(0, 20);

  const multipleLoginRisk = users.filter(u => {
    if (!u.lastLoginAt) return false;
    const hourAgo = new Date(Date.now() - 3600 * 1000);
    return new Date(u.lastLoginAt) > hourAgo && u.role === 'OWNER';
  });

  const systemPolicies = [
    { label: 'Mã hóa mật khẩu', value: 'scrypt (salt + 64-byte key)', status: 'ok' },
    { label: 'JWT Token', value: 'RS256 — Hết hạn theo cấu hình', status: 'ok' },
    { label: 'Soft-delete người dùng', value: 'Bật — Dữ liệu được lưu trữ', status: 'ok' },
    { label: 'Phê duyệt tài khoản', value: 'Bật — Admin xét duyệt trước khi vào', status: 'ok' },
    { label: 'Rate limiting', value: 'Cấu hình tại backend main.ts', status: 'warning' },
    { label: 'HTTPS', value: 'Cần cấu hình tại môi trường production', status: 'warning' },
  ];

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span></div>}

      {/* Chính sách bảo mật hệ thống */}
      <div className="panel-section">
        <div className="section-header">
          <h2 className="section-title"><IconShield size={17} /> Cấu hình & Chính sách Bảo mật</h2>
        </div>
        <div className="panel-card-surface">
          <table className="panel-table">
            <thead><tr><th>Chính sách / Tính năng</th><th>Giá trị hiện tại</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {systemPolicies.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.label}</strong></td>
                  <td className="text-muted">{p.value}</td>
                  <td>
                    {p.status === 'ok'
                      ? <span className="status-badge active"><IconCheckCircle size={12} />Đã áp dụng</span>
                      : <span className="status-badge orange"><IconAlertTriangle size={12} />Cần kiểm tra</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lịch sử đăng nhập gần đây */}
      <div className="panel-section">
        <div className="section-header">
          <h2 className="section-title"><IconClock size={17} /> Lịch sử đăng nhập gần đây (20 gần nhất)</h2>
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
                  <tr><td colSpan={4} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /></td></tr>
                ) : recentLogins.length === 0 ? (
                  <tr><td colSpan={4} className="table-empty">Chưa có thông tin đăng nhập</td></tr>
                ) : recentLogins.map(u => (
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

      {/* Thông tin hệ thống */}
      <div className="panel-section">
        <div className="section-header">
          <h2 className="section-title"><IconServer size={17} /> Thông tin hệ thống & Cơ sở hạ tầng</h2>
        </div>
        <div className="sys-info-grid">
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconDatabase size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Cơ sở dữ liệu</div>
              <div className="sys-info-value">PostgreSQL + Prisma ORM</div>
              <div className="text-muted text-sm">Soft-delete được bật trên toàn bộ model</div>
            </div>
          </div>
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconShield size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Xác thực</div>
              <div className="sys-info-value">JWT Bearer Token</div>
              <div className="text-muted text-sm">Google OAuth2 + Email/Password</div>
            </div>
          </div>
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconLock size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Phân quyền</div>
              <div className="sys-info-value">RBAC — 3 Role cơ bản</div>
              <div className="text-muted text-sm">ADMIN / OWNER / WORKER</div>
            </div>
          </div>
          <div className="sys-info-card">
            <div className="sys-info-icon"><IconServer size={24} /></div>
            <div className="sys-info-body">
              <div className="sys-info-title">Backend</div>
              <div className="sys-info-value">NestJS + TypeScript</div>
              <div className="text-muted text-sm">Chạy trên cổng 3000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
