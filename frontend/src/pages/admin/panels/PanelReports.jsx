import React, { useState, useEffect } from 'react';
import { apiGetSeasons, apiGetSeasonFinancialSummary, apiGetSeasonMaterialConsumption, apiAdminGetAllFarms } from '../../../services/api';
import {
  IconBarChart, IconRotateCw, IconAlertTriangle, IconDownload, IconSprout,
} from '../../../components/icons';

export default function PanelReports() {
  const [farms, setFarms] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiAdminGetAllFarms().then(d => setFarms(d || [])).catch(() => {});
    apiGetSeasons().then(d => setSeasons(d || [])).catch(() => {});
  }, []);

  const filteredSeasons = selectedFarm ? seasons.filter(s => {
    const farm = farms.find(f => f.id === selectedFarm);
    return farm?.plots?.some(p => p.id === s.plotId);
  }) : seasons;

  const loadSummary = async (season) => {
    setSelectedSeason(season);
    setSummary(null);
    setLoading(true); setError('');
    try {
      const [financial, consumption] = await Promise.all([
        apiGetSeasonFinancialSummary(season.id),
        apiGetSeasonMaterialConsumption(season.id).catch(() => []),
      ]);
      setSummary({ ...financial, materialConsumption: consumption });
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tải báo cáo tài chính');
    } finally { setLoading(false); }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);
  const fmtVnd = (n) => fmt(n) + ' ₫';

  const exportToCSV = () => {
    if (!summary) return;
    const rows = [
      ['Báo cáo tài chính vụ mùa', selectedSeason?.name || ''],
      [''],
      ['Chỉ tiêu', 'Giá trị'],
      ['Tổng chi phí', fmtVnd(summary.totalCost)],
      ['Tổng doanh thu', fmtVnd(summary.totalRevenue)],
      ['Lợi nhuận ước tính', fmtVnd(summary.profit)],
      ['Tổng sản lượng', `${fmt(summary.totalYield)} kg`],
      [''],
      ['Chi tiết chi phí theo loại HĐ'],
      ['Loại hoạt động', 'Chi phí'],
      ...(summary.costByActivity || []).map(c => [c.activityType, fmtVnd(c.totalCost)]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `bao-cao-${selectedSeason?.name || 'vu-mua'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}

      <div className="panel-two-col">
        {/* Panel trái: Chọn vụ mùa */}
        <div className="report-seasons-panel panel-card-surface">
          <div className="panel-card-header">
            <h3><IconSprout size={15} /> Chọn vụ mùa</h3>
          </div>
          <div className="filter-bar-v">
            <select className="filter-select w-full" value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)}>
              <option value="">— Tất cả nông hộ —</option>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="seasons-list">
            {filteredSeasons.length === 0 ? (
              <p className="text-muted text-sm p-4">Chưa có vụ mùa</p>
            ) : filteredSeasons.map(s => (
              <div
                key={s.id}
                className={`season-item ${selectedSeason?.id === s.id ? 'active' : ''}`}
                onClick={() => loadSummary(s)}
              >
                <div className="season-item-name">{s.name}</div>
                <div className="season-item-meta">
                  <span className="text-muted text-xs">{new Date(s.startDate).toLocaleDateString('vi-VN')}</span>
                  <span className={`status-badge ${s.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel phải: Báo cáo tài chính */}
        <div className="report-summary-panel panel-card-surface">
          {!selectedSeason ? (
            <div className="panel-empty-state">
              <IconBarChart size={48} className="text-muted" />
              <p>Chọn một vụ mùa để xem báo cáo</p>
            </div>
          ) : loading ? (
            <div className="panel-loading"><IconRotateCw size={28} className="spin-anim text-primary-green" /><span>Đang tính toán...</span></div>
          ) : summary ? (
            <>
              <div className="panel-card-header">
                <h3><IconBarChart size={16} /> Báo cáo: {selectedSeason.name}</h3>
                <button className="btn-section-refresh" onClick={exportToCSV}><IconDownload size={13} /> Xuất CSV</button>
              </div>

              {/* KPI tài chính */}
              <div className="finance-kpi-row">
                <div className="finance-kpi-card cost">
                  <span className="fkpi-label">Tổng chi phí</span>
                  <span className="fkpi-value">{fmtVnd(summary.totalCost)}</span>
                </div>
                <div className="finance-kpi-card revenue">
                  <span className="fkpi-label">Tổng doanh thu</span>
                  <span className="fkpi-value">{fmtVnd(summary.totalRevenue)}</span>
                </div>
                <div className={`finance-kpi-card ${(summary.profit || 0) >= 0 ? 'profit' : 'loss'}`}>
                  <span className="fkpi-label">Lợi nhuận</span>
                  <span className="fkpi-value">{(summary.profit || 0) >= 0 ? '+' : ''}{fmtVnd(summary.profit)}</span>
                </div>
              </div>

              {/* Chi tiết theo loại HĐ */}
              {summary.costByActivity && summary.costByActivity.length > 0 && (
                <div className="mt-4">
                  <h4 className="section-subtitle">Chi phí theo loại hoạt động</h4>
                  <div className="panel-table-container">
                    <table className="panel-table compact">
                      <thead><tr><th>Loại hoạt động</th><th>Số lần</th><th>Tổng chi phí</th></tr></thead>
                      <tbody>
                        {summary.costByActivity.map((c, i) => (
                          <tr key={i}>
                            <td><code className="code-tag">{c.activityType}</code></td>
                            <td>{c.count || '—'}</td>
                            <td><strong>{fmtVnd(c.totalCost)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chi phí vật tư */}
              {summary.materialConsumption && summary.materialConsumption.length > 0 && (
                <div className="mt-4">
                  <h4 className="section-subtitle">Vật tư sử dụng trong vụ</h4>
                  <div className="panel-table-container">
                    <table className="panel-table compact">
                      <thead><tr><th>Vật tư</th><th>Đơn vị</th><th>Tổng dùng</th><th>Tổng chi phí</th></tr></thead>
                      <tbody>
                        {summary.materialConsumption.map((m, i) => (
                          <tr key={i}>
                            <td>{m.materialName}</td>
                            <td>{m.unit}</td>
                            <td>{fmt(m.totalUsed)} {m.unit}</td>
                            <td><strong>{fmtVnd(m.totalCost)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="panel-empty-state">Chọn vụ mùa để xem báo cáo</div>
          )}
        </div>
      </div>
    </div>
  );
}
