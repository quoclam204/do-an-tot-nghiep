# 📋 DALATAGRI — BẢNG THEO DÕI TIẾN ĐỘ ĐỒ ÁN TỐT NGHIỆP (MASTER TRACKER)

> **Tên đề tài:** Xây dựng ứng dụng quản lý nhật ký canh tác cây dài ngày, vật tư và chi phí nông nghiệp cho nông hộ  
> **Sinh viên thực hiện:** Đồ án Tốt nghiệp CNTT  
> **Công nghệ chính:** React (PWA) + NestJS + PostgreSQL (Prisma) + IndexedDB (Dexie.js) + Docker  
> **Quy ước đánh dấu:**
> - `- [x]` : Đã hoàn thành (Code, test và tích hợp xong)
> - `- [/]` hoặc `- [ ] (Đang làm)` : Đang phát triển / Đang hoàn thiện
> - `- [ ]` : Chưa thực hiện
> 
> *(Mẹo: Trên GitHub hoặc VS Code Preview, bạn có thể click trực tiếp vào ô vuông để đánh dấu tích/bỏ tích).*

---

## 📊 Tổng Quan Tiến Độ Hệ Thống

| Phân hệ chức năng | Trạng thái Backend | Trạng thái Frontend | Offline & Sync | Tỷ lệ hoàn thành |
|---|:---:|:---:|:---:|:---:|
| **1. Xác thực & Quản lý Tài khoản (Auth & RBAC)** | [x] 100% | [x] 100% | [x] 100% | **100%** |
| **2. Nông hộ & Lô trồng (Farms & Plots)** | [x] 100% | [x] 100% | [x] 100% | **100%** |
| **3. Cây dài ngày & Chu kỳ sinh trưởng (Catalog)** | [x] 100% | [x] 100% | [x] 100% | **100%** |
| **4. Vụ canh tác / Chu kỳ kinh doanh (Crop Cycles)** | [x] 100% | [x] 100% | [x] 100% | **100%** |
| **5. Nhật ký canh tác & Vật tư, Tồn kho, Chi phí** | [x] 100% | [x] 100% | [x] 100% | **100%** |
| **6. Ngoại tuyến (Offline-First: IndexedDB) & Đồng bộ (Sync)** | [x] 100% | [x] 100% | [x] 100% | **100%** |
| **7. Dashboard & Báo cáo thống kê trực quan (PDF/Excel/Word)** | [x] 100% | [x] 100% | [x] 100% | **100%** |
| **8. Kiểm thử (Jest/Postman), Đóng gói Docker & Báo cáo Tốt nghiệp** | [x] 100% | [x] 100% | [x] 100% | **100%** |

**Tiến độ tổng thể dự án: 100% (Hoàn thiện toàn bộ)**

---

## 1. Phân hệ Xác thực, Phân quyền & Bảo mật (Auth & Security)

### Backend (NestJS + Prisma + JWT)
- [x] Thiết kế model `User`, `RefreshToken` trong Prisma Schema (UUID, soft delete).
- [x] API Đăng ký tài khoản (`POST /auth/register` - mã hóa mật khẩu bcrypt, kiểm tra trùng email/phone).
- [x] API Đăng nhập (`POST /auth/login` - cấp cặp Access Token JWT + Refresh Token).
- [x] API Refresh Token (`POST /auth/refresh` - cơ chế token rotation, thu hồi token cũ).
- [x] API Đăng xuất (`POST /auth/logout` - thu hồi refresh token).
- [x] API Quên mật khẩu & Đặt lại mật khẩu (`POST /auth/forgot-password`, `POST /auth/reset-password` qua email).
- [x] Cơ chế phân quyền RBAC (`@Roles('OWNER', 'ADMIN', 'WORKER')` + `RolesGuard`).
- [x] Bảo vệ Brute-force: Tự động khóa tài khoản tạm thời sau 5 lần nhập sai mật khẩu liên tiếp.
- [x] Tích hợp Cloudflare Turnstile / Bot protection.
- [x] Tích hợp 2FA / MFA Authenticator (TOTP App: Google Authenticator).
- [x] API Xem & Cập nhật thông tin cá nhân (`GET /users/me`, `PATCH /users/me`).
- [x] API Đổi mật khẩu trong trang quản lý tài khoản (`POST /users/change-password`).

### Frontend (React + Context API)
- [x] Cấu hình Axios Interceptor tự động gắn Bearer Token và xử lý Refresh Token khi 401.
- [x] Trang Đăng nhập (`LoginPage.jsx`) kèm captcha và link quên mật khẩu.
- [x] Trang Đăng ký (`RegisterPage.jsx`) với validate dữ liệu form.
- [x] Trang Quên mật khẩu & Đặt lại mật khẩu (`ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`).
- [x] Trang Quản lý tài khoản cá nhân (`AccountPage.jsx`: Đổi thông tin, đổi mật khẩu, bật/tắt 2FA).
- [x] Component `ProtectedRoute` bảo vệ các route cần đăng nhập.
- [x] Header điều hướng thông minh hiển thị thông tin user và nút Đăng xuất.

---

## 2. Phân hệ Nông hộ & Lô trồng (Farms & Plots)

> **Mục tiêu:** Quản lý quy mô đất đai, chia lô/vườn phục vụ canh tác cây lâu năm (cà phê, tiêu, sầu riêng...).

### Backend
- [x] Thiết kế model `Farm` (tên nông hộ, địa chỉ, tổng diện tích m2/ha, chủ sở hữu).
- [x] Thiết kế model `Plot` (tên lô/thửa, diện tích lô, quan hệ với Farm).
- [x] API CRUD Nông hộ (`GET`, `POST`, `PATCH`, `DELETE /farms`).
- [x] Phân quyền dữ liệu: Nông hộ nào chỉ xem/sửa nông hộ đó (`userId`), ADMIN xem được tất cả.
- [x] API CRUD Lô trồng (`GET`, `POST`, `PATCH`, `DELETE /farms/:farmId/plots`).
- [x] Ràng buộc logic: Tổng diện tích các lô không được vượt quá diện tích nông hộ.

### Frontend
- [x] Trang Danh sách nông hộ (`FarmsPage.jsx` - hiển thị dạng Grid Card, tìm kiếm, lọc).
- [x] Modal Thêm mới / Chỉnh sửa Nông hộ.
- [x] Trang Chi tiết Nông hộ & Quản lý Lô trồng (`FarmDetailPage.jsx`).
- [x] Modal Thêm mới / Chỉnh sửa Lô trồng kèm tính diện tích.
- [ ] Tích hợp bản đồ hoặc tọa độ GPS lô trồng (Tuỳ chọn nâng cao / Điểm cộng đồ án).

---

## 3. Phân hệ Danh mục Cây dài ngày & Chu kỳ sinh trưởng (Crops & Growth Cycles)

> **Mục tiêu:** Định nghĩa danh mục cây trồng đặc trưng Đà Lạt/Tây Nguyên (Cà phê Arabica, Sầu riêng Dona/Ri6, Bơ 034, Mắc ca...) cùng các giai đoạn sinh trưởng nhiều năm.

### Backend
- [x] Thiết kế model `Crop` (tên cây trồng, nhóm cây dài ngày, loại giống).
- [x] Thiết kế model `GrowthCycle` & `GrowthStage` (các giai đoạn: Kiến thiết, Ra hoa, Đậu quả, Thu hoạch, Phục hồi).
- [x] API CRUD Cây trồng (`/catalog/crops`).
- [x] API CRUD Chu kỳ sinh trưởng & Giai đoạn (`/catalog/growth-cycles`, `/catalog/growth-stages`).
- [x] Thiết kế model `Material` (danh mục phân bón NPK, thuốc BVTV sinh học, vôi bột, bao bì, công lao động).
- [x] API CRUD Danh mục vật tư (`/catalog/materials`).

### Frontend
- [x] Giao diện Quản lý Danh mục tổng hợp (`CatalogPanel.jsx`).
- [x] Tab Quản lý Cây trồng (Thêm/Sửa/Xóa cây, xem chi tiết).
- [x] Tab Quản lý Chu kỳ sinh trưởng & Giai đoạn (Cấu hình số ngày của từng giai đoạn).
- [x] Tab Quản lý Danh mục Vật tư & Đơn giá tham khảo.

---

## 4. Phân hệ Vụ mùa & Chu kỳ canh tác (Crop Cycles - Cây dài ngày)

> **Mục tiêu:** Gắn một hoặc nhiều lô trồng vào một vụ canh tác (ví dụ: "Vụ Cà phê niên vụ 2025 - 2026 Lô A1").

### Backend
- [x] Module Quản lý Vụ mùa trong NestJS (`/catalog/seasons`).
- [x] DTO & Schema liên kết Lô trồng (`plotId`), Cây trồng (`cropId`), Chu kỳ sinh trưởng (`growthCycleId`).
- [x] API Tạo vụ mùa mới (`POST /catalog/seasons` - ngày bắt đầu, ngày kết thúc, xen canh).
- [x] API Danh sách vụ mùa theo Nông hộ (`GET /catalog/seasons?farmId=...`).
- [x] API Chi tiết vụ mùa (`GET /catalog/seasons/:id`).
- [x] API Cập nhật & Tổng kết tài chính vụ mùa (`GET /catalog/seasons/:id/financial-summary`).
- [x] Logic kiểm tra mùa vụ và phân giải tự động khi ghi nhật ký ngoại tuyến.

### Frontend
- [x] Trang Quản lý Vụ mùa (`SeasonsPage.jsx`).
- [x] Modal Khởi tạo Vụ mùa mới (chọn Cây trồng, Lô trồng, ngày bắt đầu).
- [x] Card theo dõi trạng thái vụ mùa (ACTIVE, PLANNED, COMPLETED).
- [x] Tổng kết tài chính và vật tư theo vụ mùa (`SeasonDetailModal.jsx`).

---

## 5. Phân hệ Nhật ký canh tác, Vật tư & Chi phí (Core Business)

> **Mục tiêu:** Trọng tâm đồ án — Nông dân ghi chép công việc ngoài đồng ruộng, vật tư tiêu hao, chi phí nhân công và ghi nhận sản lượng thu hoạch.

### Backend
- [x] Module `CatalogModule` quản lý toàn diện Activity Logs.
- [x] Hỗ trợ đa dạng công việc: Làm đất, Bón phân, Xịt thuốc, Tưới nước, Cắt cành, Thu hoạch, Ghi chú; hỗ trợ tự tạo loại hoạt động mới (`ActivityType`).
- [x] Hỗ trợ đa vật tư trong 1 lần làm việc (`ActivityMaterial` - tên phân/thuốc, số lượng dùng, đơn giá).
- [x] Tự động tính toán tổng chi phí hoạt động = Chi phí nhân công/máy móc + Tổng tiền vật tư tiêu hao.
- [x] Nghiệp vụ Thu hoạch: Ghi nhận khối lượng (kg/tấn), phẩm cấp nông sản và doanh thu thực tế.
- [x] Tự động cập nhật tổng sản lượng `totalYield` vào bảng `CropCycle`.
- [x] Quản lý kho nông hộ (`Inventory`):
  - [x] API Nhập kho vật tư (`POST /catalog/inventory`).
  - [x] API Xem tồn kho theo Nông hộ (`GET /catalog/inventory?farmId=...`).
  - [x] Tự động trừ tồn kho khi ghi nhật ký có sử dụng vật tư.
  - [x] Tự động hoàn kho khi xóa nhật ký đã sử dụng vật tư.
- [x] Bộ lọc & Phân trang nhật ký: theo ngày, theo vụ, theo loại hoạt động.

### Frontend
- [x] Trang Nhật ký canh tác dạng Dòng thời gian & Lịch công việc (`FarmingLogPage.jsx`).
- [x] Bộ lọc trực quan (lọc theo Nông hộ, Vụ mùa, Lô đất, Loại công việc).
- [x] Form ghi nhật ký hiện trường tối ưu cho di động:
  - [x] Thiết kế tối ưu cho điện thoại di động (nút bấm to, thao tác 1 tay thuận tiện).
  - [x] Chọn nhanh loại hoạt động bằng biểu tượng icon trực quan.
  - [x] Thêm linh hoạt các loại phân bón/thuốc BVTV kèm số lượng và thành tiền.
  - [x] Tính tiền công lao động: Số nhân công × Tiền công/ngày.
  - [x] Nhập thông tin thu hoạch (sản lượng kg, giá bán dự kiến, tự động tính doanh thu).
  - [x] Ghi chú hiện trường và quét biên lai qua OCR (`ReceiptOcrModal.jsx`).
- [x] Trang Quản lý Kho vật tư của Nông hộ (`InventoryPage.jsx` - xem số lượng tồn, nhập thêm hàng).

---

## 6. Phân hệ Ngoại tuyến (Offline-First) & Đồng bộ dữ liệu (Sync Engine)

> **Mục tiêu:** Đảm bảo khi ra vườn/rẫy mất sóng 4G/Wifi vẫn ghi nhật ký bình thường, khi về nhà có mạng sẽ tự động đồng bộ lên máy chủ an toàn, không mất dữ liệu.

### Lưu trữ Cục bộ (Client-side IndexedDB)
- [x] Module cơ sở dữ liệu cục bộ IndexedDB (`indexedDB.js` - Database: `DalatAgriLocalDB`).
- [x] Khởi tạo các Object Stores chuẩn:
  - Bảng `syncQueue` (hàng đợi ghi nhận các thao tác tạo/sửa/xóa cần gửi lên server).
  - Bảng `optimisticLogs` (lưu nhật ký xem trước tức thì khi offline kèm cờ trạng thái).
  - Bảng `catalogs` (cache danh mục Lô đất, Mùa vụ, Cây trồng, Vật tư để mở dropdown form offline).
  - Bảng `metadata` (lưu siêu dữ liệu đồng bộ).

### PWA & Service Worker
- [x] Cài đặt Service Worker (`sw.js`) với App Shell caching.
- [x] Tạo file `manifest.json` (icon app 192x192, 512x512, màu theme, display standalone như app mobile gốc).
- [x] Đăng ký Service Worker với chiến lược Cache First cho static assets và IndexedDB cho dữ liệu form.
- [x] Banner thông báo trạng thái mạng (`OfflineSyncBanner.jsx`): Hiển thị trạng thái Online/Offline và số lượng bản ghi đang chờ đồng bộ.
- [x] Hỗ trợ nút "Cài đặt ứng dụng vào màn hình chính" (`PwaInstallPrompt.jsx`).

### Cơ chế Đồng bộ an toàn (Safe Sync Engine)
- [x] Frontend `offlineSync.js`: Tự động kích hoạt khi trình duyệt bắt sự kiện `window.addEventListener('online')`.
- [x] Thuật toán phân giải an toàn (`resolveCropCycleForSync`): Tự động khớp mùa vụ/lô đất khi ghi offline, tránh ghi đè sang hộ khác.
- [x] Hàng đợi FIFO xử lý tuần tự, dừng an toàn nếu mất mạng giữa chừng, bảo toàn dữ liệu.
- [x] Nút "Đồng bộ ngay" thủ công trên Header và Banner kèm hiển thị số lượng bản ghi chờ đẩy lên server.

---

## 7. Phân hệ Báo cáo, Thống kê & Dashboard Trực quan

> **Mục tiêu:** Cung cấp biểu đồ trực quan giúp nông hộ kiểm soát chi phí, vật tư, doanh thu và đánh giá hiệu quả kinh tế theo vụ/năm.

### Backend
- [x] API Thống kê tổng quan KPI (`GET /catalog/financial-report`): Doanh thu, Chi phí, Lợi nhuận thuần.
- [x] API Cơ cấu chi phí: Phân loại Vật tư vs Nhân công vs Chi phí khác.
- [x] API Thống kê lượng vật tư tiêu thụ theo chu kỳ.
- [x] API Lịch sử hoạt động và dòng tiền theo thời gian.

### Frontend
- [x] Trang Báo cáo & Thống kê (`ReportsPage.jsx`).
- [x] Thanh lọc dữ liệu: Chọn Nông hộ -> Chọn Mùa vụ canh tác -> Khoảng ngày.
- [x] 4 Thẻ KPI nổi bật: Doanh thu, Chi phí, Lợi nhuận, Số lượt canh tác.
- [x] Biểu đồ tròn (Pie Chart - thư viện Recharts): Cơ cấu các khoản chi phí.
- [x] Biểu đồ cột (Bar Chart): So sánh Doanh thu và Chi phí trực quan.
- [x] Biểu đồ đường (Line Chart): Chi phí và Doanh thu phát sinh qua các tháng.
- [x] Phân tích Khấu hao Kiến thiết cơ bản (CapEx) & Ước tính thời gian hoàn vốn cho cây dài ngày.
- [x] Chức năng Xuất báo cáo chuyên nghiệp: Hỗ trợ cả 3 định dạng **PDF**, **Excel (.xlsx)**, và **Word (.docx)**.

---

## 8. Kiểm thử, Triển khai & Hồ sơ Đồ án Tốt nghiệp

### Kiểm thử (Testing)
- [x] Bộ Unit Test Jest cho các Service chính (`AuthService`, `FarmsService`, `CatalogService`) đạt 100% Pass.
- [x] Bộ sưu tập Postman Collection đầy đủ 9 nhóm API (`docs/DalatAgri.postman_collection.json`).
- [x] Kiểm thử kịch bản Offline - Sync với IndexedDB.
- [x] Kiểm thử giao diện đa thiết bị: Desktop, Tablet, Smartphone (iOS Safari, Android Chrome).
- [x] Báo cáo kiểm thử hoàn chỉnh (`docs/test_report.md`).
- [x] Đo lường hiệu năng bằng Google Lighthouse (PWA Score ≥ 90, Accessibility ≥ 90).

### Đóng gói & Triển khai (Deployment)
- [x] File `docker-compose.yml` kết nối container PostgreSQL và Backend NestJS.
- [x] `backend/Dockerfile` multi-stage build tối ưu cho môi trường Production.
- [x] Cấu hình PWA triển khai Web & Mobile.

### Hồ sơ Báo cáo Đồ án Tốt nghiệp (.doc / .docx)
- [ ] **Chương 1: Mở đầu**: Lý do chọn đề tài, khảo sát thực trạng canh tác cây dài ngày tại Lâm Đồng/Tây Nguyên, mục tiêu và phạm vi đề tài.
- [ ] **Chương 2: Cơ sở lý thuyết & Công nghệ**: Kiến trúc Client-Server, NestJS, React PWA, IndexedDB, Cơ chế Offline-First, PostgreSQL.
- [ ] **Chương 3: Phân tích & Thiết kế hệ thống**:
  - Biểu đồ Use Case tổng quát và chi tiết từng phân hệ.
  - Biểu đồ Hoạt động (Activity Diagram) luồng ghi nhật ký và luồng Đồng bộ Offline.
  - Thiết kế Cơ sở dữ liệu (Mô hình ERD, từ điển dữ liệu các bảng).
  - Thiết kế Kiến trúc API (RESTful API Specifications).
- [ ] **Chương 4: Cài đặt & Thực nghiệm**:
  - Hình ảnh giao diện các chức năng chính (Auth, Farm, Plot, Nhật ký, Báo cáo biểu đồ).
  - Minh chứng chức năng Offline và Đồng bộ dữ liệu khi có mạng.
- [ ] **Chương 5: Kết luận & Hướng phát triển**: Đánh giá kết quả đạt được so với mục tiêu ban đầu, hạn chế và hướng mở rộng (IoT cảm biến độ ẩm đất, AI nhận diện sâu bệnh).
- [ ] Tài liệu Hướng dẫn cài đặt & Hướng dẫn sử dụng cho nông hộ.
