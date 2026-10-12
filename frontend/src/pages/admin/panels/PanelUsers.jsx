import React, { useState, useEffect } from 'react';
import {
  apiGetUsers, apiGetPendingUsers, apiGetDeletedUsers,
  apiAdminCreateUser, apiAdminUpdateUser, apiAdminPermanentDeleteUser,
  apiUpdateUserRole, apiToggleUserActive,
  apiDeleteUser, apiRestoreUser, apiApproveUser, apiRejectUser,
} from '../../../services/api';
import {
  IconUsers, IconClock, IconRotateCw, IconPlus, IconLock, IconUnlock,
  IconTrash, IconCheckCircle, IconXCircle, IconAlertTriangle,
  IconPenLine, IconDownload, IconWarehouse,
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
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
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
    try { await apiToggleUserActive(id); showSuccess('Đã cập nhật trạng thái hoạt động'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi cập nhật'); }
  };

  const handleChangeRole = async (id, role) => {
    try { await apiUpdateUserRole(id, role); showSuccess('Đã cập nhật vai trò'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi đổi vai trò'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Chuyển tài khoản này vào thùng rác?')) return;
    try { await apiDeleteUser(id); showSuccess('Đã chuyển tài khoản vào thùng rác'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi xóa'); }
  };

  const handleRestore = async (id) => {
    try { await apiRestoreUser(id); showSuccess('Đã khôi phục tài khoản thành công'); await loadData(); }
    catch (e) { showError(e.response?.data?.message || 'Lỗi khôi phục'); }
  };

  const handlePermanentDelete = async (id, name) => {
    if (!window.confirm(`CẢNH BÁO: Xóa vĩnh viễn tài khoản "${name}" khỏi cơ sở dữ liệu?\nHành động này không thể hoàn tác!`)) return;
    try {
      await apiAdminPermanentDeleteUser(id);
      showSuccess(`Đã xóa vĩnh viễn tài khoản ${name}`);
      await loadData();
    } catch (e) { showError(e.response?.data?.message || 'Lỗi xóa vĩnh viễn'); }
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      await apiAdminUpdateUser(editingUser.id, {
        fullName: editingUser.fullName,
        phone: editingUser.phone,
        role: editingUser.role,
      });
      showSuccess(`Đã cập nhật thông tin tài khoản ${editingUser.fullName}`);
      setEditingUser(null);
      await loadData();
    } catch (e) { showError(e.response?.data?.message || 'Lỗi cập nhật người dùng'); }
    finally { setLoading(false); }
  };

  const handleExportCSV = () => {
    const list = tab === 'active' ? activeList : tab === 'pending' ? pendingList : deletedList;
    if (list.length === 0) return;
    const header = ['Họ và tên', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày đăng ký', 'Đăng nhập cuối'];
    const rows = list.map(u => [
      `"${u.fullName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.role || ''}"`,
      `"${u.isActive ? 'Hoạt động' : 'Bị khóa'}"`,
      `"${u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : ''}"`,
    ]);
    const csv = '\ufeff' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-nguoi-dung-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <button className="btn-action-secondary" onClick={handleExportCSV} title="Xuất dữ liệu CSV">
            <IconDownload size={14} /> Xuất CSV
          </button>
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
                    <td>
                      <div className="user-cell" style={{ cursor: 'pointer' }} onClick={() => setViewingUser(u)} title="Bấm để xem chi tiết">
                        <span className="user-avatar-sm">{u.fullName?.charAt(0) || 'U'}</span>
                        <div>
                          <strong>{u.fullName || '—'}</strong>
                          {u.farms?.length > 0 && <span className="text-muted text-xs block">{u.farms.length} nông trại</span>}
                        </div>
                      </div>
                    </td>
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
                        <button className="btn-xs gray" onClick={() => setViewingUser(u)} title="Xem chi tiết người dùng">
                          Chi tiết
                        </button>
                        <button className="btn-xs blue" onClick={() => setEditingUser({ ...u })} title="Chỉnh sửa thông tin">
                          <IconPenLine size={12} />Sửa
                        </button>
                        <button className={`btn-xs ${u.isActive ? 'orange' : 'green'}`} onClick={() => handleToggle(u.id)} title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                          {u.isActive ? <><IconLock size={12} />Khóa</> : <><IconUnlock size={12} />Mở</>}
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
                  <tr><td colSpan={6} className="table-empty success"><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconCheckCircle size={16} /><span>Không có hồ sơ nào đang chờ xét duyệt!</span></span></td></tr>
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
                <th>Họ và tên</th><th>Email</th><th>Vai trò</th><th>Thời điểm xóa</th><th className="text-center">Thao tác</th>
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
                      <button className="btn-xs green" onClick={() => handleRestore(u.id)} title="Khôi phục lại tài khoản"><IconRotateCw size={12} />Khôi phục</button>
                      <button className="btn-xs red" onClick={() => handlePermanentDelete(u.id, u.fullName || u.email)} title="Xóa vĩnh viễn khỏi CSDL"><IconTrash size={12} />Xóa vĩnh viễn</button>
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
                <label>Mật khẩu khởi tạo</label>
                <input type="password" minLength={6} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Để trống nếu muốn hệ thống tự sinh mã bảo mật" />
                <span className="text-muted text-xs mt-1">Gợi ý: Có thể để trống, hệ thống sẽ tự sinh mật khẩu bảo mật và gửi hướng dẫn kích hoạt cho người dùng.</span>
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

      {/* Modal: Chỉnh sửa người dùng */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconPenLine size={18} className="text-primary-green" /><h3>Chỉnh sửa tài khoản</h3></div>
              <button className="modal-close" onClick={() => setEditingUser(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-row">
                <label>Email (Định danh cố định)</label>
                <input disabled value={editingUser.email} style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
              <div className="form-row">
                <label>Họ và tên <span className="req">*</span></label>
                <input required value={editingUser.fullName || ''} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} />
              </div>
              <div className="form-row">
                <label>Số điện thoại</label>
                <input type="tel" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="0912345678" />
              </div>
              <div className="form-row">
                <label>Vai trò người dùng</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                  <option value="OWNER">Chủ nông hộ (OWNER)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="WORKER">Công nhân (WORKER)</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chi tiết người dùng */}
      {viewingUser && (
        <div className="modal-backdrop" onClick={() => setViewingUser(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconUsers size={18} className="text-primary-green" /><h3>Chi tiết tài khoản</h3></div>
              <button className="modal-close" onClick={() => setViewingUser(null)}>&times;</button>
            </div>
            <div className="modal-form">
              <div className="detail-grid-user" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div><span className="text-muted text-xs">Họ và tên:</span><p><strong>{viewingUser.fullName || '—'}</strong></p></div>
                <div><span className="text-muted text-xs">Email:</span><p><strong>{viewingUser.email}</strong></p></div>
                <div><span className="text-muted text-xs">Số điện thoại:</span><p><strong>{viewingUser.phone || 'Chưa cập nhật'}</strong></p></div>
                <div><span className="text-muted text-xs">Vai trò hệ thống:</span><p><span className="role-badge">{viewingUser.role}</span></p></div>
                <div><span className="text-muted text-xs">Trạng thái:</span><p><span className={`status-badge ${viewingUser.isActive ? 'active' : 'inactive'}`}>{viewingUser.isActive ? 'Đang hoạt động' : 'Bị khóa'}</span></p></div>
                <div><span className="text-muted text-xs">Xét duyệt:</span><p><span className="status-badge active">{viewingUser.approvalStatus || 'APPROVED'}</span></p></div>
                <div><span className="text-muted text-xs">Ngày đăng ký:</span><p>{viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString('vi-VN') : '—'}</p></div>
                <div><span className="text-muted text-xs">Đăng nhập gần nhất:</span><p>{viewingUser.lastLoginAt ? new Date(viewingUser.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</p></div>
              </div>
              {viewingUser.farms?.length > 0 && (
                <div className="user-farms-section">
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}><IconWarehouse size={14} /> Nông trại sở hữu ({viewingUser.farms.length})</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {viewingUser.farms.map(f => (
                      <li key={f.id} style={{ padding: '6px 10px', background: 'var(--surface-sunken)', borderRadius: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                        <strong>{f.name}</strong> — {f.location} ({f.totalArea} ha)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setViewingUser(null)}>Đóng</button>
                <button type="button" className="btn-primary" onClick={() => { setEditingUser({ ...viewingUser }); setViewingUser(null); }}>Chỉnh sửa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
