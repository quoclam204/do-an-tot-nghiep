import React, { useState, useEffect, useMemo } from 'react';
import './FarmingLogPage.css';
import ReceiptOcrModal from '../../components/modals/ReceiptOcrModal';
import QuickHarvestModal from '../../components/modals/QuickHarvestModal';
import FinancialExplanationModal from '../../components/modals/FinancialExplanationModal';
import CustomTimePicker from '../../components/CustomTimePicker';
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
  IconSun,
  IconMoon,
  IconSunrise,
  IconSettings,
  IconAlertCircle,
  IconInfo,
} from '../../components/icons';
import ActivityTypesModal from '../../components/modals/ActivityTypesModal';
import CostBreakdownModal from '../../components/modals/CostBreakdownModal';
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

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatVnd = (amount) => {
  if (amount === '' || amount === null || amount === undefined || isNaN(amount)) return '';
  return Number(amount).toLocaleString('vi-VN');
};

const extractOtherCostName = (notes) => {
  if (!notes) return { name: '', cleanNotes: '' };
  const match = notes.match(/^\[Chi phí khác:\s*([^\]]+)\]\s*(.*)$/s);
  if (match) {
    return { name: match[1].trim(), cleanNotes: match[2].trim() };
  }
  return { name: '', cleanNotes: notes };
};

const buildNotes = (cleanNotes, otherCostName) => {
  const trimmedName = (otherCostName || '').trim();
  const trimmedNotes = (cleanNotes || '').trim();
  if (trimmedName) {
    return trimmedNotes
      ? `[Chi phí khác: ${trimmedName}] ${trimmedNotes}`
      : `[Chi phí khác: ${trimmedName}]`;
  }
  return trimmedNotes;
};

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
  const [breakdownLog, setBreakdownLog] = useState(null);

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [explainTab, setExplainTab] = useState('ALL');

  const handleOpenCardDetail = (tab = 'ALL') => {
    setExplainTab(tab);
    setIsExplainModalOpen(true);
  };
  const [editingHarvestLog, setEditingHarvestLog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Chỉnh sửa nhật ký
  const [editingLogId, setEditingLogId] = useState(null);
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // Form State (Chỉ phục vụ hoạt động chăm sóc & chi phí canh tác)
  const [form, setForm] = useState({
    cropCycleId: '',
    activityType: 'BON_PHAN',
    activityDate: getTodayDateStr(),
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
    otherCostName: '',
    otherCosts: '',
  });

  const COLORS = ['#16a34a', '#0284c7', '#d97706', '#dc2626', '#8b5cf6'];

  // Load tất cả dữ liệu
  const loadData = async (targetFarmId) => {
    try {
      setLoading(true);
      let farmToUse = targetFarmId !== undefined ? targetFarmId : selectedFarmId;

      let farmsRes = farms;
      if (!farmToUse && (!farmsRes || farmsRes.length === 0)) {
        farmsRes = await apiGetMyFarms().catch(() => []);
        setFarms(farmsRes || []);
        if (farmsRes && farmsRes.length > 0) {
          farmToUse = farmsRes[0].id;
          setSelectedFarmId(farmToUse);
        }
      }

      const [cropsRes, seasonsRes, materialsRes, logsRes, currentFarmsRes, finRes, typesRes] = await Promise.all([
        apiGetCrops().catch(() => []),
        apiGetSeasons(farmToUse).catch(() => []),
        apiGetMaterials().catch(() => []),
        apiGetActivityLogs(undefined, farmToUse).catch(() => []),
        farmsRes && farmsRes.length > 0 ? Promise.resolve(farmsRes) : apiGetMyFarms().catch(() => []),
        apiGetFinancialReport(undefined, farmToUse).catch(() => null),
        apiGetActivityTypes(farmToUse).catch(() => []),
      ]);

      setCrops(cropsRes || []);
      setSeasons(seasonsRes || []);
      setMaterials(materialsRes || []);
      setLogs(logsRes || []);
      if (!farms || farms.length === 0) setFarms(currentFarmsRes || []);
      setFinancials(finRes);
      setActivityTypes(typesRes || []);

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

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === form.materialId),
    [materials, form.materialId]
  );

  // Tự động tính tiền vật tư khi chọn vật tư và nhập số lượng
  const handleMaterialChange = (materialId) => {
    const selected = materials.find((m) => m.id === materialId);
    const qty = Number(form.quantityUsed || 0);
    const cost = selected && qty > 0 ? Math.round(qty * selected.defaultPrice) : 0;
    setForm((prev) => ({
      ...prev,
      materialId,
      materialCost: cost > 0 ? cost : '',
    }));
  };

  const handleQtyChange = (qtyStr) => {
    const qty = Number(qtyStr || 0);
    const selected = materials.find((m) => m.id === form.materialId);
    const cost = selected && qty > 0 ? Math.round(qty * selected.defaultPrice) : 0;
    setForm((prev) => ({
      ...prev,
      quantityUsed: qtyStr,
      materialCost: cost > 0 ? cost : '',
    }));
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
      otherCostName: '',
      otherCosts: extractedData.otherCosts || '',
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

    showToast('Đã trích xuất thông tin hóa đơn vào Form thành công!', 'success');
    // Cuộn mượt xuống Form để nông dân thấy số liệu đã được điền sẵn
    setTimeout(() => {
      const formEl = document.querySelector('.farming-form-card, .farming-form-section, form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

  // Xử lý khi chọn nhanh giờ hiện tại
  const handleTimeNow = (time24, nowObj) => {
    const now = nowObj || new Date();
    const hourNum = now.getHours();
    let autoShift = 'SANG';
    if (hourNum >= 12 && hourNum < 18) {
      autoShift = 'CHIEU';
    } else if (hourNum >= 18 || hourNum < 6) {
      autoShift = 'TOI';
    }
    setForm((prev) => ({
      ...prev,
      activityTime: time24,
      workShift: autoShift,
      activityDate: getTodayDateStr(),
    }));
  };

  // Điền nhanh ngày hôm nay
  const handleSetToday = () => {
    setForm((prev) => ({
      ...prev,
      activityDate: getTodayDateStr(),
    }));
  };

  // Chọn nhanh mốc giờ định sẵn
  const handleSelectPresetTime = (presetTime, shift) => {
    setForm((prev) => ({
      ...prev,
      activityTime: presetTime,
      workShift: shift || prev.workShift,
    }));
  };

  // Bắt đầu sửa nhật ký
  const handleStartEdit = (log) => {
    // Nếu là nhật ký thu hoạch -> Mở Modal Thu Hoạch Nhanh
    if (log.activityType === 'THU_HOACH') {
      setEditingHarvestLog(log);
      setIsHarvestModalOpen(true);
      return;
    }

    setEditingLogId(log.id);
    const mat = log.materials?.[0];
    const { name: parsedCostName, cleanNotes } = extractOtherCostName(log.notes);
    setForm({
      cropCycleId: log.cropCycleId,
      activityType: log.activityType,
      activityDate: log.activityDate ? log.activityDate.slice(0, 10) : getTodayDateStr(),
      activityTime: log.activityTime || '08:30',
      workShift: log.workShift || 'SANG',
      notes: cleanNotes,
      materialId: mat ? mat.materialId : '',
      quantityUsed: mat ? String(mat.quantityUsed) : '',
      materialCost: mat ? String(mat.cost) : '',
      isHiredLabor: Boolean(log.isHiredLabor),
      laborWorkers: log.laborWorkers || 1,
      laborWagePerDay: log.laborWagePerDay || 350000,
      otherCostName: parsedCostName,
      otherCosts: log.otherCosts ? String(log.otherCosts) : '',
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
      otherCostName: '',
      otherCosts: '',
    }));
  };

  // Submit nhật ký (Tạo mới hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cropCycleId) {
      showToast('Vui lòng chọn mùa vụ canh tác (Lô & Cây trồng)!', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const finalNotes = buildNotes(form.notes, form.otherCostName);
      const payload = {
        cropCycleId: form.cropCycleId,
        activityType: form.activityType,
        activityDate: form.activityDate,
        activityTime: form.activityTime || null,
        workShift: form.workShift || 'SANG',
        notes: finalNotes || null,
        isHiredLabor: form.isHiredLabor,
        laborWorkers: form.isHiredLabor ? Number(form.laborWorkers) : 0,
        laborWagePerDay: form.isHiredLabor ? Number(String(form.laborWagePerDay || 0).replace(/\D/g, '')) : 0,
        otherCosts: Number(String(form.otherCosts || 0).replace(/\D/g, '')),
      };

      if (form.materialId && Number(form.quantityUsed) > 0) {
        payload.materials = [
          {
            materialId: form.materialId,
            quantityUsed: Number(form.quantityUsed),
            cost: Number(String(form.materialCost || 0).replace(/\D/g, '')),
          },
        ];
      } else {
        payload.materials = [];
      }

      let savedLog;
      if (editingLogId) {
        savedLog = await apiUpdateActivityLog(editingLogId, payload);
        showToast('Cập nhật nhật ký canh tác thành công!');
        setEditingLogId(null);
        if (savedLog) {
          setLogs((prev) => prev.map((l) => (l.id === editingLogId ? { ...l, ...savedLog } : l)));
        }
      } else {
        savedLog = await apiCreateActivityLog(payload);
        showToast('Đã ghi nhật ký canh tác & hạch toán thành công!');
        if (savedLog) {
          setLogs((prev) => [savedLog, ...prev]);
        }
      }

      // Reset form tức thì để người dùng không phải chờ
      setForm((prev) => ({
        ...prev,
        notes: '',
        quantityUsed: '',
        materialCost: '',
        otherCostName: '',
        otherCosts: '',
      }));

      // Cập nhật ngầm số liệu tài chính & danh sách nhật ký mà không làm chớp/đơ màn hình
      Promise.all([
        apiGetActivityLogs(undefined, selectedFarmId).catch(() => null),
        apiGetFinancialReport(undefined, selectedFarmId).catch(() => null),
      ]).then(([freshLogs, finRes]) => {
        if (freshLogs) setLogs(freshLogs);
        if (finRes) setFinancials(finRes);
      });
    } catch (err) {
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(', ')
        : (err.response?.data?.message || err.message);
      showToast('Lỗi khi lưu nhật ký: ' + msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa nhật ký
  const handleDeleteLog = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhật ký này? Chi phí sẽ được cập nhật lại.')) {
      try {
        setLogs((prev) => prev.filter((l) => l.id !== id));
        showToast('Đã xóa nhật ký thành công!');
        await apiDeleteActivityLog(id);
        const [freshLogs, finRes] = await Promise.all([
          apiGetActivityLogs(undefined, selectedFarmId).catch(() => null),
          apiGetFinancialReport(undefined, selectedFarmId).catch(() => null),
        ]);
        if (freshLogs) setLogs(freshLogs);
        if (finRes) setFinancials(finRes);
      } catch (err) {
        showToast('Lỗi khi xóa: ' + (err.response?.data?.message || err.message), 'error');
        await loadData();
      }
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
      {toast.show && (
        <div className={`farming-toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <IconCheckCircle size={18} strokeWidth={2.4} />
          ) : (
            <IconAlertCircle size={18} strokeWidth={2.4} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

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
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn-open-harvest-header"
            onClick={() => setIsHarvestModalOpen(true)}
            title="Ghi nhận sản lượng và doanh thu thu hoạch nhanh chóng"
          >
            <IconSprout size={16} strokeWidth={2.2} />
            <span>Ghi Thu Hoạch</span>
          </button>
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

      {/* THANH TIÊU ĐỀ KHU VỰC THẺ TÀI CHÍNH */}
      <div className="kpi-header-row">
        <div className="kpi-header-title">
          <IconCalculator size={17} strokeWidth={2.4} />
          <span>TỔNG QUAN HIỆU QUẢ KINH TẾ</span>
        </div>
      </div>

      {/* DASHBOARD TÀI CHÍNH (KPI CARDS) */}
      <div className="kpi-grid">
        {/* THẺ 1: TỔNG CHI PHÍ ĐẦU TƯ */}
        <div className="kpi-card bg-red-light">
          <div
            className="kpi-top-row"
            onClick={() => handleOpenCardDetail('EXPENSE')}
            title="Bấm để xem chi tiết cách tính chi phí đầu tư"
            style={{ cursor: 'pointer' }}
          >
            <span className="kpi-label">TỔNG CHI PHÍ ĐẦU TƯ</span>
            <div className="kpi-top-actions">
              <button
                type="button"
                className="btn-text-breakdown"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCardDetail('EXPENSE');
                }}
                title="Xem chi tiết các khoản chi phí đầu tư"
              >
                <IconInfo size={13} strokeWidth={2.2} />
                <span>Chi tiết</span>
              </button>
              <div className="kpi-icon-wrap text-red">
                <IconCircleDollar size={18} strokeWidth={2} />
              </div>
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

        {/* THẺ 2: TỔNG DOANH THU THU HOẠCH */}
        <div className="kpi-card bg-blue-light kpi-card-harvest-highlight">
          <div
            className="kpi-top-row"
            onClick={() => handleOpenCardDetail('REVENUE')}
            title="Bấm để xem chi tiết cách tính doanh thu thu hoạch"
            style={{ cursor: 'pointer' }}
          >
            <span className="kpi-label">TỔNG DOANH THU THU HOẠCH</span>
            <div className="kpi-top-actions">
              <button
                type="button"
                className="btn-text-breakdown"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCardDetail('REVENUE');
                }}
                title="Xem chi tiết các đợt bán nông sản"
              >
                <IconInfo size={13} strokeWidth={2.2} />
                <span>Chi tiết</span>
              </button>
              <div className="kpi-icon-wrap text-blue">
                <IconLineChart size={18} strokeWidth={2} />
              </div>
            </div>
          </div>
          <span className="kpi-value text-blue">
            {(financials?.totalRevenue || 0).toLocaleString()} <small>đ</small>
          </span>
          <div className="kpi-subtext">
            Sản lượng thu hoạch: {(financials?.totalHarvestQty || 0).toLocaleString()} kg
          </div>
          <button
            type="button"
            className="btn-kpi-harvest-action"
            onClick={() => setIsHarvestModalOpen(true)}
            title="Bấm để mở bảng ghi nhận thu hoạch và tính tiền bán nhanh chóng"
          >
            <IconSprout size={15} strokeWidth={2.2} />
            <span>+ Ghi Nhận Thu Hoạch Ngay</span>
          </button>
        </div>

        {/* THẺ 3: LỢI NHUẬN RÒNG */}
        <div className="kpi-card bg-green-light">
          <div
            className="kpi-top-row"
            onClick={() => handleOpenCardDetail('PROFIT')}
            title="Bấm để xem chi tiết cách tính lợi nhuận ròng và ROI"
            style={{ cursor: 'pointer' }}
          >
            <span className="kpi-label">LỢI NHUẬN RÒNG (NET PROFIT)</span>
            <div className="kpi-top-actions">
              <button
                type="button"
                className="btn-text-breakdown"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCardDetail('PROFIT');
                }}
                title="Xem chi tiết công thức tính tiền lãi thực tế"
              >
                <IconInfo size={13} strokeWidth={2.2} />
                <span>Chi tiết</span>
              </button>
              <div className="kpi-icon-wrap text-green">
                <IconCalculator size={18} strokeWidth={2} />
              </div>
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

        {/* THẺ 4: TỔNG LƯỢT GHI NHẬT KÝ */}
        <div className="kpi-card bg-purple-light">
          <div
            className="kpi-top-row"
            onClick={() => handleOpenCardDetail('LOGS')}
            title="Bấm để xem chi tiết các lượt chăm sóc & thu hoạch"
            style={{ cursor: 'pointer' }}
          >
            <span className="kpi-label">TỔNG LƯỢT GHI NHẬT KÝ</span>
            <div className="kpi-top-actions">
              <button
                type="button"
                className="btn-text-breakdown"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCardDetail('LOGS');
                }}
                title="Xem chi tiết phân loại chăm sóc và thu hoạch"
              >
                <IconInfo size={13} strokeWidth={2.2} />
                <span>Chi tiết</span>
              </button>
              <div className="kpi-icon-wrap text-purple">
                <IconClipboardList size={18} strokeWidth={2} />
              </div>
            </div>
          </div>
          <span className="kpi-value text-purple">{financials?.logsCount ?? logs.length}</span>
          <div className="kpi-subtext">
            Chăm sóc: <strong>{financials?.careLogsCount ?? logs.filter((l) => l.activityType !== 'THU_HOACH').length}</strong> lần | Thu hoạch: <strong>{financials?.harvestLogsCount ?? logs.filter((l) => l.activityType === 'THU_HOACH').length}</strong> đợt
          </div>
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
            {/* Lựa chọn Lô & Vụ mùa và Loại Hoạt Động */}
            <div className="form-row">
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
                  <label style={{ margin: 0 }}>Loại Hoạt Động Chăm Sóc</label>
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(true)}
                    style={{
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      padding: '3px 9px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    + Thêm / Sửa hoạt động
                  </button>
                </div>
                <select
                  value={form.activityType}
                  onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                  className="form-control"
                >
                  {activityTypes.length > 0 ? (
                    activityTypes
                      .filter((t) => (t.code || t.id) !== 'THU_HOACH' && !t.name?.toLowerCase().includes('thu hoạch'))
                      .map((t) => (
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
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ngày Thực Hiện <span className="text-red">*</span></label>
                <div className="date-input-wrap">
                  <input
                    type="date"
                    value={form.activityDate}
                    onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                    className="form-control"
                    required
                  />
                  <button
                    type="button"
                    className={`btn-quick-today ${form.activityDate === getTodayDateStr() ? 'is-today' : ''}`}
                    onClick={handleSetToday}
                    title="Điền nhanh ngày hôm nay"
                  >
                    <IconCalendar size={14} strokeWidth={2.2} />
                    <span>Hôm nay</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Ca Làm Việc</label>
                <select
                  value={form.workShift}
                  onChange={(e) => setForm({ ...form, workShift: e.target.value })}
                  className="form-control"
                >
                  <option value="SANG">Ca Sáng (06:00 - 11:30)</option>
                  <option value="CHIEU">Ca Chiều (13:00 - 17:30)</option>
                  <option value="TOI">Ca Tối (18:00 - 21:00)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Giờ Thực Hiện</label>
                <CustomTimePicker
                  value={form.activityTime}
                  onChange={(time24) => setForm({ ...form, activityTime: time24 })}
                  onNowClick={handleTimeNow}
                />
              </div>

              <div className="form-group">
                <label>Mốc Giờ Phổ Biến</label>
                <div className="preset-time-grid">
                  <button
                    type="button"
                    className="btn-preset-time btn-preset-now"
                    onClick={() => {
                      const now = new Date();
                      const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                      handleTimeNow(t, now);
                    }}
                    title="Lấy giờ hiện tại ngay bây giờ"
                  >
                    <IconClock size={13} strokeWidth={2.2} /> Hiện tại
                  </button>
                  <button
                    type="button"
                    className="btn-preset-time"
                    onClick={() => handleSelectPresetTime('08:00', 'SANG')}
                    title="08:00 - 8h sáng"
                  >
                    <IconSunrise size={13} strokeWidth={2.2} /> 8h sáng
                  </button>
                  <button
                    type="button"
                    className="btn-preset-time"
                    onClick={() => handleSelectPresetTime('09:30', 'SANG')}
                    title="09:30 - 9h30 sáng"
                  >
                    9h30 sáng
                  </button>
                  <button
                    type="button"
                    className="btn-preset-time"
                    onClick={() => handleSelectPresetTime('14:00', 'CHIEU')}
                    title="14:00 - 2h chiều"
                  >
                    <IconSun size={13} strokeWidth={2.2} /> 2h chiều
                  </button>
                  <button
                    type="button"
                    className="btn-preset-time"
                    onClick={() => handleSelectPresetTime('16:30', 'CHIEU')}
                    title="16:30 - 4h30 chiều"
                  >
                    4h30 chiều
                  </button>
                  <button
                    type="button"
                    className="btn-preset-time"
                    onClick={() => handleSelectPresetTime('20:00', 'TOI')}
                    title="20:00 - 20h tối"
                  >
                    <IconMoon size={13} strokeWidth={2.2} /> 20h tối
                  </button>
                </div>
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
                    <div className="currency-input-wrap">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatVnd(form.materialCost)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setForm((prev) => ({
                            ...prev,
                            materialCost: raw ? Number(raw) : '',
                          }));
                        }}
                        placeholder="0"
                        className="form-control font-bold text-green"
                      />
                      <span className="currency-addon">VNĐ</span>
                    </div>
                    {selectedMaterial && Number(form.quantityUsed) > 0 && (
                      <div className="cost-calc-hint">
                        <span>💡 {form.quantityUsed} {selectedMaterial.unit || 'đơn vị'} × {formatVnd(selectedMaterial.defaultPrice)} đ = </span>
                        <strong>{formatVnd(form.materialCost || 0)} VNĐ</strong>
                      </div>
                    )}
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
                    <label>Tiền công / người / ngày (VNĐ)</label>
                    <div className="currency-input-wrap">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatVnd(form.laborWagePerDay)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setForm((prev) => ({
                            ...prev,
                            laborWagePerDay: raw ? Number(raw) : '',
                          }));
                        }}
                        placeholder="0"
                        className="form-control"
                      />
                      <span className="currency-addon">VNĐ</span>
                    </div>
                    {Number(form.laborWorkers) > 0 && Number(form.laborWagePerDay) > 0 && (
                      <div className="cost-calc-hint">
                        <span>💡 {form.laborWorkers} nhân công × {formatVnd(form.laborWagePerDay)} đ = </span>
                        <strong>{formatVnd(Number(form.laborWorkers) * Number(form.laborWagePerDay))} VNĐ/ngày</strong>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-sm">
                  Gia đình tự làm (Không phát sinh chi phí tiền mặt thuê ngoài).
                </p>
              )}
            </div>

            {/* MỤC CHI PHÍ PHÁT SINH KHÁC */}
            <div className="form-section-box">
              <span className="section-title">
                <IconZap size={16} strokeWidth={2} />
                <span>Chi Phí Phát Sinh Khác (Nhiên liệu, điện nước, vận chuyển...)</span>
              </span>
              <div className="form-row">
                <div className="form-group">
                  <label>Tên / Nội Dung Chi Phí</label>
                  <input
                    type="text"
                    value={form.otherCostName}
                    onChange={(e) => setForm({ ...form, otherCostName: e.target.value })}
                    placeholder="VD: Xăng dầu máy nổ, Tiền điện tưới, Vận chuyển..."
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Số Tiền Chi Phí (VNĐ)</label>
                  <div className="currency-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatVnd(form.otherCosts)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setForm((prev) => ({
                          ...prev,
                          otherCosts: raw ? Number(raw) : '',
                        }));
                      }}
                      placeholder="0"
                      className="form-control"
                    />
                    <span className="currency-addon">VNĐ</span>
                  </div>
                  {Number(form.otherCosts) > 0 && (
                    <div className="cost-calc-hint">
                      <span>💡 {form.otherCostName ? `${form.otherCostName}: ` : 'Chi phí khác: '}</span>
                      <strong>{formatVnd(form.otherCosts)} VNĐ</strong>
                    </div>
                  )}
                </div>
              </div>
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
              disabled={submitting}
              style={editingLogId ? { background: '#0284c7', borderColor: '#0369a1' } : {}}
            >
              {submitting ? (
                <>
                  <IconRotateCw size={18} strokeWidth={2.4} className="spin-fast" />
                  <span>{editingLogId ? 'Đang cập nhật nhật ký...' : 'Đang lưu nhật ký & hạch toán...'}</span>
                </>
              ) : (
                <>
                  <IconCheckCircle size={18} strokeWidth={2.4} />
                  <span>{editingLogId ? 'Lưu Thay Đổi Nhật Ký Canh Tác' : 'Lưu Nhật Ký & Hạch Toán Dòng Tiền'}</span>
                </>
              )}
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
                  <option value="SANG">Ca Sáng (06:00 - 11:30)</option>
                  <option value="CHIEU">Ca Chiều (13:00 - 17:30)</option>
                  <option value="TOI">Ca Tối (18:00 - 21:00)</option>
                </select>
              </div>
              <button className="btn-refresh" onClick={() => loadData()}>
                <IconRotateCw size={14} strokeWidth={2.2} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* GIAO DIỆN BẢNG RỘNG DÀNH CHO MÁY TÍNH (DESKTOP) */}
          <div className="table-responsive desktop-table-only">
            <table className="farming-table">
              <thead>
                <tr>
                  <th>Ngày & Ca làm</th>
                  <th>Mùa vụ / Cây</th>
                  <th>Hoạt động</th>
                  <th>Vật tư & Nhân công</th>
                  <th>Tổng chi phí</th>
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
                          <span className={`log-work-shift-tag shift-${log.workShift.toLowerCase()}`}>
                            {log.workShift === 'SANG' && <IconSunrise size={12} strokeWidth={2.4} />}
                            {log.workShift === 'CHIEU' && <IconSun size={12} strokeWidth={2.4} />}
                            {log.workShift === 'TOI' && <IconMoon size={12} strokeWidth={2.4} />}
                            <span>{log.workShift === 'SANG' ? 'Ca Sáng' : log.workShift === 'CHIEU' ? 'Ca Chiều' : 'Ca Tối'}</span>
                            {log.activityTime && <span className="shift-time-val">({log.activityTime})</span>}
                          </span>
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
                        {extractOtherCostName(log.notes).cleanNotes && (
                          <div className="subtext-muted" style={{ marginTop: '4px', maxWidth: '200px' }}>
                            {extractOtherCostName(log.notes).cleanNotes}
                          </div>
                        )}
                      </td>
                      <td>
                        {log.materials && log.materials.length > 0 ? (
                          log.materials.map((m) => (
                            <div key={m.id} className="item-chip">
                              <IconFlask size={12} strokeWidth={2} />
                              <span>
                                {m.material?.name || m.materialName}: {m.quantityUsed} {m.material?.unit || m.unit}
                                {Number(m.cost) > 0 ? ` (${Number(m.cost).toLocaleString('vi-VN')} đ)` : ''}
                              </span>
                            </div>
                          ))
                        ) : (
                          !log.isHiredLabor && !(Number(log.otherCosts) > 0) && <span className="text-muted-xs">Không dùng vật tư</span>
                        )}
                        {log.isHiredLabor && (
                          <div className="labor-chip">
                            <IconCheckCircle size={12} strokeWidth={2} />
                            <span>Thuê {log.laborWorkers} công ({(log.laborCost || 0).toLocaleString()}đ)</span>
                          </div>
                        )}
                        {Number(log.otherCosts) > 0 && (
                          <div className="other-cost-chip">
                            <IconZap size={12} strokeWidth={2} />
                            <span>{extractOtherCostName(log.notes).name || 'Chi phí khác'}: {Number(log.otherCosts).toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="cost-stack-cell">
                          <span className="cost-main-value">
                            {(log.cost || 0) > 0 ? `${log.cost.toLocaleString('vi-VN')} đ` : '-'}
                          </span>
                          {(log.cost || 0) > 0 && (
                            <button
                              type="button"
                              className="btn-text-breakdown"
                              onClick={() => setBreakdownLog(log)}
                              title="Xem bóc tách chi tiết khoản chi phí này"
                            >
                              <IconInfo size={13} strokeWidth={2.2} />
                              <span>Chi tiết</span>
                            </button>
                          )}
                        </div>
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

          {/* GIAO DIỆN DẠNG THẺ CARD TRỰC QUAN CHO ĐIỆN THOẠI (MOBILE) */}
          <div className="mobile-logs-cards-list mobile-cards-only">
            {displayedLogs.length === 0 ? (
              <div className="mobile-empty-logs">
                {logs.length === 0
                  ? 'Chưa có nhật ký nào. Hãy nhập thông tin hoặc bấm nút Quét Hóa Đơn (OCR)!'
                  : 'Không có nhật ký nào phù hợp với bộ lọc ca đã chọn.'}
              </div>
            ) : (
              displayedLogs.map((log) => (
                <div key={log.id} className="mobile-log-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-meta">
                      <span className="mobile-card-date">
                        <IconCalendar size={13} strokeWidth={2} />
                        {new Date(log.activityDate).toLocaleDateString('vi-VN')}
                      </span>
                      {log.workShift && (
                        <span className={`mobile-shift-tag shift-${log.workShift.toLowerCase()}`}>
                          {log.workShift === 'SANG' && <IconSunrise size={12} strokeWidth={2.4} />}
                          {log.workShift === 'CHIEU' && <IconSun size={12} strokeWidth={2.4} />}
                          {log.workShift === 'TOI' && <IconMoon size={12} strokeWidth={2.4} />}
                          <span>{log.workShift === 'SANG' ? 'Ca Sáng' : log.workShift === 'CHIEU' ? 'Ca Chiều' : 'Ca Tối'}</span>
                          {log.activityTime && <span className="shift-time-val">({log.activityTime})</span>}
                        </span>
                      )}
                    </div>
                    <div className="mobile-card-btns">
                      <button
                        type="button"
                        className="btn-mobile-edit"
                        onClick={() => handleStartEdit(log)}
                        title="Sửa nhật ký"
                      >
                        <IconPenLine size={14} strokeWidth={2.2} />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        className="btn-mobile-del"
                        onClick={() => handleDeleteLog(log.id)}
                        title="Xóa nhật ký"
                      >
                        <IconTrash size={14} strokeWidth={2.2} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>

                  <div className="mobile-card-season">
                    <span className="season-title">{log.cropCycle?.name}</span>
                    <span className="season-sub">
                      {log.cropCycle?.crop?.name} • {log.cropCycle?.plot?.name}
                    </span>
                  </div>

                  <div className="mobile-card-activity-row">
                    <span className={`badge-activity badge-${log.activityType.toLowerCase()}`}>
                      {formatActivityName(log.activityType)}
                    </span>
                    {extractOtherCostName(log.notes).cleanNotes && (
                      <span className="mobile-card-note-snippet">{extractOtherCostName(log.notes).cleanNotes}</span>
                    )}
                  </div>

                  {( (log.materials && log.materials.length > 0) || log.isHiredLabor || Number(log.otherCosts) > 0 ) && (
                    <div className="mobile-card-details">
                      {log.materials?.map((m) => (
                        <div key={m.id} className="mobile-pill mat-pill">
                          <IconFlask size={12} strokeWidth={2} />
                          <span>
                            {m.material?.name || m.materialName}: {m.quantityUsed} {m.material?.unit || m.unit}
                            {Number(m.cost) > 0 ? ` (${Number(m.cost).toLocaleString('vi-VN')} đ)` : ''}
                          </span>
                        </div>
                      ))}
                      {log.isHiredLabor && (
                        <div className="mobile-pill labor-pill">
                          <IconCheckCircle size={12} strokeWidth={2} />
                          <span>Thuê {log.laborWorkers} công ({(log.laborCost || 0).toLocaleString()}đ)</span>
                        </div>
                      )}
                      {Number(log.otherCosts) > 0 && (
                        <div className="mobile-pill other-pill">
                          <IconZap size={12} strokeWidth={2} />
                          <span>{extractOtherCostName(log.notes).name || 'Chi phí khác'}: {Number(log.otherCosts).toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mobile-card-finance-bar">
                    <div className="finance-item">
                      <span className="f-label">Tổng chi phí:</span>
                      <div className="cost-mobile-wrap">
                        <span className="cost-main-value">
                          {(log.cost || 0) > 0 ? `${log.cost.toLocaleString('vi-VN')} đ` : '0 đ'}
                        </span>
                        {(log.cost || 0) > 0 && (
                          <button
                            type="button"
                            className="btn-text-breakdown"
                            onClick={() => setBreakdownLog(log)}
                            title="Xem chi tiết"
                          >
                            <IconInfo size={12} strokeWidth={2.2} />
                            <span>Chi tiết</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {(log.revenue || 0) > 0 && (
                      <div className="finance-item">
                        <span className="f-label">Doanh thu ({log.harvestQuantity} kg):</span>
                        <span className="f-rev font-bold text-green">
                          +{log.revenue.toLocaleString()} đ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
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
        selectedActivityCode={form.activityType}
        onSelectActivity={(code, item) => {
          setForm((prev) => ({ ...prev, activityType: code }));
          showToast(`Đã chọn hoạt động: ${item.name}`);
        }}
      />

      {/* MODAL BÓC TÁCH CHI TIẾT CHI PHÍ */}
      <CostBreakdownModal
        isOpen={Boolean(breakdownLog)}
        onClose={() => setBreakdownLog(null)}
        log={breakdownLog}
        formatActivityName={formatActivityName}
      />

      {/* MODAL GHI NHẬN THU HOẠCH NHANH */}
      <QuickHarvestModal
        isOpen={isHarvestModalOpen}
        onClose={() => {
          setIsHarvestModalOpen(false);
          setEditingHarvestLog(null);
        }}
        seasons={seasons}
        defaultCropCycleId={form.cropCycleId || (seasons[0]?.id || '')}
        editingLog={editingHarvestLog}
        onSuccess={({ message, type }) => {
          showToast(message, type || 'success');
          // Tự động tải lại nhật ký và chỉ số tài chính mới nhất
          Promise.all([
            apiGetActivityLogs(undefined, selectedFarmId).catch(() => null),
            apiGetFinancialReport(undefined, selectedFarmId).catch(() => null),
          ]).then(([freshLogs, finRes]) => {
            if (freshLogs) setLogs(freshLogs);
            if (finRes) setFinancials(finRes);
          });
        }}
      />

      {/* MODAL GIẢI THÍCH CHI TIẾT CÁCH TÍNH TÀI CHÍNH */}
      <FinancialExplanationModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        financials={financials}
        logs={logs}
        initialTab={explainTab}
      />
    </div>
  );
}
