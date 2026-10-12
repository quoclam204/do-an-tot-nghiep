import React, { useState, useEffect } from 'react';
import { apiAdminGetAllActivityLogs, apiUpdateActivityLog } from '../../../services/api';
import {
  IconRotateCw, IconAlertTriangle, IconCheckCircle, IconClock,
  IconZap, IconDownload,
} from '../../../components/icons';

export default function PanelSync() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingLog, setViewingLog] = useState(null);

  useEffect(() => { loadSyncData(); }, []);

  const showMsg = (m) => { setSuccess(m); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (m) => { setError(m); setTimeout(() => setError(''), 5000); };

  const loadSyncData = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiAdminGetAllActivityLogs({ limit: 500 });
      setLogs(data || []);
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi tải dữ liệu đồng bộ');
    } finally { setLoading(false); }
  };

  const handleResolveSync = async (log, newStatus = 'SYNCED') => {
    try {
      await apiUpdateActivityLog(log.id, { syncStatus: newStatus });
      showMsg(`Đã cập nhật trạng thái bản ghi thành ${newStatus}`);
      if (viewingLog?.id === log.id) setViewingLog(null);
      await loadSyncData();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi cập nhật trạng thái đồng bộ');
    }
  };

  const handleBulkSync = async (fromStatus) => {
    const targets = logs.filter(l => l.syncStatus === fromStatus);
    if (targets.length === 0) return;
    if (!window.confirm(`Xác nhận đánh dấu ĐÃ ĐỒNG BỘ (SYNCED) cho tất cả ${targets.length} bản ghi ${fromStatus}?`)) return;
    setLoading(true);
    try {
      await Promise.all(targets.map(t => apiUpdateActivityLog(t.id, { syncStatus: 'SYNCED' })));
      showMsg(`Đã xử lý thành công ${targets.length} bản ghi`);
      await loadSyncData();
    } catch (err) {
      showErr('Có lỗi trong quá trình xử lý hàng loạt');
    } finally { setLoading(false); }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const header = ['ID', 'Vụ mùa', 'Nông trại', 'Lô', 'Ngày ghi', 'Loại công việc', 'Trạng thái đồng bộ', 'Ghi chú'];
    const rows = filtered.map(l => [
      l.id,
      `"${l.cropCycle?.name || ''}"`,
      `"${l.cropCycle?.plot?.farm?.name || ''}"`,
      `"${l.cropCycle?.plot?.name || ''}"`,
      `"${new Date(l.activityDate).toLocaleDateString('vi-VN')}"`,
      l.activityType,
      l.syncStatus,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = '\ufeff' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-dong-bo-${filterStatus || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncStats = {
    total: logs.length,
    synced: logs.filter(l => l.syncStatus === 'SYNCED').length,
    pending: logs.filter(l => l.syncStatus === 'PENDING').length,
    conflict: logs.filter(l => l.syncStatus === 'CONFLICT').length,
    failed: logs.filter(l => l.syncStatus === 'FAILED').length,
  };

  const filtered = filterStatus ? logs.filter(l => l.syncStatus === filterStatus) : logs;

  const syncBadge = (s) => {
    const map = { SYNCED: 'active', PENDING: 'pending', CONFLICT: 'orange', FAILED: 'inactive' };
    return map[s] || 'gray';
  };

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}
      {success && <div className="panel-alert success"><IconCheckCircle size={18} /><span>{success}</span><button onClick={() => setSuccess('')}>&times;</button></div>}

      {/* Thống kê đồng bộ */}
      <div className="sync-status-grid">
        <div className={`sync-stat-card synced ${filterStatus === 'SYNCED' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'SYNCED' ? '' : 'SYNCED')}>
          <div className="sync-icon"><IconCheckCircle size={28} /></div>
          <div className="sync-number">{syncStats.synced}</div>
          <div className="sync-label">Đã đồng bộ</div>
          <div className="sync-bar"><div style={{ width: `${syncStats.total ? (syncStats.synced / syncStats.total * 100) : 0}%` }}></div></div>
        </div>
        <div className={`sync-stat-card pending ${filterStatus === 'PENDING' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'PENDING' ? '' : 'PENDING')}>
          <div className="sync-icon"><IconClock size={28} /></div>
          <div className="sync-number">{syncStats.pending}</div>
          <div className="sync-label">Đang chờ đồng bộ</div>
          <div className="sync-bar pending"><div style={{ width: `${syncStats.total ? (syncStats.pending / syncStats.total * 100) : 0}%` }}></div></div>
        </div>
        <div className={`sync-stat-card conflict ${filterStatus === 'CONFLICT' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'CONFLICT' ? '' : 'CONFLICT')}>
          <div className="sync-icon"><IconAlertTriangle size={28} /></div>
          <div className="sync-number">{syncStats.conflict}</div>
          <div className="sync-label">Xung đột dữ liệu</div>
          <div className="sync-bar conflict"><div style={{ width: `${syncStats.total ? (syncStats.conflict / syncStats.total * 100) : 0}%` }}></div></div>
        </div>
        <div className={`sync-stat-card failed ${filterStatus === 'FAILED' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'FAILED' ? '' : 'FAILED')}>
          <div className="sync-icon"><IconZap size={28} /></div>
          <div className="sync-number">{syncStats.failed}</div>
          <div className="sync-label">Lỗi đồng bộ</div>
          <div className="sync-bar failed"><div style={{ width: `${syncStats.total ? (syncStats.failed / syncStats.total * 100) : 0}%` }}></div></div>
        </div>
      </div>

      {/* Tỷ lệ tổng thể */}
      <div className="panel-section mt-4">
        <div className="sync-overall-bar">
          <div className="sync-overall-title">
            <span>Tỷ lệ đồng bộ thành công</span>
            <strong>{syncStats.total > 0 ? ((syncStats.synced / syncStats.total) * 100).toFixed(1) : 0}%</strong>
          </div>
          <div className="sync-progress-bar">
            <div className="sync-progress-fill synced" style={{ width: `${syncStats.total ? (syncStats.synced / syncStats.total * 100) : 0}%` }}></div>
            <div className="sync-progress-fill pending" style={{ width: `${syncStats.total ? (syncStats.pending / syncStats.total * 100) : 0}%` }}></div>
            <div className="sync-progress-fill conflict" style={{ width: `${syncStats.total ? (syncStats.conflict / syncStats.total * 100) : 0}%` }}></div>
            <div className="sync-progress-fill failed" style={{ width: `${syncStats.total ? (syncStats.failed / syncStats.total * 100) : 0}%` }}></div>
          </div>
          <div className="sync-legend">
            <span><span className="legend-dot synced"></span>Đã đồng bộ ({syncStats.synced})</span>
            <span><span className="legend-dot pending"></span>Chờ ({syncStats.pending})</span>
            <span><span className="legend-dot conflict"></span>Xung đột ({syncStats.conflict})</span>
            <span><span className="legend-dot failed"></span>Lỗi ({syncStats.failed})</span>
          </div>
        </div>
      </div>

      {/* Lọc & bảng */}
      <div className="panel-toolbar">
        <div className="panel-tabs-inline">
          {[['', 'Tất cả'], ['PENDING', 'Đang chờ'], ['CONFLICT', 'Xung đột'], ['FAILED', 'Lỗi'], ['SYNCED', 'Thành công']].map(([k, lbl]) => (
            <button key={k} className={`panel-tab-btn ${filterStatus === k ? 'active' : ''}`} onClick={() => setFilterStatus(k)}>
              {lbl}
              {k && <span className={`tab-count-badge ${k === 'FAILED' || k === 'CONFLICT' ? 'warning' : ''}`}>
                {k === 'PENDING' ? syncStats.pending : k === 'CONFLICT' ? syncStats.conflict : k === 'FAILED' ? syncStats.failed : k === 'SYNCED' ? syncStats.synced : logs.length}
              </span>}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          {syncStats.conflict > 0 && (
            <button className="btn-action-primary btn-sm" onClick={() => handleBulkSync('CONFLICT')}>
              Giải quyết {syncStats.conflict} xung đột
            </button>
          )}
          {syncStats.pending > 0 && (
            <button className="btn-action-secondary btn-sm" onClick={() => handleBulkSync('PENDING')}>
              Đồng bộ {syncStats.pending} chờ duyệt
            </button>
          )}
          <button className="btn-action-secondary" onClick={handleExportCSV} title="Xuất báo cáo CSV">
            <IconDownload size={14} /> Xuất CSV
          </button>
          <button className="btn-action-secondary" onClick={loadSyncData} disabled={loading}>
            <IconRotateCw size={14} className={loading ? 'spin-anim' : ''} /> Làm mới
          </button>
        </div>
      </div>

      <div className="panel-card-surface">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr>
              <th>Nhật ký</th>
              <th>Nông hộ / Lô</th>
              <th>Ngày ghi</th>
              <th>Loại HĐ</th>
              <th>Trạng thái</th>
              <th>Ghi chú</th>
              <th className="text-center">Thao tác xử lý</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /> Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">
                  <IconCheckCircle size={20} className="text-primary-green" /> Không có nhật ký nào ở trạng thái này
                </td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className={log.syncStatus === 'FAILED' || log.syncStatus === 'CONFLICT' ? 'row-anomaly' : ''}>
                  <td>
                    <div className="text-sm font-medium">{log.cropCycle?.name || '—'}</div>
                    <div className="text-muted text-xs">ID: {log.id?.slice(0, 8)}...</div>
                  </td>
                  <td>
                    <div className="text-sm"><strong>{log.cropCycle?.plot?.farm?.name || '—'}</strong></div>
                    <div className="text-muted text-xs">{log.cropCycle?.plot?.name}</div>
                  </td>
                  <td className="text-muted text-sm">{new Date(log.activityDate).toLocaleDateString('vi-VN')}</td>
                  <td><code className="code-tag">{log.activityType}</code></td>
                  <td>
                    <span className={`status-badge ${syncBadge(log.syncStatus)}`}>
                      {log.syncStatus === 'SYNCED' && <IconCheckCircle size={11} />}
                      {log.syncStatus === 'PENDING' && <IconClock size={11} />}
                      {log.syncStatus === 'CONFLICT' && <IconAlertTriangle size={11} />}
                      {log.syncStatus}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{log.notes || '—'}</td>
                  <td>
                    <div className="action-btns justify-center">
                      {log.syncStatus !== 'SYNCED' && (
                        <button className="btn-xs green" onClick={() => handleResolveSync(log, 'SYNCED')} title="Xác nhận dữ liệu hợp lệ và đánh dấu đã đồng bộ">
                          <IconCheckCircle size={12} />Duyệt đồng bộ
                        </button>
                      )}
                      <button className="btn-xs blue" onClick={() => setViewingLog(log)} title="Xem chi tiết">
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chi tiết đồng bộ */}
      {viewingLog && (
        <div className="modal-backdrop" onClick={() => setViewingLog(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconClock size={18} className="text-primary-green" /><h3>Chi tiết bản ghi đồng bộ</h3></div>
              <button className="modal-close" onClick={() => setViewingLog(null)}>&times;</button>
            </div>
            <div className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div><span className="text-muted text-xs">Mã bản ghi:</span><p><code>{viewingLog.id}</code></p></div>
                <div><span className="text-muted text-xs">Trạng thái hiện tại:</span><p><span className={`status-badge ${syncBadge(viewingLog.syncStatus)}`}>{viewingLog.syncStatus}</span></p></div>
                <div><span className="text-muted text-xs">Nông trại:</span><p><strong>{viewingLog.cropCycle?.plot?.farm?.name}</strong></p></div>
                <div><span className="text-muted text-xs">Chủ nông hộ:</span><p>{viewingLog.cropCycle?.plot?.farm?.user?.fullName || '—'}</p></div>
                <div><span className="text-muted text-xs">Vụ mùa / Cây trồng:</span><p>{viewingLog.cropCycle?.name} ({viewingLog.cropCycle?.crop?.name})</p></div>
                <div><span className="text-muted text-xs">Ngày ghi nhận:</span><p>{new Date(viewingLog.activityDate).toLocaleDateString('vi-VN')}</p></div>
              </div>
              {viewingLog.notes && (
                <div style={{ marginBottom: '14px' }}>
                  <span className="text-muted text-xs">Nội dung ghi chú:</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{viewingLog.notes}</p>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setViewingLog(null)}>Đóng</button>
                {viewingLog.syncStatus !== 'SYNCED' && (
                  <button type="button" className="btn-primary" onClick={() => handleResolveSync(viewingLog, 'SYNCED')}>
                    Đánh dấu đã đồng bộ (SYNCED)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
