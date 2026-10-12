import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
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
  IconShield,
  IconExternalLink,
  IconInfo,
} from '../../components/icons';
import { PucCertificateModal, FinancialExplanationModal, QuickHarvestModal } from '../../components/modals';
import {
  calculatePlotCapex,
  calculatePaybackPeriod,
  getPlotMeta,
} from '../../utils/plotMetadata';
import {
  apiGetFinancialReport,
  apiGetActivityLogs,
  apiGetSeasons,
  apiGetMaterials,
  apiGetSeasonFinancialSummary,
  apiGetMyFarms,
} from '../../services/api';
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
  LabelList,
} from 'recharts';
import { exportToPDF, exportToExcel, exportToWord } from '../../utils/exportReport';
import './ReportsPage.css';

const COLORS = ['#107C10', '#d97706', '#dc2626', '#8b5cf6', '#0284c7', '#f43f5e'];

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
  const [selectedFarmObj, setSelectedFarmObj] = useState(null);
  const [selectedPucPlot, setSelectedPucPlot] = useState(null);
  const [seasonSummary, setSeasonSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSeason, setSelectedSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Giải trình chi tiết tài chính & Thu hoạch nhanh
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [explainTab, setExplainTab] = useState('ALL');
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);

  const handleOpenCardDetail = (tab = 'ALL') => {
    setExplainTab(tab);
    setIsExplainModalOpen(true);
  };

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


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

      const curF = farmToUse ? (farmsRes || []).find((f) => f.id === farmToUse) : (farmsRes || [])[0];
      setSelectedFarmObj(curF || null);

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
        apiGetFinancialReport({ cropCycleId: query.cropCycleId, farmId: farmToUse, startDate: query.startDate, endDate: query.endDate }).catch(() => null),
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

  // Dữ liệu so sánh Thu - Chi trực quan cho nông dân
  const comparisonData = useMemo(() => {
    if (!financials) return [];
    return [
      {
        name: 'Doanh Thu',
        value: Number(financials.totalRevenue || 0),
        fill: '#107C10', // Xanh chuẩn DalatAgri
      },
      {
        name: 'Tổng Chi Phí',
        value: Number(financials.totalExpense || 0),
        fill: '#d97706', // Cam đất nhã nhặn
      },
    ];
  }, [financials]);

  // Dữ liệu phân bổ cơ cấu chi phí thực tế
  const expenseBreakdown = useMemo(() => {
    if (!financials) return [];
    const mat = Number(financials.totalMaterialCost || 0);
    const lab = Number(financials.totalLaborCost || 0);
    const oth = Number(financials.totalOtherCosts || 0);
    const total = mat + lab + oth;

    return [
      {
        name: 'Vật tư (Phân, thuốc BVTV)',
        value: mat,
        percent: total > 0 ? Math.round((mat / total) * 100) : 0,
        fill: '#107C10',
      },
      {
        name: 'Nhân công lao động',
        value: lab,
        percent: total > 0 ? Math.round((lab / total) * 100) : 0,
        fill: '#0284c7',
      },
      {
        name: 'Chi phí khác',
        value: oth,
        percent: total > 0 ? Math.round((oth / total) * 100) : 0,
        fill: '#d97706',
      },
    ];
  }, [financials]);

  const activeExpensePie = useMemo(() => {
    return expenseBreakdown.filter((d) => d.value > 0);
  }, [expenseBreakdown]);

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

  // Phân tích Khấu hao Kiến thiết cơ bản (CapEx) & Hoàn vốn cây dài ngày
  const capexAnalysis = useMemo(() => {
    let targetPlots = [];
    if (selectedFarmId) {
      const f = (farms || []).find((farm) => farm.id === selectedFarmId);
      targetPlots = f?.plots || [];
    } else {
      targetPlots = (farms || []).flatMap((farm) => farm.plots || []);
    }

    if (!targetPlots || targetPlots.length === 0) {
      targetPlots = [
        { id: 'preset-1', name: 'Lô A - Cà phê Robusta cao sản', area: 1.2 },
        { id: 'preset-2', name: 'Lô B - Sầu riêng Ri6 ghép', area: 0.8 },
        { id: 'preset-3', name: 'Lô C - Mắc ca xen Cà phê', area: 1.0 },
        { id: 'preset-4', name: 'Lô D - Bơ sáp 034', area: 0.5 },
      ];
    }

    let totalCapEx = 0;
    let totalAnnualDepreciation = 0;
    let totalAccumulatedDepreciation = 0;

    const plotDetails = targetPlots.map((p) => {
      const c = calculatePlotCapex(p);
      totalCapEx += c.initialCost;
      totalAnnualDepreciation += c.annualDepreciation;
      totalAccumulatedDepreciation += c.accumulatedDepreciation;
      return {
        plot: p,
        capex: c,
      };
    });

    const operatingProfit = Number(financials?.netProfit || 0);
    const profitAfterDepreciation = operatingProfit - totalAnnualDepreciation;
    const payback = calculatePaybackPeriod(totalCapEx, operatingProfit);

    return {
      totalCapEx,
      totalAnnualDepreciation,
      totalAccumulatedDepreciation,
      operatingProfit,
      profitAfterDepreciation,
      payback,
      plotDetails,
    };
  }, [farms, selectedFarmId, financials]);

  // Export handler
  const handleExport = async (format) => {
    setShowExportMenu(false);
    setExporting(true);
    try {
      // Build filter info string
      const farmName = selectedFarmId
        ? farms.find((f) => f.id === selectedFarmId)?.name || ''
        : 'Tất cả trang trại';
      const seasonName = selectedSeason
        ? seasons.find((s) => s.id === selectedSeason)?.name || ''
        : 'Tất cả mùa vụ';
      const dateRange = startDate || endDate
        ? `${startDate || '...'} → ${endDate || '...'}`
        : '';
      const filterInfo = [farmName, seasonName, dateRange].filter(Boolean).join(' | ');

      const exportData = {
        financials,
        logs: filteredLogs,
        materialUsage,
        seasonSummary,
        filterInfo,
        capexAnalysis,
      };

      if (format === 'pdf') {
        await exportToPDF(exportData);
      } else if (format === 'excel') {
        await exportToExcel(exportData);
      } else if (format === 'word') {
        await exportToWord(exportData);
      }
    } catch (err) {
      console.error('Lỗi xuất báo cáo:', err);
      alert('Có lỗi khi xuất báo cáo. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

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
                <span>BÁO CÁO THU CHI NÔNG HỘ</span>
              </div>
              <h1>Báo cáo thu chi & hiệu quả mùa vụ</h1>
              <p className="reports-hero-desc">
                Theo dõi rõ ràng các khoản tiền vốn đầu tư, chi phí vật tư, tiền bán nông sản
                và lợi nhuận thực tế theo từng mùa vụ canh tác.
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
            <div className="report-filter-actions">
              <button className="btn-apply-filter" onClick={handleApplyFilter}>
                <IconCheckCircle size={16} strokeWidth={2.5} />
                <span>Xem báo cáo</span>
              </button>
              <div className="export-dropdown-wrapper" ref={exportMenuRef}>
                <button
                  className="btn-apply-filter btn-export-main"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting}
                  title="Xuất báo cáo ra file Word, PDF hoặc Excel"
                >
                  {exporting ? (
                    <span className="export-spinner" />
                  ) : (
                    <IconPrinter size={16} strokeWidth={2} />
                  )}
                  <span>{exporting ? 'Đang xuất...' : 'Xuất báo cáo'}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 2 }}>
                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showExportMenu && (
                  <div className="export-dropdown-menu">
                    <div className="export-dropdown-header">Chọn định dạng xuất</div>
                    <button className="export-dropdown-item" onClick={() => handleExport('pdf')}>
                      <span className="export-icon export-icon-pdf">PDF</span>
                      <div className="export-item-text">
                        <strong>Xuất file PDF</strong>
                        <span>Báo cáo bảng số liệu, thuận tiện in ấn</span>
                      </div>
                    </button>
                    <button className="export-dropdown-item" onClick={() => handleExport('word')}>
                      <span className="export-icon export-icon-word">DOC</span>
                      <div className="export-item-text">
                        <strong>Xuất file Word</strong>
                        <span>Tài liệu .docx có thể chỉnh sửa</span>
                      </div>
                    </button>
                    <button className="export-dropdown-item" onClick={() => handleExport('excel')}>
                      <span className="export-icon export-icon-excel">XLS</span>
                      <div className="export-item-text">
                        <strong>Xuất file Excel</strong>
                        <span>Bảng tính chi tiết .xlsx</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BÁO CÁO CHI TIẾT TỔNG KẾT VỤ MÙA (NỀN TRẮNG THANH LỊCH) */}
          {seasonSummary && (
            <div className="season-summary-card">
              <div className="season-summary-header">
                <div>
                  <div className="season-summary-title">
                    <IconSprout size={20} strokeWidth={2.2} style={{ color: 'var(--ms-green, #107C10)' }} />
                    <span>{seasonSummary.season?.name}</span>
                    <span className={`season-status-pill ${seasonSummary.season?.status === 'ACTIVE' ? 'active' : ''}`}>
                      {seasonSummary.season?.status === 'ACTIVE' ? 'Đang canh tác' : 'Đã kết thúc vụ'}
                    </span>
                  </div>
                  <p className="season-summary-subtitle">
                    Cây trồng: <strong>{seasonSummary.season?.cropName}</strong> | Lô: <strong>{seasonSummary.season?.plotName}</strong> | Nông trại: <strong>{seasonSummary.season?.farmName}</strong>
                  </p>
                </div>
                <div className="season-summary-dates">
                  <div className="season-dates-label">Thời gian vụ mùa</div>
                  <div className="season-dates-value">
                    {formatDate(seasonSummary.season?.startDate)} ➔ {formatDate(seasonSummary.season?.actualEndDate || seasonSummary.season?.expectedEndDate)}
                  </div>
                </div>
              </div>

              <div className="season-summary-stats-grid">
                <div className="season-stat-box">
                  <div className="season-stat-label">Tổng vốn đầu tư vụ mùa</div>
                  <div className="season-stat-val text-red">
                    {formatMoney(seasonSummary.summary?.totalInvestment)}
                  </div>
                  <div className="season-stat-sub">
                    • Vật tư: {formatMoney(seasonSummary.summary?.totalMaterialCost)}<br />
                    • Công lao động: {formatMoney(seasonSummary.summary?.totalLaborCost)} ({seasonSummary.summary?.totalWorkers || 0} công)<br />
                    • Chi khác: {formatMoney(seasonSummary.summary?.totalOtherCosts)}
                  </div>
                </div>

                <div className="season-stat-box">
                  <div className="season-stat-label">Tổng tiền bán nông sản</div>
                  <div className="season-stat-val text-blue">
                    {formatMoney(seasonSummary.summary?.totalRevenue)}
                  </div>
                  <div className="season-stat-sub">
                    • Đã thu hoạch: <strong>{(seasonSummary.summary?.totalHarvestQty || 0).toLocaleString()} kg</strong><br />
                    • Giá bán bình quân: {seasonSummary.summary?.totalHarvestQty > 0 ? formatMoney(seasonSummary.summary?.totalRevenue / seasonSummary.summary?.totalHarvestQty) : '—'}/kg
                  </div>
                </div>

                <div className="season-stat-box">
                  <div className="season-stat-label">Tiền lời / lỗ vụ mùa</div>
                  <div className={`season-stat-val ${(seasonSummary.summary?.netProfit || 0) >= 0 ? 'text-green' : 'text-red'}`}>
                    {(seasonSummary.summary?.netProfit || 0) >= 0 ? '+' : ''}{formatMoney(seasonSummary.summary?.netProfit)}
                  </div>
                  <div className="season-stat-sub">
                    {(seasonSummary.summary?.netProfit || 0) >= 0 ? (
                      <span className="badge-kpi-status badge-status-profit">🌾 Có lãi (Tỷ suất ROI: {seasonSummary.summary?.roiPercentage || 0}%)</span>
                    ) : (
                      <span className="badge-kpi-status badge-status-investing">🌱 Đang đầu tư vụ mùa</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* THANH TIÊU ĐỀ KHU VỰC THẺ TÀI CHÍNH */}
          <div className="kpi-header-row">
            <div className="kpi-header-title">
              <div className="kpi-title-icon-badge">
                <IconCalculator size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h2>TỔNG QUAN HIỆU QUẢ KINH TẾ</h2>
                <p className="kpi-header-subtitle">Số liệu tổng hợp tiền chi, tiền thu và tiền lãi thực tế</p>
              </div>
            </div>
            <div className="kpi-header-actions">
              <button
                type="button"
                className="btn-kpi-harvest-action"
                onClick={() => setIsHarvestModalOpen(true)}
                title="Bấm để ghi nhận nhanh sản lượng vừa hái và tiền bán nông sản"
              >
                <IconSprout size={16} strokeWidth={2.2} />
                <span>+ Ghi nhận thu hoạch</span>
              </button>
            </div>
          </div>

          {/* DASHBOARD TÀI CHÍNH (KPI CARDS - THIẾT KẾ ĐƠN GIẢN, NỀN TRẮNG THANH LỊCH, KHÔNG MÀU MÈ) */}
          <div className="reports-kpi-grid">
            {/* THẺ 1: TỔNG CHI PHÍ ĐẦU TƯ */}
            <div
              className="kpi-card"
              onClick={() => handleOpenCardDetail('EXPENSE')}
              title="Bấm để xem chi tiết các khoản chi phí đầu tư"
            >
              <div className="kpi-top-row">
                <span className="kpi-label">Tổng tiền đã chi</span>
                <div className="kpi-icon-wrap kpi-icon-expense">
                  <IconCircleDollar size={18} strokeWidth={2.2} />
                </div>
              </div>
              <div className="kpi-value text-red">
                {formatMoney(totalExpense)}
              </div>
              <div className="kpi-footer-row">
                <div className="kpi-subtext">
                  <div>Vật tư: <strong>{formatMoney(financials?.totalMaterialCost)}</strong></div>
                  <div>Công: <strong>{formatMoney(financials?.totalLaborCost)}</strong></div>
                </div>
                <button
                  type="button"
                  className="btn-card-detail-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCardDetail('EXPENSE');
                  }}
                  title="Xem chi tiết các khoản tiền đã chi"
                >
                  <span>Chi tiết</span>
                  <IconInfo size={12} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* THẺ 2: TỔNG DOANH THU THU HOẠCH */}
            <div
              className="kpi-card"
              onClick={() => handleOpenCardDetail('REVENUE')}
              title="Bấm để xem chi tiết tiền bán nông sản"
            >
              <div className="kpi-top-row">
                <span className="kpi-label">Tiền bán nông sản</span>
                <div className="kpi-icon-wrap kpi-icon-revenue">
                  <IconLineChart size={18} strokeWidth={2.2} />
                </div>
              </div>
              <div className="kpi-value text-blue">
                {formatMoney(totalRevenue)}
              </div>
              <div className="kpi-footer-row">
                <div className="kpi-subtext">
                  <div>Đã hái: <strong>{(financials?.totalHarvestQty || 0).toLocaleString()} kg</strong></div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Nông sản xuất bán</div>
                </div>
                <button
                  type="button"
                  className="btn-card-detail-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCardDetail('REVENUE');
                  }}
                  title="Xem chi tiết các đợt bán nông sản"
                >
                  <span>Chi tiết</span>
                  <IconInfo size={12} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* THẺ 3: LỢI NHUẬN RÒNG (TIỀN LỜI / LỖ THỰC TẾ) */}
            <div
              className="kpi-card"
              onClick={() => handleOpenCardDetail('PROFIT')}
              title="Bấm để xem công thức tính tiền lời thực tế"
            >
              <div className="kpi-top-row">
                <span className="kpi-label">Tiền lời / lỗ thực tế</span>
                <div className="kpi-icon-wrap kpi-icon-profit">
                  <IconCalculator size={18} strokeWidth={2.2} />
                </div>
              </div>
              <div className={`kpi-value ${netProfit >= 0 ? 'text-green' : 'text-red'}`}>
                {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)}
              </div>
              <div className="kpi-footer-row">
                <div className="kpi-subtext">
                  {netProfit < 0 ? (
                    <span className="badge-kpi-status badge-status-investing">🌱 Đang đầu tư vụ</span>
                  ) : netProfit > 0 ? (
                    <span className="badge-kpi-status badge-status-profit">🌾 Có lãi ({financials?.roiPercentage || 0}%)</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Chưa có thu chi</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-card-detail-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCardDetail('PROFIT');
                  }}
                  title="Xem chi tiết công thức tính tiền lời"
                >
                  <span>Chi tiết</span>
                  <IconInfo size={12} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* THẺ 4: TỔNG LƯỢT GHI NHẬT KÝ */}
            <div
              className="kpi-card"
              onClick={() => handleOpenCardDetail('LOGS')}
              title="Bấm để xem chi tiết các lượt chăm sóc & thu hoạch"
            >
              <div className="kpi-top-row">
                <span className="kpi-label">Số lần ghi nhật ký</span>
                <div className="kpi-icon-wrap kpi-icon-logs">
                  <IconClipboardList size={18} strokeWidth={2.2} />
                </div>
              </div>
              <div className="kpi-value text-slate">
                {logsCount} <small style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>lần</small>
              </div>
              <div className="kpi-footer-row">
                <div className="kpi-subtext">
                  <div>Chăm sóc: <strong>{financials?.careLogsCount || 0}</strong> lần</div>
                  <div>Thu hoạch: <strong>{financials?.harvestLogsCount || 0}</strong> đợt</div>
                </div>
                <button
                  type="button"
                  className="btn-card-detail-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCardDetail('LOGS');
                  }}
                  title="Xem chi tiết các lượt nhật ký"
                >
                  <span>Chi tiết</span>
                  <IconInfo size={12} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>

          {/* PHÂN HỆ KINH TẾ CÂY DÀI NGÀY: VỐN ĐẦU TƯ BAN ĐẦU & THU HỒI VỐN */}
          {capexAnalysis && (
            <div className="capex-report-section">
              <div className="capex-header-row">
                <div>
                  <div className="capex-pill-tag">
                    <IconShield size={14} strokeWidth={2.4} />
                    <span>Dành cho cây trồng lâu năm (Cà phê, Sầu riêng, Bơ...)</span>
                  </div>
                  <h3 className="capex-header-title">
                    <IconCircleDollar size={22} strokeWidth={2.4} style={{ color: 'var(--ms-green, #107C10)' }} />
                    <span>Vốn đầu tư ban đầu & Tiến độ thu hồi vốn</span>
                  </h3>
                  <p className="capex-header-desc">
                    Cây lâu năm cần đầu tư vốn lớn những năm đầu (cây giống, làm đất, hệ thống tưới). Bảng tính giúp chia đều chi phí qua các năm khai thác để tính đúng tiền lãi thực tế của từng vụ mùa.
                  </p>
                </div>
              </div>

              {/* 4 Thẻ chỉ số CapEx: Nền trắng thanh lịch, số liệu to rõ */}
              <div className="capex-cards-grid">
                <div className="capex-stat-card">
                  <div className="capex-stat-label">Tổng vốn đầu tư ban đầu</div>
                  <div className="capex-stat-value text-dark">
                    {formatMoney(capexAnalysis.totalCapEx)}
                  </div>
                  <div className="capex-stat-desc">
                    Giống cây ghép, đào hố, béc tưới ngầm, phân lót 4 năm đầu
                  </div>
                </div>

                <div className="capex-stat-card">
                  <div className="capex-stat-label">Phân bổ vốn / năm</div>
                  <div className="capex-stat-value text-amber">
                    {formatMoney(capexAnalysis.totalAnnualDepreciation)}
                  </div>
                  <div className="capex-stat-desc">
                    Phân bổ đều qua chu kỳ khai thác (15–20 năm)
                  </div>
                </div>

                <div className="capex-stat-card">
                  <div className="capex-stat-label">Lãi thực tế (sau trừ vốn năm)</div>
                  <div className={`capex-stat-value ${capexAnalysis.profitAfterDepreciation >= 0 ? 'text-green' : 'text-red'}`}>
                    {formatMoney(capexAnalysis.profitAfterDepreciation)}
                  </div>
                  <div className="capex-stat-desc">
                    = Lợi nhuận vụ mùa ({formatMoney(capexAnalysis.operatingProfit)}) − Phân bổ vốn năm
                  </div>
                </div>

                <div className="capex-stat-card">
                  <div className="capex-stat-label">Thời gian hoàn vốn dự kiến</div>
                  <div className="capex-stat-value text-blue">
                    {capexAnalysis.payback.years ? `${capexAnalysis.payback.years} năm` : 'Đang thu hồi vốn'}
                  </div>
                  <div className="capex-stat-desc">
                    {capexAnalysis.payback.status}
                  </div>
                </div>
              </div>

              {/* Hướng dẫn cuộn ngang trên mobile */}
              <div className="mobile-table-scroll-hint">
                <span>👉 Vuốt ngang bảng để xem đầy đủ cột</span>
              </div>

              {/* Bảng chi tiết từng lô đất, mã PUC và tiến độ khấu hao */}
              <div className="reports-table-scroll-wrap">
                <table className="capex-plots-table">
                  <thead>
                    <tr>
                      <th>Tên Lô Đất & Diện Tích</th>
                      <th>Cây Trồng & Mã Vùng Trồng (PUC)</th>
                      <th>Vốn Ban Đầu</th>
                      <th>Khấu Hao / Năm</th>
                      <th>Tiến Độ Khấu Hao</th>
                      <th>Giá Trị Còn Lại</th>
                      <th style={{ textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capexAnalysis.plotDetails.map(({ plot, capex }, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{plot.name}</strong>
                          <div className="table-sub-dim">{plot.area} ha ({Math.round(plot.area * 10000)} m²)</div>
                        </td>
                        <td>
                          <span className="crop-type-name">{capex.meta.cropType}</span>
                          <div className="puc-tag-wrap">
                            <span className="puc-code-tag">
                              PUC: {capex.meta.pucCode}
                            </span>
                            <span className="puc-market-tag">({capex.meta.exportMarket?.split(' ')[0] || 'GACC'})</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {formatMoney(capex.initialCost)}
                        </td>
                        <td style={{ color: '#b45309', fontWeight: 600 }}>
                          {formatMoney(capex.annualDepreciation)}/năm
                          <div className="table-sub-dim">({capex.depYears} năm)</div>
                        </td>
                        <td>
                          <div className="dep-progress-box">
                            <div className="dep-progress-bar">
                              <div className="dep-progress-fill" style={{ width: `${capex.depreciationPercent}%` }} />
                            </div>
                            <span className="dep-percent-text">{capex.depreciationPercent}%</span>
                          </div>
                          <div className="table-sub-dim">Năm {capex.yearsActive}/{capex.depYears}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--ms-green, #107C10)' }}>
                          {formatMoney(capex.remainingValue)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-puc-certificate"
                            onClick={() => setSelectedPucPlot(plot)}
                            title="Xem Giấy xác nhận & Kiểm định mã số vùng trồng xuất khẩu"
                          >
                            <span>Hồ sơ PUC</span>
                            <IconExternalLink size={12} strokeWidth={2.2} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CHARTS: ĐƠN GIẢN, TRỰC QUAN CHO NÔNG DÂN */}
          {financials && (financials.totalExpense + financials.totalRevenue > 0) && (
            <div className="reports-charts-grid">
              {/* Biểu đồ 1: So sánh Thu - Chi */}
              <div className="report-chart-card">
                <div className="report-chart-title">
                  <IconLineChart size={18} strokeWidth={2} />
                  <span>So sánh Thu - Chi thực tế</span>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={comparisonData} margin={{ top: 30, right: 20, left: 10, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 13, fill: '#334155', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(val) => {
                        if (val === 0) return '0 đ';
                        if (val >= 1000000) return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)} tr`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)} k`;
                        return `${val} đ`;
                      }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v) => [formatMoney(v), 'Số tiền']}
                      contentStyle={{ borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        content={(props) => {
                          const { x, y, width, value } = props;
                          const num = Number(value || 0);
                          const formatted = num > 0 ? formatMoney(num) : '0 đ';
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 8}
                              fill="#1e293b"
                              textAnchor="middle"
                              fontSize="13"
                              fontWeight="700"
                            >
                              {formatted}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="report-chart-summary">
                  <span>Lợi nhuận ròng: </span>
                  <strong className={netProfit >= 0 ? 'text-green' : 'text-red'}>
                    {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)}
                  </strong>
                  {netProfit < 0 && (
                    <span className="text-muted-sub"> (Đang trong giai đoạn đầu tư mùa vụ)</span>
                  )}
                </div>
              </div>

              {/* Biểu đồ 2: Cơ cấu chi phí */}
              <div className="report-chart-card">
                <div className="report-chart-title">
                  <IconCircleDollar size={18} strokeWidth={2} />
                  <span>Cơ cấu chi phí đã chi</span>
                </div>
                {activeExpensePie.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={activeExpensePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={65}
                          paddingAngle={activeExpensePie.length > 1 ? 3 : 0}
                          dataKey="value"
                        >
                          {activeExpensePie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [formatMoney(v), 'Chi phí']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="report-expense-legend">
                      {expenseBreakdown.map((item) => (
                        <div key={item.name} className="report-legend-row">
                          <div className="report-legend-left">
                            <span className="report-legend-dot" style={{ backgroundColor: item.fill }} />
                            <span>{item.name}</span>
                          </div>
                          <div className="report-legend-right">
                            <strong>{formatMoney(item.value)}</strong>
                            <span className="report-legend-pct">({item.percent}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.9rem' }}>
                    Chưa phát sinh chi phí nào.
                  </div>
                )}
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
                  <YAxis
                    tickFormatter={(v) => {
                      if (v === 0) return '0 đ';
                      if (v >= 1000000) return `${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)} tr`;
                      if (v >= 1000) return `${(v / 1000).toFixed(0)} k`;
                      return `${v} đ`;
                    }}
                  />
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="Chi phí" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Doanh thu" stroke="#107C10" strokeWidth={2} dot={{ r: 4 }} />
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
                Báo cáo chi tiết toàn bộ lượng vật tư tiêu thụ từ thời điểm bắt đầu làm đất, chăm sóc ban đầu đến khi thu hoạch kết vụ.
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
                            className={`material-type-badge ${item.type === 'PHAN_BON'
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

        {/* MODAL GIẤY CHỨNG NHẬN MÃ SỐ VÙNG TRỒNG PUC */}
        <PucCertificateModal
          isOpen={Boolean(selectedPucPlot)}
          onClose={() => setSelectedPucPlot(null)}
          plot={selectedPucPlot}
          farm={selectedFarmObj || farms[0]}
          logs={logs}
        />

        {/* MODAL GIẢI THÍCH CHI TIẾT CÁCH TÍNH TÀI CHÍNH */}
        <FinancialExplanationModal
          isOpen={isExplainModalOpen}
          onClose={() => setIsExplainModalOpen(false)}
          financials={financials}
          logs={filteredLogs || logs}
          initialTab={explainTab}
        />

        {/* MODAL GHI NHẬN THU HOẠCH NHANH */}
        <QuickHarvestModal
          isOpen={isHarvestModalOpen}
          onClose={() => setIsHarvestModalOpen(false)}
          seasons={seasons}
          defaultCropCycleId={selectedSeason || (seasons[0]?.id || '')}
          onSuccess={() => loadData()}
        />
      </main>
      <Footer />
    </div>
  );
}
