import React, { useState, useEffect } from 'react';
import './AdminDashboardPage.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import {
  IconUsers,
  IconClock,
  IconRotateCw,
  IconLineChart,
  IconPlus,
  IconLock,
  IconUnlock,
  IconTrash,
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconWarehouse,
  IconMapPin,
  IconSprout,
  IconClipboardList,
  IconCircleDollar,
  IconShield,
  IconZap,
} from '../../components/icons';
import {
  apiGetUsers,
  apiAdminCreateUser,
  apiRestoreUser,
  apiGetDeletedUsers,
  apiGetStatistics,
  apiUpdateUserRole,
  apiToggleUserActive,
  apiDeleteUser,
  apiGetPendingUsers,
  apiApproveUser,
  apiRejectUser
} from '../../services/api';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'pending' | 'deleted' | 'stats'
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form tạo tài khoản mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'FARMER'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Always fetch pending users count for the badge
      apiGetPendingUsers().then(data => setPendingUsers(data || [])).catch(() => {});

      if (activeTab === 'users') {
        const data = await apiGetUsers();
        setUsers(data || []);
      } else if (activeTab === 'pending') {
        const data = await apiGetPendingUsers();
        setPendingUsers(data || []);
      } else if (activeTab === 'deleted') {
        const data = await apiGetDeletedUsers();
        setDeletedUsers(data || []);
      } else if (activeTab === 'stats') {
        const data = await apiGetStatistics();
        setStats(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, userName) => {
    try {
      await apiApproveUser(userId);
      setSuccess(`Đã phê duyệt tài khoản thành công cho ${userName || 'người dùng'}!`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi phê duyệt tài khoản');
    }
  };

  const handleRejectUser = async (userId, userName) => {
    const reason = window.prompt(`Nhập lý do từ chối tài khoản ${userName || ''}:`);
    if (reason === null) return; // User cancelled prompt
    try {
      await apiRejectUser(userId, reason.trim() || 'Hồ sơ không đáp ứng điều kiện');
      setSuccess(`Đã từ chối tài khoản của ${userName || 'người dùng'}.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi từ chối tài khoản');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiAdminCreateUser(newUserData);
      setSuccess(`Đã tạo thành công tài khoản cho ${newUserData.fullName}!`);
      setShowCreateModal(false);
      setNewUserData({ fullName: '', email: '', phone: '', password: '', role: 'FARMER' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await apiToggleUserActive(userId);
      setSuccess('Đã cập nhật trạng thái tài khoản');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await apiUpdateUserRole(userId, newRole);
      setSuccess(`Đã thay đổi vai trò thành ${newRole}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đổi vai trò');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa tài khoản này? (Có thể khôi phục lại sau)')) return;
    try {
      await apiDeleteUser(userId);
      setSuccess('Đã xóa tài khoản vào danh sách lưu trữ');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa tài khoản');
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      await apiRestoreUser(userId);
      setSuccess('Khôi phục tài khoản thành công!');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể khôi phục tài khoản');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        {/* Header Bar */}
        <div className="admin-header">
          <div>
            <div className="admin-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconShield size={16} /> Trung tâm quản trị hệ thống
            </div>
            <h1 className="admin-title">Quản Trị Viên DalatAgri</h1>
            <p className="admin-subtitle">Quản lý người dùng nông hộ, kiểm soát truy cập và theo dõi thống kê toàn bộ nền tảng</p>
          </div>
          <div className="admin-header-actions">
            <button className="btn-create-user" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconPlus size={16} /> Thêm tài khoản mới
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-alert error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlertTriangle size={18} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="admin-alert success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCheckCircle size={18} /> <span>{success}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconUsers size={16} /> Tài khoản hoạt động ({users.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconClock size={16} /> Chờ xét duyệt {pendingUsers.length > 0 && <span className="tab-badge">{pendingUsers.length}</span>}
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'deleted' ? 'active' : ''}`}
            onClick={() => setActiveTab('deleted')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconRotateCw size={16} /> Tài khoản đã xóa / Khôi phục ({deletedUsers.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconLineChart size={16} /> Thống kê nền tảng
          </button>
        </div>

        {/* Tab 1: Danh sách tài khoản hoạt động */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">Đang tải danh sách tài khoản...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">Không có người dùng nào</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="user-avatar-initial">
                              {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                            </span>
                            <strong>{u.fullName || 'Chưa cập nhật'}</strong>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td>
                          <select
                            className="role-select"
                            value={u.role}
                            disabled={u.id === user?.id}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          >
                            <option value="FARMER">Chủ vườn (FARMER)</option>
                            <option value="TECHNICIAN">Kỹ thuật viên (TECHNICIAN)</option>
                            <option value="VIEWER">Quan sát viên (VIEWER)</option>
                            <option value="ADMIN">Quản trị viên (ADMIN)</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span className={`status-pill ${u.isActive ? 'active' : 'inactive'}`}>
                              {u.isActive ? 'Đang hoạt động' : 'Đang bị khóa'}
                            </span>
                            {u.approvalStatus === 'PENDING' && (
                              <span className="status-pill pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <IconClock size={12} /> Chờ duyệt
                              </span>
                            )}
                            {u.approvalStatus === 'REJECTED' && (
                              <span className="status-pill rejected" title={u.rejectionReason} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <IconXCircle size={12} /> Bị từ chối
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div className="action-buttons">
                            {u.id !== user?.id && (
                              <>
                                <button
                                  className={`btn-action-small ${u.isActive ? 'btn-lock' : 'btn-unlock'}`}
                                  onClick={() => handleToggleActive(u.id)}
                                  title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {u.isActive ? (
                                    <>
                                      <IconLock size={13} /> Khóa
                                    </>
                                  ) : (
                                    <>
                                      <IconUnlock size={13} /> Mở
                                    </>
                                  )}
                                </button>
                                <button
                                  className="btn-action-small btn-del"
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="Xóa tài khoản"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <IconTrash size={13} /> Xóa
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Danh sách tài khoản chờ xét duyệt */}
        {activeTab === 'pending' && (
          <div className="admin-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò xin cấp</th>
                    <th>Thời điểm gửi yêu cầu</th>
                    <th>Hành động phê duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">Đang kiểm tra danh sách chờ xét duyệt...</td>
                    </tr>
                  ) : pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4" style={{ color: '#16a34a', fontWeight: '500' }}>
                        🎉 Hiện không có yêu cầu đăng ký nào đang chờ duyệt!
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="user-avatar-initial">
                              {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                            </span>
                            <strong>{u.fullName || 'Chưa cập nhật'}</strong>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td>
                          <span className="role-tag">{u.role}</span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleString('vi-VN')}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action-small btn-approve"
                              onClick={() => handleApproveUser(u.id, u.fullName)}
                              title="Phê duyệt tài khoản và cho phép đăng nhập"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconCheckCircle size={14} /> Phê duyệt
                            </button>
                            <button
                              className="btn-action-small btn-reject"
                              onClick={() => handleRejectUser(u.id, u.fullName)}
                              title="Từ chối tài khoản"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconXCircle size={14} /> Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Danh sách tài khoản đã xóa (Khôi phục) */}
        {activeTab === 'deleted' && (
          <div className="admin-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò lúc xóa</th>
                    <th>Thời điểm xóa</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && deletedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">Đang kiểm tra dữ liệu...</td>
                    </tr>
                  ) : deletedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">Không có tài khoản nào trong thùng rác</td>
                    </tr>
                  ) : (
                    deletedUsers.map((u) => (
                      <tr key={u.id} className="deleted-row">
                        <td><strong>{u.fullName || '—'}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td><span className="role-tag">{u.role}</span></td>
                        <td>{new Date(u.deletedAt).toLocaleString('vi-VN')}</td>
                        <td>
                          <button
                            className="btn-action-small btn-restore"
                            onClick={() => handleRestoreUser(u.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <IconRotateCw size={14} /> Khôi phục tài khoản
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Thống kê nền tảng */}
        {activeTab === 'stats' && (
          <div className="admin-stats-view">
            {loading && !stats ? (
              <div className="loading-spinner">Đang tổng hợp dữ liệu thống kê...</div>
            ) : stats ? (
              <>
                <div className="stats-overview-grid">
                  <div className="stat-card stat-users">
                    <div className="stat-icon"><IconUsers size={32} /></div>
                    <div className="stat-number">{stats.overview?.totalUsers || 0}</div>
                    <div className="stat-label">Tổng người dùng ({stats.overview?.activeUsers || 0} đang hoạt động)</div>
                  </div>
                  <div className="stat-card stat-farms">
                    <div className="stat-icon"><IconWarehouse size={32} /></div>
                    <div className="stat-number">{stats.overview?.totalFarms || 0}</div>
                    <div className="stat-label">Tổng số nông trại</div>
                  </div>
                  <div className="stat-card stat-plots">
                    <div className="stat-icon"><IconMapPin size={32} /></div>
                    <div className="stat-number">{stats.overview?.totalPlots || 0}</div>
                    <div className="stat-label">Lô canh tác được thiết lập</div>
                  </div>
                  <div className="stat-card stat-seasons">
                    <div className="stat-icon"><IconSprout size={32} /></div>
                    <div className="stat-number">{stats.overview?.totalSeasons || 0}</div>
                    <div className="stat-label">Vụ mùa canh tác</div>
                  </div>
                  <div className="stat-card stat-logs">
                    <div className="stat-icon"><IconClipboardList size={32} /></div>
                    <div className="stat-number">{stats.overview?.totalActivityLogs || 0}</div>
                    <div className="stat-label">Nhật ký hoạt động ghi nhận</div>
                  </div>
                  <div className="stat-card stat-sales">
                    <div className="stat-icon"><IconCircleDollar size={32} /></div>
                    <div className="stat-number">{formatCurrency(stats.overview?.totalRevenue || 0)}</div>
                    <div className="stat-label">Doanh số bán hàng ({stats.overview?.totalInvoices || 0} hóa đơn)</div>
                  </div>
                </div>

                {/* Phân bố người dùng theo vai trò */}
                {stats.usersByRole && (
                  <div className="admin-card mt-4">
                    <h3>Phân bố vai trò người dùng</h3>
                    <div className="role-distribution-grid">
                      {stats.usersByRole.map((r) => (
                        <div key={r.role} className="role-stat-box">
                          <span className="role-name">{r.role}</span>
                          <span className="role-count">{r._count?.id || 0} tài khoản</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Modal tạo tài khoản mới */}
        {showCreateModal && (
          <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconPlus size={18} /> Thêm tài khoản người dùng mới
                </h3>
                <button className="btn-close" onClick={() => setShowCreateModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleCreateUser} className="admin-create-form">
                <div className="form-group">
                  <label>Họ và tên <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn Nông"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Địa chỉ Email <span className="req">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="nongdan@gmail.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu khởi tạo <span className="req">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  >
                    <option value="FARMER">Chủ nông hộ (FARMER)</option>
                    <option value="TECHNICIAN">Kỹ thuật viên (TECHNICIAN)</option>
                    <option value="VIEWER">Quan sát viên (VIEWER)</option>
                    <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
