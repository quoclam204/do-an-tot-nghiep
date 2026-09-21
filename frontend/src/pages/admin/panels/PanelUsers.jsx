import React, { useState, useEffect } from 'react';
import {
  apiGetUsers, apiGetPendingUsers, apiGetDeletedUsers,
  apiAdminCreateUser, apiUpdateUserRole, apiToggleUserActive,
  apiDeleteUser, apiRestoreUser, apiApproveUser, apiRejectUser,
  apiAdminResetPassword,
} from '../../../services/api';
import {
  IconUsers, IconClock, IconRotateCw, IconPlus, IconLock, IconUnlock,
  IconTrash, IconCheckCircle, IconXCircle, IconAlertTriangle, IconShield,
} from '../../../components/icons';

const TABS = [
  { key: 'active', label: 'Tài khoản hoạt động', icon: IconUsers },
  { key: 'pending', label: 'Chờ xét duyệt', icon: IconClock },
  { key: 'deleted', label: 'Thùng rác', icon: IconTrash },
];

export default function PanelUsers() {
  const [tab, setTab] = useState('active');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(null); // userId
  const [resetPwd, setResetPwd] = useState('');
  const [newUser, setNewUser] = useState({ fullName: '', email: '', phone: '', password: '', role: 'OWNER' });

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      apiGetPendingUsers().then(d => setPendingUsers(d || [])).catch(() => {});
      if (tab === 'active') { const d = await apiGetUsers(); setUsers(d || []); }
      else if (tab === 'pending') { const d = await apiGetPendingUsers(); setPendingUsers(d || []); }
      else if (tab === 'deleted') { const d = await apiGetDeletedUsers(); setDeletedUsers(d || []); }
    } catch (err) { setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const handleApprove = async (id, name) => {
    try { await apiApproveUser(id); showSuccess(`Đã phê duyệt tài khoản ${name}`); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi phê duyệt'); }
  };
  const handleReject = async (id, name) => {
    const reason = window.prompt(`Lý do từ chối tài khoản "${name}":`);
    if (reason === null) return;
    try { await apiRejectUser(id, reason || 'Không đủ điều kiện'); showSuccess(`Đã từ chối tài khoản ${name}`); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi từ chối'); }
  };
  const handleToggle = async (id) => {
    try { await apiToggleUserActive(id); showSuccess('Đã cập nhật trạng thái'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi'); }
  };
  const handleChangeRole = async (id, role) => {
    try { await apiUpdateUserRole(id, role); showSuccess('Đã cập nhật vai trò'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi đổi vai trò'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Chuyển tài khoản này vào thùng rác?')) return;
    try { await apiDeleteUser(id); showSuccess('Đã xóa tài khoản'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi xóa'); }
  };
  const handleRestore = async (id) => {
    try { await apiRestoreUser(id); showSuccess('Đã khôi phục tài khoản'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi khôi phục'); }
  };
  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await apiAdminCreateUser(newUser);
      showSuccess(`Đã tạo tài khoản cho ${newUser.fullName}`);
      setShowCreateModal(false);
      setNewUser({ fullName: '', email: '', phone: '', password: '', role: 'OWNER' });
      await loadData();
    } catch (e) { showError(e.response?.data?.message || 'Lỗi tạo tài khoản'); }
    finally { setLoading(false); }
  };
  const handleResetPwd = async () => {
    if (!resetPwd || resetPwd.length < 6) { showError('Mật khẩu phải ít nhất 6 ký tự'); return; }
    try {
      const res = await apiAdminResetPassword(showResetModal, resetPwd);
      showSuccess(res.message || 'Đã đặt lại mật khẩu');
      setShowResetModal(null); setResetPwd('');
    } catch (e) { showError(e.response?.data?.message || 'Lỗi đặt lại mật khẩu'); }
  };

  const activeList = users.filter(u => !searchText || u.fullName?.toLowerCase().includes(searchText.toLowerCase()) || u.email?.toLowerCase().includes(searchText.toLowerCase()));
  const pendingList = pendingUsers.filter(u => !searchText || u.fullName?.toLowerCase().includes(searchText.toLowerCase()) || u.email?.toLowerCase().includes(searchText.toLowerCase()));
  const deletedList = deletedUsers.filter(u => !searchText || u.fullName?.toLowerCase().includes(searchText.toLowerCase()) || u.email?.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}
      {success && <div className="panel-alert success"><IconCheckCircle size={18} /><span>{success}</span><button onClick={() => setSuccess('')}>&times;</button></div>}

      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="panel-tabs-inline">
          {TABS.map(t => {
            const Icon = t.icon;
            const count = t.key === 'active' ? users.length : t.key === 'pending' ? pendingUsers.length : deletedUsers.length;
            return (
              <button key={t.key} className={`panel-tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <Icon size={15} />
                <span>{t.label}</span>
                {t.key === 'pending' && pendingUsers.length > 0
                  ? <span className="tab-count-badge warning">{pendingUsers.length}</span>
                  : <span className="tab-count-badge">{count}</span>
                }
              </button>
            );
          })}
        </div>
        <div className="toolbar-right">
          <input className="search-input" placeholder="Tìm kiếm tên, email..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          <button className="btn-action-primary" onClick={() => setShowCreateModal(true)}>
            <IconPlus size={15} /> Tạo tài khoản
          </button>
        </div>
      </div>

      {/* TABLE: Active users */}
      {tab === 'active' && (
        <div className="panel-card-surface">
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr>
                <th>Họ và tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th>
                <th>Trạng thái</th><th>Đăng nhập cuối</th><th className="text-center">Thao tác</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="table-empty"><IconRotateCw size={20} className="spin-anim" /> Đang tải...</td></tr>
                ) : activeList.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty">Không tìm thấy tài khoản nào</td></tr>
                ) : activeList.map(u => (
                  <tr key={u.id}>
                    <td><div className="user-cell"><span className="user-avatar-sm">{u.fullName?.charAt(0) || 'U'}</span><strong>{u.fullName || '—'}</strong></div></td>
                    <td className="text-muted">{u.email}</td>
                    <td className="text-muted">{u.phone || '—'}</td>
                    <td>
                      <select className="inline-select" value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)}>
                        <option value="OWNER">OWNER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="WORKER">WORKER</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                        <span className="dot"></span>{u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                      {u.approvalStatus === 'PENDING' && <span className="status-badge pending ml-1"><IconClock size={10} />Chờ duyệt</span>}
                      {u.approvalStatus === 'REJECTED' && <span className="status-badge rejected ml-1"><IconXCircle size={10} />Từ chối</span>}
                    </td>
                    <td className="text-muted text-sm">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className={`btn-xs ${u.isActive ? 'orange' : 'green'}`} onClick={() => handleToggle(u.id)} title={u.isActive ? 'Khóa' : 'Mở khóa'}>
                          {u.isActive ? <><IconLock size={12} />Khóa</> : <><IconUnlock size={12} />Mở</>}
                        </button>
                        <button className="btn-xs blue" onClick={() => setShowResetModal(u.id)} title="Đặt lại mật khẩu">
                          <IconShield size={12} />Mật khẩu
                        </button>
                        <button className="btn-xs red" onClick={() => handleDelete(u.id)} title="Chuyển vào thùng rác">
                          <IconTrash size={12} />Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE: Pending users */}
      {tab === 'pending' && (
        <div className="panel-card-surface">
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr>
                <th>Họ và tên</th><th>Email</th><th>SĐT</th><th>Vai trò xin cấp</th>
                <th>Ngày đăng ký</th><th className="text-center">Phê duyệt</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="table-empty"><IconRotateCw size={20} className="spin-anim" /> Đang tải...</td></tr>
                ) : pendingList.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty success">🎉 Không có hồ sơ nào đang chờ xét duyệt!</td></tr>
                ) : pendingList.map(u => (
                  <tr key={u.id}>
                    <td><div className="user-cell"><span className="user-avatar-sm">{u.fullName?.charAt(0) || 'U'}</span><strong>{u.fullName || '—'}</strong></div></td>
                    <td className="text-muted">{u.email}</td>
                    <td className="text-muted">{u.phone || '—'}</td>
                    <td><span className="role-badge">{u.role}</span></td>
                    <td className="text-muted">{new Date(u.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <div className="action-btns justify-center">
                        <button className="btn-xs green" onClick={() => handleApprove(u.id, u.fullName)}><IconCheckCircle size={12} />Phê duyệt</button>
                        <button className="btn-xs red" onClick={() => handleReject(u.id, u.fullName)}><IconXCircle size={12} />Từ chối</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE: Deleted users */}
      {tab === 'deleted' && (
        <div className="panel-card-surface">
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr>
                <th>Họ và tên</th><th>Email</th><th>Vai trò</th><th>Thời điểm xóa</th><th className="text-center">Khôi phục</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="table-empty"><IconRotateCw size={20} className="spin-anim" /></td></tr>
                ) : deletedList.length === 0 ? (
                  <tr><td colSpan={5} className="table-empty">Thùng rác trống</td></tr>
                ) : deletedList.map(u => (
                  <tr key={u.id} className="row-deleted">
                    <td><strong>{u.fullName || '—'}</strong></td>
                    <td className="text-muted">{u.email}</td>
                    <td><span className="role-badge">{u.role}</span></td>
                    <td className="text-muted">{new Date(u.deletedAt).toLocaleString('vi-VN')}</td>
                    <td><div className="action-btns justify-center">
                      <button className="btn-xs green" onClick={() => handleRestore(u.id)}><IconRotateCw size={12} />Khôi phục</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tạo tài khoản */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconPlus size={18} className="text-primary-green" /><h3>Tạo tài khoản mới</h3></div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-row">
                <label>Họ và tên <span className="req">*</span></label>
                <input required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} placeholder="Nguyễn Văn A" />
              </div>
              <div className="form-row">
                <label>Email <span className="req">*</span></label>
                <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@gmail.com" />
              </div>
              <div className="form-row">
                <label>Số điện thoại</label>
                <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="0912345678" />
              </div>
              <div className="form-row">
                <label>Mật khẩu <span className="req">*</span></label>
                <input type="password" required minLength={6} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div className="form-row">
                <label>Vai trò</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="OWNER">Chủ nông hộ (OWNER)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="WORKER">Công nhân (WORKER)</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset mật khẩu */}
      {showResetModal && (
        <div className="modal-backdrop" onClick={() => setShowResetModal(null)}>
          <div className="modal-dialog sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconShield size={18} className="text-primary-green" /><h3>Đặt lại mật khẩu</h3></div>
              <button className="modal-close" onClick={() => setShowResetModal(null)}>&times;</button>
            </div>
            <div className="modal-form">
              <div className="form-row">
                <label>Mật khẩu mới <span className="req">*</span></label>
                <input type="password" minLength={6} value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="Ít nhất 6 ký tự" />
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowResetModal(null)}>Hủy</button>
                <button className="btn-primary" onClick={handleResetPwd}>Đặt lại mật khẩu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
