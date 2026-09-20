import React, { useState, useEffect } from 'react';
import './ActivityTypesModal.css';
import {
  apiGetActivityTypes,
  apiCreateActivityType,
  apiUpdateActivityType,
  apiDeleteActivityType,
  apiSeedActivityTypes
} from '../../services/api';

export default function ActivityTypesModal({
  isOpen,
  onClose,
  farmId,
  onTypesChanged,
  onSelectActivity,
  selectedActivityCode
}) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isListOpen, setIsListOpen] = useState(false); // Thu gọn danh sách thành dropdown
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTypes();
      setIsListOpen(false); // Mặc định mở modal là thu gọn danh sách
    }
  }, [isOpen, farmId]);

  const showSuccessMsg = (msg) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetActivityTypes(farmId);
      setTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Không thể tải danh sách loại hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await apiSeedActivityTypes();
      showSuccessMsg('Đã khởi tạo các hoạt động mẫu thành công!');
      await loadTypes();
      setIsListOpen(true); // Tự mở ra sau khi seed để người dùng xem
      if (onTypesChanged) onTypesChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi khởi tạo danh mục mẫu');
    } finally {
      setLoading(false);
    }
  };

  // Lưu hoạt động (thêm mới hoặc sửa)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên hoạt động');
      return;
    }

    // Tự động sinh mã ngầm
    const code = formData.name
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || `HOAT_DONG_${Date.now().toString().slice(-4)}`;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await apiUpdateActivityType(editingId, {
          name: formData.name.trim(),
          description: formData.description?.trim() || null
        });
        showSuccessMsg('Đã cập nhật hoạt động thành công!');
      } else {
        await apiCreateActivityType({
          name: formData.name.trim(),
          code,
          description: formData.description?.trim() || null,
          farmId: farmId || null
        });
        showSuccessMsg(`Đã thêm hoạt động "${formData.name.trim()}"!`);
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
      await loadTypes();
      if (onTypesChanged) onTypesChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || ''
    });
    setError('');
    setSuccess('');
    // Giữ danh sách mở khi đang chọn sửa
    setIsListOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await apiDeleteActivityType(id);
      showSuccessMsg('Đã xóa hoạt động thành công');
      setConfirmDeleteId(null);
      await loadTypes();
      if (onTypesChanged) onTypesChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa hoạt động này');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    if (onSelectActivity) {
      onSelectActivity(item.code, item);
    }
    onClose();
  };

  // Lọc theo từ khóa tìm kiếm nếu có
  const filteredTypes = types.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(term)) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="activity-modal-overlay" onClick={onClose}>
      <div className="activity-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header gọn gàng */}
        <div className="activity-modal-header">
          <div>
            <h3>Quản lý loại hoạt động canh tác</h3>
            <p className="subtitle">Tùy chỉnh danh mục công việc phù hợp với mô hình vườn của bạn</p>
          </div>
          <button className="btn-close" onClick={onClose} title="Đóng">&times;</button>
        </div>

        {/* Thông báo */}
        {error && <div className="activity-alert error">{error}</div>}
        {success && <div className="activity-alert success">{success}</div>}

        <div className="activity-modal-body">
          {/* Form thêm / sửa ngắn gọn */}
          <form className="compact-add-card" onSubmit={handleSave}>
            <div className="compact-card-title">
              {editingId ? 'Chỉnh sửa hoạt động' : 'Thêm hoạt động mới'}
            </div>

            <div className="compact-form-row">
              <div className="compact-field-name">
                <label>Tên hoạt động <span className="req">*</span></label>
                <input
                  type="text"
                  className="compact-input"
                  placeholder="VD: Bao trái cây, Thụ phấn..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="compact-field-desc">
                <label>Ghi chú / Mô tả (tùy chọn)</label>
                <input
                  type="text"
                  className="compact-input"
                  placeholder="Ghi chú thêm nếu cần..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="compact-field-actions">
                <button
                  type="submit"
                  className="btn-compact-submit"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? 'Lưu...' : editingId ? 'Lưu' : '+ Thêm'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn-compact-cancel"
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Gom danh sách hoạt động thành Dropdown xổ xuống khi ấn */}
          <div className="activity-dropdown-section">
            <button
              type="button"
              className={`activity-dropdown-trigger ${isListOpen ? 'is-open' : ''}`}
              onClick={() => setIsListOpen(!isListOpen)}
            >
              <div className="dropdown-trigger-info">
                <span className="dropdown-trigger-title">
                  Danh sách hoạt động đã có ({types.length})
                </span>
                <span className="dropdown-trigger-hint">
                  {isListOpen ? 'Bấm để thu gọn danh sách' : 'Bấm vào đây để xem, sửa hoặc xóa hoạt động'}
                </span>
              </div>
              <span className="dropdown-arrow-badge">
                {isListOpen ? '▲ Thu gọn' : '▼ Mở xem'}
              </span>
            </button>

            {/* Nội dung danh sách xổ xuống */}
            {isListOpen && (
              <div className="activity-dropdown-content">
                <div className="dropdown-content-tools">
                  {types.length > 5 && (
                    <input
                      type="text"
                      className="compact-search-input"
                      placeholder="Tìm nhanh theo tên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  )}
                  {types.length === 0 && (
                    <button
                      type="button"
                      className="btn-compact-seed"
                      onClick={handleSeed}
                      disabled={loading}
                    >
                      Tạo danh mục mẫu
                    </button>
                  )}
                </div>

                {loading && types.length === 0 ? (
                  <div className="compact-loading">Đang tải danh sách...</div>
                ) : filteredTypes.length === 0 ? (
                  <div className="compact-empty">Không tìm thấy hoạt động nào</div>
                ) : (
                  <div className="compact-list-scroll">
                    {filteredTypes.map((item) => (
                      <div
                        key={item.id}
                        className={`compact-item-row ${item.isSystem ? 'is-system' : 'is-custom'}`}
                      >
                        <div className="compact-item-left">
                          <span className="compact-item-name">{item.name}</span>
                          {item.description && (
                            <span className="compact-item-desc" title={item.description}>
                              — {item.description}
                            </span>
                          )}
                        </div>

                        <div className="compact-item-right">
                          {item.isSystem ? (
                            <span className="tag-system">Mặc định</span>
                          ) : (
                            <span className="tag-custom">Tự tạo</span>
                          )}

                          <button
                            type="button"
                            className={`btn-compact-select ${item.code === selectedActivityCode ? 'is-selected' : ''}`}
                            onClick={() => handleSelect(item)}
                            title={`Chọn "${item.name}" cho nhật ký`}
                          >
                            {item.code === selectedActivityCode ? 'Đang chọn' : 'Chọn'}
                          </button>

                          <button
                            type="button"
                            className="btn-compact-edit"
                            onClick={() => handleEdit(item)}
                            title="Chỉnh sửa"
                          >
                            Sửa
                          </button>

                          {!item.isSystem && (
                            confirmDeleteId === item.id ? (
                              <div className="compact-inline-confirm">
                                <span>Xóa?</span>
                                <button
                                  type="button"
                                  className="btn-confirm-yes"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  Có
                                </button>
                                <button
                                  type="button"
                                  className="btn-confirm-no"
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Không
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn-compact-delete"
                                onClick={() => setConfirmDeleteId(item.id)}
                                title="Xóa hoạt động này"
                              >
                                Xóa
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
