import React from 'react';
import './SeasonDetailModal.css';
import {
  IconX,
  IconCalendar,
  IconMapPin,
  IconSprout,
  IconWarehouse,
  IconExternalLink,
  IconClipboardList,
} from '../icons';

export default function SeasonDetailModal({ isOpen, onClose, season, farm, onNavigateSeasons }) {
  if (!isOpen || !season) return null;

  return (
    <div className="season-modal-backdrop" onClick={onClose}>
      <div className="season-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="season-modal-header">
          <div className="season-modal-header-info">
            <div className="season-modal-title-row">
              <div className="season-modal-icon-badge">
                <IconClipboardList size={18} strokeWidth={2.4} />
              </div>
              <h3 className="season-modal-title">Chi Tiết Mùa Vụ & Vùng Canh Tác</h3>
            </div>
            <div className="season-modal-meta">
              <span className="season-modal-name">{season.name}</span>
              <span className="season-modal-status-badge">
                <span className="status-dot"></span>
                {season.status === 'ACTIVE' || season.status === 'IN_PROGRESS' || !season.status ? 'Đang canh tác' : season.status}
              </span>
            </div>
          </div>
          <button className="season-modal-close-btn" onClick={onClose} title="Đóng">
            <IconX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="season-modal-body">
          <div className="season-modal-grid">
            {/* 1. MÙA VỤ */}
            <div className="season-modal-item item-season">
              <div className="season-modal-item-icon icon-blue">
                <IconCalendar size={18} strokeWidth={2.2} />
              </div>
              <div className="season-modal-item-content">
                <span className="item-label">Mùa vụ canh tác</span>
                <strong className="item-value">{season.name}</strong>
                {season.startDate && (
                  <span className="item-sub">
                    Bắt đầu: {new Date(season.startDate).toLocaleDateString('vi-VN')}
                    {season.endDate ? ` • Kết thúc: ${new Date(season.endDate).toLocaleDateString('vi-VN')}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* 2. LÔ ĐẤT */}
            <div className="season-modal-item item-plot">
              <div className="season-modal-item-icon icon-green">
                <IconMapPin size={18} strokeWidth={2.2} />
              </div>
              <div className="season-modal-item-content">
                <span className="item-label">Lô đất</span>
                <strong className="item-value">{season.plot?.name || 'Chưa gán lô'}</strong>
                <span className="item-sub">
                  {season.plot?.area ? `Diện tích: ${Number(season.plot.area).toLocaleString('vi-VN')} m²` : 'Lô đất canh tác'}
                  {season.plot?.soilType ? ` • Đất: ${season.plot.soilType}` : ''}
                </span>
              </div>
            </div>

            {/* 3. CÂY TRỒNG */}
            <div className="season-modal-item item-crop">
              <div className="season-modal-item-icon icon-sprout">
                <IconSprout size={18} strokeWidth={2.2} />
              </div>
              <div className="season-modal-item-content">
                <span className="item-label">Cây trồng</span>
                <strong className="item-value">{season.crop?.name || 'Chưa xác định'}</strong>
                <span className="item-sub">
                  {season.crop?.variety ? `Giống: ${season.crop.variety}` : (season.crop?.category || 'Cây nông nghiệp')}
                </span>
              </div>
            </div>

            {/* 4. NÔNG TRẠI */}
            <div className="season-modal-item item-farm">
              <div className="season-modal-item-icon icon-amber">
                <IconWarehouse size={18} strokeWidth={2.2} />
              </div>
              <div className="season-modal-item-content">
                <span className="item-label">Nông trại</span>
                <strong className="item-value">{farm?.name || season.plot?.farm?.name || season.farm?.name || 'Nông trại'}</strong>
                {(farm?.address || season.plot?.farm?.address) && (
                  <span className="item-sub">{farm?.address || season.plot?.farm?.address}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="season-modal-footer">
          <button
            type="button"
            className="btn-modal-manage-season"
            onClick={() => {
              onClose();
              if (onNavigateSeasons) onNavigateSeasons();
            }}
          >
            <span>Quản lý tại trang Mùa vụ</span>
            <IconExternalLink size={14} strokeWidth={2.2} />
          </button>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
