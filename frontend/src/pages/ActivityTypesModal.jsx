import React, { useState, useEffect } from 'react';
import './ActivityTypesModal.css';
import {
  IconPlus,
  IconPenLine,
  IconTrash,
  IconCheckCircle,
  IconAlertTriangle,
  IconSprout,
  IconSettings,
} from '../components/icons';
import {
  apiGetActivityTypes,
  apiCreateActivityType,
  apiUpdateActivityType,
  apiDeleteActivityType,
  apiSeedActivityTypes
} from '../services/api';

const DEFAULT_ICONS = [
  { label: 'Cây / Lá', value: 'leaf' },
  { label: 'Phân bón', value: 'flask' },
  { label: 'Tưới nước', value: 'droplets' },
  { label: 'Thu hoạch', value: 'shopping-bag' },
  { label: 'Cắt tỉa', value: 'scissors' },
  { label: 'Làm đất', value: 'shovel' },
  { label: 'Phun thuốc', value: 'shield' },
  { label: 'Khác', value: 'sun' },
];

export default function ActivityTypesModal({ isOpen, onClose, farmId, onTypesChanged }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'leaf'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTypes();
    }
  }, [isOpen, farmId]);

  const loadTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetActivityTypes(farmId);
      setTypes(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách loại hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await apiSeedActivityTypes();
      setSuccess('Đã khởi tạo các loại hoạt động mẫu thành công!');
      await loadTypes();
      if (onTypesChanged) onTypesChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi khởi tạo danh mục mẫu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên loại hoạt động');
      return;
    }

    // Tự sinh code nếu trống
    const code = formData.code.trim()
      ? formData.code.trim().toUpperCase().replace(/\s+/g, '_')
      : formData.name.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "_");

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await apiUpdateActivityType(editingId, {
          name: formData.name,
          description: formData.description,
          icon: formData.icon
        });
        setSuccess('Cập nhật loại hoạt động thành công!');
      } else {
        await apiCreateActivityType({
          name: formData.name,
          code,
          description: formData.description,
          icon: formData.icon,
          farmId: farmId || null
        });
        setSuccess('Thêm mới loại hoạt động thành công!');
      }
      setFormData({ name: '', code: '', description: '', icon: 'leaf' });
      setEditingId(null);
      await loadTypes();
      if (onTypesChanged) onTypesChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu loại hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      icon: item.icon || 'leaf'
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', code: '', description: '', icon: 'leaf' });
    setError('');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await apiDeleteActivityType(id);
      setSuccess('Đã xóa loại hoạt động');
      setConfirmDeleteId(null);
      await loadTypes();
      if (onTypesChanged) onTypesChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa loại hoạt động này (có thể là loại mặc định)');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="activity-modal-overlay" onClick={onClose}>
      <div className="activity-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="activity-modal-header">
          <div className="activity-modal-title">
            <span className="activity-icon-badge"><IconSettings size={18} /></span>
            <div>
              <h3>Quản lý Loại Hoạt Động Canh Tác</h3>
              <p className="subtitle">Tự do thêm, sửa, xóa loại hoạt động phù hợp với mô hình nông trại của bạn</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="activity-alert error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlertTriangle size={18} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="activity-alert success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCheckCircle size={18} /> <span>{success}</span>
          </div>
        )}

        <div className="activity-modal-body">
          {/* Form thêm / sửa */}
          <form className="activity-form-card" onSubmit={handleSave}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {editingId ? (
                <>
                  <IconPenLine size={16} /> Chỉnh sửa loại hoạt động
                </>
              ) : (
                <>
                  <IconPlus size={16} /> Thêm loại hoạt động mới
                </>
              )}
            </h4>
            <div className="activity-form-row">
              <div className="form-group flex-2">
                <label>Tên hoạt động <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="VD: Bao trái cây, Thụ phấn bổ sung..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Mã ký hiệu</label>
                <input
                  type="text"
                  placeholder="VD: BAO_TRAI"
                  value={formData.code}
                  disabled={!!editingId}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="form-group flex-1">
                <label>Biểu tượng</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {DEFAULT_ICONS.map((ic) => (
                    <option key={ic.value} value={ic.value}>
                      {ic.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả chi tiết / Hướng dẫn kỹ thuật</label>
              <input
                type="text"
                placeholder="Ghi chú thêm về quy trình, liều lượng, lưu ý..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-actions-row">
              {editingId && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                  Hủy sửa
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm hoạt động'}
              </button>
            </div>
          </form>

          {/* Danh sách các loại hoạt động */}
          <div className="activity-list-section">
            <div className="activity-list-header">
              <h4>Danh sách loại hoạt động ({types.length})</h4>
              {types.length === 0 && (
                <button className="btn-seed" onClick={handleSeed} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconSprout size={16} /> Tạo danh mục mặc định chuẩn
                </button>
              )}
            </div>

            {loading && types.length === 0 ? (
              <div className="loading-spinner">Đang tải danh mục...</div>
            ) : (
              <div className="activity-items-grid">
                {types.map((item) => (
                  <div key={item.id} className={`activity-type-item ${item.isSystem ? 'is-system' : 'custom'}`}>
                    <div className="item-info">
                      <div className="item-title-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-code-tag">{item.code}</span>
                        {item.isSystem ? (
                          <span className="badge-system" title="Loại chuẩn của hệ thống">Mặc định</span>
                        ) : (
                          <span className="badge-custom" title="Nông hộ tự định nghĩa">Tự tạo</span>
                        )}
                      </div>
                      {item.description && <p className="item-desc">{item.description}</p>}
                    </div>

                    <div className="item-actions">
                      <button
                        className="btn-item-edit"
                        title="Chỉnh sửa"
                        onClick={() => handleEdit(item)}
                      >
                        <IconPenLine size={14} />
                      </button>
                      {!item.isSystem && (
                        confirmDeleteId === item.id ? (
                          <div className="confirm-delete-box">
                            <span>Xóa?</span>
                            <button
                              className="btn-confirm-yes"
                              onClick={() => handleDelete(item.id)}
                            >
                              Có
                            </button>
                            <button
                              className="btn-confirm-no"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Không
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-item-delete"
                            title="Xóa loại này"
                            onClick={() => setConfirmDeleteId(item.id)}
                          >
                            <IconTrash size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
