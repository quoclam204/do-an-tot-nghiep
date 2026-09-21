import React, { useState, useEffect } from 'react';
import { apiAdminGetAllActivityLogs } from '../../../services/api';
import {
  IconRotateCw, IconAlertTriangle, IconCheckCircle, IconClock,
  IconZap,
} from '../../../components/icons';

export default function PanelSync() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { loadSyncData(); }, []);

  const loadSyncData = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiAdminGetAllActivityLogs({ limit: 500 });
      setLogs(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tải dữ liệu đồng bộ');
    } finally { setLoading(false); }
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

      {/* Thống kê đồng bộ */}
      <div className="sync-status-grid">
        <div className="sync-stat-card synced" onClick={() => setFilterStatus(filterStatus === 'SYNCED' ? '' : 'SYNCED')}>
          <div className="sync-icon"><IconCheckCircle size={28} /></div>
          <div className="sync-number">{syncStats.synced}</div>
          <div className="sync-label">Đã đồng bộ</div>
          <div className="sync-bar"><div style={{ width: `${syncStats.total ? (syncStats.synced / syncStats.total * 100) : 0}%` }}></div></div>
        </div>
        <div className="sync-stat-card pending" onClick={() => setFilterStatus(filterStatus === 'PENDING' ? '' : 'PENDING')}>
          <div className="sync-icon"><IconClock size={28} /></div>
          <div className="sync-number">{syncStats.pending}</div>
          <div className="sync-label">Đang chờ đồng bộ</div>
          <div className="sync-bar pending"><div style={{ width: `${syncStats.total ? (syncStats.pending / syncStats.total * 100) : 0}%` }}></div></div>
        </div>
        <div className="sync-stat-card conflict" onClick={() => setFilterStatus(filterStatus === 'CONFLICT' ? '' : 'CONFLICT')}>
          <div className="sync-icon"><IconAlertTriangle size={28} /></div>
          <div className="sync-number">{syncStats.conflict}</div>
          <div className="sync-label">Xung đột dữ liệu</div>
          <div className="sync-bar conflict"><div style={{ width: `${syncStats.total ? (syncStats.conflict / syncStats.total * 100) : 0}%` }}></div></div>
        </div>
        <div className="sync-stat-card failed" onClick={() => setFilterStatus(filterStatus === 'FAILED' ? '' : 'FAILED')}>
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
        <button className="btn-action-secondary" onClick={loadSyncData} disabled={loading}>
          <IconRotateCw size={14} className={loading ? 'spin-anim' : ''} /> Làm mới
        </button>
      </div>

      <div className="panel-card-surface">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr>
              <th>Nhật ký</th>
              <th>Nông hộ / Lô</th>
              <th>Ngày ghi</th>
              <th>Loại HĐ</th>
              <th>Trạng thái đồng bộ</th>
              <th>Ghi chú</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
