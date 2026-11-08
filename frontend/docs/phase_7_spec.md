# 📑 Phase 7 — Đặc Tả: Vụ Mùa & Chu Kỳ Canh Tác (CropCycle)

> **Thời gian:** 1 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase 5 (Farms/Plots), Phase 6 (Catalog)  
> **Tiếp theo:** Phase 8 (Nhật ký hoạt động)

---

## 1. Tổng Quan

CropCycle (Vụ mùa / Chu kỳ canh tác) là entity kết nối **Lô trồng** với **Cây trồng** trong một khoảng thời gian cụ thể. Đây là đơn vị quản lý trung tâm mà toàn bộ nhật ký, chi phí và thu hoạch đều gắn vào.

**Ví dụ thực tế:**
- "Vụ cà phê 2024–2025 trên Lô A1" → 1 CropCycle
- "Vụ bơ năm thứ 3 trên Lô B2" → 1 CropCycle

---

## 2. Database Schema — CropCycle

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK | Khóa chính |
| `plotId` | UUID | FK → Plot, NOT NULL | Trên lô nào |
| `cropId` | UUID | FK → Crop, NOT NULL | Trồng cây gì |
| `growthCycleId` | UUID? | FK → GrowthCycle | Theo template chu kỳ nào (tùy chọn) |
| `name` | String | NOT NULL | Tên vụ (VD: Vụ cà phê 2024-2025) |
| `startDate` | DateTime | NOT NULL | Ngày bắt đầu |
| `expectedEndDate` | DateTime | NOT NULL | Ngày kết thúc dự kiến |
| `actualEndDate` | DateTime? | nullable | Ngày kết thúc thực tế |
| `status` | String | NOT NULL | Trạng thái |
| `totalYield` | Float? | nullable, default: 0 | Tổng sản lượng thu hoạch (kg) |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |
| `deletedAt` | DateTime? | nullable | Soft delete |

### Trạng thái vụ mùa (Status)

```
PLANNING ──► ACTIVE ──► COMPLETED
                │
                └──► CANCELLED
```

| Status | Ý nghĩa | Cho phép ghi nhật ký? |
|--------|---------|----------------------|
| `PLANNING` | Đang lên kế hoạch, chưa bắt đầu | ❌ |
| `ACTIVE` | Đang canh tác | ✅ |
| `COMPLETED` | Đã kết thúc vụ | ❌ (chỉ xem) |
| `CANCELLED` | Đã hủy | ❌ |

---

## 3. API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/crop-cycles` | Tạo vụ mùa mới | ✅ OWNER |
| `GET` | `/crop-cycles?plotId=uuid` | Danh sách vụ theo lô | ✅ |
| `GET` | `/crop-cycles?farmId=uuid` | Danh sách vụ theo nông hộ | ✅ |
| `GET` | `/crop-cycles?status=ACTIVE` | Lọc theo trạng thái | ✅ |
| `GET` | `/crop-cycles/:id` | Chi tiết vụ mùa | ✅ |
| `PATCH` | `/crop-cycles/:id` | Cập nhật | ✅ OWNER |
| `PATCH` | `/crop-cycles/:id/status` | Thay đổi trạng thái | ✅ OWNER |
| `DELETE` | `/crop-cycles/:id` | Xóa mềm | ✅ OWNER |

### Request — Tạo vụ mùa
```json
{
  "plotId": "uuid-of-plot",
  "cropId": "uuid-of-crop",
  "growthCycleId": "uuid-of-growth-cycle",
  "name": "Vụ cà phê 2024-2025",
  "startDate": "2024-10-01",
  "expectedEndDate": "2025-09-30",
  "status": "ACTIVE"
}
```

### Response — Chi tiết vụ mùa
```json
{
  "id": "uuid",
  "name": "Vụ cà phê 2024-2025",
  "status": "ACTIVE",
  "startDate": "2024-10-01",
  "expectedEndDate": "2025-09-30",
  "actualEndDate": null,
  "totalYield": 120.5,
  "plot": {
    "id": "uuid",
    "name": "Lô A1",
    "area": 1.2,
    "farm": {
      "id": "uuid",
      "name": "Nông hộ Cà phê Đà Lạt"
    }
  },
  "crop": {
    "id": "uuid",
    "name": "Cà phê Arabica",
    "type": "Cây công nghiệp dài ngày"
  },
  "growthCycle": {
    "id": "uuid",
    "name": "Chu kỳ 3 năm",
    "stages": [
      { "name": "Cây con", "sequence": 1, "durationDays": 180 },
      { "name": "Kiến thiết", "sequence": 2, "durationDays": 365 }
    ]
  },
  "summary": {
    "activityCount": 45,
    "totalCost": 15000000,
    "totalRevenue": 25000000,
    "daysActive": 120
  },
  "createdAt": "..."
}
```

---

## 4. Business Rules

1. **Một lô trồng** có thể có **nhiều vụ mùa** (theo thời gian khác nhau).
2. **Không cho phép 2 vụ ACTIVE trùng lô** trong cùng khoảng thời gian (validate overlap).
3. **Chỉ vụ ACTIVE** mới được ghi nhật ký hoạt động.
4. **Khi COMPLETED:** tự động set `actualEndDate = now()`.
5. **Khi CANCELLED:** giữ nguyên dữ liệu để tham khảo.
6. **`totalYield`** được cộng dồn mỗi khi ghi nhật ký thu hoạch (Phase 8).

---

## 5. Frontend

### 5.1 CropCyclePage
- Hiển thị dưới dạng **Card grid** hoặc **Table**
- Mỗi card: tên vụ, cây trồng, lô, trạng thái badge, ngày bắt đầu/kết thúc
- Filter: theo lô, trạng thái, cây trồng
- Nút tạo vụ mới

### 5.2 CropCycleDetailPage
- Thông tin vụ mùa (card header)
- Progress bar theo giai đoạn sinh trưởng (nếu có GrowthCycle)
- Tab: Nhật ký | Vật tư đã dùng | Thống kê nhanh
- Nút: Chuyển trạng thái (PLANNING → ACTIVE → COMPLETED)

### 5.3 CropCycleForm (Modal)
- Dropdown: Chọn lô trồng
- Dropdown: Chọn cây trồng (auto-load growth cycles)
- Dropdown: Chọn chu kỳ sinh trưởng (tùy chọn)
- Input: Tên vụ, ngày bắt đầu, ngày kết thúc dự kiến
- Select: Trạng thái

---

## 6. Validation DTO

```typescript
export class CreateCropCycleDto {
  @IsUUID()
  plotId: string;

  @IsUUID()
  cropId: string;

  @IsOptional()
  @IsUUID()
  growthCycleId?: string;

  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  expectedEndDate: string;

  @IsIn(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  status: string;
}
```

---

## 7. Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Tạo CropCycle hợp lệ | 201 Created |
| 2 | Tạo CropCycle với plotId không tồn tại | 404 |
| 3 | Tạo CropCycle trùng lô + thời gian | 409 Conflict |
| 4 | Chuyển PLANNING → ACTIVE | OK, status updated |
| 5 | Chuyển COMPLETED → ACTIVE | 400 (không cho phép quay lại) |
| 6 | Xóa CropCycle có ActivityLogs | 400 hoặc cascade warning |
| 7 | Lấy danh sách filter theo farmId | Chỉ trả CropCycles thuộc farm đó |
| 8 | COMPLETED tự set actualEndDate | actualEndDate != null |

---

## 8. Tiêu Chí Hoàn Thành

- [ ] CRUD CropCycle hoạt động (BE + FE)
- [ ] Filter theo plotId, farmId, status
- [ ] Chuyển trạng thái đúng luồng
- [ ] Validate overlap (2 vụ ACTIVE trùng lô)
- [ ] Chi tiết vụ hiển thị progress bar giai đoạn
- [ ] Validation DTO đầy đủ
- [ ] Unit tests ≥ 8 cases PASS
