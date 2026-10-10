/**
 * offlineSync.js
 * Quản lý ghi nhận dữ liệu ngoại tuyến (Offline-First) và Đồng bộ an toàn (Safe Sync) cho DalatAgri.
 * Đặc biệt thiết kế cho nông hộ canh tác tại rẫy xa, đồi núi, nhà kính mạng yếu hoặc mất kết nối 4G/WiFi.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  apiCreateActivityLog,
  apiUpdateActivityLog,
  apiDeleteActivityLog,
} from '../services/api';

export const OFFLINE_QUEUE_KEY = 'dalatagri_offline_sync_queue_v2';
export const CACHED_CATALOGS_KEY = 'dalatagri_cached_catalogs_v2';
export const OPTIMISTIC_LOGS_KEY = 'dalatagri_optimistic_logs_v2';

// ── 1. Kiểm tra trạng thái mạng ──────────────────────────────────────
export const checkIsOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// ── 2. Quản lý hàng đợi (Queue) lưu trữ cục bộ an toàn ───────────────
export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Lỗi đọc hàng đợi offline:', err);
    return [];
  }
};

export const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    // Phát sự kiện để các component khác tự update badge
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dalatagri:queue_changed', { detail: { count: queue.length } }));
    }
  } catch (err) {
    console.error('Lỗi lưu hàng đợi offline:', err);
  }
};

export const addToOfflineQueue = ({ type = 'CREATE_LOG', payload, preview = {} }) => {
  const queue = getOfflineQueue();
  const queueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    preview: {
      activityType: payload.activityType || 'BON_PHAN',
      activityDate: payload.activityDate || new Date().toISOString().slice(0, 10),
      cost: payload.cost || 0,
      revenue: payload.revenue || 0,
      harvestQuantity: payload.harvestQuantity || 0,
      notes: payload.notes || '',
      cropCycleId: payload.cropCycleId || '',
      materials: payload.materials || [],
      ...preview,
    },
    status: 'PENDING', // PENDING | SYNCING | FAILED
    createdAt: new Date().toISOString(),
    retryCount: 0,
    lastError: null,
  };

  queue.push(queueItem);
  saveOfflineQueue(queue);

  // Lưu thêm vào danh sách optimistic logs để bảng hiển thị tức thì
  addOptimisticLog(queueItem);

  return queueItem;
};

export const removeFromOfflineQueue = (queueId) => {
  const queue = getOfflineQueue().filter((item) => item.id !== queueId);
  saveOfflineQueue(queue);
};

export const getPendingCount = () => {
  return getOfflineQueue().filter((item) => item.status === 'PENDING' || item.status === 'FAILED').length;
};

// ── 3. Lưu trữ & Trích xuất Optimistic Logs (Xem trước tức thì) ────────
export const getOptimisticLogs = () => {
  try {
    const raw = localStorage.getItem(OPTIMISTIC_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveOptimisticLogs = (logs) => {
  try {
    localStorage.setItem(OPTIMISTIC_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Lỗi lưu optimistic logs:', err);
  }
};

export const addOptimisticLog = (queueItem) => {
  const existing = getOptimisticLogs();
  const optimistic = {
    id: queueItem.id,
    isOffline: true,
    syncStatus: 'PENDING',
    activityType: queueItem.preview.activityType,
    activityDate: queueItem.preview.activityDate,
    activityTime: queueItem.payload.activityTime || '08:00',
    workShift: queueItem.payload.workShift || 'SANG',
    cost: queueItem.preview.cost,
    revenue: queueItem.preview.revenue,
    harvestQuantity: queueItem.preview.harvestQuantity,
    unitPrice: queueItem.payload.unitPrice,
    notes: queueItem.preview.notes ? `[Lưu ngoại tuyến] ${queueItem.preview.notes}` : '[Lưu ngoại tuyến]',
    cropCycleId: queueItem.payload.cropCycleId,
    cropCycle: queueItem.preview.cropCycle || { name: 'Mùa vụ (Chờ đồng bộ)', crop: { name: 'Cây trồng' } },
    materials: (queueItem.payload.materials || []).map((m) => ({
      materialId: m.materialId,
      quantityUsed: m.quantityUsed,
      cost: m.cost,
      material: queueItem.preview.material || { name: 'Vật tư', unit: 'đơn vị' },
    })),
    createdAt: queueItem.createdAt,
  };

  const updated = [optimistic, ...existing.filter((l) => l.id !== queueItem.id)];
  saveOptimisticLogs(updated);
  return optimistic;
};

export const removeOptimisticLog = (id) => {
  const existing = getOptimisticLogs().filter((l) => l.id !== id);
  saveOptimisticLogs(existing);
};

// ── 4. Cache danh mục tham chiếu (Crops, Seasons, Materials, Farms) ────
// Giúp nông dân mở form và chọn dropdown ngay cả khi không có mạng
export const cacheCatalogs = (catalogs) => {
  if (!catalogs) return;
  try {
    const prev = getCachedCatalogs();
    const updated = {
      ...prev,
      ...catalogs,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHED_CATALOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Lỗi cache danh mục:', err);
  }
};

export const getCachedCatalogs = () => {
  try {
    const raw = localStorage.getItem(CACHED_CATALOGS_KEY);
    return raw ? JSON.parse(raw) : { farms: [], crops: [], seasons: [], materials: [] };
  } catch {
    return { farms: [], crops: [], seasons: [], materials: [] };
  }
};

// ── 5. Engine Đồng Bộ An Toàn (Safe Sync Engine) ───────────────────────
let isSyncing = false;

/**
 * Thực hiện đồng bộ tuần tự (FIFO) toàn bộ hàng đợi lên Server
 * Tránh xung đột, đảm bảo an toàn toàn vẹn dữ liệu
 */
export const syncOfflineQueue = async (onProgress) => {
  if (isSyncing) {
    return { success: false, message: 'Hệ thống đang trong quá trình đồng bộ.' };
  }

  if (!checkIsOnline()) {
    return { success: false, message: 'Thiết bị đang mất kết nối Internet. Vui lòng kiểm tra 4G/WiFi.' };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, count: 0, message: 'Tất cả dữ liệu đã được đồng bộ an toàn.' };
  }

  isSyncing = true;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (onProgress) {
        onProgress({ current: i + 1, total: queue.length, item });
      }

      try {
        if (item.type === 'CREATE_LOG') {
          // Gửi lên máy chủ
          await apiCreateActivityLog(item.payload);
          // Xóa khỏi hàng đợi & optimistic cache
          removeFromOfflineQueue(item.id);
          removeOptimisticLog(item.id);
          syncedCount++;
        } else if (item.type === 'UPDATE_LOG') {
          await apiUpdateActivityLog(item.logId, item.payload);
          removeFromOfflineQueue(item.id);
          syncedCount++;
        } else if (item.type === 'DELETE_LOG') {
          await apiDeleteActivityLog(item.logId);
          removeFromOfflineQueue(item.id);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Lỗi đồng bộ item ${item.id}:`, err);
        // Nếu là lỗi mất mạng giữa chừng, dừng lại bảo toàn dữ liệu
        if (!navigator.onLine || !err.response) {
          isSyncing = false;
          throw new Error('Mất kết nối Internet trong quá trình đồng bộ. Các bản ghi còn lại vẫn được bảo toàn an toàn!');
        }

        // Nếu là lỗi nghiệp vụ (ví dụ: mùa vụ đã bị xóa), đánh dấu FAILED để không nghẽn queue
        item.status = 'FAILED';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = err.response?.data?.message || err.message;
        saveOfflineQueue(queue);
        failedCount++;
      }
    }

    // Phát sự kiện thông báo đồng bộ hoàn tất
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dalatagri:sync_completed', {
          detail: {
            syncedCount,
            failedCount,
            remaining: getPendingCount(),
          },
        })
      );
    }

    return {
      success: true,
      syncedCount,
      failedCount,
      message: syncedCount > 0
        ? `Đã đồng bộ an toàn ${syncedCount} bản ghi lên hệ thống máy chủ!`
        : 'Không có bản ghi mới cần đồng bộ.',
    };
  } finally {
    isSyncing = false;
  }
};

// ── 6. React Hook: useOfflineSync ─────────────────────────────────────
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(checkIsOnline());
  const [pendingCount, setPendingCount] = useState(getPendingCount());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const updateState = useCallback(() => {
    setIsOnline(checkIsOnline());
    setPendingCount(getPendingCount());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Tự động kích hoạt đồng bộ ngầm khi có mạng trở lại
      const count = getPendingCount();
      if (count > 0) {
        setSyncing(true);
        syncOfflineQueue()
          .then((res) => {
            setLastSyncResult(res);
            updateState();
          })
          .catch((err) => {
            console.error('Tự động đồng bộ thất bại:', err);
          })
          .finally(() => {
            setSyncing(false);
          });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChanged = () => {
      updateState();
    };

    const handleSyncCompleted = () => {
      updateState();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('dalatagri:queue_changed', handleQueueChanged);
    window.addEventListener('dalatagri:sync_completed', handleSyncCompleted);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('dalatagri:queue_changed', handleQueueChanged);
      window.removeEventListener('dalatagri:sync_completed', handleSyncCompleted);
    };
  }, [updateState]);

  const triggerSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await syncOfflineQueue();
      setLastSyncResult(res);
      updateState();
      return res;
    } finally {
      setSyncing(false);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing: syncing,
    lastSyncResult,
    triggerSync,
    queueLog: addToOfflineQueue,
    getOptimisticLogs,
    cacheCatalogs,
    getCachedCatalogs,
  };
}
