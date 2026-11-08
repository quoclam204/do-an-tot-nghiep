# ✅ Implementation Checklist V2 — DalatAgri (16 Phases)

> **Cập nhật lần cuối:** 03/09/2026  
> **Quy ước:** ✅ Hoàn thành | 🔄 Đang làm | ⏳ Chưa bắt đầu | ❌ Bị chặn  
> **Tổng phases:** 16 | **Tổng tasks:** 185+

---

## Phase 1 — Khởi Tạo & Kiến Trúc ✅

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 1.1 | Khởi tạo monorepo (root package.json) | ✅ | npm scripts |
| 1.2 | Khởi tạo NestJS backend | ✅ | NestJS 11 |
| 1.3 | Khởi tạo React + Vite frontend | ✅ | Vite 8, React 19 |
| 1.4 | Docker Compose (PostgreSQL) | ✅ | Port 5433 |
| 1.5 | .gitignore, .env.example | ✅ | |
| 1.6 | ESLint + Prettier config | ✅ | |
| 1.7 | Tạo thư mục docs/ | ✅ | |

---

## Phase 2 — CSDL & Prisma Schema ✅

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 2.1 | Thiết kế ERD (12 entities) | ✅ | |
| 2.2 | Prisma Schema: User, RefreshToken | ✅ | |
| 2.3 | Prisma Schema: Farm, Plot | ✅ | |
| 2.4 | Prisma Schema: Crop, GrowthCycle, GrowthStage | ✅ | |
| 2.5 | Prisma Schema: Material, Inventory | ✅ | |
| 2.6 | Prisma Schema: CropCycle | ✅ | |
| 2.7 | Prisma Schema: ActivityLog, ActivityMaterial | ✅ | |
| 2.8 | Initial migration | ✅ | |
| 2.9 | PrismaService (singleton) | ✅ | |
| 2.10 | Seed script (dữ liệu mẫu) | ⏳ | |

---

## Phase 3 — Xác Thực (Authentication) ✅

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 3.1 | POST /auth/register | ✅ | bcrypt, class-validator |
| 3.2 | POST /auth/login (JWT) | ✅ | Access + Refresh Token |
| 3.3 | POST /auth/refresh | ✅ | Token rotation |
| 3.4 | POST /auth/logout | ✅ | Revoke refresh token |
| 3.5 | POST /auth/forgot-password | ✅ | Nodemailer |
| 3.6 | POST /auth/reset-password | ✅ | Token validation |
| 3.7 | JWT Strategy (Passport) | ✅ | |
| 3.8 | JwtAuthGuard | ✅ | |
| 3.9 | FE: LoginPage | ✅ | |
| 3.10 | FE: RegisterPage | ✅ | |
| 3.11 | FE: ForgotPasswordPage | ✅ | |
| 3.12 | FE: ResetPasswordPage | ✅ | |
| 3.13 | FE: AuthContext (JWT storage) | ✅ | |
| 3.14 | FE: Auto-refresh token | ✅ | |
| 3.15 | FE: ProtectedRoute component | ✅ | |
| 3.16 | Unit tests: AuthService | ⏳ | |

---

## Phase 4 — Phân Quyền & Người Dùng 🔄

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 4.1 | RBAC: Roles decorator | ✅ | OWNER, ADMIN, WORKER |
| 4.2 | RBAC: RolesGuard | ✅ | |
| 4.3 | Account lockout (5 fails) | ✅ | |
| 4.4 | GET /auth/profile | ✅ | |
| 4.5 | PATCH /users/profile | 🔄 | |
| 4.6 | Change password | ⏳ | |
| 4.7 | FE: AccountPage | ✅ | |
| 4.8 | Rate limiting (login) | ⏳ | |
| 4.9 | Helmet middleware | ⏳ | |
| 4.10 | CORS strict config | 🔄 | |
| 4.11 | MFA (Google Authenticator) | ⏳ | Xem mfa_authenticator_guide.md |
| 4.12 | Cloudflare Turnstile | ⏳ | Xem turnstile_guide.md |

---

## Phase 5 — Nông Hộ & Lô Trồng 🔄

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 5.1 | BE: CRUD Farm | ✅ | Soft delete |
| 5.2 | BE: Resource ownership check | ✅ | userId match |
| 5.3 | BE: CRUD Plot | ⏳ | |
| 5.4 | FE: FarmsPage (list cards) | ⏳ | |
| 5.5 | FE: FarmForm (create/edit modal) | ⏳ | |
| 5.6 | FE: FarmDetailPage (plots) | ⏳ | |
| 5.7 | FE: PlotForm | ⏳ | |
| 5.8 | Unit tests: FarmsService | ⏳ | |

---

## Phase 6 — Danh Mục (Cây, Vật Tư, Chu Kỳ) ✅

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 6.1 | BE: CRUD Crop | ✅ | |
| 6.2 | BE: CRUD Material | ✅ | |
| 6.3 | BE: CRUD GrowthCycle + Stages | ✅ | |
| 6.4 | BE: Search materials | 🔄 | |
| 6.5 | FE: CatalogPanel component | ✅ | Tabs: Cây / Vật tư / Chu kỳ |
| 6.6 | FE: CropForm | 🔄 | |
| 6.7 | FE: MaterialForm | 🔄 | |
| 6.8 | FE: GrowthCycleForm (dynamic stages) | ⏳ | |
| 6.9 | Seed data: cây trồng phổ biến | ⏳ | |
| 6.10 | Seed data: vật tư phổ biến | ⏳ | |
| 6.11 | Unit tests: CatalogService | ⏳ | |

---

## Phase 7 — Vụ Mùa & Chu Kỳ Canh Tác ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 7.1 | BE: CRUD CropCycle | ⏳ | |
| 7.2 | BE: Status workflow (PLANNING→ACTIVE→COMPLETED) | ⏳ | |
| 7.3 | BE: Validate overlap (2 vụ trùng lô) | ⏳ | |
| 7.4 | BE: Filter by plotId, farmId, status | ⏳ | |
| 7.5 | FE: CropCyclePage (cards/table) | ⏳ | |
| 7.6 | FE: CropCycleForm | ⏳ | |
| 7.7 | FE: CropCycleDetailPage (progress bar) | ⏳ | |
| 7.8 | Unit tests: CropCycleService | ⏳ | |

---

## Phase 8 — Nhật Ký Hoạt Động ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 8.1 | BE: CRUD ActivityLog | ⏳ | |
| 8.2 | BE: ActivityMaterial linking | ⏳ | |
| 8.3 | BE: Tổng chi phí auto-calc | ⏳ | |
| 8.4 | BE: Thu hoạch → cộng totalYield | ⏳ | |
| 8.5 | BE: Phân trang + filter (type, date) | ⏳ | |
| 8.6 | FE: Timeline page | ⏳ | |
| 8.7 | FE: ActivityLogForm (multi-step) | ⏳ | |
| 8.8 | FE: MaterialInputList component | ⏳ | |
| 8.9 | FE: HarvestInput component | ⏳ | |
| 8.10 | FE: TimelineCard component | ⏳ | |
| 8.11 | Unit tests: ActivityLogService | ⏳ | |

---

## Phase 9 — Tồn Kho & Vật Tư ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| 9.1 | BE: Nhập kho (upsert) | ⏳ | |
| 9.2 | BE: Trừ kho khi ghi nhật ký | ⏳ | Transaction |
| 9.3 | BE: Hoàn kho khi xóa nhật ký | ⏳ | |
| 9.4 | BE: Low stock detection | ⏳ | |
| 9.5 | FE: InventoryPage (table) | ⏳ | |
| 9.6 | FE: ImportForm (modal) | ⏳ | |
| 9.7 | Unit tests: InventoryService | ⏳ | |

---

## Phase H-I — Validation & Data Integrity ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| HI.1 | FE: Validation realtime trên tất cả forms | ⏳ | |
| HI.2 | FE: Error messages tiếng Việt | ⏳ | |
| HI.3 | BE: Global ValidationPipe + custom errors | ⏳ | |
| HI.4 | BE: Custom validators (IsNotFutureDate, ...) | ⏳ | |
| HI.5 | BE: Referential integrity checks | ⏳ | |
| HI.6 | BE: Input sanitization (XSS) | ⏳ | |
| HI.7 | DB: Indexes cho performance | ⏳ | |
| HI.8 | Validation tests ≥ 10 cases | ⏳ | |

---

## Phase J — Code Review & Refactoring ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| J.1 | BE: Review checklist (20 items) | ⏳ | |
| J.2 | FE: Review checklist (20 items) | ⏳ | |
| J.3 | Refactor: tách common guards | ⏳ | |
| J.4 | Refactor: global exception filter | ⏳ | |
| J.5 | Refactor: tách App.jsx | ⏳ | |
| J.6 | Refactor: API service layer | ⏳ | |
| J.7 | Tăng test coverage → ≥ 55% | ⏳ | |
| J.8 | 0 ESLint errors | ⏳ | |
| J.9 | Regression test | ⏳ | |

---

## Phase K — Offline-First (IndexedDB) ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| K.1 | Install Dexie.js | ⏳ | |
| K.2 | IndexedDB schema (9 stores) | ⏳ | |
| K.3 | Offline service: ActivityLog (R+W) | ⏳ | |
| K.4 | Offline service: Farms, CropCycles (R) | ⏳ | |
| K.5 | SyncQueue entries khi offline | ⏳ | |
| K.6 | useLiveQuery hooks | ⏳ | |
| K.7 | useOnlineStatus hook | ⏳ | |
| K.8 | Unit tests ≥ 8 cases | ⏳ | |

---

## Phase L — PWA & Service Worker ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| L.1 | Install vite-plugin-pwa | ⏳ | |
| L.2 | manifest.json + icons | ⏳ | |
| L.3 | Service Worker: precache | ⏳ | |
| L.4 | Service Worker: runtime cache | ⏳ | |
| L.5 | Install prompt (A2HS) | ⏳ | |
| L.6 | Update notification | ⏳ | |
| L.7 | Lighthouse PWA ≥ 90 | ⏳ | |

---

## Phase M — Đồng Bộ Dữ Liệu (Sync) ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| M.1 | BE: POST /sync/push (batch) | ⏳ | |
| M.2 | BE: GET /sync/pull (delta) | ⏳ | |
| M.3 | BE: Conflict detection | ⏳ | |
| M.4 | FE: SyncManager (push/pull) | ⏳ | |
| M.5 | FE: Auto-sync khi online | ⏳ | |
| M.6 | FE: SyncContext (pendingCount, syncNow) | ⏳ | |
| M.7 | FE: Nút "Đồng bộ ngay" | ⏳ | |
| M.8 | Manual test: 10 logs offline → sync | ⏳ | |
| M.9 | Unit tests ≥ 8 cases | ⏳ | |

---

## Phase N-O — Báo Cáo & Dashboard ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| NO.1 | BE: Summary API | ⏳ | |
| NO.2 | BE: Cost breakdown API | ⏳ | |
| NO.3 | BE: Trends API | ⏳ | |
| NO.4 | BE: Material usage API | ⏳ | |
| NO.5 | BE: Compare API | ⏳ | |
| NO.6 | BE: Activity calendar API | ⏳ | |
| NO.7 | FE: Dashboard (4 KPI cards) | ⏳ | |
| NO.8 | FE: PieChart (cơ cấu chi phí) | ⏳ | Recharts |
| NO.9 | FE: BarChart (chi phí vs doanh thu) | ⏳ | Recharts |
| NO.10 | FE: LineChart (xu hướng) | ⏳ | Recharts |
| NO.11 | FE: Horizontal BarChart (vật tư) | ⏳ | Recharts |
| NO.12 | FE: Filter bar | ⏳ | |
| NO.13 | FE: Responsive charts | ⏳ | |
| NO.14 | Unit tests ≥ 10 cases | ⏳ | |

---

## Phase P — Review Cuối & Deployment ⏳

| # | Task | Status | Ghi chú |
|---|------|--------|---------|
| P.1 | Unit test coverage ≥ 80% | ⏳ | |
| P.2 | Integration tests: 22 APIs | ⏳ | |
| P.3 | E2E tests: 5 scenarios | ⏳ | |
| P.4 | Security tests: 10 cases | ⏳ | |
| P.5 | Performance benchmarks | ⏳ | |
| P.6 | UI/UX polish (10 items) | ⏳ | |
| P.7 | Responsive final check (6 devices) | ⏳ | |
| P.8 | User Guide (docs/user_guide.md) | ⏳ | |
| P.9 | Test Report (docs/test_report.md) | ⏳ | |
| P.10 | Deploy Backend → Render | 🔄 | |
| P.11 | Deploy Frontend → Vercel | 🔄 | |
| P.12 | Production smoke test | ⏳ | |
| P.13 | Lighthouse audit ≥ targets | ⏳ | |
| P.14 | Chuẩn bị bảo vệ đồ án | ⏳ | |

---

## Tổng Kết Tiến Độ

| Phase | Tổng | Done | % |
|-------|------|------|---|
| Phase 1: Setup | 7 | 7 | **100%** |
| Phase 2: Database | 10 | 9 | **90%** |
| Phase 3: Auth | 16 | 15 | **94%** |
| Phase 4: RBAC | 12 | 5 | **42%** |
| Phase 5: Farms | 8 | 2 | **25%** |
| Phase 6: Catalog | 11 | 5 | **45%** |
| Phase 7: CropCycle | 8 | 0 | **0%** |
| Phase 8: ActivityLog | 11 | 0 | **0%** |
| Phase 9: Inventory | 7 | 0 | **0%** |
| Phase H-I: Validation | 8 | 0 | **0%** |
| Phase J: Review | 9 | 0 | **0%** |
| Phase K: Offline | 8 | 0 | **0%** |
| Phase L: PWA | 7 | 0 | **0%** |
| Phase M: Sync | 9 | 0 | **0%** |
| Phase N-O: Reports | 14 | 0 | **0%** |
| Phase P: Final | 14 | 0 | **0%** |
| **TỔNG** | **159** | **43** | **27%** |
