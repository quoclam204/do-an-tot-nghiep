import React, { useState, useEffect } from 'react';
import {
  apiGetSeasons, apiGetSeasonFinancialSummary, apiGetSeasonMaterialConsumption,
  apiAdminGetAllFarms, apiAdminGetAllActivityLogs,
} from '../../../services/api';
import {
  IconBarChart, IconRotateCw, IconAlertTriangle, IconDownload, IconSprout,
  IconWarehouse, IconCheckCircle,
} from '../../../components/icons';

export default function PanelReports() {
  const [reportTab, setReportTab] = useState('system'); // 'system' | 'season'
  const [farms, setFarms] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true); setError('');
    try {
      const [fData, sData, lData] = await Promise.all([
        apiAdminGetAllFarms().catch(() => []),
        apiGetSeasons().catch(() => []),
        apiAdminGetAllActivityLogs({ limit: 1000 }).catch(() => []),
      ]);
      setFarms(fData || []);
      setSeasons(sData || []);
      setLogs(lData || []);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu báo cáo');
    } finally { setLoading(false); }
  };

  const filteredSeasons = selectedFarm ? seasons.filter(s => {
    const farm = farms.find(f => f.id === selectedFarm);
    return farm?.plots?.some(p => p.id === s.plotId);
  }) : seasons;

  const loadSeasonSummary = async (season) => {
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

  // Thống kê toàn hệ thống từ logs
  const systemTotalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0);
  const systemTotalRevenue = logs.reduce((sum, l) => sum + (l.revenue || 0), 0);
  const systemProfit = systemTotalRevenue - systemTotalCost;
  const systemTotalYield = logs.reduce((sum, l) => sum + (l.harvestQuantity || 0), 0);

  // Xếp hạng nông trại theo chi phí và doanh thu
  const farmStatsMap = {};
  logs.forEach(l => {
    const fName = l.cropCycle?.plot?.farm?.name || 'Khác';
    const ownerName = l.cropCycle?.plot?.farm?.user?.fullName || '—';
    if (!farmStatsMap[fName]) {
      farmStatsMap[fName] = { name: fName, owner: ownerName, cost: 0, revenue: 0, harvestQty: 0, logsCount: 0 };
    }
    farmStatsMap[fName].cost += (l.cost || 0);
    farmStatsMap[fName].revenue += (l.revenue || 0);
    farmStatsMap[fName].harvestQty += (l.harvestQuantity || 0);
    farmStatsMap[fName].logsCount += 1;
  });
  const farmStatsList = Object.values(farmStatsMap).sort((a, b) => b.revenue - a.revenue);

  // Thống kê theo loại cây trồng
  const cropStatsMap = {};
  logs.forEach(l => {
    const cName = l.cropCycle?.crop?.name || 'Chưa phân loại';
    if (!cropStatsMap[cName]) {
      cropStatsMap[cName] = { name: cName, cost: 0, revenue: 0, yield: 0, count: 0 };
    }
    cropStatsMap[cName].cost += (l.cost || 0);
    cropStatsMap[cName].revenue += (l.revenue || 0);
    cropStatsMap[cName].yield += (l.harvestQuantity || 0);
    cropStatsMap[cName].count += 1;
  });
  const cropStatsList = Object.values(cropStatsMap).sort((a, b) => b.yield - a.yield);

  // Xuất CSV báo cáo toàn hệ thống
  const exportSystemCSV = () => {
    const rows = [
      ['BÁO CÁO KINH TẾ & SẢN LƯỢNG TOÀN HỆ THỐNG DALATAGRI'],
      ['Thời điểm xuất', new Date().toLocaleString('vi-VN')],
      [''],
      ['CHỈ TIÊU TỔNG QUAN', 'GIÁ TRỊ'],
      ['Tổng chi phí canh tác', fmtVnd(systemTotalCost)],
      ['Tổng doanh thu thu hoạch', fmtVnd(systemTotalRevenue)],
      ['Lợi nhuận toàn hệ thống', fmtVnd(systemProfit)],
      ['Tổng sản lượng thu hoạch', `${fmt(systemTotalYield)} kg`],
      [''],
      ['CHI TIẾT THEO NÔNG HỘ / TRANG TRẠI'],
      ['Tên nông trại', 'Chủ hộ', 'Số nhật ký', 'Tổng chi phí', 'Doanh thu', 'Lợi nhuận', 'Sản lượng (kg)'],
      ...farmStatsList.map(f => [
        `"${f.name}"`,
        `"${f.owner}"`,
        f.logsCount,
        fmtVnd(f.cost),
        fmtVnd(f.revenue),
        fmtVnd(f.revenue - f.cost),
        `${fmt(f.harvestQty)} kg`,
      ]),
      [''],
      ['CHI TIẾT THEO CÂY TRỒNG'],
      ['Tên cây trồng', 'Tổng chi phí', 'Doanh thu', 'Sản lượng thu hoạch (kg)'],
      ...cropStatsList.map(c => [
        `"${c.name}"`,
        fmtVnd(c.cost),
        fmtVnd(c.revenue),
        `${fmt(c.yield)} kg`,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-tong-hop-he-thong-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Xuất CSV vụ mùa đơn lẻ
  const exportSeasonCSV = () => {
    if (!summary) return;
    const rows = [
      ['Báo cáo tài chính vụ mùa', selectedSeason?.name || ''],
      ['Thời điểm xuất', new Date().toLocaleString('vi-VN')],
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-vu-${selectedSeason?.name || 'mua'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}

      {/* Toolbar & Tabs */}
      <div className="panel-toolbar">
        <div className="panel-tabs-inline">
          <button className={`panel-tab-btn ${reportTab === 'system' ? 'active' : ''}`} onClick={() => setReportTab('system')}>
            <IconBarChart size={15} /> Báo cáo toàn hệ thống
          </button>
          <button className={`panel-tab-btn ${reportTab === 'season' ? 'active' : ''}`} onClick={() => setReportTab('season')}>
            <IconSprout size={15} /> Báo cáo vụ mùa chi tiết
          </button>
        </div>
        <div className="toolbar-right">
          {reportTab === 'system' ? (
            <button className="btn-action-primary" onClick={exportSystemCSV}>
              <IconDownload size={14} /> Xuất CSV toàn hệ thống
            </button>
          ) : (
            summary && (
              <button className="btn-action-primary" onClick={exportSeasonCSV}>
                <IconDownload size={14} /> Xuất CSV vụ mùa
              </button>
            )
          )}
          <button className="btn-action-secondary" onClick={loadBaseData} disabled={loading}>
            <IconRotateCw size={14} className={loading ? 'spin-anim' : ''} /> Làm mới
          </button>
        </div>
      </div>

      {/* TAB 1: BÁO CÁO TOÀN HỆ THỐNG */}
      {reportTab === 'system' && (
        <div className="system-reports-wrapper">
          {/* KPI tài chính toàn hệ thống */}
          <div className="finance-kpi-row mb-4">
            <div className="finance-kpi-card cost">
              <span className="fkpi-label">Tổng chi phí toàn hệ thống</span>
              <span className="fkpi-value">{fmtVnd(systemTotalCost)}</span>
            </div>
            <div className="finance-kpi-card revenue">
              <span className="fkpi-label">Tổng doanh thu bán nông sản</span>
              <span className="fkpi-value">{fmtVnd(systemTotalRevenue)}</span>
            </div>
            <div className={`finance-kpi-card ${systemProfit >= 0 ? 'profit' : 'loss'}`}>
              <span className="fkpi-label">Lợi nhuận toàn hệ thống</span>
              <span className="fkpi-value">{systemProfit >= 0 ? '+' : ''}{fmtVnd(systemProfit)}</span>
            </div>
            <div className="finance-kpi-card" style={{ background: '#f8fafc' }}>
              <span className="fkpi-label">Tổng sản lượng thu hoạch</span>
              <span className="fkpi-value" style={{ color: '#0284c7' }}>{fmt(systemTotalYield)} kg</span>
            </div>
          </div>

          {/* Bảng tổng hợp theo Nông trại */}
          <div className="panel-card-surface mb-4">
            <div className="panel-card-header">
              <h3><IconWarehouse size={16} /> Hiệu quả kinh tế theo Nông trại / Hộ</h3>
            </div>
            <div className="panel-table-container">
              <table className="panel-table">
                <thead><tr>
                  <th>Nông trại</th><th>Chủ hộ</th><th>Nhật ký ghi</th>
                  <th>Chi phí</th><th>Doanh thu</th><th>Lợi nhuận</th><th>Sản lượng</th>
                </tr></thead>
                <tbody>
                  {farmStatsList.length === 0 ? (
                    <tr><td colSpan={7} className="table-empty">Chưa có dữ liệu</td></tr>
                  ) : farmStatsList.map((f, i) => {
                    const profit = f.revenue - f.cost;
                    return (
                      <tr key={i}>
                        <td><strong>{f.name}</strong></td>
                        <td className="text-muted">{f.owner}</td>
                        <td><span className="count-badge">{f.logsCount}</span></td>
                        <td>{fmtVnd(f.cost)}</td>
                        <td><strong>{fmtVnd(f.revenue)}</strong></td>
                        <td style={{ color: profit >= 0 ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                          {profit >= 0 ? '+' : ''}{fmtVnd(profit)}
                        </td>
                        <td>{fmt(f.harvestQty)} kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng tổng hợp theo Cây trồng */}
          <div className="panel-card-surface">
            <div className="panel-card-header">
              <h3><IconSprout size={16} /> Năng suất và Doanh thu theo Cây trồng</h3>
            </div>
            <div className="panel-table-container">
              <table className="panel-table">
                <thead><tr>
                  <th>Cây trồng</th><th>Số hoạt động ghi</th><th>Tổng chi phí</th><th>Doanh thu</th><th>Tổng sản lượng</th>
                </tr></thead>
                <tbody>
                  {cropStatsList.length === 0 ? (
                    <tr><td colSpan={5} className="table-empty">Chưa có dữ liệu cây trồng</td></tr>
                  ) : cropStatsList.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.name}</strong></td>
                      <td><span className="count-badge">{c.count}</span></td>
                      <td>{fmtVnd(c.cost)}</td>
                      <td><strong>{fmtVnd(c.revenue)}</strong></td>
                      <td><strong style={{ color: '#0284c7' }}>{fmt(c.yield)} kg</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BÁO CÁO THEO TỪNG VỤ MÙA */}
      {reportTab === 'season' && (
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
                <p className="text-muted text-sm p-4">Chưa có vụ mùa phù hợp</p>
              ) : filteredSeasons.map(s => (
                <div
                  key={s.id}
                  className={`season-item ${selectedSeason?.id === s.id ? 'active' : ''}`}
                  onClick={() => loadSeasonSummary(s)}
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

          {/* Panel phải: Báo cáo tài chính vụ mùa */}
          <div className="report-summary-panel panel-card-surface">
            {!selectedSeason ? (
              <div className="panel-empty-state">
                <IconBarChart size={48} className="text-muted" />
                <p>Chọn một vụ mùa ở cột bên trái để xem phân tích tài chính chi tiết</p>
              </div>
            ) : loading ? (
              <div className="panel-loading"><IconRotateCw size={28} className="spin-anim text-primary-green" /><span>Đang tính toán...</span></div>
            ) : summary ? (
              <>
                <div className="panel-card-header">
                  <h3><IconBarChart size={16} /> Báo cáo: {selectedSeason.name}</h3>
                  <button className="btn-section-refresh" onClick={exportSeasonCSV}><IconDownload size={13} /> Xuất CSV</button>
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
      )}
    </div>
  );
}
