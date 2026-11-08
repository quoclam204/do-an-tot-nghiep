# ✅ Implementation Checklist — DalatAgri

> **Cập nhật lần cuối:** 03/09/2026  
> **Quy ước:** ✅ Hoàn thành | 🔄 Đang làm | ⏳ Chưa bắt đầu | ❌ Bị chặn

---

## Phase 0 — Khảo Sát & Thiết Kế ✅

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 0.1 | Khảo sát quy trình canh tác cây dài ngày | ✅ | Cà phê, hồng, bơ, sầu riêng |
| 0.2 | Xác định yêu cầu nghiệp vụ nông hộ | ✅ | |
| 0.3 | Thiết kế ERD / Database Schema | ✅ | Prisma Schema 12 models |
| 0.4 | Thiết kế kiến trúc hệ thống | ✅ | NestJS + React + Vite + PWA |
| 0.5 | Wireframe / Mockup UI | ✅ | |
| 0.6 | Lập kế hoạch triển khai | ✅ | 5 phases, ~14 tuần |
| 0.7 | Setup repository GitHub | ✅ | quoclam204/DalatAgri |

---

## Phase 1 — Nền Tảng (Auth + CRUD Core) 🔄

### Backend

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.1 | Khởi tạo project NestJS | ✅ | NestJS 11, TypeScript |
| 1.2 | Cấu hình Prisma + PostgreSQL | ✅ | Docker Compose, port 5433 |
| 1.3 | Prisma Schema (12 models) | ✅ | User, Farm, Plot, Crop, ... |
| 1.4 | Module Auth: Register | ✅ | bcrypt, class-validator |
| 1.5 | Module Auth: Login (JWT) | ✅ | Access + Refresh Token |
| 1.6 | Module Auth: Refresh Token | ✅ | Rotation, revoke |
| 1.7 | Module Auth: Logout | ✅ | Revoke refresh token |
| 1.8 | Module Auth: Forgot Password | ✅ | Nodemailer, reset token |
| 1.9 | Module Auth: Reset Password | ✅ | Token validation, expiry |
| 1.10 | JWT Strategy + Guards | ✅ | Passport-JWT |
| 1.11 | Role-based access (RBAC) | ✅ | OWNER, ADMIN, WORKER |
| 1.12 | Account lockout (brute-force) | ✅ | 5 lần sai → khóa |
| 1.13 | Module Users: CRUD | ✅ | |
| 1.14 | Module Farms: CRUD nông hộ | ✅ | Soft delete |
| 1.15 | Module Farms: CRUD lô trồng (Plot) | ⏳ | |
| 1.16 | Module Catalog: CRUD Crop | ✅ | |
| 1.17 | Module Catalog: CRUD Material | ✅ | |
| 1.18 | Module Catalog: CRUD GrowthCycle | ✅ | |
| 1.19 | Module Catalog: CRUD GrowthStage | ✅ | |
| 1.20 | Module CropCycle: CRUD vụ mùa | ⏳ | |
| 1.21 | Validation DTO đầy đủ | 🔄 | Đã có cho Auth, cần thêm |
| 1.22 | Rate limiting (login) | ⏳ | |
| 1.23 | Helmet middleware | ⏳ | |
| 1.24 | CORS strict config | 🔄 | Đã set FRONTEND_URL |
| 1.25 | Unit tests: AuthService | ⏳ | |
| 1.26 | Unit tests: FarmsService | ⏳ | |
| 1.27 | Postman collection Phase 1 | ⏳ | |

### Frontend

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.28 | Khởi tạo project React + Vite | ✅ | Vite 8, React 19 |
| 1.29 | Trang Login | ✅ | |
| 1.30 | Trang Register | ✅ | |
| 1.31 | Trang Forgot Password | ✅ | |
| 1.32 | Trang Reset Password | ✅ | |
| 1.33 | Auth Context (JWT, refresh) | ✅ | |
| 1.34 | Protected Routes | ✅ | |
| 1.35 | Trang Home (Dashboard placeholder) | ✅ | |
| 1.36 | Trang Account | ✅ | |
| 1.37 | Component CatalogPanel | ✅ | Quản lý danh mục |
| 1.38 | Component Header | ✅ | |
| 1.39 | Component Footer | ✅ | |
| 1.40 | Trang Farms (CRUD nông hộ) | ⏳ | |
| 1.41 | Trang Farm Detail (lô trồng) | ⏳ | |
| 1.42 | Trang CropCycle (vụ mùa) | ⏳ | |
| 1.43 | Responsive design check | 🔄 | |
| 1.44 | API Service layer (axios) | ✅ | |

---

## Phase 2 — Nhật Ký Canh Tác & Vật Tư ⏳

### Backend

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 2.1 | Module ActivityLog: CRUD | ⏳ | |
| 2.2 | ActivityLog + ActivityMaterial linking | ⏳ | |
| 2.3 | Tự động tính chi phí vật tư | ⏳ | |
| 2.4 | Module Inventory: Nhập kho | ⏳ | |
| 2.5 | Tự động trừ tồn kho khi ghi nhật ký | ⏳ | |
| 2.6 | Hoàn tồn kho khi xóa nhật ký | ⏳ | |
| 2.7 | Cảnh báo tồn kho thấp | ⏳ | |
| 2.8 | Ghi nhận thu hoạch + doanh thu | ⏳ | |
| 2.9 | Phân trang hoạt động theo CropCycle | ⏳ | |
| 2.10 | Thống kê nhanh chi phí/doanh thu | ⏳ | |
| 2.11 | Unit tests: ActivityLogService | ⏳ | |
| 2.12 | Integration tests: ActivityLog APIs | ⏳ | |
| 2.13 | Postman collection Phase 2 | ⏳ | |

### Frontend

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 2.14 | Trang Activity Log (Timeline) | ⏳ | |
| 2.15 | Form ghi nhật ký | ⏳ | |
| 2.16 | MaterialSelector component | ⏳ | |
| 2.17 | Trang Inventory (tồn kho) | ⏳ | |
| 2.18 | Form nhập kho | ⏳ | |
| 2.19 | Trang thu hoạch | ⏳ | |
| 2.20 | TimelineCard component | ⏳ | |
| 2.21 | StatsSummaryCard component | ⏳ | |

---

## Phase 3 — Offline-First & PWA ⏳

### Frontend (PWA)

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 3.1 | Cấu hình Service Worker (Workbox) | ⏳ | |
| 3.2 | Cache App Shell | ⏳ | |
| 3.3 | IndexedDB wrapper (CRUD operations) | ⏳ | |
| 3.4 | Sync Queue (pending operations) | ⏳ | |
| 3.5 | Background Sync | ⏳ | |
| 3.6 | Online/Offline indicator | ⏳ | |
| 3.7 | Pending operations counter | ⏳ | |
| 3.8 | manifest.json + PWA icons | ⏳ | |
| 3.9 | Install prompt handling | ⏳ | |

### Backend (Sync API)

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 3.10 | API POST /sync/push | ⏳ | Batch operations |
| 3.11 | API GET /sync/pull | ⏳ | Delta sync |
| 3.12 | Conflict detection (updatedAt) | ⏳ | |
| 3.13 | Conflict resolution (LWW) | ⏳ | Last-Write-Wins |
| 3.14 | Integration tests sync | ⏳ | |

---

## Phase 4 — Báo Cáo & Dashboard ⏳

### Backend

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 4.1 | API: Summary (tổng chi phí/doanh thu) | ⏳ | |
| 4.2 | API: Cost breakdown (cơ cấu chi phí) | ⏳ | |
| 4.3 | API: Trends (xu hướng theo thời gian) | ⏳ | |
| 4.4 | API: Material usage (vật tư tiêu thụ) | ⏳ | |
| 4.5 | API: Compare crop cycles | ⏳ | |
| 4.6 | API: Activity calendar | ⏳ | |
| 4.7 | Export CSV | ⏳ | Tùy chọn |

### Frontend

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 4.8 | Dashboard: KPI cards | ⏳ | |
| 4.9 | PieChart: cơ cấu chi phí | ⏳ | Recharts |
| 4.10 | BarChart: chi phí vs doanh thu | ⏳ | Recharts |
| 4.11 | LineChart: xu hướng | ⏳ | Recharts |
| 4.12 | BarChart: vật tư tiêu thụ | ⏳ | Recharts |
| 4.13 | Filter bar (farm, crop, date) | ⏳ | |
| 4.14 | Responsive charts | ⏳ | |
| 4.15 | Bảng báo cáo chi tiết | ⏳ | |

---

## Phase 5 — Kiểm Thử & Hoàn Thiện ⏳

### Testing

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 5.1 | Unit tests: coverage ≥ 80% | ⏳ | |
| 5.2 | Integration tests: all APIs | ⏳ | |
| 5.3 | E2E tests: 5 scenarios | ⏳ | |
| 5.4 | Security tests: 8 cases | ⏳ | OWASP |
| 5.5 | Performance benchmarks | ⏳ | |
| 5.6 | Offline sync test (10 logs) | ⏳ | |
| 5.7 | Lighthouse audit: PWA ≥ 90 | ⏳ | |
| 5.8 | Mobile usability testing | ⏳ | |

### Documentation

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 5.9 | Setup Guide | ✅ | docs/setup_guide.md |
| 5.10 | Implementation Plan | ✅ | docs/implementation_plan.md |
| 5.11 | API Reference | ⏳ | docs/api_reference.md |
| 5.12 | Security & Operations | ✅ | docs/security_operations.md |
| 5.13 | Implementation Checklist | ✅ | docs/implementation_checklist.md |
| 5.14 | User Guide | ⏳ | docs/user_guide.md |
| 5.15 | Test Report | ⏳ | docs/test_report.md |

### Polish

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 5.16 | Fix all critical/high bugs | ⏳ | |
| 5.17 | Loading/Error/Empty states | ⏳ | |
| 5.18 | Toast notifications | ⏳ | |
| 5.19 | Confirm dialogs (delete) | ⏳ | |
| 5.20 | Code splitting / lazy loading | ⏳ | |
| 5.21 | Final responsive check | ⏳ | |
| 5.22 | Deploy to production | 🔄 | Render + Vercel |

---

## Tổng Kết Tiến Độ

| Phase | Tổng Tasks | Hoàn thành | Tỷ lệ |
|-------|-----------|-----------|--------|
| Phase 0 | 7 | 7 | **100%** |
| Phase 1 | 44 | 28 | **64%** |
| Phase 2 | 21 | 0 | **0%** |
| Phase 3 | 14 | 0 | **0%** |
| Phase 4 | 15 | 0 | **0%** |
| Phase 5 | 22 | 4 | **18%** |
| **Tổng** | **123** | **39** | **32%** |

> **Lưu ý:** Cập nhật checklist này sau mỗi sprint/phase. Đánh dấu ✅ khi task hoàn thành, 🔄 khi đang làm, ❌ khi bị chặn (ghi rõ lý do).
