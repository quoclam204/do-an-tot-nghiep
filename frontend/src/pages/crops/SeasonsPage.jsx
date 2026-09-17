import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  IconBookOpen,
  IconPlus,
  IconSearch,
  IconPenLine,
  IconTrash,
  IconX,
  IconCheckCircle,
  IconSprout,
  IconLeaf,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconWarehouse,
  IconCircleDollar,
  IconTrendingUp,
  IconFlask,
  IconUsers,
  IconScale,
} from '../../components/icons';
import {
  apiGetSeasons,
  apiCreateSeason,
  apiGetCrops,
  apiGetGrowthCycles,
  apiGetSeasonFinancialSummary,
  apiGetMyFarms,
} from '../../services/api';
import { api } from '../../services/api';
import './SeasonsPage.css';

const STATUS_MAP = {
  ACTIVE: { label: 'Đang canh tác', cls: 'status-active' },
  COMPLETED: { label: 'Đã kết thúc', cls: 'status-completed' },
  UPCOMING: { label: 'Chuẩn bị', cls: 'status-upcoming' },
};

const emptyForm = {
  plotId: '',
  cropId: '',
  growthCycleId: '',
  name: '',
  startDate: '',
  expectedEndDate: '',
  isIntercropped: false,
};

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([]);
  const [crops, setCrops] = useState([]);
  const [plots, setPlots] = useState([]);
  const [growthCycles, setGrowthCycles] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Báo cáo tài chính & kinh tế vụ mùa
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [selectedSeasonData, setSelectedSeasonData] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  const loadData = async (targetFarmId) => {
    try {
      setLoading(true);
      const farmToUse = targetFarmId !== undefined ? targetFarmId : selectedFarmId;
      const [seasonsRes, cropsRes, cyclesRes, plotsRes, farmsRes] = await Promise.all([
        apiGetSeasons(farmToUse).catch(() => []),
        apiGetCrops().catch(() => []),
        apiGetGrowthCycles().catch(() => []),
        api.get('/catalog/plots', { params: farmToUse ? { farmId: farmToUse } : {} }).then((r) => r.data).catch(() => []),
        apiGetMyFarms().catch(() => []),
      ]);
      setSeasons(seasonsRes || []);
      setCrops(cropsRes || []);
      setGrowthCycles(cyclesRes || []);
      setPlots(plotsRes || []);
      setFarms(farmsRes || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu mùa vụ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate progress percentage
  const getProgress = (start, end) => {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const nowMs = Date.now();
    if (nowMs <= startMs) return 0;
    if (nowMs >= endMs) return 100;
    return Math.round(((nowMs - startMs) / (endMs - startMs)) * 100);
  };

  // Determine status from dates
  const getStatus = (season) => {
    if (season.status === 'COMPLETED' || season.actualEndDate) return 'COMPLETED';
    const now = new Date();
    const start = new Date(season.startDate);
    if (now < start) return 'UPCOMING';
    return 'ACTIVE';
  };

  const filteredSeasons = useMemo(() => {
    let result = seasons;
    if (filterStatus) {
      result = result.filter((s) => getStatus(s) === filterStatus);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.crop?.name?.toLowerCase().includes(term) ||
          s.plot?.name?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [seasons, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const active = seasons.filter((s) => getStatus(s) === 'ACTIVE').length;
    const completed = seasons.filter((s) => getStatus(s) === 'COMPLETED').length;
    const upcoming = seasons.filter((s) => getStatus(s) === 'UPCOMING').length;
    const uniqueCrops = new Set(seasons.map((s) => s.cropId)).size;
    return { total: seasons.length, active, completed, upcoming, uniqueCrops };
  }, [seasons]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      plotId: plots[0]?.id || '',
      cropId: crops[0]?.id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      plotId: item.plotId,
      cropId: item.cropId,
      growthCycleId: item.growthCycleId || '',
      name: item.name,
      startDate: item.startDate?.slice(0, 10) || '',
      expectedEndDate: item.expectedEndDate?.slice(0, 10) || '',
      isIntercropped: Boolean(item.isIntercropped),
    });
    setShowModal(true);
  };

  const handleOpenFinanceModal = async (season) => {
    try {
      setFinanceLoading(true);
      setFinanceModalOpen(true);
      const data = await apiGetSeasonFinancialSummary(season.id);
      setSelectedSeasonData(data);
    } catch (err) {
      alert('Lỗi tải báo cáo kinh tế mùa vụ: ' + (err.response?.data?.message || err.message));
      setFinanceModalOpen(false);
    } finally {
      setFinanceLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.plotId || !form.cropId) return;
    try {
      setSaving(true);
      const payload = { ...form };
      if (!payload.growthCycleId) delete payload.growthCycleId;

      if (editingId) {
        await api.patch(`/catalog/seasons/${editingId}`, payload);
      } else {
        await apiCreateSeason(payload);
      }
      closeModal();
      await loadData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mùa vụ "${name}"?`)) return;
    try {
      await api.delete(`/catalog/seasons/${id}`);
      await loadData();
    } catch (err) {
      alert('Lỗi xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  // Filter cycles by selected crop
  const filteredCycles = growthCycles.filter(
    (c) => !form.cropId || c.cropId === form.cropId
  );

  return (
    <div className="seasons-page-container">
      <Header />
      <main className="seasons-main-content">
        <div className="container">
          {/* HERO */}
          <div className="seasons-hero-banner">
            <div className="seasons-hero-text">
              <div className="seasons-pill-tag">
                <IconBookOpen size={16} strokeWidth={2.2} />
                <span>QUẢN LÝ MÙA VỤ CANH TÁC</span>
              </div>
              <h1>Mùa vụ & Chu kỳ canh tác</h1>
              <p className="seasons-hero-desc">
                Theo dõi tiến độ từng mùa vụ, gắn với lô trồng và cây trồng cụ thể.
                Quản lý thời gian bắt đầu, kết thúc và trạng thái vụ mùa.
              </p>
            </div>
            <div className="seasons-hero-actions">
              <button className="btn-add-season" onClick={openAddModal}>
                <IconPlus size={18} strokeWidth={2.5} />
                <span>Lập mùa vụ mới</span>
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="seasons-stats-grid">
            <div className="seasons-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Tổng mùa vụ</span>
                <div className="stat-card-icon green">
                  <IconBookOpen size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.total}</span>
              <span className="stat-card-sub">Mùa vụ đã thiết lập</span>
            </div>
            <div className="seasons-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Đang canh tác</span>
                <div className="stat-card-icon green">
                  <IconSprout size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.active}</span>
              <span className="stat-card-sub">Vụ mùa đang triển khai</span>
            </div>
            <div className="seasons-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Đã kết thúc</span>
                <div className="stat-card-icon blue">
                  <IconCheckCircle size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.completed}</span>
              <span className="stat-card-sub">Vụ hoàn thành thu hoạch</span>
            </div>
            <div className="seasons-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Loại cây trồng</span>
                <div className="stat-card-icon orange">
                  <IconLeaf size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.uniqueCrops}</span>
              <span className="stat-card-sub">Giống cây đang canh tác</span>
            </div>
          </div>

          {/* FILTER */}
          <div className="seasons-filter-bar">
            <div className="seasons-filter-left">
              <button
                className={`filter-chip ${filterStatus === '' ? 'active' : ''}`}
                onClick={() => setFilterStatus('')}
              >
                Tất cả ({seasons.length})
              </button>
              <button
                className={`filter-chip ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => setFilterStatus('ACTIVE')}
              >
                Đang canh tác
              </button>
              <button
                className={`filter-chip ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setFilterStatus('COMPLETED')}
              >
                Đã kết thúc
              </button>
              <button
                className={`filter-chip ${filterStatus === 'UPCOMING' ? 'active' : ''}`}
                onClick={() => setFilterStatus('UPCOMING')}
              >
                Chuẩn bị
              </button>
            </div>
            <div className="materials-search-wrap">
              <IconSearch size={16} strokeWidth={2.2} />
              <input
                className="materials-search-input"
                type="text"
                placeholder="Tìm mùa vụ, cây trồng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {farms.length > 0 && (
              <select
                className="seasons-farm-select"
                value={selectedFarmId}
                onChange={(e) => {
                  const fid = e.target.value;
                  setSelectedFarmId(fid);
                  loadData(fid);
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <option value="">🏡 Tất cả trang trại</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* SEASONS GRID */}
          {filteredSeasons.length === 0 ? (
            <div className="materials-table-card">
              <div className="seasons-empty">
                <div className="seasons-empty-icon">
                  <IconBookOpen size={32} strokeWidth={2} />
                </div>
                <h3>Chưa có mùa vụ nào</h3>
                <p>
                  Bấm "Lập mùa vụ mới" để bắt đầu theo dõi chu kỳ canh tác.
                </p>
              </div>
            </div>
          ) : (
            <div className="seasons-grid">
              {filteredSeasons.map((season) => {
                const status = getStatus(season);
                const statusInfo = STATUS_MAP[status] || STATUS_MAP.ACTIVE;
                const progress = getProgress(season.startDate, season.expectedEndDate);

                return (
                  <div className="season-card" key={season.id}>
                    <div className="season-card-top">
                      <div className="season-card-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3>{season.name}</h3>
                          {season.isIntercropped && (
                            <span className="season-intercrop-tag">🌿 Xen canh</span>
                          )}
                        </div>
                        <div className="season-card-meta">
                          <IconSprout size={14} strokeWidth={2} />
                          <span>{season.crop?.name || '—'}</span>
                          <span>·</span>
                          <IconMapPin size={14} strokeWidth={2} />
                          <span>{season.plot?.name || '—'}</span>
                        </div>
                      </div>
                      <span className={`season-status-badge ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="season-progress">
                      <div className="season-progress-bar">
                        <div
                          className="season-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="season-progress-labels">
                        <span>{formatDate(season.startDate)}</span>
                        <span>{progress}%</span>
                        <span>{formatDate(season.expectedEndDate)}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="season-detail-row">
                      <div className="season-detail-item">
                        <span className="season-detail-label">Ngày bắt đầu</span>
                        <span className="season-detail-value">
                          {formatDate(season.startDate)}
                        </span>
                      </div>
                      <div className="season-detail-item">
                        <span className="season-detail-label">Dự kiến kết thúc</span>
                        <span className="season-detail-value">
                          {formatDate(season.expectedEndDate)}
                        </span>
                      </div>
                      <div className="season-detail-item">
                        <span className="season-detail-label">Chu kỳ áp dụng</span>
                        <span className="season-detail-value">
                          {season.growthCycle?.name || 'Không áp dụng'}
                        </span>
                      </div>
                      <div className="season-detail-item">
                        <span className="season-detail-label">Sản lượng</span>
                        <span className="season-detail-value">
                          {season.totalYield ? `${season.totalYield.toLocaleString()} kg` : 'Chưa thu hoạch'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="season-card-actions">
                      <button
                        className="btn-season-finance"
                        onClick={() => handleOpenFinanceModal(season)}
                        title="Xem thống kê vốn đầu tư, tiền nhân công thuê, doanh thu & lợi nhuận"
                      >
                        <IconCircleDollar size={15} strokeWidth={2.2} />
                        <span>Báo cáo kinh tế</span>
                      </button>
                      <button className="btn-season-edit" onClick={() => openEditModal(season)}>
                        <IconPenLine size={14} strokeWidth={2} />
                        Sửa
                      </button>
                      <button className="btn-season-delete" onClick={() => handleDelete(season.id, season.name)}>
                        <IconTrash size={14} strokeWidth={2} />
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* MODAL */}
      {showModal && (
        <div className="seasons-modal-overlay" onClick={closeModal}>
          <div className="seasons-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconBookOpen size={20} strokeWidth={2} />
                {editingId ? 'Chỉnh sửa mùa vụ' : 'Lập mùa vụ mới'}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <IconX size={16} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-field">
                  <label>
                    Tên mùa vụ <span className="required">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: Mùa cà phê Robusta 2026"
                  />
                </div>
                <div className="modal-row">
                  <div className="modal-field">
                    <label>
                      Lô trồng <span className="required">*</span>
                    </label>
                    <select
                      required
                      value={form.plotId}
                      onChange={(e) => setForm({ ...form, plotId: e.target.value })}
                    >
                      <option value="">-- Chọn lô trồng --</option>
                      {plots.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.farm?.name || ''})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>
                      Cây trồng <span className="required">*</span>
                    </label>
                    <select
                      required
                      value={form.cropId}
                      onChange={(e) => setForm({ ...form, cropId: e.target.value, growthCycleId: '' })}
                    >
                      <option value="">-- Chọn cây trồng --</option>
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-field">
                  <label>Chu kỳ sinh trưởng áp dụng</label>
                  <select
                    value={form.growthCycleId}
                    onChange={(e) => setForm({ ...form, growthCycleId: e.target.value })}
                  >
                    <option value="">Không áp dụng</option>
                    {filteredCycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.stages?.length || 0} giai đoạn)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-row">
                  <div className="modal-field">
                    <label>
                      Ngày bắt đầu <span className="required">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div className="modal-field">
                    <label>
                      Dự kiến kết thúc <span className="required">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={form.expectedEndDate}
                      onChange={(e) =>
                        setForm({ ...form, expectedEndDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Tùy chọn trồng xen canh */}
                <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: '#166534', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={form.isIntercropped}
                      onChange={(e) => setForm({ ...form, isIntercropped: e.target.checked })}
                    />
                    <span>🌿 Trồng xen canh trên lô đất này (Ví dụ: Cà phê xen Sầu riêng)</span>
                  </label>
                  <small style={{ color: '#15803d', display: 'block', marginTop: '4px', fontSize: '0.82rem' }}>
                    Cho phép tạo nhiều vụ mùa cho các loại cây khác nhau cùng hoạt động song song trên một Lô đất mà không bị báo trùng lịch.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={closeModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-modal-save" disabled={saving}>
                  <IconCheckCircle size={16} strokeWidth={2.5} />
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lập mùa vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BÁO CÁO KINH TẾ & HIỆU QUẢ VỤ MÙA */}
      {financeModalOpen && (
        <div className="seasons-modal-overlay" onClick={() => setFinanceModalOpen(false)}>
          <div className="seasons-modal finance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconCircleDollar size={20} strokeWidth={2} />
                Báo Cáo Kinh Tế & Hiệu Quả Vụ Mùa
              </h3>
              <button className="modal-close-btn" onClick={() => setFinanceModalOpen(false)}>
                <IconX size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="modal-body finance-modal-body">
              {financeLoading || !selectedSeasonData ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <div className="plots-spinner" style={{ margin: '0 auto 12px' }} />
                  <p>Đang tổng hợp dữ liệu chi phí, nhân công và doanh thu vụ mùa...</p>
                </div>
              ) : (
                <>
                  <div className="finance-season-header">
                    <div>
                      <h2>{selectedSeasonData.season?.name}</h2>
                      <div className="finance-meta-tags">
                        <span>🌱 Cây trồng: <strong>{selectedSeasonData.season?.cropName}</strong></span>
                        <span>•</span>
                        <span>📍 Lô: <strong>{selectedSeasonData.season?.plotName}</strong> ({selectedSeasonData.season?.farmName})</span>
                        {selectedSeasonData.season?.isIntercropped && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#15803d', fontWeight: '600' }}>🌿 Trồng xen canh</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4 THẺ KPI CHÍNH */}
                  <div className="finance-kpi-grid">
                    <div className="finance-kpi-card cost">
                      <span className="kpi-label">Tổng vốn đầu tư vụ mùa</span>
                      <span className="kpi-value">
                        {selectedSeasonData.summary?.totalInvestment.toLocaleString()} <small>VNĐ</small>
                      </span>
                      <span className="kpi-sub">
                        Vật tư: {selectedSeasonData.summary?.totalMaterialCost.toLocaleString()} đ | Khác: {selectedSeasonData.summary?.totalOtherCosts.toLocaleString()} đ
                      </span>
                    </div>

                    <div className="finance-kpi-card labor">
                      <span className="kpi-label">Thuê nhân công ngoài?</span>
                      <span className="kpi-value">
                        {selectedSeasonData.summary?.hasHiredLabor ? 'CÓ THUÊ' : 'TỰ LÀM'}
                      </span>
                      <span className="kpi-sub">
                        {selectedSeasonData.summary?.hasHiredLabor
                          ? `${selectedSeasonData.summary?.totalWorkers} ngày công • ${selectedSeasonData.summary?.totalLaborCost.toLocaleString()} VNĐ`
                          : 'Không phát sinh tiền công thuê ngoài'}
                      </span>
                    </div>

                    <div className="finance-kpi-card revenue">
                      <span className="kpi-label">Tổng doanh thu bán hàng</span>
                      <span className="kpi-value">
                        {selectedSeasonData.summary?.totalRevenue.toLocaleString()} <small>VNĐ</small>
                      </span>
                      <span className="kpi-sub">
                        Sản lượng thu hoạch: {selectedSeasonData.summary?.totalHarvestQty.toLocaleString()} kg
                      </span>
                    </div>

                    <div className={`finance-kpi-card profit ${selectedSeasonData.summary?.isProfitable ? 'positive' : 'negative'}`}>
                      <span className="kpi-label">Lợi nhuận ròng</span>
                      <span className="kpi-value">
                        {selectedSeasonData.summary?.netProfit > 0 ? '+' : ''}
                        {selectedSeasonData.summary?.netProfit.toLocaleString()} <small>VNĐ</small>
                      </span>
                      <span className="kpi-sub">
                        ROI: {selectedSeasonData.summary?.roiPercentage}% • {selectedSeasonData.summary?.isProfitable ? 'Có lãi' : 'Đang đầu tư / Chưa hòa vốn'}
                      </span>
                    </div>
                  </div>

                  {/* CHI TIẾT VẬT TƯ ĐÃ DÙNG */}
                  <div className="finance-section-block">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconFlask size={18} /> Chi phí vật tư đã xuất dùng (Phân bón, Thuốc BVTV, Giống)
                    </h4>
                    {selectedSeasonData.materialsUsed?.length === 0 ? (
                      <p className="no-data-hint">Chưa ghi nhận vật tư nào xuất dùng trong vụ mùa này.</p>
                    ) : (
                      <div className="finance-table-wrap">
                        <table className="finance-table">
                          <thead>
                            <tr>
                              <th>Tên vật tư</th>
                              <th>Loại</th>
                              <th>Số lượng đã dùng</th>
                              <th style={{ textAlign: 'right' }}>Thành tiền (VNĐ)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSeasonData.materialsUsed?.map((m, idx) => (
                              <tr key={idx}>
                                <td><strong>{m.name}</strong></td>
                                <td><span className="badge-type">{m.type}</span></td>
                                <td>{m.quantity.toLocaleString()} {m.unit}</td>
                                <td style={{ textAlign: 'right', fontWeight: '600' }}>{m.cost.toLocaleString()} đ</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* CHI TIẾT NHÂN CÔNG */}
                  {selectedSeasonData.laborLogs?.length > 0 && (
                    <div className="finance-section-block">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconUsers size={18} /> Chi tiết các đợt thuê nhân công ngoài
                      </h4>
                      <div className="finance-table-wrap">
                        <table className="finance-table">
                          <thead>
                            <tr>
                              <th>Ngày làm</th>
                              <th>Công việc</th>
                              <th>Số nhân công</th>
                              <th>Tiền công / người / ngày</th>
                              <th style={{ textAlign: 'right' }}>Tổng tiền công</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSeasonData.laborLogs.map((l) => (
                              <tr key={l.id}>
                                <td>{new Date(l.date).toLocaleDateString('vi-VN')}</td>
                                <td><strong>{l.activityType}</strong></td>
                                <td>{l.workers} người</td>
                                <td>{l.wagePerDay.toLocaleString()} đ</td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#b45309' }}>
                                  {l.totalCost.toLocaleString()} đ
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* CHI TIẾT THU HOẠCH */}
                  {selectedSeasonData.harvestLogs?.length > 0 && (
                    <div className="finance-section-block">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconScale size={18} /> Chi tiết các đợt thu hoạch & Doanh thu bán hàng
                      </h4>
                      <div className="finance-table-wrap">
                        <table className="finance-table">
                          <thead>
                            <tr>
                              <th>Ngày thu hoạch</th>
                              <th>Sản lượng</th>
                              <th>Đơn giá bán</th>
                              <th style={{ textAlign: 'right' }}>Doanh thu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSeasonData.harvestLogs.map((h) => (
                              <tr key={h.id}>
                                <td>{new Date(h.date).toLocaleDateString('vi-VN')}</td>
                                <td><strong>{h.quantity.toLocaleString()} kg</strong></td>
                                <td>{h.unitPrice.toLocaleString()} đ/kg</td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#15803d' }}>
                                  {h.revenue.toLocaleString()} đ
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setFinanceModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
