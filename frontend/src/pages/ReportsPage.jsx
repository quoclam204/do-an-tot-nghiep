import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  IconLineChart,
  IconCircleDollar,
  IconCalculator,
  IconClipboardList,
  IconFlask,
  IconCalendar,
  IconSprout,
  IconCheckCircle,
  IconPrinter,
} from '../components/icons';
import {
  apiGetFinancialReport,
  apiGetActivityLogs,
  apiGetSeasons,
  apiGetMaterials,
  apiGetSeasonFinancialSummary,
  apiGetMyFarms,
} from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import './ReportsPage.css';

const COLORS = ['#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#0284c7', '#f43f5e'];

const ACTIVITY_LABELS = {
  BON_PHAN: 'Bón phân',
  PHUN_THUOC: 'Phun thuốc BVTV',
  CAT_TIA: 'Cắt tỉa cành',
  LAM_CO: 'Làm cỏ',
  TUOI_NUOC: 'Tưới nước',
  THU_HOACH: 'Thu hoạch',
};

const ITEMS_PER_PAGE = 10;

export default function ReportsPage() {
  const [financials, setFinancials] = useState(null);
  const [logs, setLogs] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [seasonSummary, setSeasonSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSeason, setSelectedSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async (filters = {}) => {
    try {
      setLoading(true);
      const farmToUse = filters.farmId !== undefined ? filters.farmId : selectedFarmId;
      const seasonToUse = filters.cropCycleId !== undefined ? filters.cropCycleId : selectedSeason;

      const [seasonsRes, materialsRes, farmsRes] = await Promise.all([
        apiGetSeasons(farmToUse).catch(() => []),
        apiGetMaterials().catch(() => []),
        apiGetMyFarms().catch(() => []),
      ]);
      setSeasons(seasonsRes || []);
      setMaterials(materialsRes || []);
      setFarms(farmsRes || []);

      const query = {};
      if (seasonToUse) {
        query.cropCycleId = seasonToUse;
      }
      if (filters.startDate || startDate) {
        query.startDate = filters.startDate || startDate;
      }
      if (filters.endDate || endDate) {
        query.endDate = filters.endDate || endDate;
      }

      const [finRes, logsRes, seasonSumRes] = await Promise.all([
        apiGetFinancialReport(query.cropCycleId).catch(() => null),
        apiGetActivityLogs(query.cropCycleId, farmToUse).catch(() => []),
        seasonToUse ? apiGetSeasonFinancialSummary(seasonToUse).catch(() => null) : Promise.resolve(null),
      ]);

      setFinancials(finRes);
      setLogs(logsRes || []);
      setSeasonSummary(seasonSumRes);
    } catch (err) {
      console.error('Lỗi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyFilter = () => {
    setCurrentPage(1);
    loadData({
      farmId: selectedFarmId,
      cropCycleId: selectedSeason,
      startDate,
      endDate,
    });
  };

  // KPI data
  const totalExpense = financials?.totalExpense || 0;
  const totalRevenue = financials?.totalRevenue || 0;
  const netProfit = financials?.netProfit || 0;
  const logsCount = financials?.logsCount || logs.length;

  // Pie chart - cost breakdown
  const pieData = useMemo(() => {
    if (!financials) return [];
    return [
      { name: 'Phân bón & Thuốc', value: financials.totalMaterialCost || 0 },
      { name: 'Nhân công thuê', value: financials.totalLaborCost || 0 },
      { name: 'Chi phí khác', value: financials.totalOtherCosts || 0 },
    ].filter((d) => d.value > 0);
  }, [financials]);

  // Bar chart - revenue vs cost
  const barData = useMemo(() => {
    if (!financials) return [];
    return [
      {
        name: 'Tổng quan tài chính',
        'Chi phí Vật tư': financials.totalMaterialCost || 0,
        'Chi phí Nhân công': financials.totalLaborCost || 0,
        'Chi phí Khác': financials.totalOtherCosts || 0,
        'Doanh thu': financials.totalRevenue || 0,
      },
    ];
  }, [financials]);

  // Material usage aggregation (với snapshot lịch sử)
  const materialUsage = useMemo(() => {
    const usage = {};
    logs.forEach((log) => {
      (log.materials || []).forEach((m) => {
        const key = m.materialId || m.materialName || 'Vật tư';
        if (!usage[key]) {
          usage[key] = {
            name: m.materialName || m.material?.name || 'Vật tư',
            unit: m.unit || m.material?.unit || 'đơn vị',
            type: m.material?.type || 'KHAC',
            totalQty: 0,
            totalCost: 0,
            count: 0,
          };
        }
        usage[key].totalQty += m.quantityUsed || 0;
        usage[key].totalCost += m.cost || 0;
        usage[key].count += 1;
      });
    });
    return Object.values(usage).sort((a, b) => b.totalCost - a.totalCost);
  }, [logs]);

  // Activity timeline data for line chart
  const timelineData = useMemo(() => {
    const byMonth = {};
    logs.forEach((log) => {
      const d = new Date(log.activityDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) {
        byMonth[key] = { month: key, 'Chi phí': 0, 'Doanh thu': 0 };
      }
      byMonth[key]['Chi phí'] += log.cost || 0;
      byMonth[key]['Doanh thu'] += log.revenue || 0;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [logs]);

  // Filtered and paginated logs
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (startDate) {
      result = result.filter((l) => l.activityDate >= startDate);
    }
    if (endDate) {
      result = result.filter((l) => l.activityDate <= endDate + 'T23:59:59');
    }
    return result;
  }, [logs, startDate, endDate]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`;
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

  return (
    <div className="reports-page-container">
      <Header />
      <main className="reports-main-content">
        <div className="container">
          {/* HERO */}
          <div className="reports-hero-banner">
            <div className="reports-hero-text">
              <div className="reports-pill-tag">
                <IconLineChart size={16} strokeWidth={2.2} />
                <span>BÁO CÁO KINH TẾ NÔNG HỘ</span>
              </div>
              <h1>Báo cáo tổng hợp chi phí & doanh thu</h1>
              <p className="reports-hero-desc">
                Phân tích cơ cấu chi phí, lượng vật tư tiêu thụ, doanh thu thu hoạch
                và lợi nhuận ròng theo từng mùa vụ hoặc khoảng thời gian.
              </p>
            </div>
          </div>

          {/* FILTER SECTION */}
          <div className="reports-filter-section">
            {farms.length > 0 && (
              <div className="report-filter-group">
                <label>Trang trại / Nông hộ</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => {
                    const fid = e.target.value;
                    setSelectedFarmId(fid);
                    setSelectedSeason('');
                    loadData({ farmId: fid, cropCycleId: '' });
                  }}
                >
                  <option value="">Tất cả trang trại của tôi</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="report-filter-group">
              <label>Mùa vụ canh tác</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
              >
                <option value="">Tất cả mùa vụ</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.crop?.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="report-filter-group">
              <label>Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="report-filter-group">
              <label>Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="btn-apply-filter" onClick={handleApplyFilter}>
              <IconCheckCircle size={16} strokeWidth={2.5} />
              Áp dụng bộ lọc
            </button>
            <button
              className="btn-apply-filter"
              style={{ background: '#0284c7', border: '1px solid #0284c7' }}
              onClick={() => window.print()}
              title="In hoặc xuất PDF báo cáo"
            >
              <IconPrinter size={16} strokeWidth={2} />
              <span>Xuất / In báo cáo</span>
            </button>
          </div>

          {/* BÁO CÁO CHI TIẾT TỔNG KẾT VỤ MÙA */}
          {seasonSummary && (
            <div className="season-summary-card" style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      🌾 {seasonSummary.season?.name}
                    </span>
                    <span style={{
                      background: seasonSummary.season?.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                      color: seasonSummary.season?.status === 'ACTIVE' ? '#166534' : '#475569',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {seasonSummary.season?.status === 'ACTIVE' ? 'Đang canh tác' : 'Đã kết thúc vụ'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                    Cây trồng: <strong>{seasonSummary.season?.cropName}</strong> | Lô: <strong>{seasonSummary.season?.plotName}</strong> | Nông trại: <strong>{seasonSummary.season?.farmName}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Thời gian vụ mùa</div>
                  <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                    {formatDate(seasonSummary.season?.startDate)} ➔ {formatDate(seasonSummary.season?.actualEndDate || seasonSummary.season?.expectedEndDate)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '1rem', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>TỔNG ĐẦU TƯ VỤ MÙA</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c', margin: '4px 0' }}>
                    {formatMoney(seasonSummary.summary?.totalInvestment)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7f1d1d', lineHeight: '1.5' }}>
                    • Vật tư: {formatMoney(seasonSummary.summary?.totalMaterialCost)}<br/>
                    • Nhân công: {formatMoney(seasonSummary.summary?.totalLaborCost)} ({seasonSummary.summary?.totalWorkers || 0} công)<br/>
                    • Chi phí khác: {formatMoney(seasonSummary.summary?.totalOtherCosts)}
                  </div>
                </div>

                <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '1rem', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600 }}>TỔNG DOANH THU THU HOẠCH</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', margin: '4px 0' }}>
                    {formatMoney(seasonSummary.summary?.totalRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                    • Sản lượng: <strong>{(seasonSummary.summary?.totalHarvestQty || 0).toLocaleString()} kg</strong><br/>
                    • Đơn giá trung bình: {seasonSummary.summary?.totalHarvestQty > 0 ? formatMoney(seasonSummary.summary?.totalRevenue / seasonSummary.summary?.totalHarvestQty) : '—'}/kg
                  </div>
                </div>

                <div style={{
                  background: (seasonSummary.summary?.netProfit || 0) >= 0 ? '#f0fdf4' : '#fff1f2',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: `1px solid ${(seasonSummary.summary?.netProfit || 0) >= 0 ? '#bbf7d0' : '#fecdd3'}`
                }}>
                  <div style={{
                    fontSize: '0.8rem',
                    color: (seasonSummary.summary?.netProfit || 0) >= 0 ? '#166534' : '#9f1239',
                    fontWeight: 600
                  }}>
                    LỢI NHUẬN RÒNG & HIỆU QUẢ VỐN
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: (seasonSummary.summary?.netProfit || 0) >= 0 ? '#15803d' : '#e11d48',
                    margin: '4px 0'
                  }}>
                    {formatMoney(seasonSummary.summary?.netProfit)}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: (seasonSummary.summary?.netProfit || 0) >= 0 ? '#14532d' : '#881337',
                    fontWeight: 600
                  }}>
                    Tỷ suất hoàn vốn ROI: {seasonSummary.summary?.roiPercentage || 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI CARDS */}
          <div className="reports-kpi-grid">
            <div className="reports-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label-text">Tổng chi phí đầu tư</span>
                <div className="kpi-icon-circle red">
                  <IconCircleDollar size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="kpi-value-text text-red">
                {formatMoney(totalExpense)}
              </span>
              <span className="kpi-sub-text">
                Vật tư: {formatMoney(financials?.totalMaterialCost)} | Nhân công: {formatMoney(financials?.totalLaborCost)}
              </span>
            </div>
            <div className="reports-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label-text">Tổng doanh thu</span>
                <div className="kpi-icon-circle blue">
                  <IconLineChart size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="kpi-value-text text-blue">
                {formatMoney(totalRevenue)}
              </span>
              <span className="kpi-sub-text">
                Sản lượng: {(financials?.totalHarvestQty || 0).toLocaleString()} kg
              </span>
            </div>
            <div className="reports-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label-text">Lợi nhuận ròng</span>
                <div className={`kpi-icon-circle ${netProfit >= 0 ? 'green' : 'red'}`}>
                  <IconCalculator size={20} strokeWidth={2} />
                </div>
              </div>
              <span className={`kpi-value-text ${netProfit >= 0 ? 'text-green' : 'text-red'}`}>
                {formatMoney(netProfit)}
              </span>
              <span className="kpi-sub-text">
                ROI: {financials?.roiPercentage || 0}%
              </span>
            </div>
            <div className="reports-kpi-card">
              <div className="kpi-top">
                <span className="kpi-label-text">Lượt canh tác</span>
                <div className="kpi-icon-circle purple">
                  <IconClipboardList size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="kpi-value-text text-purple">{logsCount}</span>
              <span className="kpi-sub-text">Nhật ký đã ghi nhận</span>
            </div>
          </div>

          {/* CHARTS */}
          {(pieData.length > 0 || barData.length > 0) && (
            <div className="reports-charts-grid">
              <div className="report-chart-card">
                <div className="report-chart-title">
                  <IconCircleDollar size={18} strokeWidth={2} />
                  <span>Cơ cấu chi phí đầu tư</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="report-chart-card">
                <div className="report-chart-title">
                  <IconLineChart size={18} strokeWidth={2} />
                  <span>So sánh Doanh thu & Chi phí</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={barData}
                    margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ece7" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="Chi phí Vật tư" fill="#d97706" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Chi phí Nhân công" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Chi phí Khác" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Doanh thu" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TIMELINE CHART */}
          {timelineData.length > 1 && (
            <div className="report-chart-card" style={{ marginBottom: '2rem' }}>
              <div className="report-chart-title">
                <IconCalendar size={18} strokeWidth={2} />
                <span>Chi phí & Doanh thu theo thời gian</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={timelineData} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ece7" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="Chi phí" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Doanh thu" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* MATERIAL USAGE TABLE */}
          {materialUsage.length > 0 && (
            <div className="reports-usage-card">
              <div className="reports-usage-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div className="reports-usage-title">
                  <IconFlask size={20} strokeWidth={2} />
                  <span>Tổng hợp vật tư tiêu thụ & Chi phí kết vụ ({materialUsage.length} loại)</span>
                </div>
                <div style={{ background: '#ecfdf5', color: '#047857', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #a7f3d0' }}>
                  Tổng chi phí vật tư vụ mùa: {formatMoney(materialUsage.reduce((sum, item) => sum + item.totalCost, 0))}
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem', padding: '0 1.25rem' }}>
                🌾 Báo cáo chi tiết toàn bộ lượng vật tư tiêu thụ từ thời điểm bắt đầu làm đất, chăm sóc ban đầu đến khi thu hoạch kết vụ.
              </p>
              <div className="materials-table-responsive">
                <table className="reports-usage-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên vật tư</th>
                      <th>Loại</th>
                      <th>Tổng lượng dùng</th>
                      <th>Tổng chi phí</th>
                      <th>Số lần sử dụng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialUsage.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{item.name}</td>
                        <td>
                          <span
                            className={`material-type-badge ${
                              item.type === 'PHAN_BON'
                                ? 'badge-phan-bon'
                                : item.type === 'THUOC_BVTV'
                                ? 'badge-thuoc-bvtv'
                                : 'badge-khac'
                            }`}
                          >
                            {item.type === 'PHAN_BON' ? 'Phân bón' : item.type === 'THUOC_BVTV' ? 'Thuốc BVTV' : item.type}
                          </span>
                        </td>
                        <td>
                          {item.totalQty.toLocaleString()} {item.unit}
                        </td>
                        <td className="text-bold-red">{formatMoney(item.totalCost)}</td>
                        <td>{item.count} lần</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVITY HISTORY TABLE */}
          <div className="reports-history-card">
            <div className="reports-history-header">
              <div className="reports-history-title">
                <IconClipboardList size={20} strokeWidth={2} />
                <span>Lịch sử hoạt động canh tác ({filteredLogs.length})</span>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="reports-empty">
                <div className="reports-empty-icon">
                  <IconLineChart size={32} strokeWidth={2} />
                </div>
                <h3>Chưa có dữ liệu báo cáo</h3>
                <p>
                  Hãy ghi nhật ký canh tác trước để hệ thống có thể tổng hợp báo cáo chi phí và doanh thu.
                </p>
              </div>
            ) : (
              <>
                <div className="materials-table-responsive">
                  <table className="reports-history-table">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Mùa vụ</th>
                        <th>Hoạt động</th>
                        <th>Chi phí</th>
                        <th>Doanh thu</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {formatDate(log.activityDate)}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{log.cropCycle?.name}</div>
                            <div className="text-muted-report">
                              {log.cropCycle?.crop?.name}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge-activity-sm badge-sm-${log.activityType?.toLowerCase()}`}
                            >
                              {ACTIVITY_LABELS[log.activityType] || log.activityType}
                            </span>
                          </td>
                          <td className="text-bold-red">
                            {(log.cost || 0) > 0 ? formatMoney(log.cost) : '—'}
                          </td>
                          <td className="text-bold-green">
                            {(log.revenue || 0) > 0 ? `+${formatMoney(log.revenue)}` : '—'}
                          </td>
                          <td className="text-muted-report">
                            {log.notes ? (log.notes.length > 40 ? log.notes.slice(0, 40) + '...' : log.notes) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="reports-pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      ‹ Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                      .map((p, i, arr) => (
                        <span key={p}>
                          {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: '0 4px' }}>...</span>}
                          <button
                            className={currentPage === p ? 'active' : ''}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Sau ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
