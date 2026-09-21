import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
  IconCheckCircle,
  IconAlertCircle,
  IconCalendar,
  IconDollarSign,
  IconSprout,
  IconFileText,
  IconScale,
  IconWarehouse,
} from '../../components/icons';
import {
  apiGetActivityLogs,
  apiCreateActivityLog,
  apiDeleteActivityLog,
  apiGetSeasons,
  apiGetMyFarms,
} from '../../services/api';
import './HarvestPage.css';

export default function HarvestPage() {
  const [harvestLogs, setHarvestLogs] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedFarm, setSelectedFarm] = useState('');

  // Modal Ghi nhận thu hoạch
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    cropCycleId: '',
    activityDate: new Date().toISOString().split('T')[0],
    harvestQuantity: '',
    unit: 'kg',
    unitPrice: '',
    revenue: '',
    harvestBatch: 'Đợt 1',
    buyer: '',
    notes: '',
  });

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
      const [logRes, seasonRes, farmRes] = await Promise.allSettled([
        apiGetActivityLogs(),
        apiGetSeasons(),
        apiGetMyFarms(),
      ]);

      if (logRes.status === 'fulfilled') {
        const allLogs = logRes.value || [];
        // Lọc các bản ghi có loại THU_HOACH hoặc có harvestQuantity
        const harvests = allLogs.filter(
          (l) => l.activityType === 'THU_HOACH' || Number(l.harvestQuantity) > 0 || Number(l.revenue) > 0
        );
        setHarvestLogs(harvests);
      }
      if (seasonRes.status === 'fulfilled') setSeasons(seasonRes.value || []);
      if (farmRes.status === 'fulfilled') setFarms(farmRes.value || []);
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải dữ liệu thu hoạch', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tính toán doanh thu khi sửa số lượng hoặc đơn giá
  const handleQuantityChange = (val) => {
    const qty = Number(val) || 0;
    const price = Number(formData.unitPrice) || 0;
    setFormData((prev) => ({
      ...prev,
      harvestQuantity: val,
      revenue: qty > 0 && price > 0 ? qty * price : prev.revenue,
    }));
  };

  const handlePriceChange = (val) => {
    const price = Number(val) || 0;
    const qty = Number(formData.harvestQuantity) || 0;
    setFormData((prev) => ({
      ...prev,
      unitPrice: val,
      revenue: qty > 0 && price > 0 ? qty * price : prev.revenue,
    }));
  };

  // Mùa vụ theo nông hộ đang chọn
  const availableSeasons = useMemo(() => {
    if (!selectedFarm) return seasons;
    return seasons.filter(
      (s) =>
        s.plot?.farmId === selectedFarm ||
        s.plot?.farm?.id === selectedFarm ||
        s.farmId === selectedFarm
    );
  }, [seasons, selectedFarm]);

  // Filtered list
  const filteredHarvests = useMemo(() => {
    return harvestLogs.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cropCycle?.plot?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cropCycle?.crop?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeason = !selectedSeason || item.cropCycleId === selectedSeason;

      const matchFarm =
        !selectedFarm ||
        item.cropCycle?.plot?.farmId === selectedFarm ||
        item.cropCycle?.plot?.farm?.id === selectedFarm ||
        item.cropCycle?.farmId === selectedFarm;

      return matchSearch && matchSeason && matchFarm;
    });
  }, [harvestLogs, searchTerm, selectedSeason, selectedFarm]);

  // Statistics
  const stats = useMemo(() => {
    const totalBatches = filteredHarvests.length;
    const totalQuantityKg = filteredHarvests.reduce((sum, h) => sum + (Number(h.harvestQuantity) || 0), 0);
    const totalRevenue = filteredHarvests.reduce((sum, h) => sum + (Number(h.revenue) || 0), 0);
    const avgPrice = totalQuantityKg > 0 ? Math.round(totalRevenue / totalQuantityKg) : 0;

    return { totalBatches, totalQuantityKg, totalRevenue, avgPrice };
  }, [filteredHarvests]);

  // Submit new harvest
  const handleSubmitHarvest = async (e) => {
    e.preventDefault();
    if (!formData.cropCycleId || !formData.harvestQuantity) {
      showToast('Bác nông dân vui lòng chọn mùa vụ và nhập sản lượng thu hoạch', 'error');
      return;
    }

    try {
      const fullNotes = [
        formData.harvestBatch ? `[${formData.harvestBatch}]` : '',
        formData.buyer ? `Bán cho: ${formData.buyer}` : '',
        formData.notes ? formData.notes : '',
      ]
        .filter(Boolean)
        .join(' - ');

      await apiCreateActivityLog({
        cropCycleId: formData.cropCycleId,
        activityType: 'THU_HOACH',
        activityDate: formData.activityDate,
        harvestQuantity: Number(formData.harvestQuantity),
        unitPrice: Number(formData.unitPrice || 0),
        revenue: Number(formData.revenue || 0),
        notes: fullNotes,
        syncStatus: 'SYNCED',
      });

      showToast('Đã ghi nhận đợt thu hoạch thành công!');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi ghi nhận thu hoạch', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bác có chắc chắn muốn xóa đợt thu hoạch này không?')) return;
    try {
      await apiDeleteActivityLog(id);
      showToast('Đã xóa đợt thu hoạch thành công');
      loadData();
    } catch (err) {
      showToast('Lỗi khi xóa đợt thu hoạch', 'error');
    }
  };

  const handleOpenAddModal = () => {
    const defaultSeasonId = availableSeasons[0]?.id || seasons[0]?.id || '';
    setFormData({
      cropCycleId: defaultSeasonId,
      activityDate: new Date().toISOString().split('T')[0],
      harvestQuantity: '',
      unit: 'kg',
      unitPrice: '',
      revenue: '',
      harvestBatch: `Đợt ${harvestLogs.length + 1}`,
      buyer: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  return (
    <div className="harvest-page-wrapper">
      <Header />

      <main className="harvest-main container">
        {toast.show && (
          <div className={`harvest-toast ${toast.type}`}>
            {toast.type === 'success' ? <IconCheckCircle size={18} /> : <IconAlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top bar */}
        <div className="page-top-bar">
          <div>
            <h1 className="page-title">
              <IconScale className="title-icon" /> Quản lý Thu hoạch &amp; Doanh thu
            </h1>
            <p className="page-subtitle">
              Ghi nhận năng suất vụ mùa, giá bán nông sản và doanh thu từng đợt hái
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary harvest-add-btn" onClick={handleOpenAddModal}>
              <IconPlus size={18} /> Ghi nhận đợt thu hoạch
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="stats-grid harvest-stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-green">
              <IconDollarSign size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Tổng doanh thu thu hoạch</div>
              <div className="stat-value text-green">
                {stats.totalRevenue.toLocaleString('vi-VN')}&nbsp;đ
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-yellow">
              <IconScale size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Tổng sản lượng</div>
              <div className="stat-value">
                {stats.totalQuantityKg.toLocaleString('vi-VN')}&nbsp;kg
                {stats.totalQuantityKg >= 1000 && (
                  <small className="ton-subtext">
                    ({(stats.totalQuantityKg / 1000).toFixed(2)} tấn)
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-blue">
              <IconSprout size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Giá bán trung bình</div>
              <div className="stat-value">
                {stats.avgPrice.toLocaleString('vi-VN')}&nbsp;đ/kg
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-purple">
              <IconFileText size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Số đợt đã thu hoạch</div>
              <div className="stat-value">{stats.totalBatches}&nbsp;đợt</div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="harvest-filter-card">
          <div className="search-box">
            <IconSearch size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm người mua, ghi chú, lô trồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                <IconX size={16} />
              </button>
            )}
          </div>

          <div className="filter-selects-group">
            {farms.length > 1 && (
              <select
                value={selectedFarm}
                onChange={(e) => {
                  setSelectedFarm(e.target.value);
                  setSelectedSeason('');
                }}
                className="filter-select"
              >
                <option value="">-- Tất cả nông hộ / vườn --</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="filter-select"
            >
              <option value="">-- Tất cả mùa vụ canh tác --</option>
              {availableSeasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.crop?.name} ({s.plot?.name}) - {new Date(s.startDate).getFullYear()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="loading-state">Đang tải lịch sử thu hoạch...</div>
        ) : filteredHarvests.length === 0 ? (
          <div className="empty-state">
            <IconScale size={48} className="empty-icon" />
            <h3>Chưa có bản ghi thu hoạch nào</h3>
            <p>Bác nông dân bấm vào nút bên dưới để ghi nhận năng suất và doanh thu của đợt hái này.</p>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <IconPlus size={16} /> Ghi nhận đợt đầu tiên
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP VIEW: Bảng chi tiết đầy đủ */}
            <div className="table-responsive desktop-view">
              <table className="harvest-table">
                <thead>
                  <tr>
                    <th>Ngày thu hoạch</th>
                    <th>Mùa vụ / Lô trồng</th>
                    <th>Cây trồng</th>
                    <th>Sản lượng (kg)</th>
                    <th>Đơn giá bán</th>
                    <th>Tổng doanh thu</th>
                    <th>Chi tiết / Thương lái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHarvests.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{new Date(item.activityDate).toLocaleDateString('vi-VN')}</strong>
                      </td>
                      <td>
                        <div className="plot-badge-cell">
                          <span className="plot-name">{item.cropCycle?.plot?.name || 'Lô trồng'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="crop-tag">{item.cropCycle?.crop?.name || 'Cây trồng'}</span>
                      </td>
                      <td>
                        <span className="qty-tag">
                          {(Number(item.harvestQuantity) || 0).toLocaleString('vi-VN')}&nbsp;kg
                        </span>
                      </td>
                      <td>
                        {item.unitPrice ? (
                          <span className="unit-price-tag">
                            {Number(item.unitPrice).toLocaleString('vi-VN')}&nbsp;đ/kg
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <strong className="revenue-val">
                          {(Number(item.revenue) || 0).toLocaleString('vi-VN')}&nbsp;đ
                        </strong>
                      </td>
                      <td>
                        <span className="notes-text" title={item.notes || ''}>
                          {item.notes || '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="delete-action-btn"
                          title="Xóa đợt thu này"
                          onClick={() => handleDelete(item.id)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: Dạng thẻ thông minh, dễ dùng cho nông dân trên điện thoại */}
            <div className="mobile-harvest-list mobile-view">
              {filteredHarvests.map((item) => {
                const qty = Number(item.harvestQuantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const rev = Number(item.revenue) || 0;

                return (
                  <div className="mobile-harvest-card" key={item.id}>
                    {/* Hàng trên cùng: Ngày thu hoạch + Nút xóa */}
                    <div className="mhc-top-row">
                      <div className="mhc-date-badge">
                        <IconCalendar size={15} />
                        <span>{new Date(item.activityDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <button
                        className="mhc-delete-btn"
                        title="Xóa đợt thu này"
                        onClick={() => handleDelete(item.id)}
                      >
                        <IconTrash size={15} />
                        <span>Xóa</span>
                      </button>
                    </div>

                    {/* Cây trồng & Vườn / Lô trồng */}
                    <div className="mhc-crop-row">
                      <span className="mhc-crop-pill">
                        <IconSprout size={14} />
                        {item.cropCycle?.crop?.name || 'Cây trồng'}
                      </span>
                      <span className="mhc-plot-text">
                        {item.cropCycle?.plot?.name || 'Lô trồng'}
                      </span>
                    </div>

                    {/* Lưới 3 số liệu trọng tâm: Sản lượng - Giá - Doanh thu */}
                    <div className="mhc-metrics-grid">
                      <div className="mhc-metric-box">
                        <span className="mhc-metric-label">Sản lượng hái</span>
                        <div className="mhc-metric-val">
                          <strong>{qty.toLocaleString('vi-VN')}</strong>
                          <span className="mhc-unit">kg</span>
                        </div>
                      </div>

                      <div className="mhc-metric-box">
                        <span className="mhc-metric-label">Đơn giá bán</span>
                        <div className="mhc-metric-val">
                          <strong>{price > 0 ? price.toLocaleString('vi-VN') : '—'}</strong>
                          {price > 0 && <span className="mhc-unit">đ/kg</span>}
                        </div>
                      </div>

                      <div className="mhc-metric-box highlight-revenue">
                        <span className="mhc-metric-label">Tiền thu được</span>
                        <div className="mhc-metric-val revenue-text">
                          <strong>{rev.toLocaleString('vi-VN')}</strong>
                          <span className="mhc-unit">đ</span>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin thương lái / ghi chú nếu có */}
                    {item.notes && (
                      <div className="mhc-notes-row">
                        <IconFileText size={14} className="mhc-notes-icon" />
                        <span className="mhc-notes-content">{item.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* MODAL GHI NHẬN THU HOẠCH (Tối ưu cho cả điện thoại & máy tính) */}
        {showAddModal && (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
            <div className="modal-card harvest-modal-card">
              <div className="modal-header">
                <h3>
                  <IconScale size={20} /> Ghi nhận đợt thu hoạch
                </h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <IconX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitHarvest} className="modal-body compact-modal-body">
                {/* 1. Mùa vụ / Lô thu hoạch */}
                <div className="form-group compact-group">
                  <label>Mùa vụ / Lô thu hoạch *</label>
                  <select
                    value={formData.cropCycleId}
                    onChange={(e) => setFormData({ ...formData, cropCycleId: e.target.value })}
                    required
                    className="modal-select-lg"
                  >
                    <option value="">-- Chọn mùa vụ thu hoạch --</option>
                    {availableSeasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.crop?.name} · {s.plot?.name} ({s.status === 'DANG_CANH_TAC' ? 'Đang canh tác' : s.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Ngày thu hoạch & Tên đợt hái */}
                <div className="form-row compact-row">
                  <div className="form-group compact-group">
                    <label>Ngày thu hoạch *</label>
                    <input
                      type="date"
                      value={formData.activityDate}
                      onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group compact-group">
                    <label>Tên đợt hái</label>
                    <input
                      type="text"
                      placeholder="VD: Đợt 1"
                      value={formData.harvestBatch}
                      onChange={(e) => setFormData({ ...formData, harvestBatch: e.target.value })}
                    />
                  </div>
                </div>

                {/* 3. Sản lượng & Đơn giá bán */}
                <div className="form-row compact-row">
                  <div className="form-group compact-group">
                    <label>Sản lượng (kg) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="VD: 500"
                      value={formData.harvestQuantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      required
                      className="input-number-highlight"
                    />
                  </div>

                  <div className="form-group compact-group">
                    <label>Giá bán (đ/kg)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="VD: 85000"
                      value={formData.unitPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="input-number-highlight"
                    />
                  </div>
                </div>

                {/* 4. Tổng tiền & Thương lái */}
                <div className="form-row compact-row">
                  <div className="form-group compact-group">
                    <label className="label-with-hint">
                      <span>Tổng tiền thu (VNĐ)</span>
                      {Number(formData.revenue) > 0 && (
                        <span className="auto-calc-badge">Tự động tính</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Tự tính = kg × giá"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                      className="input-revenue-highlight"
                    />
                  </div>

                  <div className="form-group compact-group">
                    <label>Thương lái / Vựa thu mua</label>
                    <input
                      type="text"
                      placeholder="VD: Vựa thu mua Bảo Lộc..."
                      value={formData.buyer}
                      onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                    />
                  </div>
                </div>

                {/* 5. Ghi chú (1 dòng gọn gàng) */}
                <div className="form-group compact-group mb-0">
                  <label>Ghi chú (tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="VD: Trái loại 1, nhận tiền cọc 50%..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="modal-actions compact-actions">
                  <button
                    type="button"
                    className="btn btn-secondary modal-btn-cancel"
                    onClick={() => setShowAddModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary modal-btn-save">
                    Lưu đợt thu hoạch
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

