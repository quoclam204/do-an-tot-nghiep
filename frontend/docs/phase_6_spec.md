# 📑 Phase 6 — Đặc Tả: Danh Mục (Cây Trồng, Vật Tư, Chu Kỳ Sinh Trưởng)

> **Thời gian:** 1.5 tuần  
> **Trạng thái:** 🔄 Đang thực hiện  
> **Phụ thuộc:** Phase 5 (Farms & Plots)  
> **Tiếp theo:** Phase 7 (Vụ mùa)

---

## 1. Tổng Quan

Phase 6 xây dựng hệ thống quản lý **danh mục** — nền tảng dữ liệu tham chiếu cho toàn bộ ứng dụng:
- **Cây trồng (Crop):** Loại cây dài ngày được trồng (cà phê, bơ, sầu riêng, hồng…).
- **Vật tư (Material):** Phân bón, thuốc BVTV, giống, nhiên liệu, dụng cụ.
- **Chu kỳ sinh trưởng (GrowthCycle):** Template các giai đoạn phát triển của cây.
- **Giai đoạn sinh trưởng (GrowthStage):** Các bước cụ thể trong chu kỳ.

---

## 2. Database Schema

### 2.1 Crop (Cây trồng)

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK, auto | Khóa chính |
| `name` | String | NOT NULL | Tên cây (VD: Cà phê Arabica) |
| `type` | String | NOT NULL | Phân loại (VD: Cây công nghiệp dài ngày) |
| `createdAt` | DateTime | auto | Ngày tạo |
| `updatedAt` | DateTime | auto | Ngày cập nhật |
| `deletedAt` | DateTime? | nullable | Soft delete |

**Quan hệ:**
- 1 Crop → N CropCycle (1 loại cây có thể trồng nhiều vụ)
- 1 Crop → N GrowthCycle (1 loại cây có thể có nhiều template chu kỳ)

### 2.2 Material (Vật tư)

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK, auto | Khóa chính |
| `name` | String | NOT NULL | Tên vật tư (VD: Phân NPK 16-16-8) |
| `unit` | String | NOT NULL | Đơn vị (kg, lít, bao, chai) |
| `defaultPrice` | Float | NOT NULL | Đơn giá mặc định (VNĐ) |
| `createdAt` | DateTime | auto | Ngày tạo |
| `updatedAt` | DateTime | auto | Ngày cập nhật |
| `deletedAt` | DateTime? | nullable | Soft delete |

**Quan hệ:**
- 1 Material → N Inventory (vật tư tồn ở nhiều nông hộ)
- 1 Material → N ActivityMaterial (vật tư được sử dụng trong nhiều hoạt động)

### 2.3 GrowthCycle (Chu kỳ sinh trưởng)

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK, auto | Khóa chính |
| `cropId` | UUID | FK → Crop | Thuộc loại cây nào |
| `name` | String | NOT NULL | Tên chu kỳ (VD: Chu kỳ 3 năm) |
| `description` | String? | nullable | Mô tả chi tiết |
| `isActive` | Boolean | default: true | Đang sử dụng |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |
| `deletedAt` | DateTime? | nullable | Soft delete |

### 2.4 GrowthStage (Giai đoạn sinh trưởng)

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PK, auto | Khóa chính |
| `growthCycleId` | UUID | FK → GrowthCycle | Thuộc chu kỳ nào |
| `name` | String | NOT NULL | Tên giai đoạn (VD: Ra hoa) |
| `sequence` | Int | NOT NULL | Thứ tự (1, 2, 3...) |
| `durationDays` | Int | NOT NULL | Số ngày kéo dài |
| `description` | String? | nullable | Mô tả |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |
| `deletedAt` | DateTime? | nullable | Soft delete |

**Unique constraint:** `(growthCycleId, sequence)` — mỗi chu kỳ không được trùng thứ tự.

---

## 3. API Endpoints

### 3.1 Crops API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/catalog/crops` | Tạo loại cây trồng | ✅ OWNER/ADMIN |
| `GET` | `/catalog/crops` | Danh sách cây trồng | ✅ |
| `GET` | `/catalog/crops/:id` | Chi tiết (bao gồm growth cycles) | ✅ |
| `PATCH` | `/catalog/crops/:id` | Cập nhật | ✅ OWNER/ADMIN |
| `DELETE` | `/catalog/crops/:id` | Xóa mềm | ✅ OWNER/ADMIN |

**Request — Tạo cây trồng:**
```json
{
  "name": "Cà phê Arabica",
  "type": "Cây công nghiệp dài ngày"
}
```

**Response — Chi tiết cây trồng:**
```json
{
  "id": "uuid",
  "name": "Cà phê Arabica",
  "type": "Cây công nghiệp dài ngày",
  "growthCycles": [
    {
      "id": "uuid",
      "name": "Chu kỳ 3 năm đầu",
      "stageCount": 5,
      "isActive": true
    }
  ],
  "cropCycleCount": 3,
  "createdAt": "..."
}
```

### 3.2 Materials API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/catalog/materials` | Tạo vật tư | ✅ OWNER/ADMIN |
| `GET` | `/catalog/materials` | Danh sách vật tư | ✅ |
| `GET` | `/catalog/materials?search=NPK` | Tìm kiếm vật tư | ✅ |
| `PATCH` | `/catalog/materials/:id` | Cập nhật | ✅ OWNER/ADMIN |
| `DELETE` | `/catalog/materials/:id` | Xóa mềm | ✅ OWNER/ADMIN |

**Request — Tạo vật tư:**
```json
{
  "name": "Phân NPK 16-16-8",
  "unit": "kg",
  "defaultPrice": 15000
}
```

### 3.3 Growth Cycles API

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/catalog/growth-cycles` | Tạo chu kỳ + stages | ✅ OWNER/ADMIN |
| `GET` | `/catalog/growth-cycles?cropId=uuid` | Danh sách theo cây | ✅ |
| `GET` | `/catalog/growth-cycles/:id` | Chi tiết (bao gồm stages) | ✅ |
| `PATCH` | `/catalog/growth-cycles/:id` | Cập nhật | ✅ OWNER/ADMIN |
| `DELETE` | `/catalog/growth-cycles/:id` | Xóa mềm | ✅ OWNER/ADMIN |

**Request — Tạo chu kỳ (bao gồm stages):**
```json
{
  "cropId": "uuid",
  "name": "Chu kỳ cà phê 3 năm đầu",
  "description": "Từ khi trồng đến thu hoạch bói lần đầu",
  "stages": [
    { "name": "Cây con", "sequence": 1, "durationDays": 180, "description": "Giai đoạn vườn ươm & trồng mới" },
    { "name": "Kiến thiết cơ bản", "sequence": 2, "durationDays": 365, "description": "Cây phát triển thân, lá" },
    { "name": "Ra hoa", "sequence": 3, "durationDays": 90, "description": "Cây bắt đầu ra hoa" },
    { "name": "Đậu quả & Phát triển quả", "sequence": 4, "durationDays": 120, "description": "Quả phát triển" },
    { "name": "Chín & Thu hoạch", "sequence": 5, "durationDays": 60, "description": "Quả chín, thu hái" }
  ]
}
```

---

## 4. Frontend Components

### 4.1 CatalogPage (Trang quản lý danh mục)
- **Tabs**: Cây trồng | Vật tư | Chu kỳ sinh trưởng
- Mỗi tab có: bảng danh sách, nút Thêm, tìm kiếm, sắp xếp
- Nút hành động trên mỗi dòng: Sửa, Xóa (confirm dialog)

### 4.2 CropForm (Modal tạo/sửa cây trồng)
- Input: Tên cây, Loại cây
- Validation: tên không rỗng, loại không rỗng

### 4.3 MaterialForm (Modal tạo/sửa vật tư)
- Input: Tên, Đơn vị, Đơn giá mặc định
- Validation: tên không rỗng, đơn giá > 0

### 4.4 GrowthCycleForm (Modal tạo/sửa chu kỳ)
- Input: Chọn cây trồng, Tên chu kỳ, Mô tả
- Dynamic list: Thêm/xóa/sắp xếp stages
- Mỗi stage: Tên, Thứ tự (tự tăng), Số ngày, Mô tả

---

## 5. Dữ Liệu Mẫu (Seed Data)

### Cây trồng phổ biến Đà Lạt & Tây Nguyên

| Tên | Loại |
|-----|------|
| Cà phê Arabica | Cây công nghiệp dài ngày |
| Cà phê Robusta | Cây công nghiệp dài ngày |
| Bơ Booth | Cây ăn quả dài ngày |
| Sầu riêng Musang King | Cây ăn quả dài ngày |
| Hồng Đà Lạt | Cây ăn quả dài ngày |
| Mắc-ca | Cây công nghiệp dài ngày |
| Tiêu đen | Cây công nghiệp dài ngày |

### Vật tư phổ biến

| Tên | Đơn vị | Đơn giá |
|-----|--------|---------|
| Phân NPK 16-16-8 | kg | 15,000₫ |
| Phân hữu cơ vi sinh | kg | 5,000₫ |
| Phân DAP | kg | 18,000₫ |
| Thuốc trừ sâu Regent | lít | 250,000₫ |
| Thuốc diệt cỏ Gramoxone | lít | 120,000₫ |
| Thuốc kích thích ra hoa | lít | 180,000₫ |
| Vôi bột | kg | 3,000₫ |

---

## 6. Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Tạo crop hợp lệ | 201 Created |
| 2 | Tạo crop thiếu name | 400 Bad Request |
| 3 | Tạo material với defaultPrice < 0 | 400 Bad Request |
| 4 | Xóa crop đang có CropCycle | 400 hoặc Cascade warning |
| 5 | Tạo GrowthCycle với stages trùng sequence | 400 Bad Request |
| 6 | Tạo GrowthCycle với cropId không tồn tại | 404 Not Found |
| 7 | Lấy danh sách materials có search | Kết quả lọc đúng |
| 8 | Soft delete crop | deletedAt != null, không hiện trong list |

---

## 7. Tiêu Chí Hoàn Thành

- [ ] CRUD Crop hoạt động (BE + FE)
- [ ] CRUD Material hoạt động (BE + FE)
- [ ] CRUD GrowthCycle + Stages hoạt động (BE + FE)
- [ ] Tìm kiếm vật tư theo tên
- [ ] Soft delete hoạt động đúng
- [ ] Validation DTO cho tất cả endpoints
- [ ] Seed data cho cây trồng & vật tư phổ biến
- [ ] Unit tests ≥ 8 cases PASS
- [ ] Postman collection cập nhật
