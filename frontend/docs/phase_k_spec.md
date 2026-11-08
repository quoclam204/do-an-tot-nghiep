# 📑 Phase K — Đặc Tả: Offline-First (IndexedDB)

> **Thời gian:** 2 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase J (Code Review hoàn thành)  
> **Tiếp theo:** Phase L (PWA)

---

## 1. Tổng Quan

Phase K xây dựng **lớp lưu trữ cục bộ** (IndexedDB) cho phép ứng dụng hoạt động khi mất mạng. Sử dụng thư viện **Dexie.js** để đơn giản hóa việc thao tác với IndexedDB.

**Khi mất mạng, user vẫn có thể:**
- Xem danh sách nông hộ, lô trồng, vụ mùa.
- Xem nhật ký hoạt động đã ghi.
- Tạo mới nhật ký hoạt động → lưu vào IndexedDB.
- Xem tồn kho (dữ liệu cached).

---

## 2. Công Nghệ

| Thành phần | Lựa chọn | Lý do |
|-----------|----------|-------|
| **IndexedDB wrapper** | Dexie.js v4 | API đơn giản, TypeScript support, reactive queries |
| **State management** | React Context + Dexie hooks | `useLiveQuery()` tự update UI khi data thay đổi |

### Cài đặt
```bash
cd frontend
npm install dexie dexie-react-hooks
```

---

## 3. IndexedDB Schema (Dexie)

```typescript
// src/offline/db.ts
import Dexie, { type Table } from 'dexie';

export interface OfflineFarm {
  id: string;
  userId: string;
  name: string;
  location: string;
  totalArea: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfflinePlot {
  id: string;
  farmId: string;
  name: string;
  area: number;
}

export interface OfflineCropCycle {
  id: string;
  plotId: string;
  cropId: string;
  name: string;
  status: string;
  startDate: string;
  expectedEndDate: string;
  totalYield: number;
}

export interface OfflineActivityLog {
  id: string;             // UUID (client-generated khi offline)
  cropCycleId: string;
  activityType: string;
  activityDate: string;
  notes?: string;
  cost?: number;
  harvestQuantity?: number;
  revenue?: number;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED' | 'CONFLICT';
  materials?: OfflineActivityMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface OfflineActivityMaterial {
  materialId: string;
  materialName?: string;
  quantityUsed: number;
  cost: number;
}

export interface OfflineMaterial {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
}

export interface OfflineInventory {
  id: string;
  farmId: string;
  materialId: string;
  quantity: number;
  totalCost: number;
}

export interface SyncQueueItem {
  clientId: string;        // UUID v4
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;          // 'activityLogs' | 'farms' | ...
  entityId: string;        // ID of the entity
  payload: any;            // Full request body
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  createdAt: string;
  lastAttempt?: string;
  errorMessage?: string;
}

export interface SyncMeta {
  entity: string;
  lastSyncAt: string;
}

class DalatAgriDB extends Dexie {
  farms!: Table<OfflineFarm>;
  plots!: Table<OfflinePlot>;
  crops!: Table<OfflineMaterial>;
  materials!: Table<OfflineMaterial>;
  cropCycles!: Table<OfflineCropCycle>;
  activityLogs!: Table<OfflineActivityLog>;
  inventories!: Table<OfflineInventory>;
  syncQueue!: Table<SyncQueueItem>;
  syncMeta!: Table<SyncMeta>;

  constructor() {
    super('DalatAgriDB');
    this.version(1).stores({
      farms: 'id, userId',
      plots: 'id, farmId',
      crops: 'id',
      materials: 'id',
      cropCycles: 'id, plotId, status',
      activityLogs: 'id, cropCycleId, syncStatus, activityDate',
      inventories: 'id, farmId, materialId',
      syncQueue: 'clientId, status, createdAt',
      syncMeta: 'entity',
    });
  }
}

export const db = new DalatAgriDB();
```

---

## 4. Offline Service Layer

### 4.1 Kiến trúc

```
┌─────────────────────────────────────────────────┐
│  React Component                                 │
│  └── useActivityLogs(cropCycleId)               │
│       └── offlineActivityLogService             │
│            ├── Online?                           │
│            │   ├── YES → apiService.get(...)     │
│            │   │         + db.activityLogs.put(.) │ ← Cache
│            │   └── NO  → db.activityLogs         │ ← Read local
│            │              .where({ cropCycleId }) │
│            │              .toArray()              │
│            └── Write:                            │
│                ├── Online → apiService.post(...)  │
│                │            + db.activityLogs.put │
│                └── Offline → db.activityLogs.put  │
│                              + db.syncQueue.add   │
└─────────────────────────────────────────────────┘
```

### 4.2 Offline Service Example

```typescript
// src/offline/activityLogOfflineService.ts
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { activityLogApi } from '../services/api';

export const activityLogOfflineService = {
  
  async getAll(cropCycleId: string) {
    if (navigator.onLine) {
      try {
        const response = await activityLogApi.list(cropCycleId);
        // Cache vào IndexedDB
        await db.activityLogs.bulkPut(response.data);
        return response.data;
      } catch {
        // Fallback to local
        return db.activityLogs.where({ cropCycleId }).toArray();
      }
    }
    return db.activityLogs.where({ cropCycleId }).toArray();
  },

  async create(data: CreateActivityLogDto) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const log = {
      id,
      ...data,
      syncStatus: navigator.onLine ? 'SYNCED' as const : 'PENDING' as const,
      createdAt: now,
      updatedAt: now,
    };

    if (navigator.onLine) {
      try {
        const response = await activityLogApi.create(data);
        log.id = response.data.id; // Dùng server ID
        log.syncStatus = 'SYNCED';
        await db.activityLogs.put(log);
        return response.data;
      } catch {
        // Network error → save offline
        log.syncStatus = 'PENDING';
      }
    }

    // Save to IndexedDB
    await db.activityLogs.put(log);
    
    // Add to sync queue
    await db.syncQueue.add({
      clientId: uuidv4(),
      operation: 'CREATE',
      entity: 'activityLogs',
      entityId: id,
      payload: data,
      status: 'PENDING',
      retryCount: 0,
      createdAt: now,
    });

    return log;
  },
};
```

---

## 5. Custom Hooks (Dexie React)

```typescript
// src/hooks/useOfflineActivityLogs.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../offline/db';
import { activityLogOfflineService } from '../offline/activityLogOfflineService';
import { useState, useEffect } from 'react';

export function useOfflineActivityLogs(cropCycleId: string) {
  const [isLoading, setIsLoading] = useState(true);

  // Live query — tự update khi IndexedDB thay đổi
  const logs = useLiveQuery(
    () => db.activityLogs
      .where({ cropCycleId })
      .reverse()
      .sortBy('activityDate'),
    [cropCycleId]
  );

  // Fetch from server (nếu online) → cache vào IndexedDB → useLiveQuery tự update
  useEffect(() => {
    activityLogOfflineService.getAll(cropCycleId)
      .finally(() => setIsLoading(false));
  }, [cropCycleId]);

  return { logs: logs || [], isLoading };
}
```

---

## 6. Online/Offline Detection

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## 7. Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | IndexedDB schema tạo đúng tables | Tất cả stores tồn tại |
| 2 | Save ActivityLog offline | Lưu vào IndexedDB + SyncQueue |
| 3 | Read ActivityLog khi offline | Trả data từ IndexedDB |
| 4 | Read ActivityLog khi online | Gọi API + cache vào IndexedDB |
| 5 | API fail → fallback IndexedDB | Trả cached data |
| 6 | SyncQueue entry created khi offline | clientId, status=PENDING |
| 7 | useLiveQuery tự update | Thêm data → UI update |
| 8 | Online/Offline detection | Đúng trạng thái |

---

## 8. Tiêu Chí Hoàn Thành

- [ ] Dexie.js installed & configured
- [ ] IndexedDB schema: 9 object stores
- [ ] Offline service cho ActivityLog (read + write)
- [ ] Offline service cho Farms, CropCycles (read only)
- [ ] SyncQueue entries tạo đúng khi offline
- [ ] useLiveQuery hoạt động (UI tự update)
- [ ] useOnlineStatus hook
- [ ] App mở được khi tắt wifi (xem data cached)
- [ ] Tạo nhật ký offline → lưu IndexedDB thành công
- [ ] Unit tests ≥ 8 cases PASS
