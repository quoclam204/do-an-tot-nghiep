import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

// ── Axios instance với interceptor tự động gắn token ──────────
export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('dalat-agri-token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Auth APIs ──────────────────────────────────────────────────

/** Đăng ký tài khoản mới */
export const apiRegister = async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

/** Đăng nhập */
export const apiLogin = async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
};

/** Quên mật khẩu */
export const apiForgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

/** Đặt lại mật khẩu */
export const apiResetPassword = async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
};

// ── Users APIs ─────────────────────────────────────────────────

/** Lấy thông tin cá nhân (đang đăng nhập) */
export const apiGetMe = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

/** Cập nhật thông tin cá nhân */
export const apiUpdateMe = async (data) => {
    const response = await api.patch('/users/me', data);
    return response.data;
};

/** Lấy danh sách tất cả users (ADMIN) */
export const apiGetAllUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

/** Thay đổi vai trò người dùng (ADMIN) */
export const apiUpdateUserRole = async (userId, role) => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
};

/** Kích hoạt / vô hiệu hóa tài khoản (ADMIN) */
export const apiToggleUserActive = async (userId) => {
    const response = await api.patch(`/users/${userId}/toggle-active`);
    return response.data;
};

/** Xóa mềm người dùng (ADMIN) */
export const apiDeleteUser = async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
};

// ── Farms APIs ─────────────────────────────────────────────────

/** Lấy danh sách nông hộ của tôi */
export const apiGetMyFarms = async () => {
    const response = await api.get('/farms');
    return response.data;
};

/** Tạo nông hộ mới */
export const apiCreateFarm = async (data) => {
    const response = await api.post('/farms', data);
    return response.data;
};

/** Xem chi tiết 1 nông hộ */
export const apiGetFarm = async (id) => {
    const response = await api.get(`/farms/${id}`);
    return response.data;
};

/** Cập nhật nông hộ */
export const apiUpdateFarm = async (id, data) => {
    const response = await api.patch(`/farms/${id}`, data);
    return response.data;
};

/** Xóa nông hộ */
export const apiDeleteFarm = async (id) => {
    const response = await api.delete(`/farms/${id}`);
    return response.data;
};

/** Lấy tất cả nông hộ (ADMIN) */
export const apiGetAllFarms = async () => {
    const response = await api.get('/farms/all');
    return response.data;
};

// ── Plots APIs ─────────────────────────────────────────────────

/** Lấy danh sách lô trồng */
export const apiGetPlots = async (farmId) => {
    const response = await api.get(`/farms/${farmId}/plots`);
    return response.data;
};

/** Tạo lô trồng mới */
export const apiCreatePlot = async (farmId, data) => {
    const response = await api.post(`/farms/${farmId}/plots`, data);
    return response.data;
};

/** Cập nhật lô trồng */
export const apiUpdatePlot = async (farmId, plotId, data) => {
    const response = await api.patch(`/farms/${farmId}/plots/${plotId}`, data);
    return response.data;
};

/** Xóa lô trồng */
export const apiDeletePlot = async (farmId, plotId) => {
    const response = await api.delete(`/farms/${farmId}/plots/${plotId}`);
    return response.data;
};

// ── Catalog & Agriculture APIs (Cây trồng, Lô, Mùa vụ, Vật tư, Nhật ký) ──────

/** Lấy danh sách cây trồng */
export const apiGetCrops = async () => {
    const response = await api.get('/catalog/crops');
    return response.data;
};

/** Lấy danh sách mùa vụ / chu kỳ canh tác */
export const apiGetSeasons = async () => {
    const response = await api.get('/catalog/seasons');
    return response.data;
};

/** Tạo mùa vụ mới */
export const apiCreateSeason = async (data) => {
    const response = await api.post('/catalog/seasons', data);
    return response.data;
};

/** Lấy danh mục vật tư (phân bón, thuốc BVTV) */
export const apiGetMaterials = async () => {
    const response = await api.get('/catalog/materials');
    return response.data;
};

/** Tạo vật tư mới */
export const apiCreateMaterial = async (data) => {
    const response = await api.post('/catalog/materials', data);
    return response.data;
};

/** Lấy danh sách nhật ký canh tác */
export const apiGetActivityLogs = async (cropCycleId) => {
    const response = await api.get('/catalog/activity-logs', { params: { cropCycleId } });
    return response.data;
};

/** Tạo nhật ký canh tác mới */
export const apiCreateActivityLog = async (data) => {
    const response = await api.post('/catalog/activity-logs', data);
    return response.data;
};

/** Xóa nhật ký canh tác */
export const apiDeleteActivityLog = async (id) => {
    const response = await api.delete(`/catalog/activity-logs/${id}`);
    return response.data;
};

/** Lấy báo cáo kinh tế / tài chính */
export const apiGetFinancialReport = async (cropCycleId) => {
    const response = await api.get('/catalog/financial-report', { params: { cropCycleId } });
    return response.data;
};

/** Seed dữ liệu đặc thù Lâm Đồng (Cà phê, Sầu riêng, Mắc-ca & Phân thuốc) */
export const apiSeedLamDong = async () => {
    const response = await api.post('/catalog/seed-lamdong');
    return response.data;
};

