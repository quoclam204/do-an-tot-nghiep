import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://192.168.155.147:3000';
export const PROD_API_URL = 'https://dalatagri-backend.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Tự động gắn Token vào header mỗi khi gọi API
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('Lỗi đọc token từ bộ nhớ:', e);
  }
  return config;
});

// ── 1. Auth & Users APIs ──────────────────────────────────────────
export const apiLogin = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const apiRegister = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const apiForgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const apiResetPassword = async (token, newPassword) => {
  const res = await api.post('/auth/reset-password', { token, newPassword });
  return res.data;
};

export const apiGetMe = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const apiUpdateMe = async (data) => {
  const res = await api.patch('/users/me', data);
  return res.data;
};

export const apiGetAllUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

export const apiUpdateUserRole = async (userId, role) => {
  const res = await api.patch(`/users/${userId}/role`, { role });
  return res.data;
};

export const apiToggleUserActive = async (userId) => {
  const res = await api.patch(`/users/${userId}/toggle-active`);
  return res.data;
};

export const apiDeleteUser = async (userId) => {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
};

export const apiGetPendingUsers = async () => {
  const res = await api.get('/users/pending-approvals');
  return res.data;
};

export const apiApproveUser = async (userId) => {
  const res = await api.patch(`/users/${userId}/approve`);
  return res.data;
};

export const apiRejectUser = async (userId, reason) => {
  const res = await api.patch(`/users/${userId}/reject`, { reason });
  return res.data;
};

export const apiGetStatistics = async () => {
  const res = await api.get('/users/statistics');
  return res.data;
};

export const apiAdminResetPassword = async (userId, newPassword) => {
  const res = await api.post(`/users/${userId}/reset-password`, { newPassword });
  return res.data;
};

export const apiGetDeletedUsers = async () => {
  const res = await api.get('/users/deleted');
  return res.data;
};

export const apiRestoreUser = async (userId) => {
  const res = await api.patch(`/users/${userId}/restore`);
  return res.data;
};


// ── 2. Nông trại & Thửa đất (Farms & Plots & Members) ───────────────
export const apiGetMyFarms = async () => {
  const res = await api.get('/farms');
  return res.data;
};

export const apiCreateFarm = async (data) => {
  const res = await api.post('/farms', data);
  return res.data;
};

export const apiGetFarm = async (id) => {
  const res = await api.get(`/farms/${id}`);
  return res.data;
};

export const apiUpdateFarm = async (id, data) => {
  const res = await api.patch(`/farms/${id}`, data);
  return res.data;
};

export const apiDeleteFarm = async (id) => {
  const res = await api.delete(`/farms/${id}`);
  return res.data;
};

export const apiGetPlots = async (farmId) => {
  if (!farmId) {
    const farms = await apiGetMyFarms();
    if (farms && farms.length > 0) {
      farmId = farms[0].id;
    } else {
      return [];
    }
  }
  const res = await api.get(`/farms/${farmId}/plots`);
  return res.data;
};

export const apiCreatePlot = async (farmId, data) => {
  const res = await api.post(`/farms/${farmId}/plots`, data);
  return res.data;
};

export const apiUpdatePlot = async (farmId, plotId, data) => {
  const res = await api.patch(`/farms/${farmId}/plots/${plotId}`, data);
  return res.data;
};

export const apiDeletePlot = async (farmId, plotId) => {
  const res = await api.delete(`/farms/${farmId}/plots/${plotId}`);
  return res.data;
};

export const apiGetFarmMembers = async (farmId) => {
  const res = await api.get(`/farms/${farmId}/members`);
  return res.data;
};

export const apiAddFarmMember = async (farmId, data) => {
  const res = await api.post(`/farms/${farmId}/members`, data);
  return res.data;
};

export const apiRemoveFarmMember = async (farmId, memberId) => {
  const res = await api.delete(`/farms/${farmId}/members/${memberId}`);
  return res.data;
};

// ── 3. Cây trồng (Crops) ──────────────────────────────────────────
export const apiGetCrops = async () => {
  const res = await api.get('/catalog/crops');
  return res.data;
};

export const apiCreateCrop = async (data) => {
  const res = await api.post('/catalog/crops', data);
  return res.data;
};

export const apiUpdateCrop = async (id, data) => {
  const res = await api.patch(`/catalog/crops/${id}`, data);
  return res.data;
};

export const apiDeleteCrop = async (id) => {
  const res = await api.delete(`/catalog/crops/${id}`);
  return res.data;
};

export const apiSeedLamDong = async () => {
  const res = await api.post('/catalog/seed-lamdong');
  return res.data;
};

// ── 4. Mùa vụ (Seasons) ───────────────────────────────────────────
export const apiGetSeasons = async (farmId) => {
  const res = await api.get('/catalog/seasons', { params: farmId ? { farmId } : {} });
  return res.data;
};

export const apiCreateSeason = async (data) => {
  const res = await api.post('/catalog/seasons', data);
  return res.data;
};

export const apiUpdateSeason = async (id, data) => {
  const res = await api.patch(`/catalog/seasons/${id}`, data);
  return res.data;
};

export const apiDeleteSeason = async (id) => {
  const res = await api.delete(`/catalog/seasons/${id}`);
  return res.data;
};

export const apiGetSeasonFinancialSummary = async (seasonId) => {
  const res = await api.get(`/catalog/seasons/${seasonId}/financial-summary`);
  return res.data;
};

export const apiGetSeasonMaterialConsumption = async (seasonId) => {
  const res = await api.get(`/catalog/seasons/${seasonId}/material-consumption`);
  return res.data;
};

// ── 5. Nhật ký canh tác (Activity Logs) ───────────────────────────
export const apiGetLogs = async (cropCycleId, farmId) => {
  const params = {};
  if (cropCycleId) params.cropCycleId = cropCycleId;
  if (farmId) params.farmId = farmId;
  const res = await api.get('/catalog/activity-logs', { params });
  return res.data;
};

export const apiCreateLog = async (data) => {
  const res = await api.post('/catalog/activity-logs', data);
  return res.data;
};

export const apiUpdateLog = async (id, data) => {
  const res = await api.patch(`/catalog/activity-logs/${id}`, data);
  return res.data;
};

export const apiDeleteLog = async (id) => {
  const res = await api.delete(`/catalog/activity-logs/${id}`);
  return res.data;
};

// ── 6. Kho vật tư (Inventory & Materials) ─────────────────────────
export const apiGetInventory = async (farmId) => {
  const res = await api.get('/catalog/inventory', { params: farmId ? { farmId } : {} });
  return res.data;
};

export const apiCreateInventory = async (data) => {
  const res = await api.post('/catalog/inventory', data);
  return res.data;
};

export const apiUpdateInventory = async (id, data) => {
  const res = await api.patch(`/catalog/inventory/${id}`, data);
  return res.data;
};

export const apiDeleteInventory = async (id) => {
  const res = await api.delete(`/catalog/inventory/${id}`);
  return res.data;
};

export const apiGetMaterials = async () => {
  const res = await api.get('/catalog/materials');
  return res.data;
};

export const apiCreateMaterial = async (data) => {
  const res = await api.post('/catalog/materials', data);
  return res.data;
};

export const apiUpdateMaterial = async (id, data) => {
  const res = await api.patch(`/catalog/materials/${id}`, data);
  return res.data;
};

export const apiDeleteMaterial = async (id) => {
  const res = await api.delete(`/catalog/materials/${id}`);
  return res.data;
};

// ── 7. Thu hoạch (Harvests) ───────────────────────────────────────
export const apiGetHarvests = async () => {
  try {
    const res = await api.get('/harvests');
    return res.data;
  } catch {
    const logs = await apiGetLogs();
    return Array.isArray(logs) ? logs.filter((l) => l.activityType === 'THU_HOACH' || l.activityType === 'Thu hoạch' || Number(l.harvestQuantity) > 0) : [];
  }
};

export const apiCreateHarvest = async (data) => {
  try {
    const res = await api.post('/harvests', data);
    return res.data;
  } catch {
    return await apiCreateLog({
      activityType: 'Thu hoạch',
      cropCycleId: data.cropCycleId,
      notes: `Thu hoạch ${data.cropName || ''}: ${data.quantity || data.harvestQuantity} ${data.unit || 'kg'}, thành tiền: ${Number(data.totalRevenue || data.revenue || 0).toLocaleString('vi-VN')} VNĐ. ${data.buyer ? `Khách: ${data.buyer}` : ''} ${data.notes ? `| ${data.notes}` : ''}`,
      cost: -(data.totalRevenue || data.revenue || 0),
      date: data.harvestDate || data.activityDate || new Date().toISOString(),
      harvestQuantity: data.quantity || data.harvestQuantity,
      unitPrice: data.unitPrice,
      revenue: data.totalRevenue || data.revenue,
    });
  }
};

// ── 8. Báo cáo Tài chính & Tổng hợp (Financial Reports) ───────────
export const apiGetFinancialReport = async (params) => {
  const res = await api.get('/catalog/financial-report', { params: params || {} });
  return res.data;
};

// ── 9. Lịch sử giá & biến động Vật tư (Material History) ──────────
export const apiGetMaterialHistory = async (materialId) => {
  const res = await api.get(`/catalog/material-history/${materialId}`);
  return res.data;
};

// ── 10. Bán hàng & Hóa đơn xuất bán (Sales & Invoices) ────────────
export const apiGetProducts = async (farmId) => {
  const res = await api.get('/sales/products', { params: farmId ? { farmId } : {} });
  return res.data;
};

export const apiCreateProduct = async (data) => {
  const res = await api.post('/sales/products', data);
  return res.data;
};

export const apiUpdateProduct = async (id, data) => {
  const res = await api.patch(`/sales/products/${id}`, data);
  return res.data;
};

export const apiDeleteProduct = async (id) => {
  const res = await api.delete(`/sales/products/${id}`);
  return res.data;
};

export const apiGetInvoices = async (farmId) => {
  const res = await api.get('/sales/invoices', { params: farmId ? { farmId } : {} });
  return res.data;
};

export const apiGetInvoice = async (id) => {
  const res = await api.get(`/sales/invoices/${id}`);
  return res.data;
};

export const apiCreateInvoice = async (data) => {
  const res = await api.post('/sales/invoices', data);
  return res.data;
};

export const apiCancelInvoice = async (id) => {
  const res = await api.patch(`/sales/invoices/${id}/cancel`);
  return res.data;
};

export const apiGetSalesStats = async (farmId) => {
  const res = await api.get('/sales/stats', { params: farmId ? { farmId } : {} });
  return res.data;
};

// ── 11. Admin Giám sát toàn hệ thống (Admin Extended) ────────────
export const apiAdminGetAllFarms = async (params = {}) => {
  const res = await api.get('/catalog/admin/farms', { params });
  return res.data;
};

export const apiAdminGetAllActivityLogs = async (params = {}) => {
  const res = await api.get('/catalog/admin/activity-logs', { params });
  return res.data;
};

