# 📑 Phase P — Review Cuối, Kiểm Thử Toàn Diện & Deployment

> **Thời gian:** 3 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Tất cả Phase trước đã hoàn thành  
> **Đây là Phase cuối cùng.**

---

## 1. Tổng Quan

Phase P là giai đoạn **hoàn thiện cuối cùng** trước khi bảo vệ đồ án:
- **Tuần 1:** Kiểm thử toàn diện (Unit, Integration, E2E, Security, Performance).
- **Tuần 2:** Sửa lỗi, polish UI/UX, viết tài liệu hướng dẫn sử dụng.
- **Tuần 3:** Deployment production, kiểm tra cuối, chuẩn bị bảo vệ.

---

## 2. Tuần 1 — Kiểm Thử Toàn Diện

### 2.1 Unit Tests (Backend)

**Target coverage: ≥ 80%**

| Module | File | Test Cases | Coverage Target |
|--------|------|------------|----------------|
| AuthService | `auth.service.spec.ts` | 12 cases | ≥ 90% |
| FarmsService | `farms.service.spec.ts` | 8 cases | ≥ 80% |
| CatalogService | `catalog.service.spec.ts` | 10 cases | ≥ 80% |
| CropCycleService | `crop-cycles.service.spec.ts` | 8 cases | ≥ 80% |
| ActivityLogService | `activity-logs.service.spec.ts` | 12 cases | ≥ 85% |
| InventoryService | `inventory.service.spec.ts` | 8 cases | ≥ 80% |
| SyncService | `sync.service.spec.ts` | 8 cases | ≥ 75% |
| ReportService | `reports.service.spec.ts` | 10 cases | ≥ 80% |

```bash
# Chạy tests
cd backend
npm run test

# Với coverage report
npm run test:cov
```

### 2.2 Integration Tests (API Endpoints)

| # | Module | Method | Endpoint | Assertions |
|---|--------|--------|----------|------------|
| 1 | Auth | POST | /auth/register | 201, user created |
| 2 | Auth | POST | /auth/register | 409, duplicate email |
| 3 | Auth | POST | /auth/login | 200, tokens returned |
| 4 | Auth | POST | /auth/login | 401, wrong credentials |
| 5 | Auth | POST | /auth/refresh | 200, new tokens |
| 6 | Auth | GET | /auth/profile | 200, user data |
| 7 | Auth | GET | /auth/profile | 401, no token |
| 8 | Farms | POST | /farms | 201, farm created |
| 9 | Farms | GET | /farms | 200, user's farms |
| 10 | Farms | GET | /farms/:id | 403, another user |
| 11 | Farms | DELETE | /farms/:id | 200, soft deleted |
| 12 | Catalog | POST | /catalog/crops | 201, crop created |
| 13 | Catalog | POST | /catalog/materials | 201, material created |
| 14 | CropCycle | POST | /crop-cycles | 201, created |
| 15 | CropCycle | PATCH | /crop-cycles/:id/status | 200, status changed |
| 16 | Activity | POST | /activity-logs | 201, log + materials |
| 17 | Activity | GET | /activity-logs?page=1 | 200, paginated |
| 18 | Activity | DELETE | /activity-logs/:id | 200, inventory restored |
| 19 | Inventory | POST | /inventory/import | 201, upserted |
| 20 | Sync | POST | /sync/push | 200, batch results |
| 21 | Sync | GET | /sync/pull | 200, delta data |
| 22 | Reports | GET | /reports/.../summary | 200, calculations correct |

```bash
npm run test:e2e
```

### 2.3 E2E Test Scenarios

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | **Full User Journey** | Register → Login → Create Farm → Create Plot → Create Crop → Create CropCycle → Log Activity → View Report | Tất cả 201/200 |
| 2 | **Activity with Materials** | Login → Select CropCycle → Create ActivityLog (BON_PHAN) with 2 materials → Verify inventory decreased | Tồn kho giảm đúng |
| 3 | **Harvest Flow** | Create ActivityLog (THU_HOACH) → Verify CropCycle.totalYield increased → Verify revenue in report | Sản lượng & doanh thu đúng |
| 4 | **Offline → Sync** | Disconnect → Create 5 logs → Reconnect → Verify sync → Verify server data | Data đồng bộ 100% |
| 5 | **Security Flow** | Login 5 lần sai → Account locked → Wait → Login đúng | Lockout hoạt động |

### 2.4 Security Tests (OWASP)

| # | Test | OWASP | Method | Expected |
|---|------|-------|--------|----------|
| 1 | SQL Injection via query params | A03 | `?name='; DROP TABLE users;--` | Prisma blocks |
| 2 | XSS via notes field | A03 | `<script>alert('xss')</script>` | HTML escaped |
| 3 | Access other user's farm | A01 | GET /farms/:otherUserId | 403 |
| 4 | Expired JWT | A07 | Bearer expired_token | 401 |
| 5 | Invalid JWT signature | A02 | Bearer tampered_token | 401 |
| 6 | Brute-force login | A07 | 5 wrong attempts | Account locked |
| 7 | Missing auth header | A01 | No Authorization header | 401 |
| 8 | CORS from unauthorized origin | A05 | Origin: evil.com | Blocked |
| 9 | Extra fields in request | A03 | `{ "role": "ADMIN" }` | Field stripped |
| 10 | Password in response | A02 | GET /auth/profile | No passwordHash |

### 2.5 Performance Benchmarks

```bash
# Cài đặt artillery
npm install -g artillery

# Chạy load test
artillery run load-test.yml
```

| API | Concurrent | Target p95 | Target Throughput |
|-----|-----------|-----------|------------------|
| GET /farms | 50 | < 200ms | > 100 rps |
| GET /activity-logs (paged) | 50 | < 300ms | > 80 rps |
| POST /activity-logs | 20 | < 500ms | > 40 rps |
| GET /reports/summary | 20 | < 500ms | > 50 rps |
| POST /sync/push (10 ops) | 10 | < 1000ms | > 10 rps |

---

## 3. Tuần 2 — Sửa Lỗi & Hoàn Thiện

### 3.1 Bug Fix Priority

| Priority | SLA | Ví dụ |
|----------|-----|-------|
| 🔴 Critical | Fix trong ngày | Data loss, security breach, crash |
| 🟡 High | Fix trong 2 ngày | Logic sai, sync fail, UI broken |
| 🟢 Medium | Fix trong 3 ngày | UI glitch, performance issue |
| ⚪ Low | Nice-to-have | Typo, minor UX improvement |

### 3.2 UI/UX Polish Checklist

| # | Hạng mục | Trạng thái |
|---|---------|-----------|
| 1 | Loading states (spinners, skeletons) cho tất cả async | ☐ |
| 2 | Error states với thông báo tiếng Việt | ☐ |
| 3 | Empty states (không data → hướng dẫn tạo) | ☐ |
| 4 | Toast notifications (success, error, warning) | ☐ |
| 5 | Confirm dialogs trước xóa | ☐ |
| 6 | Form validation realtime | ☐ |
| 7 | Focus management (focus input lỗi) | ☐ |
| 8 | Keyboard navigation | ☐ |
| 9 | Touch-friendly buttons (≥ 44px) | ☐ |
| 10 | Dark mode / Theme consistency | ☐ |

### 3.3 Responsive Final Check

| Device | Resolution | Test |
|--------|-----------|------|
| Desktop | 1920×1080 | ☐ |
| Laptop | 1366×768 | ☐ |
| Tablet (iPad) | 1024×768 | ☐ |
| Mobile (iPhone) | 375×812 | ☐ |
| Mobile (Android) | 360×640 | ☐ |
| Landscape mode | Various | ☐ |

### 3.4 Tài Liệu Hướng Dẫn Sử Dụng

File: `docs/user_guide.md`

**Mục lục dự kiến:**
1. Giới thiệu ứng dụng
2. Đăng ký & Đăng nhập
3. Quản lý nông hộ & lô trồng
4. Quản lý cây trồng & vật tư
5. Tạo vụ mùa
6. Ghi nhật ký hoạt động
7. Quản lý tồn kho
8. Xem báo cáo & thống kê
9. Sử dụng ngoại tuyến (offline)
10. Cài đặt app trên điện thoại
11. Câu hỏi thường gặp (FAQ)

---

## 4. Tuần 3 — Deployment & Final

### 4.1 Production Deployment

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│   Vercel     │     │   Render      │     │  Render          │
│   Frontend   │────►│   Backend     │────►│  PostgreSQL      │
│   HTTPS      │     │   HTTPS       │     │  Auto-backup     │
└──────────────┘     └───────────────┘     └──────────────────┘
```

**Checklist Deployment:**

| # | Task | Trạng thái |
|---|------|-----------|
| 1 | Backend build thành công (`npm run build`) | ☐ |
| 2 | Frontend build thành công (`npm run build`) | ☐ |
| 3 | Database migration trên production | ☐ |
| 4 | Seed data cơ bản (crops, materials) | ☐ |
| 5 | Environment variables đầy đủ trên Render | ☐ |
| 6 | Environment variables đầy đủ trên Vercel | ☐ |
| 7 | CORS cho production URL | ☐ |
| 8 | HTTPS hoạt động | ☐ |
| 9 | PWA installable trên production | ☐ |
| 10 | Email (forgot password) hoạt động | ☐ |
| 11 | Smoke test trên production | ☐ |
| 12 | Lighthouse audit ≥ targets | ☐ |

### 4.2 Lighthouse Targets (Production)

| Category | Target |
|----------|--------|
| Performance | ≥ 80 |
| Accessibility | ≥ 85 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |
| PWA | ≥ 90 |

### 4.3 Báo Cáo Kiểm Thử (Test Report)

File: `docs/test_report.md`

**Nội dung:**
1. Tóm tắt kết quả kiểm thử
2. Unit test results + coverage
3. Integration test results
4. E2E test results
5. Security test results
6. Performance benchmark results
7. Lighthouse audit results
8. Known issues & limitations
9. Kết luận

---

## 5. Sản Phẩm Đầu Ra Phase P

| # | Sản phẩm | File/Location |
|---|---------|---------------|
| 1 | Unit test coverage report | `backend/coverage/` |
| 2 | Integration test results | `backend/test/results/` |
| 3 | Postman collection | `docs/DalatAgri.postman_collection.json` |
| 4 | Test Report | `docs/test_report.md` |
| 5 | User Guide | `docs/user_guide.md` |
| 6 | Production URLs | Render + Vercel |
| 7 | Final Lighthouse report | Screenshot / PDF |
| 8 | Báo cáo đồ án | Theo mẫu trường |

---

## 6. Tiêu Chí Hoàn Thành (TOÀN DỰ ÁN)

### Testing ✅
- [ ] Unit test coverage ≥ 80%
- [ ] 22 integration tests PASS
- [ ] 5 E2E scenarios PASS
- [ ] 10 security tests PASS
- [ ] Performance benchmarks MET
- [ ] Lighthouse PWA ≥ 90

### Features ✅
- [ ] Auth: Register, Login, Logout, Forgot/Reset Password
- [ ] RBAC: Owner, Admin, Worker
- [ ] CRUD: Farm, Plot, Crop, Material, GrowthCycle, CropCycle
- [ ] Activity Logging: 8 loại hoạt động, vật tư, thu hoạch
- [ ] Inventory: nhập/xuất kho tự động, cảnh báo
- [ ] Offline-First: IndexedDB, SyncQueue
- [ ] PWA: Installable, Service Worker, Offline
- [ ] Sync: Push/Pull, Conflict resolution
- [ ] Dashboard: 4 KPI, 5 biểu đồ, filters
- [ ] Reports: Summary, Cost breakdown, Trends, Material usage

### Quality ✅
- [ ] 0 critical/high bugs
- [ ] Responsive: desktop + tablet + mobile
- [ ] Validation: FE + BE + DB
- [ ] Error handling: loading, error, empty states
- [ ] Tiếng Việt: UI + error messages

### Documentation ✅
- [ ] Setup Guide
- [ ] Implementation Plan V2
- [ ] API Reference
- [ ] Security & Operations
- [ ] Phase Specs (1-9, H-I, J, K, L, M, N-O, P)
- [ ] Implementation Checklist V2, V3
- [ ] MFA Guide, Turnstile Guide
- [ ] User Guide
- [ ] Test Report

### Deployment ✅
- [ ] Backend: Render.com (HTTPS)
- [ ] Frontend: Vercel (HTTPS)
- [ ] Database: Render PostgreSQL
- [ ] CI/CD: GitHub Actions
