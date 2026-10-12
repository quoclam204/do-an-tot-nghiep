import React, { useState, useEffect } from 'react';
import {
  apiAdminGetAllFarms, apiGetUsers, apiAdminCreateFarm,
  apiUpdateFarm, apiDeleteFarm, apiCreatePlot, apiDeletePlot,
} from '../../../services/api';
import {
  IconWarehouse, IconMapPin, IconUsers, IconSprout,
  IconRotateCw, IconAlertTriangle, IconSearch, IconPlus,
  IconPenLine, IconTrash, IconDownload, IconCheckCircle,
} from '../../../components/icons';

export default function PanelFarms() {
  const [farms, setFarms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);

  // Modals
  const [showCreateFarm, setShowCreateFarm] = useState(false);
  const [newFarm, setNewFarm] = useState({ name: '', location: '', totalArea: '', userId: '' });
  const [editingFarm, setEditingFarm] = useState(null);
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [newPlot, setNewPlot] = useState({ name: '', area: '' });

  useEffect(() => {
    loadFarms();
    apiGetUsers().then(d => setUsers(d || [])).catch(() => {});
  }, []);

  const showMsg = (m) => { setSuccess(m); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (m) => { setError(m); setTimeout(() => setError(''), 5000); };

  const loadFarms = async (searchVal) => {
    setLoading(true); setError('');
    try {
      const data = await apiAdminGetAllFarms(searchVal ? { search: searchVal } : {});
      setFarms(data || []);
      // Cập nhật selectedFarm nếu đang mở
      if (selectedFarm) {
        const updated = (data || []).find(f => f.id === selectedFarm.id);
        setSelectedFarm(updated || null);
      }
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi khi tải danh sách nông hộ');
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadFarms(search);
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    if (!newFarm.userId) { showErr('Vui lòng chọn chủ hộ cho nông trại'); return; }
    setLoading(true);
    try {
      await apiAdminCreateFarm({
        ...newFarm,
        totalArea: parseFloat(newFarm.totalArea) || 0,
      });
      showMsg(`Đã tạo nông trại "${newFarm.name}" thành công`);
      setShowCreateFarm(false);
      setNewFarm({ name: '', location: '', totalArea: '', userId: '' });
      await loadFarms();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi tạo nông hộ mới');
    } finally { setLoading(false); }
  };

  const handleUpdateFarm = async (e) => {
    e.preventDefault();
    if (!editingFarm) return;
    setLoading(true);
    try {
      await apiUpdateFarm(editingFarm.id, {
        name: editingFarm.name,
        location: editingFarm.location,
        totalArea: parseFloat(editingFarm.totalArea) || 0,
      });
      showMsg(`Đã cập nhật thông tin nông trại "${editingFarm.name}"`);
      setEditingFarm(null);
      await loadFarms();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi cập nhật nông hộ');
    } finally { setLoading(false); }
  };

  const handleDeleteFarm = async (farm) => {
    if (!window.confirm(`Xóa nông trại "${farm.name}" của chủ hộ "${farm.user?.fullName || farm.user?.email}"?`)) return;
    setLoading(true);
    try {
      await apiDeleteFarm(farm.id);
      showMsg(`Đã xóa nông trại "${farm.name}"`);
      if (selectedFarm?.id === farm.id) setSelectedFarm(null);
      await loadFarms();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi xóa nông hộ');
    } finally { setLoading(false); }
  };

  const handleAddPlot = async (e) => {
    e.preventDefault();
    if (!selectedFarm) return;
    setLoading(true);
    try {
      await apiCreatePlot(selectedFarm.id, {
        name: newPlot.name,
        area: parseFloat(newPlot.area) || 0,
      });
      showMsg(`Đã thêm lô "${newPlot.name}" vào nông trại "${selectedFarm.name}"`);
      setShowAddPlot(false);
      setNewPlot({ name: '', area: '' });
      await loadFarms();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi thêm lô canh tác');
    } finally { setLoading(false); }
  };

  const handleDeletePlot = async (plot) => {
    if (!window.confirm(`Xóa lô "${plot.name}" (${plot.area} ha)?`)) return;
    setLoading(true);
    try {
      await apiDeletePlot(selectedFarm.id, plot.id);
      showMsg(`Đã xóa lô "${plot.name}"`);
      await loadFarms();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi xóa lô');
    } finally { setLoading(false); }
  };

  const handleExportCSV = () => {
    if (farms.length === 0) return;
    const header = ['Tên nông trại', 'Chủ hộ', 'Email chủ hộ', 'SĐT', 'Địa điểm', 'Diện tích (ha)', 'Số lô'];
    const rows = farms.map(f => [
      `"${f.name || ''}"`,
      `"${f.user?.fullName || ''}"`,
      `"${f.user?.email || ''}"`,
      `"${f.user?.phone || ''}"`,
      `"${f.location || ''}"`,
      f.totalArea || 0,
      f.plots?.length || 0,
    ]);
    const csv = '\ufeff' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-nong-ho-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

  const totalArea = farms.reduce((sum, f) => sum + (f.totalArea || 0), 0);
  const totalPlots = farms.reduce((sum, f) => sum + (f.plots?.length || 0), 0);
  const activeSeasonsCount = farms.reduce((sum, f) =>
    sum + (f.plots || []).reduce((ps, p) => ps + (p.cropCycles?.length || 0), 0), 0);

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}
      {success && <div className="panel-alert success"><IconCheckCircle size={18} /><span>{success}</span><button onClick={() => setSuccess('')}>&times;</button></div>}

      {/* Thống kê nhanh */}
      <div className="mini-kpi-row">
        <div className="mini-kpi">
          <span className="mini-kpi-value">{farms.length}</span>
          <span className="mini-kpi-label">Nông trại / Hộ</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value">{fmt(totalArea.toFixed(2))} ha</span>
          <span className="mini-kpi-label">Tổng diện tích</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value">{totalPlots}</span>
          <span className="mini-kpi-label">Lô canh tác</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value">{activeSeasonsCount}</span>
          <span className="mini-kpi-label">Vụ mùa đang chạy</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="panel-toolbar">
        <form className="toolbar-search-form" onSubmit={handleSearch}>
          <input className="search-input" placeholder="Tìm tên hộ, tên chủ hộ, địa điểm..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-action-secondary"><IconSearch size={15} /> Tìm</button>
        </form>
        <div className="toolbar-right">
          <button className="btn-action-secondary" onClick={handleExportCSV} title="Xuất dữ liệu CSV">
            <IconDownload size={14} /> Xuất CSV
          </button>
          <button className="btn-action-secondary" onClick={() => loadFarms()} disabled={loading}>
            <IconRotateCw size={14} className={loading ? 'spin-anim' : ''} /> Làm mới
          </button>
          <button className="btn-action-primary" onClick={() => setShowCreateFarm(true)}>
            <IconPlus size={15} /> Thêm Nông hộ
          </button>
        </div>
      </div>

      {/* Bảng nông hộ */}
      <div className="panel-card-surface">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr>
              <th>Tên nông hộ / nông trại</th>
              <th>Chủ hộ</th>
              <th>Vị trí / Địa điểm</th>
              <th>Diện tích (ha)</th>
              <th>Số lô</th>
              <th>Vụ đang chạy</th>
              <th className="text-center">Thao tác</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /> Đang tải...</td></tr>
              ) : farms.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">Không tìm thấy nông hộ nào</td></tr>
              ) : farms.map(f => {
                const activePlotSeasons = (f.plots || []).reduce((sum, p) => sum + (p.cropCycles?.length || 0), 0);
                return (
                  <tr key={f.id} className={selectedFarm?.id === f.id ? 'row-selected' : ''}>
                    <td>
                      <div className="farm-cell" style={{ cursor: 'pointer' }} onClick={() => setSelectedFarm(selectedFarm?.id === f.id ? null : f)}>
                        <div className="farm-icon-wrap"><IconWarehouse size={16} /></div>
                        <strong>{f.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar-sm">{f.user?.fullName?.charAt(0) || '?'}</span>
                        <div>
                          <div>{f.user?.fullName || '—'}</div>
                          <div className="text-muted text-sm">{f.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted"><IconMapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{f.location}</td>
                    <td><strong>{fmt(f.totalArea?.toFixed(2))}</strong></td>
                    <td><span className="count-badge">{f.plots?.length || 0}</span></td>
                    <td>
                      {activePlotSeasons > 0
                        ? <span className="status-badge active"><span className="dot"></span>{activePlotSeasons} vụ</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>
                      <div className="action-btns justify-center">
                        <button className="btn-xs blue" onClick={() => setSelectedFarm(selectedFarm?.id === f.id ? null : f)}>
                          {selectedFarm?.id === f.id ? 'Thu gọn' : 'Xem lô'}
                        </button>
                        <button className="btn-xs gray" onClick={() => setEditingFarm({ ...f })} title="Sửa thông tin nông hộ">
                          <IconPenLine size={12} />Sửa
                        </button>
                        <button className="btn-xs red" onClick={() => handleDeleteFarm(f)} title="Xóa nông hộ">
                          <IconTrash size={12} />Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chi tiết nông hộ & Quản lý lô */}
      {selectedFarm && (
        <div className="panel-card-surface mt-4">
          <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '14px' }}>
            <div>
              <h3 className="detail-title"><IconWarehouse size={18} className="text-primary-green" /> {selectedFarm.name}</h3>
              <p className="text-muted text-sm mt-1">Chủ hộ: <strong>{selectedFarm.user?.fullName}</strong> — {selectedFarm.user?.email} — {selectedFarm.user?.phone || '—'} — Diện tích: {selectedFarm.totalArea} ha</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-action-primary btn-sm" onClick={() => setShowAddPlot(true)}>
                <IconPlus size={13} /> Thêm lô đất
              </button>
              <button className="btn-xs gray" onClick={() => setSelectedFarm(null)}>Đóng</button>
            </div>
          </div>
          <div className="detail-plots">
            <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>Danh sách lô canh tác ({selectedFarm.plots?.length || 0} lô)</h4>
            {selectedFarm.plots?.length === 0 ? (
              <p className="text-muted text-sm">Chưa có lô canh tác nào. Bấm "Thêm lô đất" để tạo lô cho nông trại.</p>
            ) : (
              <div className="plots-grid">
                {selectedFarm.plots?.map(p => (
                  <div key={p.id} className="plot-card">
                    <div className="plot-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{p.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="area-tag">{p.area} ha</span>
                        <button className="btn-xs text-danger" style={{ padding: '2px 4px', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleDeletePlot(p)} title="Xóa lô này">
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </div>
                    {p.cropCycles?.length > 0 ? (
                      <div className="crop-cycles-list">
                        {p.cropCycles.map(cc => (
                          <div key={cc.id} className="crop-cycle-item">
                            <IconSprout size={12} className="text-primary-green" />
                            <span>{cc.crop?.name} — {cc.name}</span>
                            <span className={`cycle-status ${cc.status?.toLowerCase()}`}>{cc.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-sm mt-1">Chưa có vụ mùa đang chạy</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Thêm Nông hộ mới */}
      {showCreateFarm && (
        <div className="modal-backdrop" onClick={() => setShowCreateFarm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconWarehouse size={18} className="text-primary-green" /><h3>Thêm nông hộ mới</h3></div>
              <button className="modal-close" onClick={() => setShowCreateFarm(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateFarm} className="modal-form">
              <div className="form-row">
                <label>Chủ sở hữu (Người dùng) <span className="req">*</span></label>
                <select required value={newFarm.userId} onChange={e => setNewFarm({...newFarm, userId: e.target.value})}>
                  <option value="">— Chọn tài khoản chủ hộ —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email} ({u.email} - {u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Tên nông hộ / nông trại <span className="req">*</span></label>
                <input required value={newFarm.name} onChange={e => setNewFarm({...newFarm, name: e.target.value})} placeholder="VD: Nông trại Cà phê Cầu Đất" />
              </div>
              <div className="form-row">
                <label>Vị trí / Địa chỉ <span className="req">*</span></label>
                <input required value={newFarm.location} onChange={e => setNewFarm({...newFarm, location: e.target.value})} placeholder="VD: Xã Xuân Trường, TP. Đà Lạt" />
              </div>
              <div className="form-row">
                <label>Tổng diện tích (ha) <span className="req">*</span></label>
                <input type="number" step="0.01" min="0.01" required value={newFarm.totalArea} onChange={e => setNewFarm({...newFarm, totalArea: e.target.value})} placeholder="VD: 2.5" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateFarm(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo nông hộ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sửa Nông hộ */}
      {editingFarm && (
        <div className="modal-backdrop" onClick={() => setEditingFarm(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconPenLine size={18} className="text-primary-green" /><h3>Chỉnh sửa nông hộ</h3></div>
              <button className="modal-close" onClick={() => setEditingFarm(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateFarm} className="modal-form">
              <div className="form-row">
                <label>Chủ hộ</label>
                <input disabled value={editingFarm.user?.fullName || editingFarm.user?.email || '—'} style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
              <div className="form-row">
                <label>Tên nông hộ / nông trại <span className="req">*</span></label>
                <input required value={editingFarm.name} onChange={e => setEditingFarm({...editingFarm, name: e.target.value})} />
              </div>
              <div className="form-row">
                <label>Vị trí / Địa chỉ <span className="req">*</span></label>
                <input required value={editingFarm.location} onChange={e => setEditingFarm({...editingFarm, location: e.target.value})} />
              </div>
              <div className="form-row">
                <label>Tổng diện tích (ha) <span className="req">*</span></label>
                <input type="number" step="0.01" min="0.01" required value={editingFarm.totalArea} onChange={e => setEditingFarm({...editingFarm, totalArea: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditingFarm(null)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Lô canh tác */}
      {showAddPlot && selectedFarm && (
        <div className="modal-backdrop" onClick={() => setShowAddPlot(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconPlus size={18} className="text-primary-green" /><h3>Thêm lô canh tác cho {selectedFarm.name}</h3></div>
              <button className="modal-close" onClick={() => setShowAddPlot(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddPlot} className="modal-form">
              <div className="form-row">
                <label>Tên lô canh tác <span className="req">*</span></label>
                <input required value={newPlot.name} onChange={e => setNewPlot({...newPlot, name: e.target.value})} placeholder="VD: Lô 1 - Cà phê đồi" />
              </div>
              <div className="form-row">
                <label>Diện tích lô (ha) <span className="req">*</span></label>
                <input type="number" step="0.01" min="0.01" required value={newPlot.area} onChange={e => setNewPlot({...newPlot, area: e.target.value})} placeholder="VD: 1.0" />
                <span className="text-muted text-xs mt-1">Lưu ý: Tổng diện tích các lô không được vượt quá diện tích nông trại ({selectedFarm.totalArea} ha).</span>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddPlot(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang thêm...' : 'Thêm lô'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
