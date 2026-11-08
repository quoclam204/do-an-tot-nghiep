# 📑 Phase 2 — Đặc Tả: Thiết Kế CSDL & Prisma Schema

> **Thời gian:** 1 tuần  
> **Trạng thái:** ✅ Hoàn thành (90%)  
> **Phụ thuộc:** Phase 1  
> **Tiếp theo:** Phase 3 (Authentication)

---

## 1. Tổng Quan

Phase 2 thiết kế toàn bộ cơ sở dữ liệu cho ứng dụng, bao gồm 12 models chính phản ánh nghiệp vụ canh tác cây dài ngày.

---

## 2. ERD (Entity Relationship Diagram)

```
User ──1:N──► Farm ──1:N──► Plot ──1:N──► CropCycle
  │                │                          │  │
  │                │                          │  └──► Crop
  │                │                          │
  │                └──1:N──► Inventory        └──1:N──► ActivityLog
  │                              │                         │
  │                              └── Material ◄────────────┘
  │                                    │                   (qua ActivityMaterial)
  │                                    │
  └──1:N──► RefreshToken               │
                                       │
Crop ──1:N──► GrowthCycle ──1:N──► GrowthStage
```

---

## 3. Danh Sách Models (12)

| # | Model | Mô tả | Quan hệ chính |
|---|-------|-------|---------------|
| 1 | **User** | Người dùng (nông dân, quản lý, nhân công) | → Farm, RefreshToken |
| 2 | **RefreshToken** | JWT refresh tokens | → User |
| 3 | **Farm** | Nông hộ | → User, Plot, Inventory |
| 4 | **Plot** | Lô trồng trong nông hộ | → Farm, CropCycle |
| 5 | **Crop** | Loại cây trồng (cà phê, bơ, sầu riêng) | → CropCycle, GrowthCycle |
| 6 | **GrowthCycle** | Template chu kỳ sinh trưởng | → Crop, GrowthStage |
| 7 | **GrowthStage** | Giai đoạn trong chu kỳ | → GrowthCycle |
| 8 | **CropCycle** | Vụ mùa / chu kỳ canh tác | → Plot, Crop, GrowthCycle, ActivityLog |
| 9 | **Material** | Vật tư (phân bón, thuốc, giống) | → Inventory, ActivityMaterial |
| 10 | **Inventory** | Tồn kho vật tư theo nông hộ | → Farm, Material |
| 11 | **ActivityLog** | Nhật ký hoạt động canh tác | → CropCycle, ActivityMaterial |
| 12 | **ActivityMaterial** | Bảng trung gian (hoạt động ↔ vật tư) | → ActivityLog, Material |

---

## 4. Prisma Schema

File: `backend/prisma/schema.prisma`

*(Schema đầy đủ đã được triển khai — xem file trực tiếp)*

### Các đặc điểm thiết kế:
- **UUID** cho tất cả primary keys (distributed-friendly).
- **Soft delete** (`deletedAt`) trên tất cả models.
- **Timestamps** (`createdAt`, `updatedAt`) tự động.
- **Enum** cho UserRole (OWNER, ADMIN, WORKER).
- **Unique constraints**: User.email, User.phone, GrowthStage(growthCycleId, sequence).
- **Foreign keys** với `@relation` rõ ràng.

---

## 5. Seed Data

### 5.1 Script seed (cần tạo)

File: `backend/prisma/seed.ts`

**Dữ liệu mẫu:**
- 7 loại cây trồng phổ biến (Cà phê Arabica, Robusta, Bơ Booth, Sầu riêng, Hồng, Mắc-ca, Tiêu)
- 7 loại vật tư phổ biến (NPK, DAP, Hữu cơ, Regent, Gramoxone, Vôi bột, Kích thích)
- 1 chu kỳ sinh trưởng mẫu (Cà phê 3 năm, 5 giai đoạn)

---

## 6. Tiêu Chí Hoàn Thành

- [x] 12 models trong Prisma Schema
- [x] Migration thành công
- [x] PrismaService (singleton) hoạt động
- [x] Prisma Studio mở được
- [ ] Seed script hoạt động (⏳)
- [x] Schema comments tiếng Việt
