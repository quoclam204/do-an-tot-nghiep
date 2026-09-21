import React, { useState, useEffect } from 'react';
import { apiAdminGetAllActivityLogs, apiAdminGetAllFarms } from '../../../services/api';
import {
  IconClipboardList, IconAlertTriangle, IconRotateCw,
  IconWarehouse,
} from '../../../components/icons';

const SYNC_STATUSES = ['', 'SYNCED', 'PENDING', 'CONFLICT', 'FAILED'];
const ACTIVITY_TYPES = ['', 'BON_PHAN', 'PHUN_THUOC', 'TUOI', 'LAM_DAT', 'THU_HOACH', 'CAT_TIA', 'LAM_CO', 'KHAC'];

export default function PanelLogs() {
  const [logs, setLogs] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ farmId: '', syncStatus: '', activityType: '', from: '', to: '' });

  useEffect(() => {
    apiAdminGetAllFarms().then(d => setFarms(d || [])).catch(() => {});
    loadLogs();
  }, []);

  const loadLogs = async (f = filters) => {
    setLoading(true); setError('');
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      const data = await apiAdminGetAllActivityLogs({ ...params, limit: 200 });
      setLogs(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tải nhật ký hệ thống');
    } finally { setLoading(false); }
  };

  const handleFilter = () => loadLogs(filters);
  const handleReset = () => {
    const f = { farmId: '', syncStatus: '', activityType: '', from: '', to: '' };
    setFilters(f); loadLogs(f);
  };

  const fmtCurrency = (n) => n ? new Intl.NumberFormat('vi-VN').format(n) + ' ₫' : '—';

  const syncBadgeClass = (s) => s === 'SYNCED' ? 'active' : s === 'PENDING' ? 'pending' : s === 'CONFLICT' ? 'orange' : s === 'FAILED' ? 'inactive' : '';

  const anomalies = logs.filter(l =>
    (l.unitPrice && l.unitPrice > 500000000) ||
    (l.cost && l.cost > 100000000) ||
    (l.materials && l.materials.some(m => m.quantityUsed > 10000))
  );

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}

      {/* Thống kê nhanh */}
      <div className="mini-kpi-row">
        <div className="mini-kpi">
          <span className="mini-kpi-value">{logs.length}</span>
          <span className="mini-kpi-label">Tổng nhật ký</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value">{logs.filter(l => l.syncStatus === 'SYNCED').length}</span>
          <span className="mini-kpi-label">Đã đồng bộ</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value">{logs.filter(l => l.syncStatus === 'PENDING').length}</span>
          <span className="mini-kpi-label">Đang chờ</span>
        </div>
        <div className="mini-kpi">
          <span className="mini-kpi-value" style={{ color: anomalies.length > 0 ? '#dc2626' : 'inherit' }}>{anomalies.length}</span>
          <span className="mini-kpi-label">Dữ liệu bất thường</span>
        </div>
      </div>

      {/* Cảnh báo dữ liệu bất thường */}
      {anomalies.length > 0 && (
        <div className="system-alert danger mb-4">
          <IconAlertTriangle size={18} />
          <div className="alert-body">
            <strong>Phát hiện {anomalies.length} nhật ký có dữ liệu bất thường</strong>
            <span>Đơn giá vượt ngưỡng hoặc số lượng vật tư quá lớn. Cần kiểm tra và xác nhận với nông hộ.</span>
          </div>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="filter-bar">
        <select className="filter-select" value={filters.farmId} onChange={e => setFilters({...filters, farmId: e.target.value})}>
          <option value="">— Tất cả nông hộ —</option>
          {farms.map(f => <option key={f.id} value={f.id}>{f.name} ({f.user?.fullName})</option>)}
        </select>
        <select className="filter-select" value={filters.syncStatus} onChange={e => setFilters({...filters, syncStatus: e.target.value})}>
          {SYNC_STATUSES.map(s => <option key={s} value={s}>{s || '— Trạng thái đồng bộ —'}</option>)}
        </select>
        <select className="filter-select" value={filters.activityType} onChange={e => setFilters({...filters, activityType: e.target.value})}>
          {ACTIVITY_TYPES.map(s => <option key={s} value={s}>{s || '— Loại hoạt động —'}</option>)}
        </select>
        <input className="filter-input" type="date" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})} title="Từ ngày" />
        <input className="filter-input" type="date" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})} title="Đến ngày" />
        <button className="btn-action-primary" onClick={handleFilter}><IconClipboardList size={14} /> Lọc</button>
        <button className="btn-action-secondary" onClick={handleReset}>Xóa lọc</button>
      </div>

      {/* Bảng nhật ký */}
      <div className="panel-card-surface">
        <div className="panel-card-header">
          <h3>Nhật ký canh tác toàn hệ thống ({logs.length})</h3>
          <button className="btn-section-refresh" onClick={() => loadLogs()}><IconRotateCw size={13} className={loading ? 'spin-anim' : ''} /> Làm mới</button>
        </div>
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr>
              <th>Nông hộ / Lô</th>
              <th>Ngày</th>
              <th>Loại HĐ</th>
              <th>Cây trồng / Vụ</th>
              <th>Chi phí</th>
              <th>Thu hoạch</th>
              <th>Đồng bộ</th>
              <th>Ghi chú</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /> Đang tải...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="table-empty">Không có nhật ký phù hợp</td></tr>
              ) : logs.map(log => {
                const isAnomaly = (log.unitPrice && log.unitPrice > 500000000) || (log.cost && log.cost > 100000000);
                return (
                  <tr key={log.id} className={isAnomaly ? 'row-anomaly' : ''}>
                    <td>
                      <div className="text-sm"><IconWarehouse size={11} /> <strong>{log.cropCycle?.plot?.farm?.name || '—'}</strong></div>
                      <div className="text-muted text-xs">{log.cropCycle?.plot?.farm?.user?.fullName}</div>
                      <div className="text-muted text-xs">Lô: {log.cropCycle?.plot?.name}</div>
                    </td>
                    <td className="text-muted text-sm">{new Date(log.activityDate).toLocaleDateString('vi-VN')}</td>
                    <td><code className="code-tag">{log.activityType}</code></td>
                    <td>
                      <div className="text-sm">{log.cropCycle?.crop?.name || '—'}</div>
                      <div className="text-muted text-xs">{log.cropCycle?.name}</div>
                    </td>
                    <td className={`text-sm ${isAnomaly ? 'text-danger' : ''}`}>
                      {fmtCurrency(log.cost)}
                      {isAnomaly && <span className="anomaly-tag">⚠️</span>}
                    </td>
                    <td className="text-sm">
                      {log.harvestQuantity ? `${log.harvestQuantity} kg — ${fmtCurrency(log.revenue)}` : '—'}
                    </td>
                    <td>
                      <span className={`status-badge ${syncBadgeClass(log.syncStatus)}`}>
                        {log.syncStatus || 'N/A'}
                      </span>
                    </td>
                    <td className="text-muted text-sm" style={{ maxWidth: 150 }}>{log.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
