/**
 * plotMetadata.js
 * Quản lý siêu dữ liệu chuyên sâu cho Lô đất (Plot):
 * 1. Mã số vùng trồng (Planting Unit Code - PUC) phục vụ xuất khẩu chính ngạch & kiểm dịch thực vật.
 * 2. Vốn đầu tư Kiến thiết cơ bản (CapEx) & Khấu hao phân bổ nhiều năm cho cây dài ngày.
 */

export const PLOT_METAS_STORAGE_KEY = 'dalatagri_plot_metas_v1';

// Bộ dữ liệu mẫu thông minh mặc định dựa trên loại cây hoặc tên lô đất
export const DEFAULT_PLOT_PRESETS = {
  // Sầu riêng: Đầu tư ban đầu cao (cây giống ghép, béc tưới ngầm, 4-5 năm kiến thiết)
  durian: {
    pucCode: 'VN-LDO-0082',
    pucIssueDate: '2024-03-15',
    pucStatus: 'ACTIVE',
    exportMarket: 'Trung Quốc (Nghị định thư GACC)',
    cropType: 'Sầu riêng Ri6 ghép',
    initialInvestmentCost: 180000000, // 180 triệu / ha
    plantingYear: 2020,
    depreciationYears: 20, // Chu kỳ khai thác 20 năm
    capexNotes: '150 cây giống Ri6 ghép + đào hố + hệ thống béc tưới ngầm tự động + phân lót hữu cơ vi sinh 4 năm đầu',
  },
  // Cà phê: Đầu tư phổ thông ở Tây Nguyên
  coffee: {
    pucCode: 'VN-LDO-0145',
    pucIssueDate: '2023-11-20',
    pucStatus: 'ACTIVE',
    exportMarket: 'Châu Âu (Chuẩn EUDR - Không phá rừng)',
    cropType: 'Cà phê Robusta cao sản',
    initialInvestmentCost: 95000000, // 95 triệu / ha
    plantingYear: 2019,
    depreciationYears: 15, // Chu kỳ khai thác 15 năm
    capexNotes: '1.100 cây giống cà phê vối + đào hố + ống tưới giếng khoan + phân lót NPK & phân chuồng 3 năm đầu',
  },
  // Mắc ca xen canh:
  macadamia: {
    pucCode: 'VN-LDO-0219',
    pucIssueDate: '2024-01-10',
    pucStatus: 'ACTIVE',
    exportMarket: 'Nhật Bản & Hàn Quốc',
    cropType: 'Mắc-ca ghép OC',
    initialInvestmentCost: 120000000, // 120 triệu / ha
    plantingYear: 2021,
    depreciationYears: 20,
    capexNotes: '250 cây giống mắc-ca ghép + công đào hố lớn + phân lót trùn quế + chăm sóc 4 năm kiến thiết',
  },
  // Bơ sáp 034:
  avocado: {
    pucCode: 'VN-LDO-0308',
    pucIssueDate: '2024-04-05',
    pucStatus: 'ACTIVE',
    exportMarket: 'Nội địa cao cấp & Xuất khẩu tiểu ngạch',
    cropType: 'Bơ 034 sáp dẻo',
    initialInvestmentCost: 75000000, // 75 triệu / ha
    plantingYear: 2022,
    depreciationYears: 15,
    capexNotes: '300 cây giống bơ 034 đầu dòng + hệ thống tưới nhỏ giọt + phân bón lót 3 năm đầu',
  },
  // Tiêu:
  pepper: {
    pucCode: 'VN-LDO-0412',
    pucIssueDate: '2023-08-15',
    pucStatus: 'ACTIVE',
    exportMarket: 'Hoa Kỳ & Trung Đông',
    cropType: 'Tiêu Vĩnh Linh trụ sống',
    initialInvestmentCost: 110000000,
    plantingYear: 2020,
    depreciationYears: 15,
    capexNotes: 'Trụ sống lồng mức + dây tiêu giống Vĩnh Linh + hệ thống tưới phun sương',
  },
  // Mặc định chung cho các loại cây khác:
  general: {
    pucCode: 'VN-LDO-0999',
    pucIssueDate: '2024-01-01',
    pucStatus: 'ACTIVE',
    exportMarket: 'Xuất khẩu chính ngạch',
    cropType: 'Cây lâu năm',
    initialInvestmentCost: 80000000,
    plantingYear: 2021,
    depreciationYears: 15,
    capexNotes: 'Chi phí cây giống lâu năm, làm đất, hệ thống tưới và phân bón lót kiến thiết cơ bản',
  },
};

/**
 * Đoán loại cây từ tên lô đất để gán preset phù hợp
 */
export const guessPlotPreset = (plotName = '') => {
  const lower = (plotName || '').toLowerCase();
  if (lower.includes('sầu') || lower.includes('sau rieng') || lower.includes('durian')) return DEFAULT_PLOT_PRESETS.durian;
  if (lower.includes('cà phê') || lower.includes('ca phe') || lower.includes('coffee') || lower.includes('robusta') || lower.includes('arabica')) return DEFAULT_PLOT_PRESETS.coffee;
  if (lower.includes('mắc') || lower.includes('mac ca') || lower.includes('macadamia')) return DEFAULT_PLOT_PRESETS.macadamia;
  if (lower.includes('bơ') || lower.includes('bo 034') || lower.includes('avocado')) return DEFAULT_PLOT_PRESETS.avocado;
  if (lower.includes('tiêu') || lower.includes('tieu') || lower.includes('pepper')) return DEFAULT_PLOT_PRESETS.pepper;
  return DEFAULT_PLOT_PRESETS.general;
};

/**
 * Lấy toàn bộ metadata lô đất đã lưu
 */
export const getStoredPlotMetas = () => {
  try {
    const raw = localStorage.getItem(PLOT_METAS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/**
 * Lấy metadata của 1 lô đất cụ thể (kết hợp dữ liệu lưu trữ + dữ liệu mặc định thông minh)
 */
export const getPlotMeta = (plot) => {
  if (!plot) return DEFAULT_PLOT_PRESETS.general;
  const stored = getStoredPlotMetas();
  const key = plot.id || plot.name;
  const userMeta = stored[key] || stored[plot.name] || {};

  const preset = guessPlotPreset(plot.name);

  // Ghép nối: ưu tiên giá trị người dùng tùy biến, nếu chưa có thì lấy từ preset mẫu
  return {
    pucCode: userMeta.pucCode !== undefined && userMeta.pucCode !== '' ? userMeta.pucCode : preset.pucCode,
    pucIssueDate: userMeta.pucIssueDate || preset.pucIssueDate,
    pucStatus: userMeta.pucStatus || preset.pucStatus,
    exportMarket: userMeta.exportMarket || preset.exportMarket,
    cropType: userMeta.cropType || preset.cropType,
    initialInvestmentCost: userMeta.initialInvestmentCost !== undefined ? Number(userMeta.initialInvestmentCost) : preset.initialInvestmentCost,
    plantingYear: userMeta.plantingYear !== undefined ? Number(userMeta.plantingYear) : preset.plantingYear,
    depreciationYears: userMeta.depreciationYears !== undefined ? Number(userMeta.depreciationYears) : preset.depreciationYears,
    capexNotes: userMeta.capexNotes !== undefined ? userMeta.capexNotes : preset.capexNotes,
  };
};

/**
 * Lưu metadata cho 1 lô đất
 */
export const savePlotMeta = (plotIdOrName, meta) => {
  if (!plotIdOrName) return;
  try {
    const stored = getStoredPlotMetas();
    stored[plotIdOrName] = { ...(stored[plotIdOrName] || {}), ...meta };
    localStorage.setItem(PLOT_METAS_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.error('Không thể lưu metadata lô đất:', e);
  }
};

/**
 * Tính toán tài chính Khấu hao CapEx cho 1 lô đất
 */
export const calculatePlotCapex = (plot, currentYear = new Date().getFullYear()) => {
  const meta = getPlotMeta(plot);
  const initialCost = Number(meta.initialInvestmentCost || 0);
  const depYears = Math.max(1, Number(meta.depreciationYears || 15));
  const plantYear = Number(meta.plantingYear || currentYear);

  // Mức trích khấu hao hàng năm
  const annualDepreciation = Math.round(initialCost / depYears);

  // Số năm đã vận hành kể từ khi trồng
  const yearsActive = Math.max(0, currentYear - plantYear);

  // Tổng lũy kế khấu hao đến hiện tại
  const accumulatedDepreciation = Math.min(initialCost, yearsActive * annualDepreciation);

  // Giá trị còn lại của vườn cây
  const remainingValue = Math.max(0, initialCost - accumulatedDepreciation);

  // Tỷ lệ khấu hao (%)
  const depreciationPercent = initialCost > 0 ? Math.min(100, Math.round((accumulatedDepreciation / initialCost) * 100)) : 100;

  // Đã khấu hao hết chưa
  const isFullyDepreciated = remainingValue === 0;

  return {
    meta,
    initialCost,
    depYears,
    plantYear,
    currentYear,
    yearsActive,
    annualDepreciation,
    accumulatedDepreciation,
    remainingValue,
    depreciationPercent,
    isFullyDepreciated,
  };
};

/**
 * Tính toán Điểm hòa vốn (Payback Period)
 * @param {number} initialInvestment - Tổng vốn đầu tư ban đầu (VNĐ)
 * @param {number} annualOperatingProfit - Lợi nhuận vận hành thu được hàng năm (Doanh thu - OpEx)
 */
export const calculatePaybackPeriod = (initialInvestment, annualOperatingProfit) => {
  const cost = Number(initialInvestment || 0);
  const profit = Number(annualOperatingProfit || 0);

  if (cost <= 0) return { years: 0, status: 'Đã hoàn vốn', isViable: true };
  if (profit <= 0) return { years: null, status: 'Chưa hòa vốn (Chưa có lãi vận hành)', isViable: false };

  const years = Number((cost / profit).toFixed(1));
  return {
    years,
    status: `Dự kiến ${years} năm hoàn vốn`,
    isViable: true,
  };
};
