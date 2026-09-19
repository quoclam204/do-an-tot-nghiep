import React, { useState, useRef, useEffect, useMemo } from 'react';
import './CustomTimePicker.css';
import { IconClock, IconSun, IconMoon, IconSunrise } from './icons';

// Danh sách giờ canh tác với nhãn thuần Việt
const HOURS_24 = [
  { h: 5, label24: '05:00', vnText: '5h sáng', shift: 'SANG' },
  { h: 6, label24: '06:00', vnText: '6h sáng', shift: 'SANG' },
  { h: 7, label24: '07:00', vnText: '7h sáng', shift: 'SANG' },
  { h: 8, label24: '08:00', vnText: '8h sáng', shift: 'SANG' },
  { h: 9, label24: '09:00', vnText: '9h sáng', shift: 'SANG' },
  { h: 10, label24: '10:00', vnText: '10h sáng', shift: 'SANG' },
  { h: 11, label24: '11:00', vnText: '11h trưa', shift: 'SANG' },
  { h: 12, label24: '12:00', vnText: '12h trưa', shift: 'CHIEU' },
  { h: 13, label24: '13:00', vnText: '1h chiều', shift: 'CHIEU' },
  { h: 14, label24: '14:00', vnText: '2h chiều', shift: 'CHIEU' },
  { h: 15, label24: '15:00', vnText: '3h chiều', shift: 'CHIEU' },
  { h: 16, label24: '16:00', vnText: '4h chiều', shift: 'CHIEU' },
  { h: 17, label24: '17:00', vnText: '5h chiều', shift: 'CHIEU' },
  { h: 18, label24: '18:00', vnText: '6h tối', shift: 'TOI' },
  { h: 19, label24: '19:00', vnText: '7h tối', shift: 'TOI' },
  { h: 20, label24: '20:00', vnText: '20h tối', shift: 'TOI' },
  { h: 21, label24: '21:00', vnText: '9h tối', shift: 'TOI' },
  { h: 22, label24: '22:00', vnText: '10h tối', shift: 'TOI' },
  { h: 23, label24: '23:00', vnText: '11h đêm', shift: 'TOI' },
  { h: 0, label24: '00:00', vnText: '12h đêm', shift: 'TOI' },
  { h: 1, label24: '01:00', vnText: '1h sáng', shift: 'SANG' },
  { h: 2, label24: '02:00', vnText: '2h sáng', shift: 'SANG' },
  { h: 3, label24: '03:00', vnText: '3h sáng', shift: 'SANG' },
  { h: 4, label24: '04:00', vnText: '4h sáng', shift: 'SANG' },
];

export default function CustomTimePicker({
  value = '08:00',
  onChange,
  onNowClick,
  className = '',
  placeholder = 'Chọn giờ',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterShift, setFilterShift] = useState('ALL'); // ALL | SANG | CHIEU | TOI
  const containerRef = useRef(null);
  const hoursColRef = useRef(null);
  const minsColRef = useRef(null);

  // Tách giờ & phút số nguyên
  const { hourNum, minNum } = useMemo(() => {
    if (!value || typeof value !== 'string' || !value.includes(':')) {
      return { hourNum: 8, minNum: 0 };
    }
    const [h, m] = value.split(':');
    return {
      hourNum: parseInt(h, 10) || 0,
      minNum: parseInt(m, 10) || 0,
    };
  }, [value]);

  // Cuộn đến vị trí giờ & phút đang chọn khi mở bảng
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hoursColRef.current) {
          const activeH = hoursColRef.current.querySelector('.hour-item.active');
          if (activeH) {
            hoursColRef.current.scrollTop = activeH.offsetTop - hoursColRef.current.offsetTop - 50;
          }
        }
        if (minsColRef.current) {
          const activeM = minsColRef.current.querySelector('.minute-item.active');
          if (activeM) {
            minsColRef.current.scrollTop = activeM.offsetTop - minsColRef.current.offsetTop - 50;
          }
        }
      }, 50);
    }
  }, [isOpen]);

  // Click ngoài đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Chọn giờ
  const handleSelectHour = (h) => {
    const timeStr = `${String(h).padStart(2, '0')}:${String(minNum).padStart(2, '0')}`;
    if (onChange) onChange(timeStr);
  };

  // Chọn phút
  const handleSelectMin = (m) => {
    const timeStr = `${String(hourNum).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (onChange) onChange(timeStr);
  };

  // Nút chọn nhanh giờ hiện tại
  const handlePickNow = (e) => {
    if (e) e.stopPropagation();
    const now = new Date();
    const curH = now.getHours();
    const curM = now.getMinutes();
    const timeStr = `${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`;

    if (onChange) onChange(timeStr);
    if (onNowClick) onNowClick(timeStr, now);
    setIsOpen(false);
  };

  // Lọc danh sách giờ theo ca buổi nếu người dùng muốn
  const filteredHours = useMemo(() => {
    if (filterShift === 'ALL') return HOURS_24;
    return HOURS_24.filter((item) => item.shift === filterShift);
  }, [filterShift]);

  // Danh sách phút 00 đến 59
  const minsList = Array.from({ length: 60 }, (_, i) => i);

  // Hiển thị tiếng Việt ngắn gọn trên ô input
  const displayVietnamese = useMemo(() => {
    const hh = String(hourNum).padStart(2, '0');
    const mm = String(minNum).padStart(2, '0');

    let textVn = '';
    if (hourNum >= 4 && hourNum < 11) {
      textVn = `${hourNum}h${minNum > 0 ? mm : ''} sáng`;
    } else if (hourNum >= 11 && hourNum < 13) {
      textVn = `${hourNum}h${minNum > 0 ? mm : ''} trưa`;
    } else if (hourNum >= 13 && hourNum < 18) {
      textVn = `${hourNum - 12}h${minNum > 0 ? mm : ''} chiều`;
    } else if (hourNum >= 18 && hourNum < 23) {
      textVn = `${hourNum}h tối`;
      if (minNum > 0) textVn = `${hourNum}h${mm} tối`;
    } else {
      textVn = `${hourNum}h${minNum > 0 ? mm : ''} đêm`;
    }

    return {
      time24: `${hh}:${mm}`,
      textVn,
    };
  }, [hourNum, minNum]);

  return (
    <div className={`custom-time-picker-container ${className}`} ref={containerRef}>
      {/* Ô hiển thị chính */}
      <div
        className={`custom-time-input-box ${isOpen ? 'focused' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Bấm để chọn giờ hoặc lấy giờ hiện tại"
      >
        <div className="time-display-wrap">
          <span className="time-primary-val">{displayVietnamese.time24}</span>
          <span className="time-vn-badge">{displayVietnamese.textVn}</span>
        </div>

        <div className="time-input-actions">
          <button
            type="button"
            className="btn-now-compact"
            onClick={handlePickNow}
            title="Lấy giờ hiện tại của thiết bị ngay bây giờ"
          >
            <IconClock size={12} strokeWidth={2.2} /> Bây giờ
          </button>
          <IconClock size={16} className="clock-icon" />
        </div>
      </div>

      {/* Dropdown chọn giờ 24h gọn gàng, tinh gọn */}
      {isOpen && (
        <div className="custom-time-dropdown">
          {/* Bộ lọc ca buổi */}
          <div className="dropdown-filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filterShift === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterShift('ALL')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`filter-tab ${filterShift === 'SANG' ? 'active' : ''}`}
              onClick={() => setFilterShift('SANG')}
            >
              <IconSunrise size={13} strokeWidth={2} /> Sáng
            </button>
            <button
              type="button"
              className={`filter-tab ${filterShift === 'CHIEU' ? 'active' : ''}`}
              onClick={() => setFilterShift('CHIEU')}
            >
              <IconSun size={13} strokeWidth={2} /> Chiều
            </button>
            <button
              type="button"
              className={`filter-tab ${filterShift === 'TOI' ? 'active' : ''}`}
              onClick={() => setFilterShift('TOI')}
            >
              <IconMoon size={13} strokeWidth={2} /> Tối
            </button>
          </div>

          {/* Tiêu đề 2 cột */}
          <div className="dropdown-columns-header">
            <span>GIỜ</span>
            <span>PHÚT</span>
          </div>

          {/* Nội dung 2 cột cuộn */}
          <div className="dropdown-columns-body">
            {/* Cột Giờ */}
            <div className="time-column hours-col" ref={hoursColRef}>
              {filteredHours.map((item) => (
                <div
                  key={item.h}
                  className={`hour-item ${hourNum === item.h ? 'active' : ''}`}
                  onClick={() => handleSelectHour(item.h)}
                >
                  <span className="hour-24">{item.label24}</span>
                  <span className="hour-vn">{item.vnText}</span>
                </div>
              ))}
            </div>

            {/* Cột Phút */}
            <div className="time-column mins-col" ref={minsColRef}>
              {minsList.map((m) => {
                const mStr = String(m).padStart(2, '0');
                return (
                  <div
                    key={m}
                    className={`minute-item ${minNum === m ? 'active' : ''}`}
                    onClick={() => handleSelectMin(m)}
                  >
                    {mStr} {m % 5 === 0 ? 'phút' : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chân bảng chọn: Nút Giờ hiện tại & Đóng */}
          <div className="dropdown-footer">
            <button
              type="button"
              className="btn-footer-now"
              onClick={handlePickNow}
            >
              <IconClock size={13} strokeWidth={2.2} /> Giờ hiện tại
            </button>
            <button
              type="button"
              className="btn-footer-done"
              onClick={() => setIsOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
