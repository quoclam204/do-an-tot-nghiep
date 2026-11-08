# 📑 Phase M — Đặc Tả: Đồng Bộ Dữ Liệu (Sync)

> **Thời gian:** 1 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase K (IndexedDB), Phase L (PWA)  
> **Tiếp theo:** Phase N-O (Reports)

---

## 1. Tổng Quan

Phase M triển khai **cơ chế đồng bộ dữ liệu** giữa IndexedDB (client) và PostgreSQL (server). Đây là phần phức tạp nhất trong kiến trúc offline-first.

**Luồng chính:**
1. User tạo data offline → lưu IndexedDB + SyncQueue.
2. Khi có mạng → SyncManager xử lý queue → POST /sync/push.
3. Server xử lý batch → trả kết quả (SYNCED / CONFLICT / ERROR).
4. Client cập nhật IndexedDB dựa trên kết quả.
5. Client pull dữ liệu mới từ server → GET /sync/pull.

---

## 2. Sync Flow Chi Tiết

### 2.1 Push Flow (Client → Server)
```
┌─────────────────────────────────────────────────┐
│  SyncManager.pushPendingOps()                    │
│                                                  │
│  1. Lấy tất cả SyncQueue entries (status=PENDING)│
│  2. Sắp xếp theo createdAt (FIFO)               │
│  3. Batch gửi: POST /sync/push                  │
│     Body: { operations: [...] }                  │
│                                                  │
│  4. Server xử lý từng operation:                 │
│     ┌─────────────────────────────────────┐      │
│     │ For each operation:                 │      │
│     │   ├── Validate payload              │      │
│     │   ├── Check conflict (updatedAt)    │      │
│     │   ├── Execute CREATE/UPDATE/DELETE   │      │
│     │   └── Return result                 │      │
│     └─────────────────────────────────────┘      │
│                                                  │
│  5. Client nhận response:                        │
│     ├── SYNCED → Update IndexedDB (serverId)     │
│     │            + Xóa SyncQueue entry           │
│     ├── CONFLICT → Giữ lại, set status=CONFLICT  │
│     │              + Thông báo user               │
│     └── ERROR → Giữ lại, retry++ (max 3)         │
└─────────────────────────────────────────────────┘
```

### 2.2 Pull Flow (Server → Client)
```
┌─────────────────────────────────────────────────┐
│  SyncManager.pullUpdates()                       │
│                                                  │
│  1. Lấy lastSyncAt từ SyncMeta                   │
│  2. GET /sync/pull?since=lastSyncAt              │
│  3. Server trả data thay đổi since lastSyncAt    │
│  4. Client cập nhật IndexedDB:                   │
│     ├── Upsert records mới/update                │
│     └── Mark deleted records                     │
│  5. Cập nhật SyncMeta.lastSyncAt = serverTime    │
└─────────────────────────────────────────────────┘
```

---

## 3. Backend — Sync Module (NestJS)

### 3.1 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/sync/push` | Nhận batch operations từ client |
| `GET` | `/sync/pull?since=ISO_DATE&entities=activityLogs,inventories` | Gửi data mới cho client |

### 3.2 POST /sync/push

**Request:**
```json
{
  "operations": [
    {
      "clientId": "client-uuid-1",
      "operation": "CREATE",
      "entity": "activityLogs",
      "entityId": "client-generated-uuid",
      "payload": {
        "cropCycleId": "uuid",
        "activityType": "BON_PHAN",
        "activityDate": "2025-03-15",
        "notes": "Bón phân NPK",
        "cost": 200000,
        "materials": [
          { "materialId": "uuid", "quantityUsed": 50, "cost": 750000 }
        ]
      },
      "clientTimestamp": "2025-03-15T08:05:00Z"
    },
    {
      "clientId": "client-uuid-2",
      "operation": "UPDATE",
      "entity": "activityLogs",
      "entityId": "server-uuid-existing",
      "payload": {
        "notes": "Bón phân NPK (đã sửa)"
      },
      "clientTimestamp": "2025-03-15T08:10:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "clientId": "client-uuid-1",
      "status": "SYNCED",
      "serverId": "server-generated-uuid",
      "serverTimestamp": "2025-03-15T08:06:00Z"
    },
    {
      "clientId": "client-uuid-2",
      "status": "SYNCED",
      "serverId": "server-uuid-existing",
      "serverTimestamp": "2025-03-15T08:11:00Z"
    }
  ],
  "conflicts": [],
  "errors": []
}
```

### 3.3 GET /sync/pull

**Request:**
```
GET /sync/pull?since=2025-03-15T00:00:00Z&entities=activityLogs,inventories,farms
```

**Response:**
```json
{
  "data": {
    "activityLogs": {
      "upserted": [
        { "id": "uuid", "...fields": "..." }
      ],
      "deleted": ["uuid-1", "uuid-2"]
    },
    "inventories": {
      "upserted": [...],
      "deleted": []
    },
    "farms": {
      "upserted": [...],
      "deleted": []
    }
  },
  "serverTime": "2025-03-15T12:00:00Z",
  "hasMore": false
}
```

### 3.4 Sync Service (Backend)
```typescript
// src/sync/sync.service.ts
@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async push(userId: string, operations: SyncOperation[]) {
    const results = [];
    const conflicts = [];
    const errors = [];

    for (const op of operations) {
      try {
        const result = await this.processOperation(userId, op);
        results.push(result);
      } catch (error) {
        if (error instanceof ConflictException) {
          conflicts.push({
            clientId: op.clientId,
            status: 'CONFLICT',
            serverVersion: error.getResponse(),
          });
        } else {
          errors.push({
            clientId: op.clientId,
            status: 'ERROR',
            message: error.message,
          });
        }
      }
    }

    return { results, conflicts, errors };
  }

  private async processOperation(userId: string, op: SyncOperation) {
    switch (op.entity) {
      case 'activityLogs':
        return this.syncActivityLog(userId, op);
      // ... other entities
    }
  }

  private async syncActivityLog(userId: string, op: SyncOperation) {
    // Verify ownership (user → farm → plot → cropCycle)
    // Check conflict (updatedAt comparison)
    // Execute operation
    // Return result
  }
}
```

---

## 4. Frontend — SyncManager

```typescript
// src/offline/syncManager.ts
import { db } from './db';
import { syncApi } from '../services/api';

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 phút

class SyncManager {
  private intervalId: number | null = null;

  start() {
    // Sync khi online
    window.addEventListener('online', () => this.sync());
    
    // Periodic sync
    this.intervalId = window.setInterval(() => {
      if (navigator.onLine) this.sync();
    }, SYNC_INTERVAL);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  async sync() {
    await this.push();
    await this.pull();
  }

  async push() {
    const pending = await db.syncQueue
      .where('status').equals('PENDING')
      .and(item => item.retryCount < MAX_RETRIES)
      .sortBy('createdAt');

    if (pending.length === 0) return;

    // Mark as SYNCING
    await db.syncQueue.bulkUpdate(
      pending.map(p => ({ key: p.clientId, changes: { status: 'SYNCING' } }))
    );

    try {
      const response = await syncApi.push({ operations: pending });

      // Process results
      for (const result of response.data.results) {
        // Update IndexedDB entity with server ID
        // Remove from SyncQueue
        await db.syncQueue.delete(result.clientId);
      }

      for (const conflict of response.data.conflicts) {
        await db.syncQueue.update(conflict.clientId, { status: 'FAILED' });
      }

      for (const error of response.data.errors) {
        const item = pending.find(p => p.clientId === error.clientId);
        await db.syncQueue.update(error.clientId, {
          status: 'PENDING',
          retryCount: (item?.retryCount || 0) + 1,
          lastAttempt: new Date().toISOString(),
          errorMessage: error.message,
        });
      }
    } catch {
      // Network error → revert to PENDING
      await db.syncQueue.bulkUpdate(
        pending.map(p => ({ key: p.clientId, changes: { status: 'PENDING' } }))
      );
    }
  }

  async pull() {
    const entities = ['farms', 'activityLogs', 'inventories', 'cropCycles'];
    
    for (const entity of entities) {
      const meta = await db.syncMeta.get(entity);
      const since = meta?.lastSyncAt || '1970-01-01T00:00:00Z';
      
      const response = await syncApi.pull({ since, entities: [entity] });
      
      // Upsert into IndexedDB
      const table = db.table(entity);
      if (response.data.data[entity]) {
        await table.bulkPut(response.data.data[entity].upserted);
      }
      
      // Update sync meta
      await db.syncMeta.put({ entity, lastSyncAt: response.data.serverTime });
    }
  }

  async getPendingCount(): Promise<number> {
    return db.syncQueue.where('status').equals('PENDING').count();
  }
}

export const syncManager = new SyncManager();
```

---

## 5. Conflict Resolution

### Strategy: Last-Write-Wins (LWW)
```
Client gửi update (clientTimestamp: 08:05)
Server kiểm tra: record.updatedAt = 08:03

08:03 < 08:05 → Không conflict → Áp dụng update

---

Client gửi update (clientTimestamp: 08:05)
Server kiểm tra: record.updatedAt = 08:10

08:10 > 08:05 → CONFLICT → Server version mới hơn

→ Mặc định: giữ server version (LWW)
→ Tùy chọn: thông báo user để chọn
```

---

## 6. SyncContext (React)

```typescript
// src/context/SyncContext.tsx
const SyncContext = createContext({
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,
  syncNow: () => {},
});

export function SyncProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const isOnline = useOnlineStatus();

  // useLiveQuery để tự update pendingCount
  const count = useLiveQuery(() => 
    db.syncQueue.where('status').equals('PENDING').count()
  );

  useEffect(() => { setPendingCount(count || 0); }, [count]);

  // Auto sync khi online
  useEffect(() => {
    if (isOnline) syncManager.start();
    return () => syncManager.stop();
  }, [isOnline]);

  const syncNow = async () => {
    setIsSyncing(true);
    await syncManager.sync();
    setIsSyncing(false);
    setLastSyncAt(new Date());
  };

  return (
    <SyncContext.Provider value={{ pendingCount, isSyncing, lastSyncAt, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}
```

---

## 7. Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Push 1 PENDING operation → server SYNCED | SyncQueue entry removed |
| 2 | Push → network error | Entries revert to PENDING |
| 3 | Push → CONFLICT | Entry marked FAILED |
| 4 | Push → retry 3 lần rồi stop | retryCount = 3, không retry nữa |
| 5 | Pull → upsert mới | IndexedDB updated |
| 6 | Pull → update lastSyncAt | SyncMeta updated |
| 7 | Conflict detection | server updatedAt > client → CONFLICT |
| 8 | Full flow: offline create → online push → verify | Data đúng trên server |

---

## 8. Tiêu Chí Hoàn Thành

- [ ] Backend: POST /sync/push hoạt động (batch)
- [ ] Backend: GET /sync/pull hoạt động (delta)
- [ ] Frontend: SyncManager push/pull hoạt động
- [ ] Auto-sync khi online (5 phút interval)
- [ ] Sync khi phát hiện online event
- [ ] Conflict detection hoạt động
- [ ] SyncContext: pendingCount, isSyncing, syncNow
- [ ] Nút "Đồng bộ ngay" trên UI
- [ ] Manual test: 10 nhật ký offline → sync → verify server data
- [ ] Unit tests ≥ 8 cases PASS
