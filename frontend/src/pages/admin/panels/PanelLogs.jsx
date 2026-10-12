import React, { useState, useEffect } from 'react';
import { apiAdminGetAllActivityLogs, apiAdminGetAllFarms, apiDeleteActivityLog } from '../../../services/api';
import {
  IconClipboardList, IconAlertTriangle, IconRotateCw,
  IconWarehouse, IconDownload, IconTrash, IconCheckCircle,
} from '../../../components/icons';

const SYNC_STATUSES = ['', 'SYNCED', 'PENDING', 'CONFLICT', 'FAILED'];
const ACTIVITY_TYPES = ['', 'BON_PHAN', 'PHUN_THUOC', 'TUOI', 'LAM_DAT', 'THU_HOACH', 'CAT_TIA', 'LAM_CO', 'KHAC'];

export default function PanelLogs() {
  const [logs, setLogs] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ farmId: '', syncStatus: '', activityType: '', from: '', to: '' });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    apiAdminGetAllFarms().then(d => setFarms(d || [])).catch(() => {});
    loadLogs();
  }, []);

  const showMsg = (m) => { setSuccess(m); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (m) => { setError(m); setTimeout(() => setError(''), 5000); };

  const loadLogs = async (f = filters) => {
    setLoading(true); setError('');
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      const data = await apiAdminGetAllActivityLogs({ ...params, limit: 300 });
      setLogs(data || []);
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi tải nhật ký hệ thống');
    } finally { setLoading(false); }
  };

  const handleFilter = () => loadLogs(filters);
  const handleReset = () => {
    const f = { farmId: '', syncStatus: '', activityType: '', from: '', to: '' };
    setFilters(f); loadLogs(f);
  };

  const handleDeleteLog = async (log) => {
    if (!window.confirm(`Xóa nhật ký ngày ${new Date(log.activityDate).toLocaleDateString('vi-VN')} (${log.activityType}) của ${log.cropCycle?.plot?.farm?.name || 'nông trại'}?`)) return;
    try {
      await apiDeleteActivityLog(log.id);
      showMsg('Đã xóa nhật ký thành công');
      if (selectedLog?.id === log.id) setSelectedLog(null);
      await loadLogs();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi khi xóa nhật ký');
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const header = ['ID', 'Nông trại', 'Chủ hộ', 'Lô', 'Cây trồng', 'Vụ mùa', 'Ngày', 'Ca làm', 'Hoạt động', 'Chi phí (VNĐ)', 'Sản lượng (kg)', 'Doanh thu (VNĐ)', 'Trạng thái', 'Ghi chú'];
    const rows = logs.map(l => [
      l.id,
      `"${l.cropCycle?.plot?.farm?.name || ''}"`,
      `"${l.cropCycle?.plot?.farm?.user?.fullName || ''}"`,
      `"${l.cropCycle?.plot?.name || ''}"`,
      `"${l.cropCycle?.crop?.name || ''}"`,
      `"${l.cropCycle?.name || ''}"`,
      `"${new Date(l.activityDate).toLocaleDateString('vi-VN')}"`,
      `"${l.workShift || ''}"`,
      `"${l.activityType || ''}"`,
      l.cost || 0,
      l.harvestQuantity || 0,
      l.revenue || 0,
      `"${l.syncStatus || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = '\ufeff' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhat-ky-toan-he-thong-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      {success && <div className="panel-alert success"><IconCheckCircle size={18} /><span>{success}</span><button onClick={() => setSuccess('')}>&times;</button></div>}

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
            <span>Đơn giá vượt ngưỡng hoặc số lượng vật tư quá lớn. Quản trị viên có thể xem chi tiết hoặc xóa bản ghi rác.</span>
          </div>
        </div>
      )}

      {/* Bộ lọc & thao tác */}
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
        <button className="btn-action-secondary" onClick={handleExportCSV} title="Xuất toàn bộ nhật ký ra CSV">
          <IconDownload size={14} /> Xuất CSV
        </button>
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
              <th className="text-center">Thao tác</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /> Đang tải...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={9} className="table-empty">Không có nhật ký phù hợp</td></tr>
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
                      {isAnomaly && <span className="anomaly-tag" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}><IconAlertTriangle size={12} strokeWidth={2.4} /></span>}
                    </td>
                    <td className="text-sm">
                      {log.harvestQuantity ? `${log.harvestQuantity} kg — ${fmtCurrency(log.revenue)}` : '—'}
                    </td>
                    <td>
                      <span className={`status-badge ${syncBadgeClass(log.syncStatus)}`}>
                        {log.syncStatus || 'N/A'}
                      </span>
                    </td>
                    <td className="text-muted text-sm" style={{ maxWidth: 140 }}>{log.notes || '—'}</td>
                    <td>
                      <div className="action-btns justify-center">
                        <button className="btn-xs blue" onClick={() => setSelectedLog(log)} title="Xem chi tiết nhật ký">
                          Chi tiết
                        </button>
                        <button className="btn-xs red" onClick={() => handleDeleteLog(log)} title="Xóa nhật ký">
                          <IconTrash size={12} />
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

      {/* Modal: Chi tiết nhật ký */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-dialog" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconClipboardList size={18} className="text-primary-green" /><h3>Chi tiết nhật ký canh tác</h3></div>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>&times;</button>
            </div>
            <div className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div><span className="text-muted text-xs">Nông trại:</span><p><strong>{selectedLog.cropCycle?.plot?.farm?.name}</strong></p></div>
                <div><span className="text-muted text-xs">Chủ hộ:</span><p><strong>{selectedLog.cropCycle?.plot?.farm?.user?.fullName || '—'}</strong></p></div>
                <div><span className="text-muted text-xs">Lô đất:</span><p>{selectedLog.cropCycle?.plot?.name}</p></div>
                <div><span className="text-muted text-xs">Vụ mùa & Cây trồng:</span><p>{selectedLog.cropCycle?.name} ({selectedLog.cropCycle?.crop?.name})</p></div>
                <div><span className="text-muted text-xs">Ngày thực hiện:</span><p>{new Date(selectedLog.activityDate).toLocaleDateString('vi-VN')} {selectedLog.activityTime ? `- ${selectedLog.activityTime}` : ''} {selectedLog.workShift ? `(${selectedLog.workShift})` : ''}</p></div>
                <div><span className="text-muted text-xs">Loại công việc:</span><p><code className="code-tag">{selectedLog.activityType}</code></p></div>
                <div><span className="text-muted text-xs">Trạng thái đồng bộ:</span><p><span className={`status-badge ${syncBadgeClass(selectedLog.syncStatus)}`}>{selectedLog.syncStatus}</span></p></div>
                <div><span className="text-muted text-xs">Tổng chi phí:</span><p><strong style={{ color: '#107c10' }}>{fmtCurrency(selectedLog.cost)}</strong></p></div>
              </div>

              {/* Nhân công */}
              {selectedLog.isHiredLabor && (
                <div style={{ background: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Chi phí nhân công thuê ngoài:</span>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    {selectedLog.laborWorkers} công &times; {fmtCurrency(selectedLog.laborWagePerDay)} = <strong>{fmtCurrency(selectedLog.laborCost)}</strong>
                  </div>
                </div>
              )}

              {/* Vật tư sử dụng */}
              {selectedLog.materials?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Vật tư đã sử dụng ({selectedLog.materials.length}):</span>
                  <div className="panel-table-container mt-1">
                    <table className="panel-table compact">
                      <thead><tr><th>Tên vật tư</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
                      <tbody>
                        {selectedLog.materials.map(m => (
                          <tr key={m.id}>
                            <td>{m.material?.name || 'Vật tư'}</td>
                            <td>{m.quantityUsed} {m.material?.unit}</td>
                            <td><strong>{fmtCurrency(m.cost)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Thu hoạch */}
              {selectedLog.harvestQuantity > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534' }}>Kết quả thu hoạch:</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                    Sản lượng: <strong>{selectedLog.harvestQuantity} kg</strong> — Đơn giá: {fmtCurrency(selectedLog.unitPrice)}/kg — Doanh thu: <strong style={{ color: '#16a34a' }}>{fmtCurrency(selectedLog.revenue)}</strong>
                  </p>
                </div>
              )}

              {selectedLog.notes && (
                <div style={{ marginBottom: '12px' }}>
                  <span className="text-muted text-xs">Ghi chú:</span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontStyle: 'italic' }}>"{selectedLog.notes}"</p>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setSelectedLog(null)}>Đóng</button>
                <button type="button" className="btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleDeleteLog(selectedLog)}>Xóa nhật ký</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
