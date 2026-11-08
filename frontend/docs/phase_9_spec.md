# 📑 Phase 9 — Đặc Tả: Quản Lý Tồn Kho & Vật Tư (Inventory)

> **Thời gian:** 1 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase 8 (ActivityLog)  
> **Tiếp theo:** Phase H-I (Validation)

---

## 1. Tổng Quan

Quản lý tồn kho giúp nông hộ theo dõi lượng vật tư hiện có, tự động trừ khi sử dụng và cảnh báo khi sắp hết. Mỗi nông hộ (Farm) có kho riêng.

---

## 2. Database Schema — Inventory

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK | Khóa chính |
| `farmId` | UUID | FK → Farm, NOT NULL | Thuộc nông hộ nào |
| `materialId` | UUID | FK → Material, NOT NULL | Vật tư nào |
| `quantity` | Float | NOT NULL, default: 0 | Số lượng tồn kho hiện tại |
| `totalCost` | Float | NOT NULL, default: 0 | Tổng giá trị tồn kho |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |
| `deletedAt` | DateTime? | nullable | Soft delete |

**Unique constraint:** `(farmId, materialId)` — mỗi vật tư chỉ có 1 record tồn kho per farm.

---

## 3. Luồng Tồn Kho

### 3.1 Nhập kho (Import)
```
Nông dân mua phân bón
    └── Vào app → Nhập kho
         ├── Chọn nông hộ
         ├── Chọn vật tư (hoặc tạo mới)
         ├── Nhập số lượng: 100 kg
         ├── Nhập tổng tiền: 1,500,000₫
         └── Lưu
              ├── Inventory tồn tại → quantity += 100, totalCost += 1,500,000
              └── Inventory chưa tồn tại → Create mới
```

### 3.2 Xuất kho tự động (khi ghi nhật ký)
```
Ghi nhật ký bón phân: dùng 50 kg NPK
    └── ActivityLog + ActivityMaterial created
         └── Inventory.quantity -= 50
              ├── quantity ≥ 0 → OK
              └── quantity < 0 → Cảnh báo "Tồn kho không đủ" (vẫn cho ghi)
```

### 3.3 Hoàn kho (khi xóa nhật ký)
```
Xóa nhật ký bón phân (đã dùng 50 kg NPK)
    └── Inventory.quantity += 50 (hoàn lại)
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/inventory/import` | Nhập kho | ✅ OWNER |
| `GET` | `/inventory?farmId=uuid` | Danh sách tồn kho | ✅ |
| `GET` | `/inventory/:id` | Chi tiết | ✅ |
| `PATCH` | `/inventory/:id` | Điều chỉnh (kiểm kê) | ✅ OWNER |
| `GET` | `/inventory/low-stock?farmId=uuid` | Vật tư tồn kho thấp | ✅ |

### Request — Nhập kho
```json
{
  "farmId": "uuid",
  "materialId": "uuid",
  "quantity": 100,
  "totalCost": 1500000
}
```

### Response — Danh sách tồn kho
```json
[
  {
    "id": "uuid",
    "farmId": "uuid",
    "material": {
      "id": "uuid",
      "name": "Phân NPK 16-16-8",
      "unit": "kg",
      "defaultPrice": 15000
    },
    "quantity": 150,
    "totalCost": 2250000,
    "avgUnitPrice": 15000,
    "isLowStock": false,
    "updatedAt": "..."
  },
  {
    "id": "uuid",
    "farmId": "uuid",
    "material": {
      "id": "uuid",
      "name": "Thuốc trừ sâu Regent",
      "unit": "lít",
      "defaultPrice": 250000
    },
    "quantity": 2,
    "totalCost": 500000,
    "avgUnitPrice": 250000,
    "isLowStock": true,
    "updatedAt": "..."
  }
]
```

---

## 5. Business Rules

1. **Upsert logic:** Nếu `(farmId, materialId)` đã tồn tại → cộng dồn quantity & totalCost. Nếu chưa → tạo mới.
2. **Cảnh báo tồn kho thấp:** `isLowStock = true` khi `quantity ≤ ngưỡng` (mặc định: 10% so với tổng nhập hoặc ≤ 5 đơn vị).
3. **Cho phép ghi nhật ký khi tồn kho không đủ** (trường hợp nông dân quên nhập kho) → Hiện warning, không block.
4. **Không cho phép tồn kho âm quá nhiều** → Log warning cho admin.
5. `avgUnitPrice = totalCost / quantity` (giá trung bình).

---

## 6. Frontend

### 6.1 InventoryPage
```
┌─────────────────────────────────────────────────────┐
│  Tồn kho — Nông hộ Cà phê Đà Lạt ▼    + Nhập kho  │
├─────────────────────────────────────────────────────┤
│  🔍 Tìm kiếm vật tư...                             │
├───────────┬────────┬──────────┬───────────┬─────────┤
│ Vật tư    │ Đơn vị │ Tồn kho  │ Giá trị   │ Trạng   │
│           │        │          │           │ thái    │
├───────────┼────────┼──────────┼───────────┼─────────┤
│ NPK 16-16 │ kg     │ 150      │ 2,250,000 │ 🟢 OK   │
│ Hữu cơ VS │ kg     │ 80       │ 400,000   │ 🟢 OK   │
│ Regent    │ lít    │ 2        │ 500,000   │ 🔴 Thấp │
│ Gramoxone │ lít    │ 0        │ 0         │ ⚫ Hết  │
└───────────┴────────┴──────────┴───────────┴─────────┘
```

### 6.2 ImportForm (Modal)
- Dropdown: Chọn vật tư (có search)
- Input: Số lượng nhập
- Input: Tổng tiền mua
- Auto-calculate: Đơn giá = Tổng tiền / Số lượng
- Nút: Nhập kho

---

## 7. Tích Hợp Với ActivityLog (Phase 8)

### Service Logic — Khi tạo ActivityLog có materials:
```typescript
async createActivityLog(dto: CreateActivityLogDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Tạo ActivityLog
    const log = await tx.activityLog.create({ data: { ... } });
    
    // 2. Tạo ActivityMaterials
    for (const mat of dto.materials) {
      await tx.activityMaterial.create({ data: { activityLogId: log.id, ...mat } });
      
      // 3. Trừ Inventory
      const inventory = await tx.inventory.findFirst({
        where: { farmId, materialId: mat.materialId }
      });
      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: mat.quantityUsed } }
        });
      }
    }
    
    // 4. Cộng totalYield nếu thu hoạch
    if (dto.activityType === 'THU_HOACH' && dto.harvestQuantity) {
      await tx.cropCycle.update({
        where: { id: dto.cropCycleId },
        data: { totalYield: { increment: dto.harvestQuantity } }
      });
    }
    
    return log;
  });
}
```

---

## 8. Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Nhập kho lần đầu | Inventory record created |
| 2 | Nhập kho lần 2 (upsert) | quantity & totalCost cộng dồn |
| 3 | Ghi nhật ký → trừ kho | quantity giảm đúng |
| 4 | Xóa nhật ký → hoàn kho | quantity tăng lại |
| 5 | Ghi nhật ký khi tồn kho không đủ | Warning nhưng vẫn tạo |
| 6 | Low stock detection | isLowStock = true khi ≤ 5 |
| 7 | Lấy tồn kho theo farmId | Chỉ trả đúng farm |
| 8 | Transaction rollback | Nếu 1 bước fail → tất cả rollback |

---

## 9. Tiêu Chí Hoàn Thành

- [ ] Nhập kho (upsert) hoạt động đúng
- [ ] Tự động trừ kho khi ghi nhật ký
- [ ] Hoàn kho khi xóa nhật ký
- [ ] Cảnh báo tồn kho thấp
- [ ] Transaction đảm bảo data integrity
- [ ] Frontend: bảng tồn kho + form nhập kho
- [ ] Unit tests ≥ 8 cases PASS
