import React, { useState } from 'react';
import './OfflineSyncBanner.css';
import { useOfflineSync } from '../utils/offlineSync';
import {
  IconWifiOff,
  IconRotateCw,
  IconCheckCircle,
  IconAlertCircle,
  IconClock,
} from './icons';

export default function OfflineSyncBanner({ onSyncSuccess }) {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const handleSyncNow = async () => {
    setSyncError(null);
    try {
      const res = await triggerSync();
      if (res && res.success) {
        setSyncFeedback(res.message || 'Đã đồng bộ toàn bộ nhật ký lên máy chủ thành công!');
        setSyncError(null);
        setTimeout(() => setSyncFeedback(null), 4000);
        if (onSyncSuccess) onSyncSuccess();
      } else if (res && !res.success) {
        setSyncError(
          res.message ||
            'Chưa thể gửi dữ liệu lên máy chủ lúc này. Bác yên tâm, số liệu vẫn được lưu an toàn trong máy.'
        );
      }
    } catch (err) {
      setSyncError(
        'Mạng kết nối chập chờn hoặc máy chủ phản hồi chậm. Toàn bộ nhật ký canh tác của bác vẫn lưu an toàn trên máy, hệ thống sẽ tự gửi lại khi có sóng ổn định.'
      );
    }
  };

  // Nếu trực tuyến và không có bản ghi nào chờ đồng bộ và không có feedback/lỗi -> ẩn đi cho gọn gàng
  if (isOnline && pendingCount === 0 && !syncFeedback && !syncError) {
    return null;
  }

  // 1. Trạng thái mất mạng
  if (!isOnline) {
    return (
      <div className="offline-sync-banner-wrap offline">
        <div className="sync-banner-left">
          <div className="sync-banner-icon-box">
            <IconWifiOff size={22} strokeWidth={2.2} />
          </div>
          <div className="sync-banner-text">
            <div className="sync-banner-title">
              <span>Đang ở khu vực mất mạng / Ngoại tuyến (Offline)</span>
              <span className="sync-badge-pill offline">Lưu Trữ Cục Bộ</span>
            </div>
            <p className="sync-banner-desc">
              Bạn vẫn có thể ghi nhật ký canh tác và thu hoạch bình thường ngoài vườn. Dữ liệu sẽ được lưu an toàn trong máy và tự động đồng bộ khi có kết nối trở lại.
              {pendingCount > 0 && <strong> (Đang lưu tạm {pendingCount} bản ghi)</strong>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trạng thái vừa đồng bộ thành công
  if (syncFeedback) {
    return (
      <div className="offline-sync-banner-wrap synced">
        <div className="sync-banner-left">
          <div className="sync-banner-icon-box">
            <IconCheckCircle size={22} strokeWidth={2.2} />
          </div>
          <div className="sync-banner-text">
            <div className="sync-banner-title">
              <span>Đồng bộ thành công!</span>
            </div>
            <p className="sync-banner-desc">{syncFeedback}</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Trạng thái lỗi đồng bộ (thông điệp trấn an, giải pháp rõ ràng, không giật popup)
  if (syncError) {
    return (
      <div className="offline-sync-banner-wrap error" role="alert">
        <div className="sync-banner-left">
          <div className="sync-banner-icon-box">
            <IconAlertCircle size={22} strokeWidth={2.2} />
          </div>
          <div className="sync-banner-text">
            <div className="sync-banner-title">
              <span>Chưa thể gửi dữ liệu lên máy chủ</span>
            </div>
            <p className="sync-banner-desc">{syncError}</p>
          </div>
        </div>
        <div className="sync-banner-actions">
          <button
            type="button"
            className={`btn-trigger-sync ${isSyncing ? 'spinning' : ''}`}
            onClick={handleSyncNow}
            disabled={isSyncing}
            title="Bấm để thử gửi lại dữ liệu"
          >
            <IconRotateCw size={15} strokeWidth={2.4} />
            <span>{isSyncing ? 'Đang gửi lại...' : 'Thử gửi lại'}</span>
          </button>
          <button
            type="button"
            className="btn-dismiss-sync"
            onClick={() => setSyncError(null)}
            title="Đóng thông báo lỗi này"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // 4. Trạng thái có mạng nhưng có bản ghi chờ đồng bộ
  return (
    <div className="offline-sync-banner-wrap pending">
      <div className="sync-banner-left">
        <div className="sync-banner-icon-box">
          <IconRotateCw size={22} strokeWidth={2.2} className={isSyncing ? 'spinning' : ''} />
        </div>
        <div className="sync-banner-text">
          <div className="sync-banner-title">
            <span>Đã kết nối Internet — Có {pendingCount} bản ghi nhật ký chờ đồng bộ</span>
            <span className="sync-badge-pill pending">Chờ Đồng Bộ</span>
          </div>
          <p className="sync-banner-desc">
            Các hoạt động bạn đã ghi nhận trong lúc mất kết nối ngoài vườn đang chờ gửi lên máy chủ để cập nhật báo cáo tài chính.
          </p>
        </div>
      </div>

      <div className="sync-banner-actions">
        <button
          type="button"
          className={`btn-trigger-sync ${isSyncing ? 'spinning' : ''}`}
          onClick={handleSyncNow}
          disabled={isSyncing}
          title="Bấm để tải các bản ghi ngoại tuyến lên máy chủ"
        >
          <IconRotateCw size={15} strokeWidth={2.4} />
          <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}</span>
        </button>
      </div>
    </div>
  );
}
