import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { PageHeader, KpiCard, KpiGrid, ConfirmDialog, EmptyState } from '../../components/ui';
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
  IconRotateCw,
} from '../../components/icons';
import {
  apiGetActivityLogs,
  apiCreateActivityLog,
  apiDeleteActivityLog,
  apiGetSeasons,
  apiGetMyFarms,
} from '../../services/api';
import './HarvestPage.css';

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    cropCycleId: '',
    activityDate: getTodayDateStr(),
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
      showToast(
        'Không thể tải lịch sử thu hoạch. Bác vui lòng kiểm tra kết nối mạng hoặc thử tải lại trang.',
        'error'
      );
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
      revenue: qty > 0 && price > 0 ? Math.round(qty * price) : (price === 0 || !val ? '' : prev.revenue),
    }));
  };

  const handlePriceChange = (valStr) => {
    const cleanNum = String(valStr).replace(/[^\d]/g, '');
    const price = cleanNum ? Number(cleanNum) : '';
    const qty = Number(formData.harvestQuantity) || 0;
    setFormData((prev) => ({
      ...prev,
      unitPrice: price,
      revenue: qty > 0 && price > 0 ? Math.round(qty * price) : (qty === 0 || !cleanNum ? '' : prev.revenue),
    }));
  };

  const handleRevenueChange = (valStr) => {
    const cleanNum = String(valStr).replace(/[^\d]/g, '');
    setFormData((prev) => ({
      ...prev,
      revenue: cleanNum ? Number(cleanNum) : '',
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

      showToast('Đã ghi nhận đợt thu hoạch thành công vào sổ!');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          'Không thể lưu đợt thu hoạch. Bác vui lòng kiểm tra lại thông tin hoặc kết nối mạng.',
        'error'
      );
    }
  };

  const handleRequestDelete = (harvestItem) => {
    setDeleteTarget(harvestItem);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiDeleteActivityLog(deleteTarget.id);
      showToast('Đã xóa đợt thu hoạch thành công khỏi sổ theo dõi.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          'Không thể xóa đợt thu hoạch lúc này. Bác vui lòng kiểm tra lại kết nối mạng.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddModal = () => {
    const defaultSeasonId = availableSeasons[0]?.id || seasons[0]?.id || '';
    setFormData({
      cropCycleId: defaultSeasonId,
      activityDate: getTodayDateStr(),
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

        {/* Header trang */}
        <PageHeader
          icon={IconScale}
          title="Quản lý Thu hoạch & Doanh thu"
          description="Ghi nhận năng suất vụ mùa, giá bán nông sản và doanh thu từng đợt hái"
          actions={
            <button className="btn btn-primary harvest-add-btn" onClick={handleOpenAddModal}>
              <IconPlus size={18} /> Ghi nhận đợt thu hoạch
            </button>
          }
        />

        {/* KPI Cards */}
        <KpiGrid className="harvest-stats-grid" style={{ marginBottom: '1.5rem' }}>
          <KpiCard
            label="TỔNG DOANH THU THU HOẠCH"
            value={stats.totalRevenue.toLocaleString('vi-VN')}
            unit="đ"
            icon={IconDollarSign}
            variant="green"
            highlight={true}
          />
          <KpiCard
            label="TỔNG SẢN LƯỢNG"
            value={stats.totalQuantityKg.toLocaleString('vi-VN')}
            unit="kg"
            icon={IconScale}
            variant="amber"
            subtext={
              stats.totalQuantityKg >= 1000
                ? `(${(stats.totalQuantityKg / 1000).toFixed(2)} tấn)`
                : null
            }
          />
          <KpiCard
            label="GIÁ BÁN TRUNG BÌNH"
            value={stats.avgPrice.toLocaleString('vi-VN')}
            unit="đ/kg"
            icon={IconSprout}
            variant="blue"
          />
          <KpiCard
            label="SỐ ĐỢT ĐÃ THU HOẠCH"
            value={stats.totalBatches}
            unit="đợt"
            icon={IconFileText}
            variant="purple"
          />
        </KpiGrid>

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
          <div className="loading-state">
            <IconRotateCw
              size={22}
              className="spinning"
              style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}
            />
            Đang tải dữ liệu thu hoạch và doanh thu...
          </div>
        ) : filteredHarvests.length === 0 ? (
          harvestLogs.length > 0 ? (
            <EmptyState
              type="filter"
              icon={IconSearch}
              title="Không tìm thấy đợt thu hoạch phù hợp"
              description="Không có đợt thu hoạch nào khớp với từ khóa tìm kiếm hoặc vườn/mùa vụ bác đã chọn."
              primaryAction={{
                label: 'Đặt lại bộ lọc',
                onClick: () => {
                  setSearchTerm('');
                  setSelectedSeason('');
                  setSelectedFarm('');
                },
                icon: IconRotateCw,
              }}
            />
          ) : (
            <EmptyState
              type="empty"
              icon={IconScale}
              title="Chưa có đợt thu hoạch nào được ghi sổ"
              description="Bác ghi nhận sản lượng hái và tiền bán để DalatAgri tự động cộng doanh thu, tính năng suất và tổng kết lời lỗ cho vụ mùa."
              primaryAction={{
                label: 'Ghi nhận đợt thu hoạch mới',
                onClick: handleOpenAddModal,
                icon: IconPlus,
              }}
            />
          )
        ) : (
          <>
            {/* DESKTOP VIEW: Bảng chi tiết đầy đủ */}
            <div className="table-responsive desktop-view">
              <table className="harvest-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px', whiteSpace: 'nowrap' }}>Ngày thu hoạch</th>
                    <th>Mùa vụ / Lô trồng</th>
                    <th>Cây trồng</th>
                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Sản lượng (kg)</th>
                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Đơn giá bán</th>
                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng doanh thu</th>
                    <th>Chi tiết / Thương lái</th>
                    <th className="text-center" style={{ width: '85px', minWidth: '85px', whiteSpace: 'nowrap' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHarvests.map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{new Date(item.activityDate).toLocaleDateString('vi-VN')}</strong>
                      </td>
                      <td>
                        <div className="plot-badge-cell">
                          <span className="plot-name">{item.cropCycle?.plot?.name || item.cropCycle?.name || 'Lô trồng'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="crop-tag">{item.cropCycle?.crop?.name || 'Cây trồng'}</span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span className="qty-tag">
                          {(Number(item.harvestQuantity) || 0).toLocaleString('vi-VN')}&nbsp;kg
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {item.unitPrice ? (
                          <span className="unit-price-tag">
                            {Number(item.unitPrice).toLocaleString('vi-VN')}&nbsp;đ/kg
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <strong className="revenue-val">
                          {(Number(item.revenue) || 0).toLocaleString('vi-VN')}&nbsp;đ
                        </strong>
                      </td>
                      <td>
                        <span className="notes-text" title={item.notes || ''}>
                          {item.notes || '—'}
                        </span>
                      </td>
                      <td className="text-center" style={{ width: '85px', minWidth: '85px' }}>
                        <button
                          className="delete-action-btn"
                          title="Xóa đợt thu này"
                          onClick={() => handleRequestDelete(item)}
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
                        onClick={() => handleRequestDelete(item)}
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
                    <label className="label-with-hint">
                      <span>Ngày thu hoạch *</span>
                      <button
                        type="button"
                        className={`badge-quick-today ${formData.activityDate === getTodayDateStr() ? 'is-today' : ''}`}
                        onClick={() => setFormData((prev) => ({ ...prev, activityDate: getTodayDateStr() }))}
                        title="Điền nhanh ngày hôm nay"
                      >
                        <IconCalendar size={12} strokeWidth={2.2} />
                        <span>Hôm nay</span>
                      </button>
                    </label>
                    <input
                      type="date"
                      value={formData.activityDate}
                      onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group compact-group">
                    <label className="label-with-hint">
                      <span>Tên đợt hái</span>
                    </label>
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
                    <label className="label-with-hint">
                      <span>Sản lượng (kg) *</span>
                    </label>
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
                    <label className="label-with-hint">
                      <span>Giá bán (đ/kg)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="VD: 85.000"
                      value={
                        formData.unitPrice
                          ? Number(formData.unitPrice).toLocaleString('vi-VN')
                          : ''
                      }
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
                      type="text"
                      inputMode="numeric"
                      placeholder="Tự động tính"
                      value={
                        formData.revenue
                          ? `${Number(formData.revenue).toLocaleString('vi-VN')} VNĐ`
                          : ''
                      }
                      onChange={(e) => handleRevenueChange(e.target.value)}
                      className="input-revenue-highlight"
                    />
                  </div>

                  <div className="form-group compact-group">
                    <label className="label-with-hint">
                      <span>Thương lái / Vựa thu mua</span>
                    </label>
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
        {/* HỘP THOẠI XÁC NHẬN XÓA ĐỢT THU HOẠCH AN TOÀN */}
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title="Xác nhận xóa đợt thu hoạch?"
          description={
            deleteTarget ? (
              <>
                Bác có chắc chắn muốn xóa đợt thu hoạch giống cây{' '}
                <strong>{deleteTarget.cropCycle?.crop?.name || 'cây trồng'}</strong> ngày{' '}
                <strong>{new Date(deleteTarget.activityDate).toLocaleDateString('vi-VN')}</strong>{' '}
                (Sản lượng:{' '}
                <strong>
                  {(Number(deleteTarget.harvestQuantity) || 0).toLocaleString('vi-VN')} kg
                </strong>
                {deleteTarget.revenue
                  ? `, Doanh thu: ${(Number(deleteTarget.revenue) || 0).toLocaleString('vi-VN')} đ`
                  : ''}
                )?
              </>
            ) : null
          }
          tip="Số liệu sản lượng và tiền bán này sẽ được gỡ khỏi sổ sách theo dõi của mùa vụ."
          confirmLabel="Xóa đợt thu này"
          cancelLabel="Hủy bỏ, giữ lại"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
        />
      </main>

      <Footer />
    </div>
  );
}

