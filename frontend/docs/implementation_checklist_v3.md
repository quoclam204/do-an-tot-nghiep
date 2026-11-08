# ✅ Implementation Checklist V3 — DalatAgri (Sprint Tracker)

> **Cập nhật lần cuối:** 03/09/2026  
> **Mục đích:** Theo dõi tiến độ theo Sprint (2 tuần/sprint)  
> **Quy ước:** ✅ Done | 🔄 In Progress | ⏳ Todo | ❌ Blocked | 🚫 Skipped

---

## Sprint 1 (Tuần 1–2): Foundation

**Mục tiêu:** Setup + Database + Auth cơ bản

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 1 | Init NestJS + Vite + Docker | 1 | ✅ | — | |
| 2 | Prisma Schema (12 models) | 2 | ✅ | — | |
| 3 | Initial migration | 2 | ✅ | — | |
| 4 | Register API | 3 | ✅ | — | bcrypt |
| 5 | Login API (JWT) | 3 | ✅ | — | Access + Refresh |
| 6 | Refresh / Logout APIs | 3 | ✅ | — | |
| 7 | JWT Strategy + Guard | 3 | ✅ | — | |
| 8 | FE: Login + Register pages | 3 | ✅ | — | |
| 9 | FE: AuthContext + ProtectedRoute | 3 | ✅ | — | |
| 10 | FE: Header + Footer | 1 | ✅ | — | |

**Sprint 1 kết quả:** ✅ 10/10 done

---

## Sprint 2 (Tuần 3–4): Auth Hoàn Thiện + CRUD Cơ Bản

**Mục tiêu:** Password reset + RBAC + Farms + Catalog

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 11 | Forgot / Reset Password API | 3 | ✅ | — | Nodemailer |
| 12 | FE: Forgot + Reset Password pages | 3 | ✅ | — | |
| 13 | RBAC: Roles decorator + guard | 4 | ✅ | — | |
| 14 | Account lockout | 4 | ✅ | — | 5 fails |
| 15 | CRUD Farm API | 5 | ✅ | — | |
| 16 | CRUD Crop API | 6 | ✅ | — | |
| 17 | CRUD Material API | 6 | ✅ | — | |
| 18 | CRUD GrowthCycle API | 6 | ✅ | — | |
| 19 | FE: CatalogPanel | 6 | ✅ | — | |
| 20 | FE: AccountPage | 4 | ✅ | — | |

**Sprint 2 kết quả:** ✅ 10/10 done

---

## Sprint 3 (Tuần 5–6): Farms UI + CropCycle + Plots

**Mục tiêu:** Hoàn thiện CRUD nông hộ, lô trồng, vụ mùa

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 21 | BE: CRUD Plot API | 5 | ✅ | AI | Hoàn thành |
| 22 | BE: CRUD CropCycle API | 7 | ⏳ | — | |
| 23 | BE: CropCycle status workflow | 7 | ⏳ | — | |
| 24 | BE: Validate overlap | 7 | ⏳ | — | |
| 25 | FE: FarmsPage (cards) | 5 | ✅ | AI | Hoàn thành |
| 26 | FE: FarmForm (modal) | 5 | ✅ | AI | Tích hợp trong FarmsPage |
| 27 | FE: FarmDetailPage (plots) | 5 | ✅ | AI | Hoàn thành |
| 28 | FE: CropCyclePage | 7 | ⏳ | — | |
| 29 | FE: CropCycleForm | 7 | ⏳ | — | |
| 30 | FE: GrowthCycleForm (stages) | 6 | ⏳ | — | |

**Sprint 3 kết quả:** ⏳ 0/10 done

---

## Sprint 4 (Tuần 7–8): Nhật Ký + Tồn Kho

**Mục tiêu:** Core feature — ghi nhật ký, vật tư, tồn kho

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 31 | BE: CRUD ActivityLog | 8 | ⏳ | — | |
| 32 | BE: ActivityMaterial linking | 8 | ⏳ | — | |
| 33 | BE: Auto-calc cost | 8 | ⏳ | — | |
| 34 | BE: Harvest → totalYield | 8 | ⏳ | — | |
| 35 | BE: Inventory upsert (import) | 9 | ⏳ | — | |
| 36 | BE: Auto-deduct inventory | 9 | ⏳ | — | Transaction |
| 37 | FE: Timeline page | 8 | ⏳ | — | |
| 38 | FE: ActivityLogForm | 8 | ⏳ | — | Multi-step |
| 39 | FE: InventoryPage | 9 | ⏳ | — | |
| 40 | BE: Pagination + filter | 8 | ⏳ | — | |

**Sprint 4 kết quả:** ⏳ 0/10 done

---

## Sprint 5 (Tuần 9–10): Validation + Review + Offline Start

**Mục tiêu:** Data integrity, code quality, bắt đầu offline

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 41 | FE: Validation realtime all forms | HI | ⏳ | — | |
| 42 | BE: Global ValidationPipe | HI | ⏳ | — | |
| 43 | BE: Custom validators | HI | ⏳ | — | |
| 44 | BE: Referential integrity | HI | ⏳ | — | |
| 45 | Code review: BE checklist | J | ⏳ | — | |
| 46 | Code review: FE checklist | J | ⏳ | — | |
| 47 | Refactor App.jsx | J | ⏳ | — | |
| 48 | Install Dexie.js | K | ⏳ | — | |
| 49 | IndexedDB schema | K | ⏳ | — | |
| 50 | Offline service: ActivityLog | K | ⏳ | — | |

**Sprint 5 kết quả:** ⏳ 0/10 done

---

## Sprint 6 (Tuần 11–12): PWA + Sync

**Mục tiêu:** PWA hoàn chỉnh, sync hoạt động

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 51 | vite-plugin-pwa config | L | ⏳ | — | |
| 52 | manifest.json + icons | L | ⏳ | — | |
| 53 | Service Worker caching | L | ⏳ | — | |
| 54 | Install prompt + Update toast | L | ⏳ | — | |
| 55 | BE: POST /sync/push | M | ⏳ | — | |
| 56 | BE: GET /sync/pull | M | ⏳ | — | |
| 57 | FE: SyncManager | M | ⏳ | — | |
| 58 | FE: SyncContext | M | ⏳ | — | |
| 59 | FE: Online/Offline indicator | K | ⏳ | — | |
| 60 | Manual test: offline → sync | M | ⏳ | — | |

**Sprint 6 kết quả:** ⏳ 0/10 done

---

## Sprint 7 (Tuần 13–14): Reports + Dashboard

**Mục tiêu:** Báo cáo trực quan, biểu đồ

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 61 | BE: Summary API | NO | ⏳ | — | |
| 62 | BE: Cost breakdown API | NO | ⏳ | — | |
| 63 | BE: Trends API | NO | ⏳ | — | |
| 64 | BE: Material usage API | NO | ⏳ | — | |
| 65 | FE: Dashboard KPI cards | NO | ⏳ | — | |
| 66 | FE: PieChart | NO | ⏳ | — | Recharts |
| 67 | FE: BarChart | NO | ⏳ | — | Recharts |
| 68 | FE: LineChart | NO | ⏳ | — | Recharts |
| 69 | FE: Filter bar | NO | ⏳ | — | |
| 70 | FE: Responsive charts | NO | ⏳ | — | |

**Sprint 7 kết quả:** ⏳ 0/10 done

---

## Sprint 8 (Tuần 15–16): Testing + Deploy + Final

**Mục tiêu:** Kiểm thử, sửa lỗi, deploy, tài liệu cuối

| # | Task | Phase | Status | Assignee | Notes |
|---|------|-------|--------|----------|-------|
| 71 | Unit tests coverage ≥ 80% | P | ⏳ | — | |
| 72 | Integration tests: 22 APIs | P | ⏳ | — | |
| 73 | E2E tests: 5 scenarios | P | ⏳ | — | |
| 74 | Security tests: 10 cases | P | ⏳ | — | |
| 75 | UI/UX polish | P | ⏳ | — | |
| 76 | Responsive check (6 devices) | P | ⏳ | — | |
| 77 | User Guide | P | ⏳ | — | |
| 78 | Test Report | P | ⏳ | — | |
| 79 | Deploy production | P | 🔄 | — | Render + Vercel |
| 80 | Lighthouse audit | P | ⏳ | — | |

**Sprint 8 kết quả:** ⏳ 0/10 done

---

## Velocity Tracking

| Sprint | Planned | Completed | Velocity |
|--------|---------|-----------|----------|
| Sprint 1 | 10 | 10 | **10** |
| Sprint 2 | 10 | 10 | **10** |
| Sprint 3 | 10 | 0 | **—** |
| Sprint 4 | 10 | 0 | **—** |
| Sprint 5 | 10 | 0 | **—** |
| Sprint 6 | 10 | 0 | **—** |
| Sprint 7 | 10 | 0 | **—** |
| Sprint 8 | 10 | 0 | **—** |
| **Total** | **80** | **20** | **avg: 10** |

---

## Overall Progress

```
Sprint 1 ████████████████████ 100%  ✅
Sprint 2 ████████████████████ 100%  ✅
Sprint 3 ░░░░░░░░░░░░░░░░░░░░   0%  ⏳ ← Bạn đang ở đây
Sprint 4 ░░░░░░░░░░░░░░░░░░░░   0%
Sprint 5 ░░░░░░░░░░░░░░░░░░░░   0%
Sprint 6 ░░░░░░░░░░░░░░░░░░░░   0%
Sprint 7 ░░░░░░░░░░░░░░░░░░░░   0%
Sprint 8 ░░░░░░░░░░░░░░░░░░░░   0%

Overall: ████░░░░░░░░░░░░░░░░  25%
```
