import React, { useState, useEffect, useMemo } from 'react';
import './FarmingLogPage.css';
import ReceiptOcrModal from '../../components/modals/ReceiptOcrModal';
import {
  IconClipboardList,
  IconZap,
  IconFileText,
  IconCircleDollar,
  IconLineChart,
  IconCalculator,
  IconFlask,
  IconLeaf,
  IconSprout,
  IconPenLine,
  IconTrash,
  IconCheckCircle,
  IconRotateCw,
  IconCalendar,
  IconMapPin,
  IconClock,
  IconSettings,
} from '../../components/icons';
import ActivityTypesModal from '../../components/modals/ActivityTypesModal';
import {
  apiGetCrops,
  apiGetSeasons,
  apiGetMaterials,
  apiGetActivityLogs,
  apiCreateActivityLog,
  apiUpdateActivityLog,
  apiDeleteActivityLog,
  apiGetFinancialReport,
  apiSeedLamDong,
  apiGetMyFarms,
  apiGetActivityTypes,
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
} from 'recharts';

export default function FarmingLogPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [crops, setCrops] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [logs, setLogs] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [activityTypes, setActivityTypes] = useState([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // Chỉnh sửa nhật ký
  const [editingLogId, setEditingLogId] = useState(null);
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // Form State
  const [form, setForm] = useState({
    cropCycleId: '',
    activityType: 'BON_PHAN',
    activityDate: new Date().toISOString().split('T')[0],
    activityTime: new Date().toTimeString().slice(0, 5), // "08:30"
    workShift: 'SANG', // SANG | CHIEU | TOI
    notes: '',
    // Vật tư
    materialId: '',
    quantityUsed: '',
    materialCost: '',
    // Nhân công
    isHiredLabor: false,
    laborWorkers: 1,
    laborWagePerDay: 350000,
    // Khác
    otherCosts: 0,
    // Thu hoạch
    harvestQuantity: '',
    unitPrice: '',
    revenue: '',
  });

  const COLORS = ['#16a34a', '#0284c7', '#d97706', '#dc2626', '#8b5cf6'];

  // Load tất cả dữ liệu
  const loadData = async (targetFarmId) => {
    try {
      setLoading(true);
      const farmToUse = targetFarmId !== undefined ? targetFarmId : selectedFarmId;
      const [cropsRes, seasonsRes, materialsRes, logsRes, farmsRes, finRes, typesRes] = await Promise.all([
        apiGetCrops().catch(() => []),
        apiGetSeasons(farmToUse).catch(() => []),
        apiGetMaterials().catch(() => []),
        apiGetActivityLogs(undefined, farmToUse).catch(() => []),
        apiGetMyFarms().catch(() => []),
        apiGetFinancialReport().catch(() => null),
        apiGetActivityTypes(farmToUse).catch(() => []),
      ]);

      setCrops(cropsRes || []);
      setSeasons(seasonsRes || []);
      setMaterials(materialsRes || []);
      setLogs(logsRes || []);
      setFarms(farmsRes || []);
      setFinancials(finRes);
      setActivityTypes(typesRes || []);

      if (farmsRes?.length > 0 && !selectedFarmId && targetFarmId === undefined) {
        setSelectedFarmId(farmsRes[0].id);
      }

      if (seasonsRes && seasonsRes.length > 0 && !form.cropCycleId) {
        setForm((prev) => ({ ...prev, cropCycleId: seasonsRes[0].id }));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu nhật ký:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFarmId]);

  // Tự động tính tiền vật tư khi chọn vật tư và nhập số lượng
  const handleMaterialChange = (materialId) => {
    const selected = materials.find((m) => m.id === materialId);
    const qty = Number(form.quantityUsed || 0);
    const cost = selected ? qty * selected.defaultPrice : 0;
    setForm((prev) => ({
      ...prev,
      materialId,
      materialCost: cost > 0 ? cost : '',
    }));
  };

  const handleQtyChange = (qtyStr) => {
    const qty = Number(qtyStr || 0);
    const selected = materials.find((m) => m.id === form.materialId);
    const cost = selected ? qty * selected.defaultPrice : 0;
    setForm((prev) => ({
      ...prev,
      quantityUsed: qtyStr,
      materialCost: cost > 0 ? cost : '',
    }));
  };

  // Tự động tính doanh thu thu hoạch: Sản lượng * Đơn giá
  const handleHarvestChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const qty = Number(field === 'harvestQuantity' ? value : prev.harvestQuantity || 0);
      const price = Number(field === 'unitPrice' ? value : prev.unitPrice || 0);
      updated.revenue = qty > 0 && price > 0 ? qty * price : '';
      return updated;
    });
  };

  // Áp dụng dữ liệu từ quét hóa đơn OCR vào Form
  const handleApplyOcr = (extractedData) => {
    let matchedMatId = '';
    if (extractedData.materialName) {
      const found = materials.find(
        (m) =>
          m.name.toLowerCase().includes(extractedData.materialName.toLowerCase()) ||
          extractedData.materialName.toLowerCase().includes(m.name.toLowerCase())
      );
      if (found) matchedMatId = found.id;
    }

    setForm((prev) => ({
      ...prev,
      activityType: extractedData.activityType || prev.activityType,
      materialId: matchedMatId || prev.materialId,
      quantityUsed: extractedData.quantity || '',
      materialCost: extractedData.totalCost || '',
      isHiredLabor: extractedData.isHiredLabor || false,
      laborWorkers: extractedData.laborWorkers || 1,
      laborWagePerDay: extractedData.laborWagePerDay || 350000,
      otherCosts: extractedData.otherCosts || 0,
      harvestQuantity: extractedData.harvestQuantity || '',
      unitPrice: extractedData.harvestUnitPrice || '',
      revenue:
        extractedData.harvestQuantity && extractedData.harvestUnitPrice
          ? extractedData.harvestQuantity * extractedData.harvestUnitPrice
          : '',
      notes: extractedData.notes
        ? `${extractedData.notes} [Đã trích xuất tự động qua OCR]`
        : prev.notes,
    }));
  };

  // Seed mẫu dữ liệu chuẩn
  const handleSeedLamDong = async () => {
    if (!window.confirm('Khởi tạo danh mục Cây trồng, Mùa vụ, Vật tư và Nhật ký mẫu?')) return;
    try {
      setSeeding(true);
      await apiSeedLamDong();
      alert('Đã khởi tạo thành công Cây trồng & Vật tư mẫu!');
      await loadData();
    } catch (err) {
      alert('Lỗi nạp dữ liệu mẫu: ' + (err.response?.data?.message || err.message));
    } finally {
      setSeeding(false);
    }
  };

  // Bắt đầu sửa nhật ký
  const handleStartEdit = (log) => {
    setEditingLogId(log.id);
    const mat = log.materials?.[0];
    setForm({
      cropCycleId: log.cropCycleId,
      activityType: log.activityType,
      activityDate: log.activityDate ? log.activityDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      activityTime: log.activityTime || '08:30',
      workShift: log.workShift || 'SANG',
      notes: log.notes || '',
      materialId: mat ? mat.materialId : '',
      quantityUsed: mat ? String(mat.quantityUsed) : '',
      materialCost: mat ? String(mat.cost) : '',
      isHiredLabor: Boolean(log.isHiredLabor),
      laborWorkers: log.laborWorkers || 1,
      laborWagePerDay: log.laborWagePerDay || 350000,
      otherCosts: log.otherCosts || 0,
      harvestQuantity: log.harvestQuantity ? String(log.harvestQuantity) : '',
      unitPrice: log.unitPrice ? String(log.unitPrice) : '',
      revenue: log.revenue ? String(log.revenue) : '',
    });
    // Cuộn mượt đến form nhập
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Hủy sửa nhật ký
  const handleCancelEdit = () => {
    setEditingLogId(null);
    setForm((prev) => ({
      ...prev,
      notes: '',
      quantityUsed: '',
      materialCost: '',
      harvestQuantity: '',
      unitPrice: '',
      revenue: '',
    }));
  };

  // Submit nhật ký (Tạo mới hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cropCycleId) {
      alert('Vui lòng chọn mùa vụ canh tác (Lô & Cây trồng)!');
      return;
    }

    try {
      const payload = {
        cropCycleId: form.cropCycleId,
        activityType: form.activityType,
        activityDate: form.activityDate,
        activityTime: form.activityTime || null,
        workShift: form.workShift || 'SANG',
        notes: form.notes,
        isHiredLabor: form.isHiredLabor,
        laborWorkers: form.isHiredLabor ? Number(form.laborWorkers) : 0,
        laborWagePerDay: form.isHiredLabor ? Number(form.laborWagePerDay) : 0,
        otherCosts: Number(form.otherCosts || 0),
      };

      if (form.materialId && Number(form.quantityUsed) > 0) {
        payload.materials = [
          {
            materialId: form.materialId,
            quantityUsed: Number(form.quantityUsed),
            cost: Number(form.materialCost || 0),
          },
        ];
      } else {
        payload.materials = [];
      }

      if (form.activityType === 'THU_HOACH') {
        payload.harvestQuantity = Number(form.harvestQuantity || 0);
        payload.unitPrice = Number(form.unitPrice || 0);
        payload.revenue = Number(form.revenue || 0);
      }

      if (editingLogId) {
        await apiUpdateActivityLog(editingLogId, payload);
        alert('Cập nhật nhật ký canh tác thành công!');
        setEditingLogId(null);
      } else {
        await apiCreateActivityLog(payload);
        alert('Đã ghi nhật ký canh tác & hạch toán thành công!');
      }

      // Reset form
      setForm((prev) => ({
        ...prev,
        notes: '',
        quantityUsed: '',
        materialCost: '',
        harvestQuantity: '',
        unitPrice: '',
        revenue: '',
      }));
      await loadData();
    } catch (err) {
      alert('Lỗi khi lưu nhật ký: ' + (err.response?.data?.message || err.message));
    }
  };

  // Xóa nhật ký
  const handleDeleteLog = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhật ký này? Chi phí sẽ được cập nhật lại.')) {
      await apiDeleteActivityLog(id);
      await loadData();
    }
  };

  // Format tên hoạt động (tìm từ danh mục động trước)
  const formatActivityName = (type) => {
    const custom = activityTypes.find((t) => t.code === type);
    if (custom) return custom.name;
    switch (type) {
      case 'BON_PHAN':
        return 'Bón phân';
      case 'PHUN_THUOC':
        return 'Phun thuốc BVTV';
      case 'CAT_TIA':
        return 'Cắt tỉa cành';
      case 'LAM_CO':
        return 'Làm cỏ / Xới đất';
      case 'TUOI_NUOC':
        return 'Tưới tiêu nước';
      case 'THU_HOACH':
        return 'Thu hoạch nông sản';
      case 'LAM_DAT':
        return 'Làm đất / Xới luống';
      case 'GIEO_TRONG':
        return 'Gieo trồng';
      default:
        return type;
    }
  };

  // Chuẩn bị dữ liệu biểu đồ
  const chartData = useMemo(() => {
    if (!financials) return [];
    return [
      {
        name: 'Tài chính vụ mùa',
        'Chi phí Vật tư': financials.totalMaterialCost || 0,
        'Chi phí Nhân công': financials.totalLaborCost || 0,
        'Chi phí Khác': financials.totalOtherCosts || 0,
        'Doanh thu Thu hoạch': financials.totalRevenue || 0,
      },
    ];
  }, [financials]);

  const pieData = useMemo(() => {
    if (!financials) return [];
    return [
      { name: 'Phân bón & Thuốc BVTV', value: financials.totalMaterialCost || 0 },
      { name: 'Nhân công thuê', value: financials.totalLaborCost || 0 },
      { name: 'Chi phí khác', value: financials.totalOtherCosts || 0 },
    ].filter((item) => item.value > 0);
  }, [financials]);

  const displayedLogs = useMemo(() => {
    return logs.filter((log) => {
      if (shiftFilter !== 'ALL' && log.workShift !== shiftFilter) return false;
      return true;
    });
  }, [logs, shiftFilter]);

  return (
    <div className="farming-log-container">
      {/* HEADER TRANG */}
      <div className="farming-header">
        <div>
          <div className="farming-tag">
            <IconClipboardList size={14} strokeWidth={2.2} />
            <span>SỔ TAY ĐIỆN TỬ NÔNG HỘ</span>
          </div>
          <h2>Nhật Ký Canh Tác & Kinh Tế Nông Nghiệp</h2>
          <p className="farming-subtitle">
            Ghi chép phân bón, thuốc BVTV, nhân công thuê, kiểm soát chi phí đầu tư và lợi nhuận vụ mùa nông nghiệp
          </p>
        </div>
        <div className="farming-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {farms.length > 0 && (
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1.5px solid #10b981',
                background: '#fff',
                fontWeight: '600',
                color: '#065f46',
                cursor: 'pointer',
                fontSize: '0.88rem'
              }}
              title="Chọn Nông hộ của bạn để xem và ghi nhật ký"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  🏡 {f.name}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn-open-ocr"
            onClick={() => setIsOcrOpen(true)}
            title="Chụp hoặc tải ảnh hóa đơn để AI tự điền form"
          >
            <IconFileText size={16} strokeWidth={2} />
            <span>Quét Hóa Đơn (OCR)</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD TÀI CHÍNH (KPI CARDS) */}
      <div className="kpi-grid">
        <div className="kpi-card bg-red-light">
          <div className="kpi-top-row">
            <span className="kpi-label">TỔNG CHI PHÍ ĐẦU TƯ</span>
            <div className="kpi-icon-wrap text-red">
              <IconCircleDollar size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="kpi-value text-red">
            {(financials?.totalExpense || 0).toLocaleString()} <small>đ</small>
          </span>
          <div className="kpi-subtext">
            Phân thuốc: {(financials?.totalMaterialCost || 0).toLocaleString()} đ | Nhân công:{' '}
            {(financials?.totalLaborCost || 0).toLocaleString()} đ
          </div>
        </div>

        <div className="kpi-card bg-blue-light">
          <div className="kpi-top-row">
            <span className="kpi-label">TỔNG DOANH THU THU HOẠCH</span>
            <div className="kpi-icon-wrap text-blue">
              <IconLineChart size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="kpi-value text-blue">
            {(financials?.totalRevenue || 0).toLocaleString()} <small>đ</small>
          </span>
          <div className="kpi-subtext">
            Sản lượng thu hoạch: {(financials?.totalHarvestQty || 0).toLocaleString()} kg
          </div>
        </div>

        <div className="kpi-card bg-green-light">
          <div className="kpi-top-row">
            <span className="kpi-label">LỢI NHUẬN RÒNG (NET PROFIT)</span>
            <div className="kpi-icon-wrap text-green">
              <IconCalculator size={20} strokeWidth={2} />
            </div>
          </div>
          <span
            className={`kpi-value ${(financials?.netProfit || 0) >= 0 ? 'text-green' : 'text-red'
              }`}
          >
            {(financials?.netProfit || 0).toLocaleString()} <small>đ</small>
          </span>
          <div className="kpi-subtext">
            Tỷ suất lợi nhuận (ROI): {financials?.roiPercentage || 0}%
          </div>
        </div>

        <div className="kpi-card bg-purple-light">
          <div className="kpi-top-row">
            <span className="kpi-label">SỐ LƯỢT CANH TÁC</span>
            <div className="kpi-icon-wrap text-purple">
              <IconClipboardList size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="kpi-value text-purple">{financials?.logsCount || 0}</span>
          <div className="kpi-subtext">Nhật ký đã ghi nhận vào hệ thống</div>
        </div>
      </div>

      {/* BIỂU ĐỒ KINH TẾ NÔNG HỘ */}
      {financials && financials.totalExpense + financials.totalRevenue > 0 && (
        <div className="charts-section">
          <div className="chart-card">
            <div className="chart-card-title">
              <IconLineChart size={18} strokeWidth={2} />
              <h4>So Sánh Doanh Thu & Chi Phí (VNĐ)</h4>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} đ`} />
                <Legend />
                <Bar dataKey="Chi phí Vật tư" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Chi phí Nhân công" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Chi phí Khác" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Doanh thu Thu hoạch" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-title">
              <IconCircleDollar size={18} strokeWidth={2} />
              <h4>Cơ Cấu Chi Phí Đầu Tư</h4>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} đ`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* NỘI DUNG CHÍNH: FORM NHẬP & BẢNG NHẬT KÝ */}
      <div className="main-content-grid">
        {/* CỘT TRÁI: FORM GHI NHẬT KÝ */}
        <div className="farming-form-card">
          <div className="form-card-header">
            <div className="form-title-wrap">
              <IconPenLine size={20} strokeWidth={2} />
              <h3>{editingLogId ? 'Chỉnh Sửa Nhật Ký Canh Tác' : 'Ghi Nhật Ký Canh Tác Mới'}</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {editingLogId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy sửa
                </button>
              )}
              <button
                type="button"
                className="btn-quick-ocr"
                onClick={() => setIsOcrOpen(true)}
              >
                <IconZap size={14} strokeWidth={2.4} />
                <span>Quét Hóa Đơn Tự Điền</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="farming-form">
            {/* Lựa chọn Lô & Vụ mùa */}
            <div className="form-group">
              <label>Lô Đất & Mùa Vụ Canh Tác <span className="text-red">*</span></label>
              <select
                value={form.cropCycleId}
                onChange={(e) => setForm({ ...form, cropCycleId: e.target.value })}
                required
                className="form-control"
              >
                <option value="">-- Chọn Mùa Vụ / Lô Trồng --</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.crop?.name} - {s.plot?.name})
                  </option>
                ))}
              </select>
              {seasons.length === 0 && (
                <small className="form-help text-red">
                  Chưa có mùa vụ nào! Vui lòng vào mục "Mùa vụ" trong thanh menu để tạo mùa vụ canh tác thực tế của bạn.
                </small>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Loại Hoạt Động</label>
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(true)}
                  style={{
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <IconSettings size={13} /> Thêm / Sửa loại hoạt động
                </button>
              </div>
              <select
                value={form.activityType}
                onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                className="form-control"
              >
                {activityTypes.length > 0 ? (
                  activityTypes.map((t) => (
                    <option key={t.id || t.code} value={t.code}>
                      {t.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="BON_PHAN">Bón phân (Gốc / Lá)</option>
                    <option value="PHUN_THUOC">Phun thuốc BVTV</option>
                    <option value="CAT_TIA">Cắt tỉa cành / Tạo tán</option>
                    <option value="LAM_CO">Làm cỏ / Xới đất</option>
                    <option value="TUOI_NUOC">Tưới tiêu nước</option>
                    <option value="THU_HOACH">Thu hoạch nông sản</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Ngày Thực Hiện <span className="text-red">*</span></label>
                <input
                  type="date"
                  value={form.activityDate}
                  onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Ca Làm Việc</label>
                <select
                  value={form.workShift}
                  onChange={(e) => setForm({ ...form, workShift: e.target.value })}
                  className="form-control"
                >
                  <option value="SANG">🌅 Ca Sáng (06:00 - 11:30)</option>
                  <option value="CHIEU">☀️ Ca Chiều (13:00 - 17:30)</option>
                  <option value="TOI">🌙 Ca Tối (18:00 - 21:00)</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Giờ Thực Hiện</label>
                <input
                  type="time"
                  value={form.activityTime}
                  onChange={(e) => setForm({ ...form, activityTime: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            {/* MỤC VẬT TƯ (Phân, Thuốc BVTV) */}
            <div className="form-section-box">
              <span className="section-title">
                <IconFlask size={16} strokeWidth={2} />
                <span>Vật Tư Tiêu Hao (Phân bón, Thuốc BVTV)</span>
              </span>
              <div className="form-group">
                <label>Chọn Vật Tư Trong Kho</label>
                <select
                  value={form.materialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="form-control"
                >
                  <option value="">-- Không sử dụng vật tư / Chỉ dùng nhân công --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type === 'PHAN_BON' ? 'Phân bón' : 'Thuốc BVTV'}) -{' '}
                      {m.defaultPrice.toLocaleString()} đ/{m.unit}
                    </option>
                  ))}
                </select>
              </div>

              {form.materialId && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Số lượng dùng</label>
                    <input
                      type="number"
                      step="any"
                      value={form.quantityUsed}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      placeholder="VD: 5"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Thành tiền vật tư (VNĐ)</label>
                    <input
                      type="number"
                      value={form.materialCost}
                      onChange={(e) => setForm({ ...form, materialCost: e.target.value })}
                      className="form-control font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MỤC NHÂN CÔNG: Tự làm hay Thuê ngoài */}
            <div className="form-section-box">
              <div className="section-title-toggle">
                <span className="section-title">
                  <IconCheckCircle size={16} strokeWidth={2} />
                  <span>Chi Phí Lao Động / Nhân Công</span>
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={form.isHiredLabor}
                    onChange={(e) => setForm({ ...form, isHiredLabor: e.target.checked })}
                  />
                  <span>Có thuê nhân công ngoài</span>
                </label>
              </div>

              {form.isHiredLabor ? (
                <div className="form-row">
                  <div className="form-group">
                    <label>Số nhân công thuê</label>
                    <input
                      type="number"
                      min="1"
                      value={form.laborWorkers}
                      onChange={(e) => setForm({ ...form, laborWorkers: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiền công / người / ngày (đ)</label>
                    <input
                      type="number"
                      step="10000"
                      value={form.laborWagePerDay}
                      onChange={(e) => setForm({ ...form, laborWagePerDay: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-sm">
                  Gia đình tự làm (Không phát sinh chi phí tiền mặt thuê ngoài).
                </p>
              )}
            </div>

            {/* DÀNH RIÊNG KHI THU HOẠCH */}
            {form.activityType === 'THU_HOACH' && (
              <div className="form-section-box bg-harvest">
                <span className="section-title">
                  <IconSprout size={16} strokeWidth={2} />
                  <span>Kết Quả Thu Hoạch & Doanh Thu Bán Nông Sản</span>
                </span>
                <div className="form-row">
                  <div className="form-group">
                    <label>Sản lượng thu được (kg)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.harvestQuantity}
                      onChange={(e) => handleHarvestChange('harvestQuantity', e.target.value)}
                      placeholder="VD: 2500"
                      className="form-control font-bold"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Đơn giá bán (VNĐ / kg)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.unitPrice}
                      onChange={(e) => handleHarvestChange('unitPrice', e.target.value)}
                      placeholder="VD: 85000 (sầu riêng)"
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Tổng Doanh Thu Ước Tính (VNĐ)</label>
                  <input
                    type="number"
                    value={form.revenue}
                    onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                    className="form-control text-green font-bold text-lg"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Chi Phí Khác (Nhiên liệu máy nổ, điện nước, vận chuyển...)</label>
              <input
                type="number"
                value={form.otherCosts}
                onChange={(e) => setForm({ ...form, otherCosts: e.target.value })}
                className="form-control"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Ghi Chú Chi Tiết Hiện Trường</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ghi chú thêm về thời tiết, tình trạng sinh trưởng cây trồng..."
                className="form-control"
              />
            </div>

            <button
              type="submit"
              className="btn-submit-log"
              style={editingLogId ? { background: '#0284c7', borderColor: '#0369a1' } : {}}
            >
              <IconCheckCircle size={18} strokeWidth={2.4} />
              <span>{editingLogId ? 'Lưu Thay Đổi Nhật Ký Canh Tác' : 'Lưu Nhật Ký & Hạch Toán Dòng Tiền'}</span>
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: BẢNG DANH SÁCH NHẬT KÝ */}
        <div className="farming-table-card">
          <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div className="table-title-box">
              <IconClipboardList size={20} strokeWidth={2} />
              <h3>Lịch Sử Nhật Ký Canh Tác ({displayedLogs.length})</h3>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Lọc ca:</span>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    background: '#fff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Tất cả các ca</option>
                  <option value="SANG">🌅 Ca Sáng</option>
                  <option value="CHIEU">☀️ Ca Chiều</option>
                  <option value="TOI">🌙 Ca Tối</option>
                </select>
              </div>
              <button className="btn-refresh" onClick={() => loadData()}>
                <IconRotateCw size={14} strokeWidth={2.2} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="farming-table">
              <thead>
                <tr>
                  <th>Ngày & Ca làm</th>
                  <th>Mùa vụ / Cây</th>
                  <th>Hoạt động</th>
                  <th>Vật tư & Nhân công</th>
                  <th>Chi phí</th>
                  <th>Doanh thu</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted">
                      {logs.length === 0
                        ? 'Chưa có nhật ký nào. Hãy nhập thông tin hoặc bấm nút Quét Hóa Đơn (OCR)!'
                        : 'Không có nhật ký nào phù hợp với bộ lọc ca đã chọn.'}
                    </td>
                  </tr>
                ) : (
                  displayedLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-date-cell">
                        <IconCalendar size={13} strokeWidth={2} />
                        <span>{new Date(log.activityDate).toLocaleDateString('vi-VN')}</span>
                        {log.workShift && (
                          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                            {log.workShift === 'SANG' ? '🌅 Ca Sáng' : log.workShift === 'CHIEU' ? '☀️ Ca Chiều' : '🌙 Ca Tối'}
                            {log.activityTime ? ` (${log.activityTime})` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{log.cropCycle?.name}</strong>
                        <div className="subtext-muted">
                          {log.cropCycle?.crop?.name} - {log.cropCycle?.plot?.name}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-activity badge-${log.activityType.toLowerCase()}`}>
                          {formatActivityName(log.activityType)}
                        </span>
                      </td>
                      <td>
                        {log.materials && log.materials.length > 0 ? (
                          log.materials.map((m) => (
                            <div key={m.id} className="item-chip">
                              <IconFlask size={12} strokeWidth={2} />
                              <span>{m.material?.name || m.materialName}: {m.quantityUsed} {m.material?.unit || m.unit}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-xs">Không dùng vật tư</span>
                        )}
                        {log.isHiredLabor && (
                          <div className="labor-chip">
                            <IconCheckCircle size={12} strokeWidth={2} />
                            <span>Thuê {log.laborWorkers} công ({(log.laborCost || 0).toLocaleString()}đ)</span>
                          </div>
                        )}
                      </td>
                      <td className="font-bold text-red">
                        {(log.cost || 0) > 0 ? `${log.cost.toLocaleString()} đ` : '-'}
                      </td>
                      <td className="font-bold text-green">
                        {(log.revenue || 0) > 0 ? (
                          <div>
                            +{log.revenue.toLocaleString()} đ
                            <div className="subtext-muted">({log.harvestQuantity} kg)</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-edit-icon"
                          title="Chỉnh sửa nhật ký này"
                          style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7' }}
                          onClick={() => handleStartEdit(log)}
                        >
                          <IconPenLine size={15} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          className="btn-delete-icon"
                          title="Xóa nhật ký này"
                          onClick={() => handleDeleteLog(log.id)}
                        >
                          <IconTrash size={15} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL SỐ HÓA HÓA ĐƠN OCR */}
      <ReceiptOcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onApplyData={handleApplyOcr}
      />

      {/* MODAL QUẢN LÝ LOẠI HOẠT ĐỘNG */}
      <ActivityTypesModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        farmId={selectedFarmId}
        onTypesChanged={loadData}
      />
    </div>
  );
}
