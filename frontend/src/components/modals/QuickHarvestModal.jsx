import React, { useState, useEffect, useMemo, useRef } from 'react';
import './QuickHarvestModal.css';
import {
  IconX,
  IconSprout,
  IconCalendar,
  IconBanknote,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronDown,
  IconInfo,
} from '../icons';
import { apiCreateActivityLog, apiUpdateActivityLog } from '../../services/api';
import { addToOfflineQueue } from '../../utils/offlineSync';

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function QuickHarvestModal({
  isOpen,
  onClose,
  seasons = [],
  defaultCropCycleId = '',
  editingLog = null,
  onSuccess,
}) {
  const [cropCycleId, setCropCycleId] = useState('');
  const [harvestDate, setHarvestDate] = useState(getTodayDateStr());
  const [harvestQuantity, setHarvestQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quản lý custom dropdown mùa vụ
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const seasonDropdownRef = useRef(null);

  // Đóng dropdown khi bấm ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(e.target)) {
        setSeasonDropdownOpen(false);
      }
    };
    if (seasonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [seasonDropdownOpen]);

  // Tìm mùa vụ được chọn
  const selectedSeason = useMemo(() => {
    return seasons.find((s) => s.id === cropCycleId) || null;
  }, [seasons, cropCycleId]);

  // Đồng bộ dữ liệu khi modal mở (tạo mới hoặc chỉnh sửa)
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (editingLog) {
        setCropCycleId(editingLog.cropCycleId || '');
        setHarvestDate(editingLog.activityDate ? editingLog.activityDate.slice(0, 10) : getTodayDateStr());
        setHarvestQuantity(editingLog.harvestQuantity ? String(editingLog.harvestQuantity) : '');
        setUnitPrice(editingLog.unitPrice ? String(editingLog.unitPrice) : '');
        setNotes(editingLog.notes || '');
      } else {
        setHarvestDate(getTodayDateStr());
        setHarvestQuantity('');
        setUnitPrice('');
        setNotes('');
        if (defaultCropCycleId) {
          setCropCycleId(defaultCropCycleId);
        } else if (seasons.length > 0) {
          setCropCycleId(seasons[0].id);
        }
      }
    }
  }, [isOpen, editingLog, defaultCropCycleId, seasons]);

  // Tính tổng tiền tự động
  const totalRevenue = useMemo(() => {
    const qty = Number(harvestQuantity || 0);
    const price = Number(String(unitPrice || 0).replace(/\D/g, ''));
    if (qty > 0 && price > 0) {
      return Math.round(qty * price);
    }
    return 0;
  }, [harvestQuantity, unitPrice]);

  if (!isOpen) return null;

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setUnitPrice(raw ? Number(raw) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cropCycleId) {
      setErrorMessage('Vui lòng chọn mùa vụ canh tác để ghi nhận thu hoạch!');
      return;
    }

    const qty = Number(harvestQuantity);
    if (!qty || qty <= 0) {
      setErrorMessage('Vui lòng nhập sản lượng thu hoạch lớn hơn 0 kg!');
      return;
    }

    const price = Number(String(unitPrice || 0).replace(/\D/g, ''));
    if (!price || price <= 0) {
      setErrorMessage('Vui lòng nhập giá bán nông sản (VNĐ/kg)!');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cropCycleId,
        activityType: 'THU_HOACH',
        activityDate: harvestDate,
        activityTime: '09:00',
        workShift: 'SANG',
        harvestQuantity: qty,
        unitPrice: price,
        revenue: totalRevenue,
        notes: notes ? notes.trim() : 'Thu hoạch nông sản',
        materials: [],
        isHiredLabor: false,
        laborWorkers: 0,
        laborWagePerDay: 0,
        otherCosts: 0,
      };

      // 1. Nếu đang mất mạng ngoại tuyến ngoài vườn
      if (!navigator.onLine) {
        addToOfflineQueue({
          type: 'CREATE_LOG',
          payload,
          preview: {
            harvestQuantity: qty,
            revenue: totalRevenue,
            activityType: 'THU_HOACH',
            notes: notes || 'Thu hoạch nông sản',
          },
        });
        if (onSuccess) {
          onSuccess({
            message: `Đã lưu thu hoạch ngoại tuyến an toàn: +${totalRevenue.toLocaleString('vi-VN')} đ (${qty} kg). Tự động đồng bộ khi có mạng!`,
            type: 'warning',
          });
        }
        onClose();
        return;
      }

      // 2. Có mạng -> Gửi lên máy chủ, nếu rớt mạng giữa chừng thì fallback vào hàng đợi ngoại tuyến
      try {
        if (editingLog && editingLog.id) {
          await apiUpdateActivityLog(editingLog.id, payload);
        } else {
          await apiCreateActivityLog(payload);
        }

        if (onSuccess) {
          onSuccess({
            message: editingLog
              ? `Đã cập nhật thu hoạch: ${totalRevenue.toLocaleString('vi-VN')} đ (${qty} kg)!`
              : `Đã ghi nhận thu hoạch thành công: +${totalRevenue.toLocaleString('vi-VN')} đ (${qty} kg)!`,
            type: 'success',
          });
        }
        onClose();
      } catch (reqErr) {
        if (!navigator.onLine || !reqErr.response) {
          addToOfflineQueue({
            type: 'CREATE_LOG',
            payload,
            preview: {
              harvestQuantity: qty,
              revenue: totalRevenue,
              activityType: 'THU_HOACH',
              notes: notes || 'Thu hoạch nông sản',
            },
          });
          if (onSuccess) {
            onSuccess({
              message: `Mạng yếu, đã lưu thu hoạch ngoại tuyến: +${totalRevenue.toLocaleString('vi-VN')} đ (${qty} kg). Sẽ tự động đồng bộ khi có mạng!`,
              type: 'warning',
            });
          }
          onClose();
          return;
        }
        throw reqErr;
      }
    } catch (err) {
      const msg =
        Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : err.response?.data?.message || err.message || 'Lỗi khi lưu thu hoạch';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="harvest-modal-overlay" onClick={onClose}>
      <div
        className="harvest-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="harvest-modal-header">
          <div className="harvest-modal-title-group">
            <div className="harvest-modal-icon">
              <IconSprout size={24} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="harvest-modal-title">
                {editingLog ? 'Chỉnh Sửa Thu Hoạch Nông Sản' : 'Ghi Nhận Thu Hoạch Nhanh'}
              </h3>
              <p className="harvest-modal-subtitle">
                Ghi số kg thu được và giá bán để hệ thống tự động cộng doanh thu
              </p>
            </div>
          </div>
          <button
            type="button"
            className="harvest-modal-btn-close"
            onClick={onClose}
            title="Đóng cửa sổ"
          >
            <IconX size={20} strokeWidth={2} />
          </button>
        </div>

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {errorMessage && (
          <div className="harvest-modal-alert">
            <IconAlertCircle size={18} strokeWidth={2.2} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM THU HOẠCH ĐƠN GIẢN */}
        <form onSubmit={handleSubmit} className="harvest-modal-body">
          {/* MỤC 1: CHỌN MÙA VỤ */}
          <div className="harvest-form-group">
            <label className="harvest-form-label">
              Mùa Vụ & Lô Đất Thu Hoạch <span className="text-required">*</span>
            </label>
            <div className="harvest-custom-select-wrap" ref={seasonDropdownRef}>
              <div
                className={`harvest-select-trigger ${seasonDropdownOpen ? 'active' : ''}`}
                onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSeasonDropdownOpen(!seasonDropdownOpen);
                  } else if (e.key === 'Escape') {
                    setSeasonDropdownOpen(false);
                  }
                }}
              >
                <span className={`harvest-select-single-text ${!selectedSeason ? 'is-placeholder' : ''}`}>
                  {selectedSeason
                    ? `${selectedSeason.name}${selectedSeason.plot?.name ? ` (${selectedSeason.plot.name})` : ''}${selectedSeason.isIntercropped ? ' - Xen canh' : ''}`
                    : '-- Chọn Mùa Vụ / Lô Trồng --'}
                </span>
                <div className={`harvest-select-arrow ${seasonDropdownOpen ? 'open' : ''}`}>
                  <IconChevronDown size={17} strokeWidth={2.4} />
                </div>
              </div>

              {seasonDropdownOpen && (
                <div className="harvest-dropdown-menu">
                  {seasons.length === 0 ? (
                    <div className="harvest-dropdown-empty">Chưa có mùa vụ nào sẵn sàng</div>
                  ) : (
                    seasons.map((s) => {
                      const isSelected = s.id === cropCycleId;
                      const labelText = `${s.name}${s.plot?.name ? ` (${s.plot.name})` : ''}${s.isIntercropped ? ' - Xen canh' : ''}`;
                      return (
                        <div
                          key={s.id}
                          className={`harvest-dropdown-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setCropCycleId(s.id);
                            setSeasonDropdownOpen(false);
                          }}
                          title={labelText}
                        >
                          <span className="harvest-option-single-label">{labelText}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {/* Input ẩn để đảm bảo validation HTML5 form */}
            <input
              type="text"
              value={cropCycleId}
              required
              tabIndex={-1}
              aria-hidden="true"
              style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}
              onChange={() => {}}
            />
          </div>

          {/* MỤC 2: NGÀY THU HOẠCH */}
          <div className="harvest-form-group">
            <label className="harvest-form-label">Ngày Thu Hoạch</label>
            <div className="harvest-date-row">
              <input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="harvest-form-input"
                required
              />
              <button
                type="button"
                className={`harvest-btn-today ${harvestDate === getTodayDateStr() ? 'active' : ''}`}
                onClick={() => setHarvestDate(getTodayDateStr())}
              >
                <IconCalendar size={15} strokeWidth={2.2} />
                <span>Hôm nay</span>
              </button>
            </div>
          </div>

          {/* MỤC 3: SẢN LƯỢNG & ĐƠN GIÁ (2 CỘT RÕ RÀNG) */}
          <div className="harvest-form-row">
            <div className="harvest-form-group flex-1">
              <label className="harvest-form-label">
                ⚖️ Sản lượng thu được <span className="text-required">*</span>
              </label>
              <div className="harvest-input-unit-wrap">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={harvestQuantity}
                  onChange={(e) => setHarvestQuantity(e.target.value)}
                  placeholder="Ví dụ: 500"
                  className="harvest-form-input harvest-input-bold"
                  required
                />
                <span className="harvest-input-unit">kg</span>
              </div>
            </div>

            <div className="harvest-form-group flex-1">
              <label className="harvest-form-label">
                💵 Giá bán mỗi kg <span className="text-required">*</span>
              </label>
              <div className="harvest-input-unit-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  value={unitPrice ? Number(unitPrice).toLocaleString('vi-VN') : ''}
                  onChange={handlePriceChange}
                  placeholder="Ví dụ: 90,000"
                  className="harvest-form-input harvest-input-bold"
                  required
                />
                <span className="harvest-input-unit">đ/kg</span>
              </div>
            </div>
          </div>

          {/* MỤC 4: TỔNG DOANH THU TÍNH NHẨM TỰ ĐỘNG */}
          <div className="harvest-revenue-preview-box">
            <div className="harvest-revenue-top">
              <div className="harvest-revenue-icon">
                <IconBanknote size={22} strokeWidth={2.2} />
              </div>
              <div>
                <span className="harvest-revenue-label">TỔNG TIỀN BÁN THU ĐƯỢC</span>
                <div className="harvest-revenue-amount">
                  {totalRevenue.toLocaleString('vi-VN')} <small>VNĐ</small>
                </div>
              </div>
            </div>

            {Number(harvestQuantity) > 0 && Number(unitPrice) > 0 ? (
              <div className="harvest-calc-formula">
                <IconInfo size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                <span>Công thức: </span><strong>{Number(harvestQuantity).toLocaleString('vi-VN')} kg</strong> ×{' '}
                <strong>{Number(unitPrice).toLocaleString('vi-VN')} đ/kg</strong> ={' '}
                <span className="text-green">{totalRevenue.toLocaleString('vi-VN')} đ</span>
              </div>
            ) : (
              <div className="harvest-calc-hint">
                <IconInfo size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                <span>Nhập số kg và giá bán ở trên, hệ thống sẽ tự động tính thành tiền vào đây.</span>
              </div>
            )}
          </div>

          {/* MỤC 5: GHI CHÚ BÁN HÀNG */}
          <div className="harvest-form-group">
            <label className="harvest-form-label">Ghi chú (Tùy chọn)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Bán cho vựa thu mua Tuấn, Cà phê loại 1..."
              className="harvest-form-input"
            />
          </div>

          {/* NÚT THAO TÁC */}
          <div className="harvest-modal-footer">
            <button
              type="button"
              className="harvest-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="harvest-btn-submit"
              disabled={submitting}
            >
              <IconCheckCircle size={18} strokeWidth={2.4} />
              <span>{submitting ? 'Đang lưu...' : (editingLog ? 'LƯU CẬP NHẬT' : 'LƯU THU HOẠCH')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
