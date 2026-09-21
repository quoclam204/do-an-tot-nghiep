import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  IconWarehouse,
  IconPlus,
  IconSearch,
  IconPenLine,
  IconTrash,
  IconX,
  IconCheckCircle,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
  IconCalendar,
  IconFilter,
  IconDollarSign,
  IconFileText,
  IconBanknote,
  IconCoins,
} from '../../components/icons';
import {
  apiGetInventory,
  apiCreateInventory,
  apiUpdateInventory,
  apiDeleteInventory,
  apiGetMaterials,
  apiGetMyFarms,
  apiGetActivityLogs,
} from '../../services/api';
import './InventoryPage.css';

const TYPE_LABELS = {
  PHAN_BON: 'Phân bón',
  THUOC_BVTV: 'Thuốc BVTV',
  GIONG: 'Giống',
  KHAC: 'Khác',
};

const ACTIVITY_LABELS = {
  BON_PHAN: 'Bón phân',
  PHUN_THUOC: 'Phun thuốc BVTV',
  CAT_TIA: 'Cắt tỉa cành',
  LAM_CO: 'Làm cỏ / Xới đất',
  TUOI_NUOC: 'Tưới nước',
  THU_HOACH: 'Thu hoạch',
};

const formatVNDWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return '';
  if (num >= 1e9) {
    const b = (num / 1e9).toFixed(2).replace(/\.?0+$/, '');
    return `${b} tỷ đồng`;
  }
  if (num >= 1e6) {
    const m = (num / 1e6).toFixed(2).replace(/\.?0+$/, '');
    return `${m} triệu đồng`;
  }
  if (num >= 1e3) {
    const k = (num / 1e3).toFixed(1).replace(/\.?0+$/, '');
    return `${k} nghìn đồng`;
  }
  return `${Number(num).toLocaleString('vi-VN')} đồng`;
};

export default function InventoryPage() {
  const [inventories, setInventories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [farms, setFarms] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'history'

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    farmId: '',
    materialId: '',
    quantity: '',
    unitPrice: '',
    totalCost: '',
  });
  const [adjustData, setAdjustData] = useState({
    quantity: '',
    reason: '',
  });

  // Notification / Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, matRes, farmRes, logRes] = await Promise.allSettled([
        apiGetInventory(),
        apiGetMaterials(),
        apiGetMyFarms(),
        apiGetActivityLogs(),
      ]);

      if (invRes.status === 'fulfilled') setInventories(invRes.value || []);
      if (matRes.status === 'fulfilled') setMaterials(matRes.value || []);
      if (farmRes.status === 'fulfilled') setFarms(farmRes.value || []);
      if (logRes.status === 'fulfilled') setActivityLogs(logRes.value || []);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải dữ liệu tồn kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered inventory list
  const filteredInventories = useMemo(() => {
    return inventories.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.farm?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFarm = !selectedFarm || item.farmId === selectedFarm;
      const matchType = !selectedType || item.material?.type === selectedType;

      return matchSearch && matchFarm && matchType;
    });
  }, [inventories, searchTerm, selectedFarm, selectedType]);

  // Statistics
  const stats = useMemo(() => {
    const totalItems = inventories.length;
    const totalValue = inventories.reduce((sum, item) => {
      const val = Number(item.totalCost) > 0
        ? Number(item.totalCost)
        : (Number(item.quantity || 0) * Number(item.material?.defaultPrice || 0));
      return sum + val;
    }, 0);
    const lowStockCount = inventories.filter((item) => Number(item.quantity) <= 5).length;
    const outOfStockCount = inventories.filter((item) => Number(item.quantity) <= 0).length;

    return { totalItems, totalValue, lowStockCount, outOfStockCount };
  }, [inventories]);

  // Selected material in modal for unit & price info
  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === formData.materialId) || null;
  }, [materials, formData.materialId]);

  // Handle open add modal
  const handleOpenAdd = () => {
    if (!farms || farms.length === 0) {
      showToast('Bạn chưa có nông hộ nào. Vui lòng tạo nông hộ trước khi nhập kho!', 'error');
      return;
    }
    const defaultFarmId = selectedFarm || farms[0]?.id || '';
    const defaultMat = materials[0];
    const defaultPrice = defaultMat ? Number(defaultMat.defaultPrice) || 0 : 0;
    setFormData({
      farmId: defaultFarmId,
      materialId: defaultMat?.id || '',
      quantity: '',
      unitPrice: defaultPrice,
      totalCost: 0,
    });
    setShowAddModal(true);
  };

  // Handle material selection change in Add Modal to auto-fill unitPrice
  const handleMaterialChange = (materialId) => {
    const mat = materials.find((m) => m.id === materialId);
    const price = mat ? Number(mat.defaultPrice) || 0 : 0;
    const qty = Number(formData.quantity) || 0;
    setFormData((prev) => ({
      ...prev,
      materialId,
      unitPrice: price,
      totalCost: qty > 0 && price > 0 ? qty * price : 0,
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (qty) => {
    const num = Number(qty) || 0;
    const price = Number(formData.unitPrice) || 0;
    setFormData((prev) => ({
      ...prev,
      quantity: qty,
      totalCost: num > 0 && price > 0 ? num * price : 0,
    }));
  };

  // Submit Add / Import
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!formData.farmId || !formData.materialId || !formData.quantity || Number(formData.quantity) <= 0) {
      showToast('Vui lòng chọn nông hộ, vật tư và nhập số lượng hợp lệ (> 0)', 'error');
      return;
    }

    try {
      await apiCreateInventory({
        farmId: formData.farmId,
        materialId: formData.materialId,
        quantity: Number(formData.quantity),
        totalCost: Number(formData.totalCost || 0),
      });
      showToast('Nhập kho vật tư thành công (Đã cập nhật/cộng dồn vào kho)!');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi nhập kho', 'error');
    }
  };

  // Open adjust modal
  const handleOpenAdjust = (item) => {
    setCurrentEditItem(item);
    setAdjustData({
      quantity: item.quantity,
      reason: 'Kiểm kê định kỳ',
    });
    setShowAdjustModal(true);
  };

  // Submit adjust
  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (adjustData.quantity === '' || Number(adjustData.quantity) < 0) {
      showToast('Số lượng tồn không hợp lệ', 'error');
      return;
    }

    try {
      const unitPrice =
        currentEditItem.totalCost && currentEditItem.quantity > 0
          ? currentEditItem.totalCost / currentEditItem.quantity
          : currentEditItem.material?.defaultPrice || 0;

      const newTotalCost = Number(adjustData.quantity) * unitPrice;

      await apiUpdateInventory(currentEditItem.id, {
        quantity: Number(adjustData.quantity),
        totalCost: newTotalCost,
      });
      showToast('Cập nhật kiểm kê tồn kho thành công!');
      setShowAdjustModal(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi điều chỉnh tồn kho', 'error');
    }
  };

  // Delete inventory
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi tồn kho của "${name}" không?`)) return;

    try {
      await apiDeleteInventory(id);
      showToast('Đã xóa thành công');
      loadData();
    } catch (err) {
      showToast('Lỗi khi xóa bản ghi tồn kho', 'error');
    }
  };

  return (
    <div className="inventory-page-wrapper">
      <Header />

      <main className="inventory-main container">
        {toast.show && (
          <div className={`inventory-toast ${toast.type}`}>
            {toast.type === 'success' ? <IconCheckCircle size={18} /> : <IconAlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="page-top-bar">
          <div>
            <h1 className="page-title">
              <IconWarehouse className="title-icon" /> Quản lý Tồn kho Vật tư
            </h1>
            <p className="page-subtitle">
              Kiểm soát xuất nhập tồn phân bón, thuốc BVTV và vật tư theo từng nông hộ
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <IconPlus size={18} /> Nhập kho mới
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-blue">
              <IconWarehouse size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Tổng mặt hàng tồn</div>
              <div className="stat-value">{stats.totalItems}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-green">
              <IconDollarSign size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Tổng giá trị tồn kho</div>
              <div className="stat-value">{stats.totalValue.toLocaleString('vi-VN')} đ</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-orange">
              <IconAlertCircle size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Cảnh báo sắp hết (≤ 5)</div>
              <div className="stat-value text-orange">{stats.lowStockCount}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-red">
              <IconX size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Đã hết hàng (0)</div>
              <div className="stat-value text-red">{stats.outOfStockCount}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="inventory-tabs">
          <button
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <IconWarehouse size={16} /> Danh sách Tồn kho
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <IconFileText size={16} /> Lịch sử xuất dùng vật tư ({activityLogs.filter(l => l.materials?.length > 0).length})
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <>
            {/* Filter Bar */}
            <div className="filter-card">
              <div className="search-box">
                <IconSearch size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên vật tư, nông hộ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="clear-btn" onClick={() => setSearchTerm('')}>
                    <IconX size={16} />
                  </button>
                )}
              </div>

              <div className="filter-group">
                <select
                  value={selectedFarm}
                  onChange={(e) => setSelectedFarm(e.target.value)}
                  className="filter-select"
                >
                  <option value="">-- Tất cả nông hộ --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="filter-select"
                >
                  <option value="">-- Tất cả nhóm vật tư --</option>
                  <option value="PHAN_BON">Phân bón</option>
                  <option value="THUOC_BVTV">Thuốc BVTV</option>
                  <option value="GIONG">Giống</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>
            </div>

            {/* Table or Card list */}
            {loading ? (
              <div className="loading-state">Đang tải dữ liệu tồn kho...</div>
            ) : filteredInventories.length === 0 ? (
              <div className="empty-state">
                <IconWarehouse size={48} className="empty-icon" />
                <h3>Chưa có dữ liệu tồn kho</h3>
                {farms.length === 0 ? (
                  <p>Tài khoản của bạn chưa thuộc về nông hộ/trang trại nào. Vui lòng tạo nông hộ trong mục <strong>Quản lý &gt; Vườn trại & Phân lô</strong> trước khi quản lý tồn kho.</p>
                ) : (
                  <p>Nhấn nút "Nhập kho mới" để bắt đầu theo dõi vật tư của trang trại.</p>
                )}
                <button className="btn btn-primary" onClick={handleOpenAdd}>
                  <IconPlus size={16} /> Nhập kho ngay
                </button>
              </div>
            ) : (
              <>
                {/* Desktop View: Table */}
                <div className="table-responsive desktop-view">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Vật tư</th>
                        <th>Nhóm</th>
                        <th>Nông hộ</th>
                        <th>Số lượng tồn</th>
                        <th>Ước tính giá trị</th>
                        <th>Trạng thái</th>
                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventories.map((item) => {
                        const qty = Number(item.quantity);
                        let statusBadge = <span className="status-tag status-ok">Đầy đủ</span>;
                        if (qty <= 0) {
                          statusBadge = <span className="status-tag status-out">Hết hàng</span>;
                        } else if (qty <= 5) {
                          statusBadge = <span className="status-tag status-low">Sắp hết</span>;
                        }

                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="item-name-cell">
                                <strong>{item.material?.name || 'Vật tư chưa đặt tên'}</strong>
                                <span className="item-unit">({item.material?.unit || 'Đơn vị'})</span>
                              </div>
                            </td>
                            <td>
                              <span className={`type-badge badge-${item.material?.type?.toLowerCase()}`}>
                                {TYPE_LABELS[item.material?.type] || item.material?.type || 'Chung'}
                              </span>
                            </td>
                            <td>{item.farm?.name || 'N/A'}</td>
                            <td>
                              <div className="stock-quantity">
                                <span className="qty-number">{qty.toLocaleString('vi-VN')}</span>
                                <span className="qty-unit">{item.material?.unit}</span>
                              </div>
                            </td>
                            <td>
                              <strong>{((Number(item.totalCost) > 0 ? Number(item.totalCost) : (Number(item.quantity || 0) * Number(item.material?.defaultPrice || 0)))).toLocaleString('vi-VN')} đ</strong>
                            </td>
                            <td>{statusBadge}</td>
                            <td className="text-center">
                              <div className="action-btns">
                                <button
                                  className="action-btn edit-btn"
                                  title="Kiểm kê / Điều chỉnh"
                                  onClick={() => handleOpenAdjust(item)}
                                >
                                  <IconPenLine size={16} />
                                </button>
                                <button
                                  className="action-btn delete-btn"
                                  title="Xóa"
                                  onClick={() => handleDelete(item.id, item.material?.name)}
                                >
                                  <IconTrash size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="mobile-inventory-list mobile-view">
                  {filteredInventories.map((item) => {
                    const qty = Number(item.quantity);
                    let statusBadge = <span className="status-tag status-ok">Đầy đủ</span>;
                    if (qty <= 0) {
                      statusBadge = <span className="status-tag status-out">Hết hàng</span>;
                    } else if (qty <= 5) {
                      statusBadge = <span className="status-tag status-low">Sắp hết</span>;
                    }

                    return (
                      <div className="mobile-inventory-card" key={item.id}>
                        <div className="mic-top-row">
                          <div className="mic-title-wrap">
                            <h4 className="mic-item-name">{item.material?.name || 'Vật tư chưa đặt tên'}</h4>
                            <span className="mic-item-unit">({item.material?.unit || 'Đơn vị'})</span>
                          </div>
                          <div className="mic-badges">
                            <span className={`type-badge badge-${item.material?.type?.toLowerCase()}`}>
                              {TYPE_LABELS[item.material?.type] || item.material?.type || 'Chung'}
                            </span>
                            {statusBadge}
                          </div>
                        </div>

                        <div className="mic-farm-row">
                          <IconWarehouse size={15} className="mic-farm-icon" />
                          <span className="mic-farm-name">{item.farm?.name || 'Chưa gắn nông hộ'}</span>
                        </div>

                        <div className="mic-metrics-grid">
                          <div className="mic-metric-item">
                            <span className="mic-metric-label">Số lượng tồn</span>
                            <div className="mic-metric-value">
                              <span className="mic-qty-num">{qty.toLocaleString('vi-VN')}</span>
                              <span className="mic-qty-unit">{item.material?.unit}</span>
                            </div>
                          </div>

                          <div className="mic-metric-item">
                            <span className="mic-metric-label">Ước tính giá trị</span>
                            <div className="mic-metric-value">
                              <span className="mic-cost-num">{((Number(item.totalCost) > 0 ? Number(item.totalCost) : (Number(item.quantity || 0) * Number(item.material?.defaultPrice || 0)))).toLocaleString('vi-VN')} đ</span>
                            </div>
                          </div>
                        </div>

                        <div className="mic-actions">
                          <button
                            className="mic-btn mic-btn-edit"
                            onClick={() => handleOpenAdjust(item)}
                          >
                            <IconPenLine size={15} /> Kiểm kê / Điều chỉnh
                          </button>
                          <button
                            className="mic-btn mic-btn-delete"
                            onClick={() => handleDelete(item.id, item.material?.name)}
                            title="Xóa"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          /* Usage History Tab */
          <div className="history-tab-content">
            <div className="history-header">
              <h3>Nhật ký tiêu thụ vật tư thực tế ngoài hiện trường</h3>
              <p>Tự động ghi nhận mỗi khi bà con lưu nhật ký bón phân, phun thuốc, chăm sóc cây trồng.</p>
            </div>

            {/* Desktop View: History Table */}
            <div className="table-responsive desktop-view">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Ngày dùng</th>
                    <th>Nông hộ / Lô</th>
                    <th>Hoạt động canh tác</th>
                    <th>Vật tư đã dùng</th>
                    <th>Số lượng</th>
                    <th>Chi phí vật tư</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredLogs = activityLogs.filter((log) => {
                      const hasMat = log.materials && log.materials.length > 0;
                      const matchFarm = !selectedFarm || log.cropCycle?.plot?.farmId === selectedFarm;
                      return hasMat && matchFarm;
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-muted" style={{ padding: '2rem' }}>
                            Chưa có lịch sử xuất dùng vật tư nào cho nông hộ đã chọn.
                          </td>
                        </tr>
                      );
                    }

                    return filteredLogs.map((log) =>
                      log.materials.map((m, idx) => {
                        const qtyUsed = m.quantityUsed ?? m.quantity ?? 0;
                        const costVal = Number(m.cost ?? m.totalPrice ?? 0) > 0
                          ? Number(m.cost ?? m.totalPrice)
                          : qtyUsed * Number(m.material?.defaultPrice || 0);

                        return (
                          <tr key={`${log.id}-${idx}`}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {new Date(log.activityDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td>
                              <strong>{log.cropCycle?.plot?.farm?.name || 'Nông hộ'}</strong>
                              {log.cropCycle?.plot?.name && (
                                <div className="text-muted-xs" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Lô: {log.cropCycle?.plot?.name}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`activity-badge badge-${log.activityType?.toLowerCase()}`}>
                                {ACTIVITY_LABELS[log.activityType] || log.activityType}
                              </span>
                            </td>
                            <td>
                              <strong>{m.material?.name || 'Vật tư'}</strong>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <strong>{qtyUsed.toLocaleString('vi-VN')}</strong> {m.material?.unit || ''}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <strong style={{ color: '#dc2626' }}>{costVal.toLocaleString('vi-VN')} đ</strong>
                            </td>
                            <td>{log.notes || '—'}</td>
                          </tr>
                        );
                      })
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Mobile View: History Cards */}
            <div className="mobile-history-list mobile-view">
              {(() => {
                const filteredLogs = activityLogs.filter((log) => {
                  const hasMat = log.materials && log.materials.length > 0;
                  const matchFarm = !selectedFarm || log.cropCycle?.plot?.farmId === selectedFarm;
                  return hasMat && matchFarm;
                });

                if (filteredLogs.length === 0) {
                  return (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                      Chưa có lịch sử xuất dùng vật tư nào.
                    </div>
                  );
                }

                return filteredLogs.map((log) =>
                  log.materials.map((m, idx) => {
                    const qtyUsed = m.quantityUsed ?? m.quantity ?? 0;
                    const costVal = Number(m.cost ?? m.totalPrice ?? 0) > 0
                      ? Number(m.cost ?? m.totalPrice)
                      : qtyUsed * Number(m.material?.defaultPrice || 0);

                    return (
                      <div className="mobile-history-card" key={`${log.id}-${idx}`}>
                        <div className="mhc-header">
                          <div className="mhc-date">
                            <IconCalendar size={14} />
                            <span>{new Date(log.activityDate).toLocaleDateString('vi-VN')}</span>
                            {log.cropCycle?.plot?.farm?.name && (
                              <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 4 }}>
                                • {log.cropCycle.plot.farm.name}
                              </span>
                            )}
                          </div>
                          <span className={`activity-badge badge-${log.activityType?.toLowerCase()}`}>
                            {ACTIVITY_LABELS[log.activityType] || log.activityType}
                          </span>
                        </div>
                        <div className="mhc-body">
                          <div className="mhc-mat-name">{m.material?.name || 'Vật tư'}</div>
                          <div className="mhc-stats">
                            <div className="mhc-stat">
                              <span className="mhc-label">Đã dùng:</span>
                              <strong>{qtyUsed.toLocaleString('vi-VN')} {m.material?.unit || ''}</strong>
                            </div>
                            <div className="mhc-stat">
                              <span className="mhc-label">Chi phí:</span>
                              <strong style={{ color: '#dc2626' }}>{costVal.toLocaleString('vi-VN')} đ</strong>
                            </div>
                          </div>
                          {log.notes && (
                            <div className="mhc-notes">
                              <span className="mhc-label">Ghi chú:</span> {log.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                );
              })()}
            </div>
          </div>
        )}

        {/* MODAL: Nhập kho mới */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>
                  <IconPlus size={20} /> Nhập kho vật tư
                </h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <IconX size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveAdd} className="modal-body">
                <div className="form-group">
                  <label>Chọn nông hộ / Trang trại *</label>
                  <select
                    value={formData.farmId}
                    onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn nông hộ --</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chọn vật tư từ danh mục *</label>
                  <select
                    value={formData.materialId}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn vật tư --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit} - Giá chuẩn: {Number(m.defaultPrice).toLocaleString('vi-VN')}đ)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Số lượng nhập * {selectedMaterial?.unit && <span className="unit-hint">({selectedMaterial.unit})</span>}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder={`VD: 50`}
                      value={formData.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>Đơn giá niêm yết (Cố định)</label>
                    <div className="readonly-price-box">
                      <span className="price-num">
                        {Number(formData.unitPrice || 0).toLocaleString('vi-VN')} đ
                      </span>
                      <span className="price-unit">/ {selectedMaterial?.unit || 'đơn vị'}</span>
                    </div>
                  </div>
                </div>

                {/* Khối Tổng giá trị nhập kho (Tự động tính, không cho sửa) */}
                <div className="total-calculation-card">
                  <div className="calc-header">
                    <span className="calc-title">
                      <IconCoins size={17} className="calc-icon" /> Tổng giá trị nhập kho
                    </span>
                    <span className="calc-badge">Tự động tính</span>
                  </div>

                  <div className="calc-amount">
                    <span className="amount-number">
                      {Number(formData.totalCost || 0).toLocaleString('vi-VN')}
                    </span>
                    <span className="amount-currency">VNĐ</span>
                  </div>

                  {Number(formData.totalCost) > 0 && (
                    <div className="calc-words">
                      Bằng chữ: <em>{formatVNDWords(Number(formData.totalCost))}</em>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <IconCheckCircle size={18} /> Xác nhận nhập kho
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Điều chỉnh / Kiểm kê */}
        {showAdjustModal && currentEditItem && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>
                  <IconPenLine size={20} /> Kiểm kê & Điều chỉnh tồn kho
                </h3>
                <button className="close-btn" onClick={() => setShowAdjustModal(false)}>
                  <IconX size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveAdjust} className="modal-body">
                <p className="modal-desc">
                  Vật tư: <strong>{currentEditItem.material?.name}</strong> ({currentEditItem.material?.unit})
                  <br />
                  Nông hộ: <strong>{currentEditItem.farm?.name}</strong>
                </p>

                <div className="form-group">
                  <label>Số lượng thực tế sau kiểm kê *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Lý do điều chỉnh</label>
                  <select
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  >
                    <option value="Kiểm kê định kỳ">Kiểm kê định kỳ</option>
                    <option value="Thất thoát / Hư hỏng">Thất thoát / Hư hỏng</option>
                    <option value="Bù sai số cân đo">Bù sai số cân đo</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu kết quả kiểm kê
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
