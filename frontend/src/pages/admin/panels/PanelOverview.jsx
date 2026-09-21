import React, { useState, useEffect } from 'react';
import { apiGetStatistics } from '../../../services/api';
import {
  IconUsers, IconWarehouse, IconSprout,
  IconClipboardList, IconClock,
  IconAlertTriangle, IconCheckCircle, IconRotateCw,
  IconShield,
} from '../../../components/icons';

export default function PanelOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await apiGetStatistics();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải thống kê hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);
  const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

  if (loading) return (
    <div className="panel-loading">
      <IconRotateCw size={32} className="spin-anim text-primary-green" />
      <span>Đang tải dữ liệu tổng quan hệ thống...</span>
    </div>
  );

  if (error) return (
    <div className="panel-error">
      <IconAlertTriangle size={20} />
      <span>{error}</span>
    </div>
  );

  const kpis = [
    { title: 'Tổng người dùng', value: fmt(stats?.totalUsers), sub: `${fmt(stats?.activeUsers)} đang hoạt động`, icon: IconUsers, color: 'green' },
    { title: 'Nông trại ghi nhận', value: fmt(stats?.totalFarms), sub: 'Trên địa bàn Lâm Đồng', icon: IconWarehouse, color: 'teal' },
    { title: 'Vụ mùa canh tác', value: fmt(stats?.totalSeasons), sub: 'Đang quản lý & theo dõi', icon: IconSprout, color: 'yellow' },
    { title: 'Nhật ký hoạt động', value: fmt(stats?.totalLogs), sub: 'Ghi chép toàn hệ thống', icon: IconClipboardList, color: 'blue' },
    { title: 'Chờ phê duyệt', value: fmt(stats?.pendingUsers), sub: 'Tài khoản cần xét duyệt', icon: IconClock, color: stats?.pendingUsers > 0 ? 'orange' : 'gray' },
    { title: 'Tài khoản bị khóa', value: fmt(stats?.inactiveUsers), sub: 'Cần kiểm tra & xử lý', icon: IconShield, color: stats?.inactiveUsers > 0 ? 'red' : 'gray' },
  ];

  return (
    <div className="panel-content">
      <div className="panel-section">
        <div className="section-header">
          <h2 className="section-title">Tổng quan hệ thống DalatAgri</h2>
          <button className="btn-section-refresh" onClick={loadStats}>
            <IconRotateCw size={14} /> Làm mới
          </button>
        </div>

        {/* KPI Grid */}
        <div className="overview-kpi-grid">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className={`overview-kpi-card kpi-${kpi.color}`}>
                <div className="kpi-card-top">
                  <span className="kpi-label">{kpi.title}</span>
                  <div className="kpi-icon-wrap"><Icon size={20} /></div>
                </div>
                <div className="kpi-big-value">{kpi.value}</div>
                <div className="kpi-desc">{kpi.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cảnh báo hệ thống */}
      {(stats?.pendingUsers > 0 || stats?.inactiveUsers > 0) && (
        <div className="panel-section">
          <div className="section-header">
            <h2 className="section-title">Cảnh báo cần xử lý</h2>
          </div>
          <div className="alerts-list">
            {stats.pendingUsers > 0 && (
              <div className="system-alert warning">
                <IconClock size={18} />
                <div className="alert-body">
                  <strong>Có {stats.pendingUsers} tài khoản đang chờ phê duyệt</strong>
                  <span>Vui lòng vào mục "Người dùng & Phân quyền → Chờ xét duyệt" để xử lý.</span>
                </div>
              </div>
            )}
            {stats.inactiveUsers > 0 && (
              <div className="system-alert info">
                <IconShield size={18} />
                <div className="alert-body">
                  <strong>Có {stats.inactiveUsers} tài khoản đang bị vô hiệu hóa</strong>
                  <span>Kiểm tra và mở khóa tài khoản nếu cần thiết.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phân bố vai trò */}
      {stats?.usersByRole && stats.usersByRole.length > 0 && (
        <div className="panel-section">
          <div className="section-header">
            <h2 className="section-title">Phân bổ người dùng theo vai trò</h2>
          </div>
          <div className="role-dist-grid">
            {stats.usersByRole.map((r) => {
              const roleName = r.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : (r.role === 'OWNER' ? 'Chủ nông hộ / Vườn (OWNER)' : 'Công nhân / Lao động (WORKER)');
              return (
                <div key={r.role} className="role-dist-card">
                  <div className="role-dist-role">{roleName}</div>
                  <div className="role-dist-count">{fmt(r.count)}</div>
                  <div className="role-dist-desc">Tài khoản trong hệ thống</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tài khoản đăng ký gần đây */}
      {stats?.recentUsers && stats.recentUsers.length > 0 && (
        <div className="panel-section">
          <div className="section-header">
            <h2 className="section-title">Tài khoản đăng ký trong 7 ngày qua</h2>
          </div>
          <div className="panel-card-surface">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Thời điểm đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar-sm">{u.fullName?.charAt(0) || 'U'}</span>
                        <strong>{u.fullName || '—'}</strong>
                      </div>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td><span className="role-badge">{u.role}</span></td>
                    <td className="text-muted">{new Date(u.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
