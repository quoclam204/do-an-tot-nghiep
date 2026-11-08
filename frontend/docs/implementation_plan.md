# 🗺️ Kế Hoạch Triển Khai Dự Án DalatAgri

> **Đề tài:** Xây dựng ứng dụng quản lý nhật ký canh tác cây dài ngày, vật tư và chi phí nông nghiệp cho nông hộ  
> **Phiên bản:** 1.0  
> **Cập nhật:** 03/09/2026

---

## Tổng Quan Dự Án

### Mục tiêu chính
1. **Số hóa nhật ký canh tác** cây dài ngày, vật tư và chi phí cho nông hộ.
2. **Hỗ trợ offline-first** — ghi nhận dữ liệu khi mất mạng, đồng bộ an toàn khi có kết nối.
3. **Cung cấp báo cáo trực quan** — kiểm soát vật tư, chi phí, doanh thu và hiệu quả theo vụ/chu kỳ canh tác.

### Công nghệ sử dụng

| Thành phần | Công nghệ | Chi tiết |
|-----------|----------|---------|
| **Frontend** | React.js + Vite | SPA, PWA-enabled |
| **Backend** | NestJS (Node.js) | REST API, modular architecture |
| **Database** | PostgreSQL | Prisma ORM |
| **Local Storage** | IndexedDB | Offline data persistence |
| **Auth** | JWT (Access + Refresh Token) | Passport.js |
| **Container** | Docker Compose | PostgreSQL dev environment |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Testing** | Jest, Supertest, Postman | Unit, Integration, E2E |
| **Hosting** | Render (Backend) + Vercel (Frontend) | Cloud deployment |

### Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite + PWA)          │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Pages   │  │Components │  │  Services  │  │ Context  │ │
│  └──────────┘  └───────────┘  └─────┬──────┘  └──────────┘ │
│                                     │                       │
│  ┌──────────────────────────────────┼──────────────────┐    │
│  │           Service Worker (PWA)   │                  │    │
│  │  ┌───────────┐  ┌───────────────┼────────────┐     │    │
│  │  │ IndexedDB │  │  Sync Queue   │            │     │    │
│  │  │ (Offline) │  │  (Pending Ops)│            │     │    │
│  │  └───────────┘  └───────────────┘            │     │    │
│  └──────────────────────────────────────────────┘     │    │
└─────────────────────────────────┬─────────────────────┘    │
                                  │ REST/JSON + JWT          │
┌─────────────────────────────────┼──────────────────────────┘
│                      BACKEND (NestJS)                       │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Auth    │  │   Farms   │  │  Catalog   │  │  Sync    │ │
│  │  Module  │  │   Module  │  │  Module    │  │  Module  │ │
│  └──────────┘  └───────────┘  └────────────┘  └──────────┘ │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐               │
│  │  Users   │  │  Reports  │  │  Prisma    │               │
│  │  Module  │  │  Module   │  │  Service   │               │
│  └──────────┘  └───────────┘  └─────┬──────┘               │
└─────────────────────────────────────┼───────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │   PostgreSQL Database    │
                         │   (Docker / Render)      │
                         └─────────────────────────┘
```

---

## Phân Chia Giai Đoạn

### Tóm tắt Timeline

| Giai đoạn | Tên | Thời gian | Trạng thái |
|-----------|-----|-----------|-----------|
| **Phase 0** | Khảo sát & Thiết kế | 2 tuần | ✅ Hoàn thành |
| **Phase 1** | Nền tảng (Auth + CRUD Core) | 3 tuần | 🔄 Đang thực hiện |
| **Phase 2** | Nhật ký canh tác & Vật tư | 3 tuần | ⏳ Chưa bắt đầu |
| **Phase 3** | Offline-First & PWA | 2 tuần | ⏳ Chưa bắt đầu |
| **Phase 4** | Báo cáo & Dashboard | 2 tuần | ⏳ Chưa bắt đầu |
| **Phase 5** | Kiểm thử & Hoàn thiện | 2 tuần | ⏳ Chưa bắt đầu |

**Tổng thời gian ước tính: ~14 tuần**

---

## Phase 0 — Khảo sát & Thiết kế (2 tuần)

### Mục tiêu
- Hiểu quy trình canh tác cây dài ngày tại Đà Lạt (cà phê, hồng, bơ, sầu riêng...).
- Xác định yêu cầu nghiệp vụ thực tế của nông hộ.
- Thiết kế kiến trúc hệ thống, cơ sở dữ liệu, và lên wireframe UI.

### Sản phẩm đầu ra
- [x] Báo cáo khảo sát yêu cầu nghiệp vụ
- [x] Sơ đồ ERD (Entity Relationship Diagram)
- [x] Prisma Schema hoàn chỉnh
- [x] Wireframe / Mockup UI cơ bản
- [x] Tài liệu kiến trúc hệ thống
- [x] Kế hoạch triển khai (file này)

### Đặc tả chi tiết
Xem: [phase_0_spec.md](./phase_0_spec.md) *(tài liệu khảo sát)*

---

## Phase 1 — Nền Tảng: Auth + CRUD Core (3 tuần)

### Mục tiêu
- Xây dựng hệ thống xác thực an toàn (JWT + Refresh Token).
- CRUD cơ bản cho: User, Farm, Plot, Crop, CropCycle.
- UI đăng nhập / đăng ký / quên mật khẩu.
- Trang quản lý nông hộ, lô trồng, danh mục cây trồng.

### Sản phẩm đầu ra

#### Backend
- [x] Module Auth: Register, Login, Logout, Refresh Token
- [x] Module Auth: Forgot Password, Reset Password (qua email)
- [x] JWT Strategy + Guards + Role-based access (OWNER, ADMIN, WORKER)
- [x] Module Users: CRUD, soft delete, account locking
- [x] Module Farms: CRUD nông hộ
- [ ] Module Farms: CRUD lô trồng (Plot)
- [x] Module Catalog: CRUD cây trồng (Crop), chu kỳ sinh trưởng (GrowthCycle), giai đoạn (GrowthStage)
- [x] Module Catalog: CRUD vật tư (Material)
- [ ] Module CropCycle: CRUD vụ mùa / chu kỳ canh tác
- [ ] Validation DTO (class-validator) cho tất cả endpoints
- [ ] Unit tests cho Auth Service, Farms Service

#### Frontend
- [x] Trang Login / Register
- [x] Trang Forgot Password / Reset Password
- [x] Context Auth (JWT storage, auto-refresh, protected routes)
- [x] Trang Home (Dashboard placeholder)
- [x] Trang Account (thông tin tài khoản)
- [x] Component CatalogPanel (quản lý danh mục)
- [ ] Trang Farms (danh sách nông hộ, CRUD)
- [ ] Trang Farm Detail (danh sách lô trồng)
- [ ] Trang CropCycle (vụ mùa của từng lô)

### Tiêu chuẩn bảo mật (OWASP)
- [x] Mã hóa mật khẩu: bcrypt (cost factor ≥ 10)
- [x] JWT Access Token: thời hạn ngắn (15 phút)
- [x] Refresh Token: lưu DB, có thể thu hồi (revoke)
- [x] Khóa tài khoản sau nhiều lần đăng nhập thất bại
- [ ] Rate limiting cho endpoint login
- [ ] Helmet middleware (HTTP security headers)
- [ ] CORS cấu hình chặt chẽ (chỉ cho phép frontend origin)

### Đặc tả chi tiết
Xem: [phase_1_spec.md](./phase_1_spec.md)

---

## Phase 2 — Nhật Ký Canh Tác & Quản Lý Vật Tư (3 tuần)

### Mục tiêu
- Ghi nhật ký công việc: làm đất, tưới, bón phân, phun thuốc, chăm sóc, thu hoạch.
- Quản lý tồn kho vật tư cơ bản.
- Tính chi phí tự động dựa trên vật tư sử dụng.

### Sản phẩm đầu ra

#### Backend
- [ ] Module ActivityLog: CRUD nhật ký hoạt động
- [ ] Module ActivityLog: Liên kết vật tư sử dụng (ActivityMaterial)
- [ ] Module ActivityLog: Tự động tính chi phí vật tư
- [ ] Module Inventory: Quản lý tồn kho theo nông hộ
- [ ] Module Inventory: Trừ tồn kho khi ghi nhật ký sử dụng vật tư
- [ ] Module Inventory: Cảnh báo khi tồn kho thấp
- [ ] Module Harvest: Ghi nhận thu hoạch, doanh thu
- [ ] API: Lịch sử hoạt động theo CropCycle (có phân trang)
- [ ] API: Thống kê nhanh chi phí/doanh thu theo CropCycle
- [ ] Unit tests & Integration tests

#### Frontend
- [ ] Trang Activity Log (timeline hoạt động)
- [ ] Form ghi nhật ký: chọn loại công việc, ngày, vật tư, chi phí
- [ ] Trang Inventory (danh sách vật tư, tồn kho)
- [ ] Form nhập kho / xuất kho
- [ ] Trang thu hoạch (ghi nhận sản lượng & doanh thu)
- [ ] Component Timeline (hiển thị dòng thời gian hoạt động)

### Đặc tả chi tiết
Xem: [phase_2_spec.md](./phase_2_spec.md)

---

## Phase 3 — Offline-First & PWA (2 tuần)

### Mục tiêu
- Ứng dụng hoạt động khi mất kết nối mạng.
- Dữ liệu được lưu vào IndexedDB khi offline.
- Khi có mạng, tự động đồng bộ lên server qua hàng đợi (Sync Queue).
- Xử lý xung đột dữ liệu (conflict resolution).

### Sản phẩm đầu ra

#### Frontend (PWA)
- [ ] Cấu hình Service Worker (Workbox)
- [ ] Cache static assets (App Shell)
- [ ] IndexedDB wrapper: lưu/đọc ActivityLog, Farm, Plot, Material offline
- [ ] Sync Queue: hàng đợi các mutation khi offline
- [ ] Background Sync: tự động gửi queue khi online
- [ ] UI indicator: hiển thị trạng thái online/offline
- [ ] UI indicator: hiển thị số lượng pending operations
- [ ] Manifest.json cho PWA (install prompt)

#### Backend (Sync API)
- [ ] API `/sync/push`: nhận batch operations từ client
- [ ] API `/sync/pull`: gửi dữ liệu mới nhất cho client
- [ ] Conflict detection: so sánh `updatedAt` timestamp
- [ ] Conflict resolution: strategy (last-write-wins hoặc manual)
- [ ] Trường `syncStatus` trên ActivityLog (PENDING, SYNCED, CONFLICT)
- [ ] Integration tests cho sync flow

### Đặc tả chi tiết
Xem: [phase_3_spec.md](./phase_3_spec.md)

---

## Phase 4 — Báo Cáo & Dashboard (2 tuần)

### Mục tiêu
- Dashboard tổng quan cho nông hộ.
- Báo cáo chi phí, doanh thu, lợi nhuận theo vụ/chu kỳ/khoảng thời gian.
- Biểu đồ trực quan: cơ cấu chi phí, lượng vật tư tiêu thụ, lịch sử hoạt động.

### Sản phẩm đầu ra

#### Backend (Report APIs)
- [ ] API thống kê: tổng chi phí / doanh thu / lợi nhuận theo CropCycle
- [ ] API thống kê: cơ cấu chi phí (phân bón, thuốc, nhân công, ...)
- [ ] API thống kê: lượng vật tư tiêu thụ theo thời gian
- [ ] API thống kê: lịch sử hoạt động (group by date / type)
- [ ] API thống kê: so sánh hiệu quả giữa các vụ
- [ ] Export báo cáo (CSV / PDF) — *tùy chọn*

#### Frontend (Dashboard)
- [ ] Dashboard tổng quan: KPI cards (tổng chi phí, doanh thu, lợi nhuận)
- [ ] Biểu đồ tròn: cơ cấu chi phí (Recharts PieChart)
- [ ] Biểu đồ cột: chi phí vs doanh thu theo vụ (Recharts BarChart)
- [ ] Biểu đồ đường: xu hướng chi phí theo thời gian (Recharts LineChart)
- [ ] Bảng báo cáo chi tiết: filter theo vụ, cây, thời gian
- [ ] Responsive design cho mobile

### Đặc tả chi tiết
Xem: [phase_4_spec.md](./phase_4_spec.md)

---

## Phase 5 — Kiểm Thử & Hoàn Thiện (2 tuần)

### Mục tiêu
- Kiểm thử toàn diện: chức năng, bảo mật, đồng bộ, hiệu năng.
- Hoàn thiện UI/UX.
- Viết tài liệu hướng dẫn sử dụng.
- Chuẩn bị cho bảo vệ đồ án.

### Sản phẩm đầu ra

#### Testing
- [ ] Unit tests: coverage ≥ 80% cho services
- [ ] Integration tests: tất cả API endpoints
- [ ] E2E tests: các luồng chính (đăng nhập → ghi nhật ký → xem báo cáo)
- [ ] Offline sync tests: ghi offline → sync → verify data consistency
- [ ] Security tests: injection, XSS, CSRF, brute-force
- [ ] Performance tests: API response time < 500ms
- [ ] Mobile usability testing

#### Documentation
- [ ] Hướng dẫn sử dụng cho người dùng (User Guide)
- [ ] API Reference hoàn chỉnh
- [ ] Báo cáo kiểm thử (Test Report)
- [ ] Tài liệu phân tích & thiết kế (báo cáo đồ án)

#### Polish
- [ ] Fix tất cả bugs từ testing
- [ ] Tối ưu performance (lazy loading, code splitting)
- [ ] Responsive final check trên nhiều thiết bị
- [ ] Accessibility check (a11y)

### Đặc tả chi tiết
Xem: [phase_5_spec.md](./phase_5_spec.md)

---

## Nguyên Tắc Phát Triển Xuyên Suốt

### 🧪 Test-Driven Development (TDD)
1. **Viết test trước** khi viết implementation code.
2. Chạy test → **RED** (test fail).
3. Viết code tối thiểu → **GREEN** (test pass).
4. **REFACTOR** code cho sạch đẹp, test vẫn pass.
5. Lặp lại cho feature tiếp theo.

### 🔒 Bảo mật theo OWASP Top 10
- **A01 – Broken Access Control:** RBAC (Owner/Admin/Worker), JWT Guards
- **A02 – Cryptographic Failures:** bcrypt cho password, HTTPS
- **A03 – Injection:** Prisma ORM (parameterized queries), class-validator
- **A05 – Security Misconfiguration:** Helmet, CORS, environment variables
- **A07 – Authentication Failures:** Account lockout, token rotation
- **A09 – Security Logging:** Ghi log đăng nhập, actions quan trọng

### 📐 Code Quality
- ESLint + Prettier cho coding standards
- Meaningful commit messages (Conventional Commits)
- Code review trước khi merge
- Không commit `.env`, secrets, hoặc `node_modules`
