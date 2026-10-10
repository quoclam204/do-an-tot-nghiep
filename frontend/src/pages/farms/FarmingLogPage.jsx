import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconWarehouse,
  IconClock,
  IconSun,
  IconMoon,
  IconSunrise,
  IconSettings,
  IconAlertCircle,
  IconInfo,
  IconX,
  IconShield,
} from '../../components/icons';
import ActivityTypesModal from '../../components/modals/ActivityTypesModal';
import CostBreakdownModal from '../../components/modals/CostBreakdownModal';
import {
  apiGetCrops,
  apiGetSeasons,
  apiGetMaterials,
  apiGetInventory,
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
  LabelList,
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
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [crops, setCrops] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [inventory, setInventory] = useState([]);
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


  // Load tất cả dữ liệu
  const loadData = async (targetFarmId) => {
    try {
      setLoading(true);
      const farmToUse = targetFarmId !== undefined ? targetFarmId : selectedFarmId;

      let farmsRes = farms;
      if (!farmsRes || farmsRes.length === 0) {
        farmsRes = await apiGetMyFarms().catch(() => []);
        setFarms(farmsRes || []);
      }

      const [cropsRes, seasonsRes, materialsRes, logsRes, currentFarmsRes, finRes, typesRes, invRes] = await Promise.all([
        apiGetCrops().catch(() => []),
        apiGetSeasons(farmToUse || undefined).catch(() => []),
        apiGetMaterials().catch(() => []),
        apiGetActivityLogs(undefined, farmToUse || undefined).catch(() => []),
        farmsRes && farmsRes.length > 0 ? Promise.resolve(farmsRes) : apiGetMyFarms().catch(() => []),
        apiGetFinancialReport(undefined, farmToUse || undefined).catch(() => null),
        apiGetActivityTypes(farmToUse || undefined).catch(() => []),
        farmToUse ? apiGetInventory(farmToUse).catch(() => []) : apiGetInventory().catch(() => []),
      ]);

      setCrops(cropsRes || []);
      setSeasons(seasonsRes || []);
      setMaterials(materialsRes || []);
      setLogs(logsRes || []);
      if (!farms || farms.length === 0) setFarms(currentFarmsRes || []);
      setFinancials(finRes);
      setActivityTypes(typesRes || []);
      setInventory(invRes || []);

      if (seasonsRes && seasonsRes.length > 0) {
        setForm((prev) => {
          const exists = seasonsRes.some((s) => s.id === prev.cropCycleId);
          const firstSeason = exists ? seasonsRes.find((s) => s.id === prev.cropCycleId) : seasonsRes[0];
          return {
            ...prev,
            cropCycleId: firstSeason?.id || '',
          };
        });
      } else {
        setForm((prev) => ({ ...prev, cropCycleId: '' }));
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

  const seasonOptions = useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    return seasons.map((s) => {
      const farmName =
        s.plot?.farm?.name ||
        farms.find((f) => f.id === s.plot?.farmId)?.name ||
        farms.find((f) => f.id === selectedFarmId)?.name ||
        '';
      const plotName = s.plot?.name || 'Chưa gán lô';
      const cropName = s.crop?.name || '';
      return {
        value: s.id,
        label: s.name,
        seasonName: s.name,
        farmName,
        plotName,
        cropName,
        sub: farmName ? `Trại: ${farmName} · Lô: ${plotName}` : `Lô: ${plotName}`,
        fullLabel: s.name,
      };
    });
  }, [seasons, farms, selectedFarmId]);

  const currentSeason = useMemo(() => {
    return (seasons || []).find((s) => s.id === form.cropCycleId);
  }, [seasons, form.cropCycleId]);

  const activeFarmId = selectedFarmId || currentSeason?.plot?.farmId || currentSeason?.plot?.farm?.id || '';

  const currentFarm = useMemo(() => {
    if (selectedFarmId) {
      return (farms || []).find((f) => f.id === selectedFarmId) || null;
    }
    if (currentSeason?.plot?.farm) return currentSeason.plot.farm;
    if (currentSeason?.plot?.farmId) {
      return (farms || []).find((f) => f.id === currentSeason.plot.farmId) || null;
    }
    return null;
  }, [selectedFarmId, currentSeason, farms]);

  const farmInventory = useMemo(() => {
    if (!activeFarmId) return inventory || [];
    return (inventory || []).filter((inv) => inv.farmId === activeFarmId);
  }, [inventory, activeFarmId]);

  const selectedInventoryItem = useMemo(
    () => (farmInventory || []).find((inv) => inv.materialId === form.materialId),
    [farmInventory, form.materialId]
  );

  const selectedMaterial = useMemo(() => {
    if (selectedInventoryItem?.material) return selectedInventoryItem.material;
    return (materials || []).find((m) => m.id === form.materialId);
  }, [selectedInventoryItem, materials, form.materialId]);

  // Xử lý khi chọn Mùa Vụ trong Form: Tự động reset vật tư
  const handleCropCycleChange = (cycleId) => {
    setForm((prev) => ({
      ...prev,
      cropCycleId: cycleId,
      materialId: '',
      quantityUsed: '',
      materialCost: '',
    }));
  };

  // Tự động tính tiền vật tư khi chọn vật tư và nhập số lượng (ưu tiên đơn giá thực tế trong kho của nông hộ)
  const handleMaterialChange = (materialId) => {
    const invItem = (farmInventory || []).find((inv) => inv.materialId === materialId);
    const selected = invItem?.material || (materials || []).find((m) => m.id === materialId);
    const unitPrice = invItem?.unitPrice ?? selected?.defaultPrice ?? 0;
    const qty = Number(form.quantityUsed || 0);
    const cost = selected && qty > 0 ? Math.round(qty * unitPrice) : 0;
    setForm((prev) => ({
      ...prev,
      materialId,
      materialCost: cost > 0 ? cost : '',
    }));
  };

  const handleQtyChange = (qtyStr) => {
    const qty = Number(qtyStr || 0);
    const invItem = (farmInventory || []).find((inv) => inv.materialId === form.materialId);
    const selected = invItem?.material || (materials || []).find((m) => m.id === form.materialId);
    const unitPrice = invItem?.unitPrice ?? selected?.defaultPrice ?? 0;
    const cost = selected && qty > 0 ? Math.round(qty * unitPrice) : 0;
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
      const foundInv = inventory.find(
        (inv) =>
          inv.material?.name?.toLowerCase().includes(extractedData.materialName.toLowerCase()) ||
          extractedData.materialName.toLowerCase().includes(inv.material?.name?.toLowerCase())
      );
      if (foundInv) {
        matchedMatId = foundInv.materialId;
      } else {
        const found = materials.find(
          (m) =>
            m.name.toLowerCase().includes(extractedData.materialName.toLowerCase()) ||
            extractedData.materialName.toLowerCase().includes(m.name.toLowerCase())
        );
        if (found) matchedMatId = found.id;
      }
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
        const invItem = (farmInventory || []).find((inv) => inv.materialId === form.materialId);
        if (!invItem || Number(invItem.quantity || 0) <= 0) {
          showToast(
            'Vật tư này chưa được nhập vào kho của nông trại này hoặc đã hết hàng. Vui lòng nhập kho tại trang Quản lý tồn kho trước!',
            'error'
          );
          setSubmitting(false);
          return;
        }
        if (!editingLogId && invItem && Number(form.quantityUsed) > Number(invItem.quantity)) {
          showToast(
            `Số lượng sử dụng (${form.quantityUsed}) vượt quá tồn kho hiện có của nông trại (${invItem.quantity})!`,
            'error'
          );
          setSubmitting(false);
          return;
        }

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

      // Cập nhật ngầm số liệu tài chính, nhật ký & tồn kho mà không làm chớp/đơ màn hình
      Promise.all([
        apiGetActivityLogs(undefined, selectedFarmId || undefined).catch(() => null),
        apiGetFinancialReport(undefined, selectedFarmId || undefined).catch(() => null),
        apiGetInventory(selectedFarmId || undefined).catch(() => null),
      ]).then(([freshLogs, finRes, freshInv]) => {
        if (freshLogs) setLogs(freshLogs);
        if (finRes) setFinancials(finRes);
        if (freshInv) setInventory(freshInv);
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
        const [freshLogs, finRes, freshInv] = await Promise.all([
          apiGetActivityLogs(undefined, selectedFarmId || undefined).catch(() => null),
          apiGetFinancialReport(undefined, selectedFarmId || undefined).catch(() => null),
          apiGetInventory(selectedFarmId || undefined).catch(() => null),
        ]);
        if (freshLogs) setLogs(freshLogs);
        if (finRes) setFinancials(finRes);
        if (freshInv) setInventory(freshInv);
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
    return expenseBreakdown.filter((item) => item.value > 0);
  }, [expenseBreakdown]);

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
            <IconCheckCircle size={22} strokeWidth={2.4} />
          ) : (
            <IconAlertCircle size={22} strokeWidth={2.4} />
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
              <option value="">-- Tất cả nông trại ({farms.length}) --</option>
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

      {/* BANNER NGHIỆP VỤ CÂY DÀI NGÀY: KHẤU HAO KIẾN THIẾT CƠ BẢN (CAPEX) */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '10px',
        padding: '10px 16px',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#166534' }}>
          <span style={{ background: '#dcfce7', padding: '4px 6px', borderRadius: '4px', display: 'flex', color: '#059669' }}>
            <IconShield size={18} strokeWidth={2.4} />
          </span>
          <span>
            <strong>Đặc thù kinh tế cây dài ngày:</strong> Số liệu trên là chi phí vận hành mùa vụ (OpEx). Để tính đúng điểm hòa vốn thực tế, hãy xem <strong>Khấu hao kiến thiết cơ bản (CapEx)</strong>.
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleOpenCardDetail('CAPEX')}
          style={{
            background: '#059669',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          title="Bấm để mở giải trình chi tiết về khấu hao vốn đầu tư 3-5 năm đầu"
        >
          Giải trình Khấu hao CapEx ↗
        </button>
      </div>

      {/* BIỂU ĐỒ KINH TẾ NÔNG HỘ: ĐƠN GIẢN, TRỰC QUAN */}
      {financials && financials.totalExpense + financials.totalRevenue > 0 && (
        <div className="charts-section">
          {/* Biểu đồ 1: So sánh Thu - Chi */}
          <div className="chart-card">
            <div className="chart-card-title">
              <IconLineChart size={18} strokeWidth={2} />
              <h4>So Sánh Thu - Chi Thực Tế</h4>
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
                  formatter={(value) => [`${Number(value).toLocaleString()} đ`, 'Số tiền']}
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
                      const formatted = num > 0 ? `${num.toLocaleString('vi-VN')} đ` : '0 đ';
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
            <div className="chart-summary-line">
              <span>Lợi nhuận vụ mùa: </span>
              <strong className={(financials.netProfit || 0) >= 0 ? 'text-green' : 'text-red'}>
                {(financials.netProfit || 0) >= 0 ? '+' : ''}{(financials.netProfit || 0).toLocaleString()} đ
              </strong>
              {(financials.netProfit || 0) < 0 && (
                <span className="text-muted-sub"> (Đang trong giai đoạn đầu tư vụ mùa)</span>
              )}
            </div>
          </div>

          {/* Biểu đồ 2: Cơ cấu chi phí */}
          <div className="chart-card">
            <div className="chart-card-title">
              <IconCircleDollar size={18} strokeWidth={2} />
              <h4>Cơ Cấu Chi Phí Đã Chi</h4>
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
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} đ`, 'Chi phí']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="expense-legend-list">
                  {expenseBreakdown.map((item) => (
                    <div key={item.name} className="expense-legend-item">
                      <div className="legend-left">
                        <span className="legend-bullet" style={{ backgroundColor: item.fill }} />
                        <span className="legend-name">{item.name}</span>
                      </div>
                      <div className="legend-right">
                        <strong>{Number(item.value).toLocaleString()} đ</strong>
                        <span className="legend-pct">({item.percent}%)</span>
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

          {/* Dòng thông tin nông trại đang ghi chép: Đơn giản, rõ ràng, chuẩn màu xanh DalatAgri */}
          <div className="current-farm-bar">
            <IconWarehouse size={16} strokeWidth={2} />
            <span>Nông trại ghi chép: <strong>{currentFarm?.name || 'Tất cả nông trại'}</strong></span>
            {currentFarm?.address && (
              <span className="farm-bar-address">({currentFarm.address})</span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="farming-form">
            {/* Hàng 1: Lô Đất & Mùa Vụ Canh Tác + Loại Hoạt Động Chăm Sóc */}
            <div className="form-row">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>Lô Đất & Mùa Vụ Canh Tác <span className="text-red">*</span></label>
                  {(!seasonOptions || seasonOptions.length === 0) && (
                    <button
                      type="button"
                      onClick={() => navigate(selectedFarmId ? `/seasons?farmId=${selectedFarmId}` : '/seasons')}
                      style={{
                        background: '#ffffff',
                        color: '#15803d',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '3px 9px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      title="Chuyển đến trang Mùa vụ để tạo mùa vụ mới"
                    >
                      + Tạo mùa vụ mới &rarr;
                    </button>
                  )}
                </div>
                <select
                  value={form.cropCycleId}
                  onChange={(e) => handleCropCycleChange(e.target.value)}
                  className="form-control"
                  disabled={!seasonOptions || seasonOptions.length === 0}
                >
                  {seasonOptions && seasonOptions.length > 0 ? (
                    seasonOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label} {s.farmName ? `— [${s.farmName}]` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="">-- Chưa có mùa vụ nào --</option>
                  )}
                </select>
                {currentSeason && currentFarm && (
                  <small style={{ color: 'var(--ms-gray-600, #5a5a5a)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', fontSize: '0.82rem' }}>
                    <IconWarehouse size={13} style={{ color: 'var(--ms-green, #107C10)' }} />
                    <span>Nông trại: <strong style={{ color: 'var(--ms-green-dark, #0a5e0a)' }}>{currentFarm.name}</strong></span>
                    {currentSeason.plot?.name && (
                      <span> · Lô đất: <strong style={{ color: 'var(--ms-gray-800, #2a2a2a)' }}>{currentSeason.plot.name}</strong></span>
                    )}
                  </small>
                )}
                {(!seasonOptions || seasonOptions.length === 0) && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '5px', fontSize: '0.84rem' }}>
                    Chưa có mùa vụ nào cho nông trại này.
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

            {/* Hàng 2: Ngày Thực Hiện & Ca Làm Việc */}
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

            {/* Hàng 3: Giờ Thực Hiện & Mốc Giờ Phổ Biến */}
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
                <label style={{ fontSize: '0.78rem', color: '#64748b' }}>Mốc Giờ Phổ Biến</label>
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
                  {farmInventory.map((inv) => {
                    const m = inv.material || {};
                    const isOutOfStock = Number(inv.quantity || 0) <= 0;
                    return (
                      <option key={inv.materialId} value={inv.materialId} disabled={isOutOfStock}>
                        {m.name || 'Vật tư'}{isOutOfStock ? ' [Hết hàng]' : ` (Còn: ${inv.quantity} ${m.unit || 'đv'} - ${Number(inv.unitPrice || m.defaultPrice || 0).toLocaleString('vi-VN')} đ)`}
                      </option>
                    );
                  })}
                  {form.materialId && selectedMaterial && !farmInventory.some((inv) => inv.materialId === form.materialId) && (
                    <option value={form.materialId}>
                      {selectedMaterial.name} (Đã dùng trong nhật ký này)
                    </option>
                  )}
                </select>
                {activeFarmId && farmInventory.length === 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.8rem', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>⚠️ Kho của nông trại này hiện chưa có vật tư nào.</span>
                    <a href="/inventory" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>+ Nhập kho ngay</a>
                  </div>
                )}
              </div>

              {form.materialId && (
                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Số lượng dùng ({selectedMaterial?.unit || 'đơn vị'})</label>
                      {selectedInventoryItem ? (
                        <span style={{ fontSize: '0.8rem', color: selectedInventoryItem.quantity > 0 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                          Tồn kho nông trại: {selectedInventoryItem.quantity} {selectedMaterial?.unit || ''}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>
                          Chưa nhập kho nông trại này (Tồn: 0)
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.quantityUsed}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      placeholder="VD: 1"
                      className="form-control"
                      required
                    />
                    {selectedInventoryItem && Number(form.quantityUsed) > Number(selectedInventoryItem.quantity) && (
                      <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconAlertCircle size={14} /> Vượt quá số lượng tồn kho ({selectedInventoryItem.quantity})!
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Thành tiền vật tư (VNĐ)</label>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Tự động tính</span>
                    </div>
                    <div className="currency-input-wrap">
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={formatVnd(form.materialCost)}
                        placeholder="0"
                        className="form-control font-bold text-green"
                        style={{
                          backgroundColor: '#f8fafc',
                          cursor: 'not-allowed',
                          color: '#059669',
                          borderColor: '#e2e8f0',
                          userSelect: 'none',
                        }}
                      />
                      <span className="currency-addon">VNĐ</span>
                    </div>
                    {selectedMaterial && Number(form.quantityUsed) > 0 && (
                      <div className="cost-calc-hint">
                        <span>💡 {form.quantityUsed} {selectedMaterial.unit || 'đơn vị'} × {formatVnd(selectedInventoryItem?.unitPrice ?? selectedMaterial.defaultPrice ?? 0)} đ = </span>
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
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="cost-stack-cell">
                          <span className="cost-main-value" style={{ whiteSpace: 'nowrap' }}>
                            {(log.cost || 0) > 0 ? `${Number(log.cost).toLocaleString('vi-VN')}\u00A0đ` : '-'}
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
                      <td className="font-bold text-green" style={{ whiteSpace: 'nowrap' }}>
                        {(log.revenue || 0) > 0 ? (
                          <div style={{ whiteSpace: 'nowrap' }}>
                            <span style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                              +{Number(log.revenue).toLocaleString('vi-VN')}&nbsp;đ
                            </span>
                            <div className="subtext-muted" style={{ whiteSpace: 'nowrap' }}>
                              ({log.harvestQuantity}&nbsp;kg)
                            </div>
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

                  {((log.materials && log.materials.length > 0) || log.isHiredLabor || Number(log.otherCosts) > 0) && (
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
                        <span className="f-label">Doanh thu ({log.harvestQuantity}&nbsp;kg):</span>
                        <span className="f-rev font-bold text-green" style={{ whiteSpace: 'nowrap' }}>
                          +{Number(log.revenue).toLocaleString('vi-VN')}&nbsp;đ
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
