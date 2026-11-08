/**
 * indexedDB.js
 * Quản lý cơ sở dữ liệu cục bộ IndexedDB (DalatAgriLocalDB) cho DalatAgri PWA.
 * Thay thế giới hạn 5MB của localStorage, cho phép lưu trữ lớn, an toàn,
 * hoạt động ngoại tuyến (Offline-First) ngay cả khi mất sóng 4G/WiFi.
 */

const DB_NAME = 'DalatAgriLocalDB';
const DB_VERSION = 1;

export const STORES = {
  SYNC_QUEUE: 'syncQueue',
  OPTIMISTIC_LOGS: 'optimisticLogs',
  CATALOGS: 'catalogs',
  METADATA: 'metadata',
};

let dbInstance = null;
let dbInitPromise = null;

/**
 * Khởi tạo kết nối IndexedDB và thiết lập Schema các Object Stores
 */
export function openLocalDatabase() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log(`[IndexedDB] Đang nâng cấp cấu trúc CSDL cục bộ ${DB_NAME} (v${DB_VERSION})...`);

      // 1. Store Hàng đợi đồng bộ (Sync Queue)
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Store Nhật ký cục bộ tức thì (Optimistic Logs)
      if (!db.objectStoreNames.contains(STORES.OPTIMISTIC_LOGS)) {
        const logStore = db.createObjectStore(STORES.OPTIMISTIC_LOGS, { keyPath: 'id' });
        logStore.createIndex('activityDate', 'activityDate', { unique: false });
        logStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // 3. Store Danh mục tham chiếu ngoại tuyến (Farms, Plots, Crops, Seasons, Materials, Inventory)
      if (!db.objectStoreNames.contains(STORES.CATALOGS)) {
        db.createObjectStore(STORES.CATALOGS, { keyPath: 'key' });
      }

      // 4. Store Siêu dữ liệu hệ thống (Metadata & Lịch sử)
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log(`✅ [DalatAgri IndexedDB] Đã kết nối cơ sở dữ liệu cục bộ IndexedDB: "${DB_NAME}"`);
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Lỗi mở cơ sở dữ liệu IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });

  return dbInitPromise;
}

/**
 * Lấy 1 bản ghi theo khóa chính từ Object Store
 */
export async function idbGet(storeName, key) {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB idbGet] Store ${storeName}:`, err);
    return null;
  }
}

/**
 * Lấy toàn bộ bản ghi trong Object Store
 */
export async function idbGetAll(storeName) {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB idbGetAll] Store ${storeName}:`, err);
    return [];
  }
}

/**
 * Thêm hoặc Cập nhật 1 bản ghi (Upsert)
 */
export async function idbPut(storeName, value) {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB idbPut] Store ${storeName}:`, err);
    return null;
  }
}

/**
 * Lưu nhiều bản ghi trong cùng một Transaction
 */
export async function idbPutMany(storeName, items = []) {
  if (!items || items.length === 0) return true;
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB idbPutMany] Store ${storeName}:`, err);
    return false;
  }
}

/**
 * Xóa 1 bản ghi theo khóa chính
 */
export async function idbDelete(storeName, key) {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB idbDelete] Store ${storeName}:`, err);
    return false;
  }
}

/**
 * Xóa trắng toàn bộ dữ liệu trong 1 Object Store
 */
export async function idbClear(storeName) {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB idbClear] Store ${storeName}:`, err);
    return false;
  }
}

/**
 * Đếm số lượng bản ghi trong Object Store
 */
export async function idbCount(storeName) {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return 0;
  }
}

// Tự động khởi tạo kết nối IndexedDB khi module được load
if (typeof window !== 'undefined' && window.indexedDB) {
  openLocalDatabase().catch((err) => {
    console.warn('[DalatAgri] Khởi tạo IndexedDB ban đầu:', err);
  });
}
