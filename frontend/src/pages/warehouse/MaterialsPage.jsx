import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  IconFlask,
  IconPlus,
  IconSearch,
  IconPenLine,
  IconTrash,
  IconX,
  IconCheckCircle,
  IconSprout,
  IconLeaf,
  IconWarehouse,
} from '../../components/icons';
import {
  apiGetMaterials,
  apiCreateMaterial,
  apiGetMaterialHistory,
} from '../../services/api';
import { api } from '../../services/api';
import './MaterialsPage.css';

const MATERIAL_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'PHAN_BON', label: 'Phân bón' },
  { value: 'THUOC_BVTV', label: 'Thuốc BVTV' },
  { value: 'GIONG', label: 'Giống' },
  { value: 'KHAC', label: 'Khác' },
];

const TYPE_LABELS = {
  PHAN_BON: 'Phân bón',
  THUOC_BVTV: 'Thuốc BVTV',
  GIONG: 'Giống',
  KHAC: 'Khác',
};

const TYPE_BADGE_CLASS = {
  PHAN_BON: 'badge-phan-bon',
  THUOC_BVTV: 'badge-thuoc-bvtv',
  GIONG: 'badge-giong',
  KHAC: 'badge-khac',
};

const emptyForm = {
  name: '',
  type: 'PHAN_BON',
  unit: 'kg',
  defaultPrice: '',
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Lịch sử thay đổi vật tư
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [materialHistories, setMaterialHistories] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Xác nhận xóa
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const handleOpenHistory = async (item) => {
    setSelectedMaterial(item);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const data = await apiGetMaterialHistory(item.id);
      setMaterialHistories(data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử vật tư:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      await api.delete(`/catalog/materials/${deleteConfirmItem.id}`);
      setDeleteConfirmItem(null);
      await loadMaterials();
    } catch (err) {
      alert('Lỗi xóa vật tư: ' + (err.response?.data?.message || err.message));
    }
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await apiGetMaterials();
      setMaterials(data || []);
    } catch (err) {
      console.error('Lỗi tải vật tư:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const filteredMaterials = useMemo(() => {
    let result = materials;
    if (filterType) {
      result = result.filter((m) => m.type === filterType);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          (TYPE_LABELS[m.type] || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [materials, filterType, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = materials.length;
    const phanBon = materials.filter((m) => m.type === 'PHAN_BON').length;
    const thuocBvtv = materials.filter((m) => m.type === 'THUOC_BVTV').length;
    const other = total - phanBon - thuocBvtv;
    return { total, phanBon, thuocBvtv, other };
  }, [materials]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      unit: item.unit,
      defaultPrice: item.defaultPrice,
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
    if (!form.name.trim() || !form.defaultPrice) return;
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        type: form.type,
        unit: form.unit.trim(),
        defaultPrice: Number(form.defaultPrice),
      };
      if (editingId) {
        await api.patch(`/catalog/materials/${editingId}`, payload);
      } else {
        await apiCreateMaterial(payload);
      }
      closeModal();
      await loadMaterials();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vật tư "${name}"?`)) return;
    try {
      await api.delete(`/catalog/materials/${id}`);
      await loadMaterials();
    } catch (err) {
      alert('Lỗi xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="materials-page-container">
      <Header />
      <main className="materials-main-content">
        <div className="container">
          {/* HERO BANNER */}
          <div className="materials-hero-banner">
            <div className="materials-hero-text">
              <div className="materials-pill-tag">
                <IconFlask size={16} strokeWidth={2.2} />
                <span>QUẢN LÝ VẬT TƯ NÔNG NGHIỆP</span>
              </div>
              <h1>Danh mục vật tư, phân bón & thuốc BVTV</h1>
              <p className="materials-hero-desc">
                Quản lý đầy đủ các loại phân bón, thuốc bảo vệ thực vật, giống cây
                và vật tư khác phục vụ cho hoạt động canh tác nông nghiệp.
              </p>
            </div>
            <div className="materials-hero-actions">
              <button className="btn-add-material" onClick={openAddModal}>
                <IconPlus size={18} strokeWidth={2.5} />
                <span>Thêm vật tư mới</span>
              </button>
            </div>
          </div>

          {/* KPI STATS */}
          <div className="materials-stats-grid">
            <div className="materials-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Tổng vật tư</span>
                <div className="stat-card-icon green">
                  <IconWarehouse size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.total}</span>
              <span className="stat-card-sub">Loại vật tư trong hệ thống</span>
            </div>
            <div className="materials-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Phân bón</span>
                <div className="stat-card-icon orange">
                  <IconSprout size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.phanBon}</span>
              <span className="stat-card-sub">Phân hữu cơ, NPK, DAP, Urê...</span>
            </div>
            <div className="materials-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Thuốc BVTV</span>
                <div className="stat-card-icon purple">
                  <IconFlask size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.thuocBvtv}</span>
              <span className="stat-card-sub">Thuốc trừ sâu, diệt cỏ, nấm...</span>
            </div>
            <div className="materials-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">Loại khác</span>
                <div className="stat-card-icon blue">
                  <IconLeaf size={20} strokeWidth={2} />
                </div>
              </div>
              <span className="stat-card-value">{stats.other}</span>
              <span className="stat-card-sub">Giống, công cụ, vật tư khác</span>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="materials-filter-bar">
            <div className="materials-filter-left">
              {MATERIAL_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`filter-chip ${filterType === t.value ? 'active' : ''}`}
                  onClick={() => setFilterType(t.value)}
                >
                  {t.label}
                  {t.value === '' && <span>({materials.length})</span>}
                </button>
              ))}
            </div>
            <div className="materials-search-wrap">
              <IconSearch size={16} strokeWidth={2.2} />
              <input
                className="materials-search-input"
                type="text"
                placeholder="Tìm kiếm vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="materials-table-card">
            <div className="materials-table-header">
              <div className="materials-table-title">
                <IconFlask size={20} strokeWidth={2} />
                <span>Danh sách vật tư ({filteredMaterials.length})</span>
              </div>
            </div>

            {filteredMaterials.length === 0 ? (
              <div className="materials-empty">
                <div className="materials-empty-icon">
                  <IconFlask size={32} strokeWidth={2} />
                </div>
                <h3>Chưa có vật tư nào</h3>
                <p>
                  Bấm "Thêm vật tư mới" ở góc trên để thêm phân bón, thuốc bảo vệ thực vật hoặc hạt giống thực tế.
                </p>
              </div>
            ) : (
              <div className="materials-table-responsive">
                <table className="materials-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên vật tư</th>
                      <th>Phân loại</th>
                      <th>Đơn vị</th>
                      <th>Đơn giá (VNĐ)</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <span className="material-name">{item.name}</span>
                        </td>
                        <td>
                          <span className={`material-type-badge ${TYPE_BADGE_CLASS[item.type] || 'badge-khac'}`}>
                            {TYPE_LABELS[item.type] || item.type}
                          </span>
                        </td>
                        <td>
                          <span className="material-unit">{item.unit}</span>
                        </td>
                        <td>
                          <span className="material-price">
                            {Number(item.defaultPrice).toLocaleString('vi-VN')} đ
                          </span>
                        </td>
                        <td>
                          <div className="material-actions-cell" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn-mat-history"
                              title="Xem lịch sử thay đổi vật tư"
                              onClick={() => handleOpenHistory(item)}
                              style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              📜 Lịch sử
                            </button>
                            <button
                              className="btn-mat-edit"
                              title="Sửa vật tư"
                              onClick={() => openEditModal(item)}
                            >
                              <IconPenLine size={14} strokeWidth={2} />
                            </button>
                            <button
                              className="btn-mat-delete"
                              title="Xóa vật tư"
                              onClick={() => setDeleteConfirmItem(item)}
                            >
                              <IconTrash size={14} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* MODAL THÊM/SỬA VẬT TƯ */}
      {showModal && (
        <div className="materials-modal-overlay" onClick={closeModal}>
          <div className="materials-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconFlask size={20} strokeWidth={2} />
                {editingId ? 'Chỉnh sửa vật tư' : 'Thêm vật tư mới'}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <IconX size={16} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-field">
                  <label>
                    Tên vật tư <span className="required">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: Phân NPK 16-16-8"
                  />
                </div>
                <div className="modal-row">
                  <div className="modal-field">
                    <label>Phân loại</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="PHAN_BON">Phân bón</option>
                      <option value="THUOC_BVTV">Thuốc BVTV</option>
                      <option value="GIONG">Giống</option>
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>Đơn vị tính</label>
                    <input
                      required
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      placeholder="kg, lít, bao, chai..."
                    />
                  </div>
                </div>
                <div className="modal-field">
                  <label>
                    Đơn giá mặc định (VNĐ) <span className="required">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="100"
                    value={form.defaultPrice}
                    onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
                    placeholder="VD: 15000"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={closeModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-modal-save" disabled={saving}>
                  <IconCheckCircle size={16} strokeWidth={2.5} />
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ THAY ĐỔI VẬT TƯ */}
      {historyModalOpen && (
        <div className="materials-modal-overlay" onClick={() => setHistoryModalOpen(false)}>
          <div className="materials-modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                📜 Lịch sử thay đổi vật tư: {selectedMaterial?.name}
              </h3>
              <button className="modal-close-btn" onClick={() => setHistoryModalOpen(false)}>
                <IconX size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
                💡 Mọi thay đổi về tên, đơn vị, giá hoặc điều chỉnh vật tư đều được lưu trữ vĩnh viễn nhằm đảm bảo các mùa vụ canh tác trong quá khứ không bị sai lệch số liệu.
              </p>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải lịch sử...</div>
              ) : materialHistories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Chưa có lịch sử thay đổi nào được ghi nhận cho vật tư này.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Hành động</th>
                      <th style={{ padding: '8px' }}>Tên vật tư</th>
                      <th style={{ padding: '8px' }}>Loại</th>
                      <th style={{ padding: '8px' }}>Đơn vị</th>
                      <th style={{ padding: '8px' }}>Đơn giá</th>
                      <th style={{ padding: '8px' }}>Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialHistories.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: h.action === 'CREATE' ? '#dcfce7' : h.action === 'UPDATE' ? '#fef3c7' : '#fee2e2',
                            color: h.action === 'CREATE' ? '#166534' : h.action === 'UPDATE' ? '#92400e' : '#991b1b',
                          }}>
                            {h.action === 'CREATE' ? 'Tạo mới' : h.action === 'UPDATE' ? 'Cập nhật' : 'Xóa'}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{h.name}</td>
                        <td style={{ padding: '8px' }}>{TYPE_LABELS[h.type] || h.type}</td>
                        <td style={{ padding: '8px' }}>{h.unit}</td>
                        <td style={{ padding: '8px' }}>{Number(h.defaultPrice).toLocaleString('vi-VN')} đ</td>
                        <td style={{ padding: '8px', color: '#64748b', fontSize: '0.8rem' }}>
                          {new Date(h.changedAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setHistoryModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA VẬT TƯ */}
      {deleteConfirmItem && (
        <div className="materials-modal-overlay" onClick={() => setDeleteConfirmItem(null)}>
          <div className="materials-modal" style={{ maxWidth: '480px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', margin: '1rem 0 0.5rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem' }}>Xác nhận xóa vật tư</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 1rem 1rem' }}>
              Bạn có chắc chắn muốn xóa vật tư <strong>"{deleteConfirmItem.name}"</strong>?
            </p>
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '0.75rem',
              margin: '0 1.5rem 1.5rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: '#065f46'
            }}>
              🛡️ <strong>Bảo toàn dữ liệu lịch sử:</strong> Lịch sử của vật tư này vẫn được hệ thống lưu trữ vĩnh viễn. Các vụ mùa và nhật ký canh tác đã sử dụng vật tư này trước đây sẽ không bị ảnh hưởng hay mất dữ liệu chi phí!
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '0.75rem' }}>
              <button type="button" className="btn-modal-cancel" onClick={() => setDeleteConfirmItem(null)}>
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-modal-save"
                style={{ background: '#dc2626' }}
                onClick={handleConfirmDelete}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
