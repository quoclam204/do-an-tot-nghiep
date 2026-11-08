# 📑 Phase 8 — Đặc Tả: Nhật Ký Hoạt Động Canh Tác (ActivityLog)

> **Thời gian:** 2 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase 7 (CropCycle)  
> **Tiếp theo:** Phase 9 (Inventory)

---

## 1. Tổng Quan

Đây là **tính năng cốt lõi nhất** của DalatAgri — nơi nông dân ghi nhận mọi công việc hàng ngày trên vườn. Mỗi hoạt động được gắn vào một vụ mùa (CropCycle) cụ thể và có thể kèm theo vật tư sử dụng.

---

## 2. Loại Hoạt Động (ActivityType)

| Mã | Icon | Tên | Mô tả | Cần vật tư? | Có thu hoạch? |
|----|------|-----|-------|-------------|--------------|
| `LAM_DAT` | 🚜 | Làm đất | Cày, xới, lên luống, dọn đất | ❌ | ❌ |
| `TRONG` | 🌱 | Trồng | Trồng mới, thay thế cây chết | ✅ (giống) | ❌ |
| `TUOI` | 💧 | Tưới nước | Tưới thủ công / tự động | ❌ | ❌ |
| `BON_PHAN` | 🧪 | Bón phân | Bón gốc, phun lá, bón thúc | ✅ | ❌ |
| `PHUN_THUOC` | 🔫 | Phun thuốc | Trừ sâu, diệt cỏ, kích thích | ✅ | ❌ |
| `CHAM_SOC` | ✂️ | Chăm sóc | Tỉa cành, cắt tỉa, làm cỏ | ❌ | ❌ |
| `THU_HOACH` | 🌾 | Thu hoạch | Hái quả, cắt trái, gom sản phẩm | ❌ | ✅ |
| `KHAC` | 📝 | Khác | Ghi chú hiện trường, sự kiện đặc biệt | ❌ | ❌ |

---

## 3. Database Schema

### 3.1 ActivityLog

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK | Khóa chính |
| `cropCycleId` | UUID | FK → CropCycle, NOT NULL | Thuộc vụ mùa nào |
| `activityType` | String | NOT NULL | Loại hoạt động (enum trên) |
| `activityDate` | DateTime | NOT NULL | Ngày thực hiện |
| `notes` | String? | nullable | Ghi chú tự do |
| `cost` | Float? | nullable, default: 0 | Chi phí phát sinh (nhân công, thuê máy) |
| `harvestQuantity` | Float? | nullable | Sản lượng thu hoạch (kg) — chỉ cho THU_HOACH |
| `revenue` | Float? | nullable | Doanh thu — chỉ cho THU_HOACH |
| `syncStatus` | String | NOT NULL, default: SYNCED | Trạng thái đồng bộ |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |
| `deletedAt` | DateTime? | nullable | Soft delete |

### 3.2 ActivityMaterial (Bảng trung gian)

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK | Khóa chính |
| `activityLogId` | UUID | FK → ActivityLog, NOT NULL | Thuộc nhật ký nào |
| `materialId` | UUID | FK → Material, NOT NULL | Vật tư nào |
| `quantityUsed` | Float | NOT NULL, > 0 | Số lượng sử dụng |
| `cost` | Float | NOT NULL | Chi phí = quantityUsed × đơn giá |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |
| `deletedAt` | DateTime? | nullable | Soft delete |

---

## 4. API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/activity-logs` | Ghi nhật ký mới | ✅ |
| `GET` | `/activity-logs?cropCycleId=uuid&page=1&limit=20` | Danh sách (phân trang) | ✅ |
| `GET` | `/activity-logs?cropCycleId=uuid&type=BON_PHAN` | Lọc theo loại | ✅ |
| `GET` | `/activity-logs?cropCycleId=uuid&from=date&to=date` | Lọc theo khoảng thời gian | ✅ |
| `GET` | `/activity-logs/:id` | Chi tiết (kèm vật tư) | ✅ |
| `PATCH` | `/activity-logs/:id` | Cập nhật | ✅ |
| `DELETE` | `/activity-logs/:id` | Xóa mềm | ✅ |

### Request — Tạo nhật ký (bón phân)
```json
{
  "cropCycleId": "uuid",
  "activityType": "BON_PHAN",
  "activityDate": "2025-03-15",
  "notes": "Bón phân NPK gốc buổi sáng, trời nắng nhẹ, đất ẩm vừa",
  "cost": 200000,
  "materials": [
    {
      "materialId": "uuid-npk",
      "quantityUsed": 50,
      "cost": 750000
    },
    {
      "materialId": "uuid-huu-co",
      "quantityUsed": 30,
      "cost": 150000
    }
  ]
}
```

### Request — Tạo nhật ký (thu hoạch)
```json
{
  "cropCycleId": "uuid",
  "activityType": "THU_HOACH",
  "activityDate": "2025-06-20",
  "notes": "Thu hoạch đợt 1, quả chín đều, chất lượng tốt",
  "cost": 500000,
  "harvestQuantity": 200,
  "revenue": 12000000,
  "materials": []
}
```

### Response — Chi tiết nhật ký
```json
{
  "id": "uuid",
  "cropCycleId": "uuid",
  "activityType": "BON_PHAN",
  "activityDate": "2025-03-15",
  "notes": "Bón phân NPK gốc buổi sáng...",
  "cost": 200000,
  "harvestQuantity": null,
  "revenue": null,
  "syncStatus": "SYNCED",
  "materials": [
    {
      "id": "uuid",
      "materialId": "uuid-npk",
      "materialName": "Phân NPK 16-16-8",
      "unit": "kg",
      "quantityUsed": 50,
      "unitPrice": 15000,
      "cost": 750000
    },
    {
      "id": "uuid",
      "materialId": "uuid-huu-co",
      "materialName": "Phân hữu cơ vi sinh",
      "unit": "kg",
      "quantityUsed": 30,
      "unitPrice": 5000,
      "cost": 150000
    }
  ],
  "totalMaterialCost": 900000,
  "totalCost": 1100000,
  "cropCycle": {
    "id": "uuid",
    "name": "Vụ cà phê 2024-2025"
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Response — Danh sách (phân trang)
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## 5. Business Rules

1. **Chỉ ghi nhật ký vào CropCycle có status = ACTIVE.**
2. `totalCost = cost + Σ(materials[].cost)`.
3. `harvestQuantity` & `revenue` chỉ được fill khi `activityType = THU_HOACH`.
4. Khi tạo ActivityLog có materials → **trừ Inventory** (Phase 9).
5. Khi xóa ActivityLog → **hoàn Inventory** (Phase 9).
6. Khi tạo ActivityLog loại THU_HOACH → **cộng dồn `CropCycle.totalYield`**.
7. `syncStatus` mặc định = `SYNCED`. Set `PENDING` khi tạo offline (Phase K).
8. Phân trang mặc định: `page=1, limit=20`, sắp xếp `activityDate DESC`.

---

## 6. Frontend

### 6.1 ActivityLogPage (Timeline)
```
┌─────────────────────────────────────────┐
│  Vụ cà phê 2024-2025  ▼ Filter ▼  + Thêm │
├─────────────────────────────────────────┤
│                                         │
│  📅 15/03/2025                          │
│  ┌─────────────────────────────────┐    │
│  │ 🧪 Bón phân                     │    │
│  │ Bón NPK gốc buổi sáng          │    │
│  │ 💰 1,100,000₫  📦 2 vật tư      │    │
│  │ ✅ Đã đồng bộ                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📅 10/03/2025                          │
│  ┌─────────────────────────────────┐    │
│  │ 💧 Tưới nước                     │    │
│  │ Tưới buổi chiều, 30 phút        │    │
│  │ 💰 0₫                           │    │
│  │ ✅ Đã đồng bộ                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📅 05/03/2025                          │
│  ┌─────────────────────────────────┐    │
│  │ 🌾 Thu hoạch                     │    │
│  │ Đợt 1, quả chín đều             │    │
│  │ 🌾 200 kg  💰 12,000,000₫       │    │
│  │ ✅ Đã đồng bộ                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [Tải thêm...]                 │
└─────────────────────────────────────────┘
```

### 6.2 ActivityLogForm (Modal / Full page trên mobile)
- Step 1: Chọn loại hoạt động (icon grid)
- Step 2: Chọn ngày, nhập ghi chú
- Step 3 (nếu có vật tư): Chọn & nhập số lượng vật tư
- Step 3 (nếu thu hoạch): Nhập sản lượng & doanh thu
- Step 4: Nhập chi phí phát sinh → Xem tóm tắt → Lưu

### 6.3 Components
- `TimelineCard` — Card hiển thị 1 hoạt động
- `ActivityTypeSelector` — Icon grid chọn loại
- `MaterialInputList` — Dynamic list thêm/xóa vật tư
- `HarvestInput` — Input sản lượng + doanh thu
- `SyncBadge` — Hiển thị trạng thái đồng bộ

---

## 7. Validation DTO

```typescript
export class CreateActivityLogDto {
  @IsUUID()
  cropCycleId: string;

  @IsIn(['LAM_DAT', 'TRONG', 'TUOI', 'BON_PHAN', 'PHUN_THUOC', 'CHAM_SOC', 'THU_HOACH', 'KHAC'])
  activityType: string;

  @IsDateString()
  activityDate: string;

  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  harvestQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateActivityMaterialDto)
  materials?: CreateActivityMaterialDto[];
}

export class CreateActivityMaterialDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @IsPositive()
  quantityUsed: number;

  @IsNumber()
  @Min(0)
  cost: number;
}
```

---

## 8. Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Tạo ActivityLog hợp lệ (không vật tư) | 201, log created |
| 2 | Tạo ActivityLog với 2 vật tư | 201, 2 ActivityMaterial created |
| 3 | Tạo ActivityLog trên CropCycle COMPLETED | 400 |
| 4 | Tạo ActivityLog THU_HOACH → totalYield cộng dồn | CropCycle.totalYield += harvestQuantity |
| 5 | Tạo ActivityLog BON_PHAN thiếu materials | Cho phép (materials optional) |
| 6 | totalCost = cost + Σ materials.cost | Tính toán đúng |
| 7 | Phân trang: page=2, limit=10 | Trả đúng offset |
| 8 | Filter theo activityType | Chỉ trả đúng loại |
| 9 | Filter theo date range | Chỉ trả trong khoảng |
| 10 | Xóa ActivityLog → soft delete | deletedAt != null |

---

## 9. Tiêu Chí Hoàn Thành

- [ ] CRUD ActivityLog hoạt động (BE + FE)
- [ ] Liên kết vật tư (ActivityMaterial) hoạt động
- [ ] Tổng chi phí tính đúng (cost + materials)
- [ ] Thu hoạch cộng dồn CropCycle.totalYield
- [ ] Timeline hiển thị đẹp, có icon theo loại
- [ ] Form ghi nhật ký multi-step trên mobile
- [ ] Phân trang hoạt động
- [ ] Filter theo loại, date range
- [ ] Validation DTO đầy đủ
- [ ] Unit tests ≥ 10 cases PASS
