import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
} from '../components/icons';
import {
  apiGetSeasons,
  apiCreateSeason,
  apiGetCrops,
  apiGetGrowthCycles,
} from '../services/api';
import { api } from '../services/api';
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
};

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([]);
  const [crops, setCrops] = useState([]);
  const [plots, setPlots] = useState([]);
  const [growthCycles, setGrowthCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [seasonsRes, cropsRes, cyclesRes, plotsRes] = await Promise.all([
        apiGetSeasons().catch(() => []),
        apiGetCrops().catch(() => []),
        apiGetGrowthCycles().catch(() => []),
        api.get('/catalog/plots').then((r) => r.data).catch(() => []),
      ]);
      setSeasons(seasonsRes || []);
      setCrops(cropsRes || []);
      setGrowthCycles(cyclesRes || []);
      setPlots(plotsRes || []);
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
    });
    setShowModal(true);
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
                        <h3>{season.name}</h3>
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
    </div>
  );
}
