import React, { useState, useEffect } from 'react';
import { apiAdminGetAllFarms } from '../../../services/api';
import {
  IconWarehouse, IconMapPin, IconUsers, IconSprout,
  IconRotateCw, IconAlertTriangle, IconSearch,
} from '../../../components/icons';

export default function PanelFarms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);

  useEffect(() => { loadFarms(); }, []);

  const loadFarms = async (searchVal) => {
    setLoading(true); setError('');
    try {
      const data = await apiAdminGetAllFarms(searchVal ? { search: searchVal } : {});
      setFarms(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách nông hộ');
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadFarms(search);
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

  const totalArea = farms.reduce((sum, f) => sum + (f.totalArea || 0), 0);
  const totalPlots = farms.reduce((sum, f) => sum + (f.plots?.length || 0), 0);
  const activeSeasonsCount = farms.reduce((sum, f) =>
    sum + (f.plots || []).reduce((ps, p) => ps + (p.cropCycles?.length || 0), 0), 0);

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}

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
        <button className="btn-action-secondary" onClick={() => loadFarms()} disabled={loading}>
          <IconRotateCw size={14} className={loading ? 'spin-anim' : ''} /> Làm mới
        </button>
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
              <th className="text-center">Chi tiết</th>
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
                      <div className="farm-cell">
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
                          {selectedFarm?.id === f.id ? 'Ẩn' : 'Xem chi tiết'}
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

      {/* Chi tiết nông hộ */}
      {selectedFarm && (
        <div className="panel-card-surface mt-4">
          <div className="detail-header">
            <div>
              <h3 className="detail-title"><IconWarehouse size={18} className="text-primary-green" /> {selectedFarm.name}</h3>
              <p className="text-muted">Chủ hộ: <strong>{selectedFarm.user?.fullName}</strong> — {selectedFarm.user?.email} — {selectedFarm.user?.phone || '—'}</p>
            </div>
            <button className="btn-xs gray" onClick={() => setSelectedFarm(null)}>Đóng</button>
          </div>
          <div className="detail-plots">
            <h4>Danh sách lô canh tác ({selectedFarm.plots?.length || 0} lô)</h4>
            {selectedFarm.plots?.length === 0 ? (
              <p className="text-muted">Chưa có lô canh tác nào</p>
            ) : (
              <div className="plots-grid">
                {selectedFarm.plots?.map(p => (
                  <div key={p.id} className="plot-card">
                    <div className="plot-card-header">
                      <strong>{p.name}</strong>
                      <span className="area-tag">{p.area} ha</span>
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
    </div>
  );
}
