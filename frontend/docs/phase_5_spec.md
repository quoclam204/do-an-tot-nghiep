# 📑 Phase 5 — Đặc Tả: Kiểm Thử & Hoàn Thiện

> **Thời gian:** 2 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase 1–4 hoàn thành

---

## 1. Tổng Quan

Phase cuối cùng tập trung vào đảm bảo chất lượng sản phẩm trước khi bảo vệ đồ án:
- Kiểm thử toàn diện (Unit, Integration, E2E, Security, Performance).
- Sửa lỗi tìm được.
- Hoàn thiện UI/UX.
- Viết tài liệu hướng dẫn sử dụng.

---

## 2. Chiến Lược Kiểm Thử

### 2.1 Pyramid Testing

```
        ╱╲
       ╱  ╲
      ╱ E2E╲         ← Ít nhất: 5-10 test cases
     ╱──────╲           Luồng chính end-to-end
    ╱ Integr. ╲       ← Vừa: 20-30 test cases
   ╱───────────╲        API endpoints, database
  ╱   Unit Tests╲    ← Nhiều nhất: 50-100 test cases
 ╱───────────────╲      Services, utilities, helpers
```

### 2.2 Công cụ kiểm thử

| Loại | Công cụ | Target |
|------|---------|--------|
| Unit Test | Jest | Backend services, utility functions |
| Integration Test | Jest + Supertest | API endpoints + Database |
| E2E Test | Postman / Jest | Full user flows |
| Security Test | OWASP ZAP / Manual | Vulnerabilities |
| Performance Test | Artillery / Autocannon | API response time |
| PWA Audit | Lighthouse | PWA score, a11y, performance |
| Mobile Test | Chrome DevTools + Real device | Responsive, usability |

---

## 3. Test Cases Chi Tiết

### 3.1 Unit Tests — Backend Services

#### AuthService
| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Register với email hợp lệ | Tạo user thành công, password được hash |
| 2 | Register với email đã tồn tại | Throw ConflictException |
| 3 | Register với password yếu (<8 ký tự) | Throw BadRequestException |
| 4 | Login đúng credentials | Trả access + refresh token |
| 5 | Login sai password | Throw UnauthorizedException, tăng failedAttempts |
| 6 | Login 5 lần sai → khóa tài khoản | Throw ForbiddenException, set lockedUntil |
| 7 | Login tài khoản bị khóa | Throw ForbiddenException |
| 8 | Refresh token hợp lệ | Trả access token mới |
| 9 | Refresh token đã bị revoke | Throw UnauthorizedException |
| 10 | Forgot password → gửi email | Gọi mailService, lưu resetToken |
| 11 | Reset password với token hợp lệ | Cập nhật password, xóa token |
| 12 | Reset password với token hết hạn | Throw BadRequestException |

#### FarmsService
| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Tạo farm cho user | Farm được tạo với đúng userId |
| 2 | Lấy danh sách farms của user | Chỉ trả farms của user đó |
| 3 | Cập nhật farm | Fields được update |
| 4 | Xóa farm (soft delete) | deletedAt != null |
| 5 | Truy cập farm không phải của mình | Throw ForbiddenException |

#### ActivityLogService
| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Tạo nhật ký không có vật tư | ActivityLog created, no materials |
| 2 | Tạo nhật ký có 2 loại vật tư | ActivityLog + 2 ActivityMaterial created |
| 3 | Tạo nhật ký → tồn kho tự động trừ | Inventory.quantity giảm đúng |
| 4 | Tạo nhật ký → tồn kho không đủ | Throw BadRequestException hoặc Warning |
| 5 | Xóa nhật ký → tồn kho hoàn lại | Inventory.quantity tăng lại |
| 6 | Tổng chi phí tính đúng | totalCost = cost + Σ materials.cost |
| 7 | Thu hoạch → cộng dồn totalYield | CropCycle.totalYield tăng |

#### ReportService
| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Summary trả đúng tổng chi phí | Σ(cost + material cost) |
| 2 | Summary trả đúng doanh thu | Σ(revenue) where THU_HOACH |
| 3 | Cost breakdown đúng tỷ lệ % | Tổng = 100% |
| 4 | Trends group by month đúng | Mỗi entry đúng tháng |
| 5 | Material usage đúng tổng lượng | Σ(quantityUsed) per material |

### 3.2 Integration Tests — API Endpoints

#### Auth APIs
| # | Method | Endpoint | Test |
|---|--------|----------|------|
| 1 | POST | `/auth/register` | 201 + user created |
| 2 | POST | `/auth/register` | 409 duplicate email |
| 3 | POST | `/auth/login` | 200 + tokens returned |
| 4 | POST | `/auth/login` | 401 wrong password |
| 5 | POST | `/auth/refresh` | 200 + new access token |
| 6 | POST | `/auth/logout` | 200 + token revoked |
| 7 | GET | `/auth/profile` | 200 + user data (no password) |
| 8 | GET | `/auth/profile` | 401 without token |

#### Farm APIs
| # | Method | Endpoint | Test |
|---|--------|----------|------|
| 1 | POST | `/farms` | 201 + farm created |
| 2 | GET | `/farms` | 200 + array of user's farms |
| 3 | GET | `/farms/:id` | 200 + farm detail |
| 4 | GET | `/farms/:id` | 403 another user's farm |
| 5 | PATCH | `/farms/:id` | 200 + updated |
| 6 | DELETE | `/farms/:id` | 200 + soft deleted |

#### ActivityLog APIs
| # | Method | Endpoint | Test |
|---|--------|----------|------|
| 1 | POST | `/activity-logs` | 201 + log created with materials |
| 2 | GET | `/activity-logs?cropCycleId=x` | 200 + paginated list |
| 3 | PATCH | `/activity-logs/:id` | 200 + updated |
| 4 | DELETE | `/activity-logs/:id` | 200 + soft deleted + inventory restored |

### 3.3 E2E Test Scenarios

| # | Scenario | Steps |
|---|----------|-------|
| 1 | **Đăng ký → Đăng nhập → Tạo nông hộ** | Register → Login → Create Farm → Verify |
| 2 | **Ghi nhật ký hoạt động** | Login → Select Farm → Select Plot → Select CropCycle → Create ActivityLog → Verify timeline |
| 3 | **Thu hoạch & Doanh thu** | Create ActivityLog (THU_HOACH) → Verify totalYield updated → Verify revenue in report |
| 4 | **Xem báo cáo** | Login → Dashboard → Filter by CropCycle → Verify charts data |
| 5 | **Offline → Sync** | Disconnect → Create logs → Reconnect → Verify sync → Verify server data |

### 3.4 Security Tests

| # | Test | Dựa trên OWASP | Expected |
|---|------|-----------------|----------|
| 1 | SQL Injection qua API params | A03:2021 | Prisma ngăn chặn (parameterized) |
| 2 | XSS qua notes field | A03:2021 | HTML escaped khi render |
| 3 | Access farm/data không phải của mình | A01:2021 | 403 Forbidden |
| 4 | Dùng expired/invalid JWT | A07:2021 | 401 Unauthorized |
| 5 | Brute-force login | A07:2021 | Account locked sau 5 lần |
| 6 | Access API không có token | A01:2021 | 401 Unauthorized |
| 7 | Manipulate JWT payload | A02:2021 | Signature verification fails |
| 8 | CORS từ unauthorized origin | A05:2021 | Request blocked |

### 3.5 Performance Benchmarks

| API | Concurrent Users | Target Response Time | Target Throughput |
|-----|-----------------|---------------------|------------------|
| GET /farms | 50 | < 200ms (p95) | > 100 req/s |
| GET /activity-logs (paginated) | 50 | < 300ms (p95) | > 80 req/s |
| POST /activity-logs | 20 | < 500ms (p95) | > 40 req/s |
| GET /reports/summary | 20 | < 500ms (p95) | > 50 req/s |
| POST /sync/push (10 ops) | 10 | < 1000ms (p95) | > 10 req/s |

---

## 4. Checklist Hoàn Thiện UI/UX

### Responsive
- [ ] Desktop (1920x1080): layout 2-3 cột
- [ ] Tablet (768x1024): layout 1-2 cột
- [ ] Mobile (375x667): layout 1 cột, bottom navigation
- [ ] Landscape mode: không bị vỡ layout

### Accessibility (a11y)
- [ ] Tất cả form inputs có label
- [ ] Contrast ratio ≥ 4.5:1
- [ ] Keyboard navigation hoạt động
- [ ] Screen reader friendly (aria-labels)
- [ ] Focus indicators visible

### UX Polish
- [ ] Loading states cho tất cả async operations
- [ ] Error states với thông báo rõ ràng (tiếng Việt)
- [ ] Empty states (không có data → hướng dẫn tạo mới)
- [ ] Success feedback (toast notifications)
- [ ] Confirm dialog trước khi xóa
- [ ] Form validation realtime (highlight lỗi)

---

## 5. Tài Liệu Cần Hoàn Thiện

| Tài liệu | File | Mô tả |
|-----------|------|-------|
| Hướng dẫn cài đặt | `docs/setup_guide.md` | ✅ Đã có |
| Kế hoạch triển khai | `docs/implementation_plan.md` | ✅ Đã có |
| API Reference | `docs/api_reference.md` | Cần hoàn thiện |
| Bảo mật & Vận hành | `docs/security_operations.md` | ✅ Đã có |
| Checklist tiến độ | `docs/implementation_checklist.md` | ✅ Đã có |
| Hướng dẫn sử dụng | `docs/user_guide.md` | Cần viết (Phase 5) |
| Báo cáo kiểm thử | `docs/test_report.md` | Cần viết (Phase 5) |

---

## 6. Tiêu Chí Hoàn Thành Phase 5

- [ ] Unit test coverage ≥ 80%
- [ ] Tất cả integration tests PASS
- [ ] E2E tests: 5 scenarios PASS
- [ ] Security tests: 8/8 PASS
- [ ] Performance: đạt benchmarks
- [ ] Lighthouse PWA score ≥ 90
- [ ] Lighthouse Accessibility score ≥ 85
- [ ] Lighthouse Performance score ≥ 80
- [ ] Không còn known bugs (critical/high)
- [ ] User Guide hoàn chỉnh
- [ ] Test Report hoàn chỉnh
- [ ] Code đã deploy lên production (Render + Vercel)
