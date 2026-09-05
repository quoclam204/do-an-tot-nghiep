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
| **1. Xác thực & Quản lý Tài khoản (Auth & RBAC)** | [x] 100% | [x] 100% | — | **100%** |
| **2. Nông hộ & Lô trồng (Farms & Plots)** | [x] 100% | [x] 95% | [ ] 0% | **70%** |
| **3. Cây dài ngày & Chu kỳ sinh trưởng (Catalog)** | [x] 100% | [x] 90% | [ ] 0% | **65%** |
| **4. Vụ canh tác / Chu kỳ kinh doanh (Crop Cycles)** | [ ] 0% | [ ] 0% | [ ] 0% | **0%** |
| **5. Nhật ký canh tác & Vật tư, Tồn kho, Chi phí** | [ ] 0% | [ ] 0% | [ ] 0% | **0%** |
| **6. Ngoại tuyến (Offline-First) & Đồng bộ (Sync)** | [ ] 0% | [ ] 0% | [ ] 0% | **0%** |
| **7. Dashboard & Báo cáo thống kê trực quan** | [ ] 0% | [ ] 0% | [ ] 0% | **0%** |
| **8. Kiểm thử, Đóng gói Docker & Báo cáo Tốt nghiệp** | [ ] 20% | [ ] 20% | — | **20%** |

**Tiến độ tổng thể dự án: ~32%**

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
- [ ] Module `CropCyclesModule` trong NestJS.
- [ ] DTO: `CreateCropCycleDto`, `UpdateCropCycleDto`, `QueryCropCycleDto`.
- [ ] API Tạo vụ mùa mới (`POST /crop-cycles` - chọn lô `plotId`, cây `cropId`, ngày bắt đầu, ngày dự kiến kết thúc).
- [ ] API Danh sách vụ mùa theo Lô / Nông hộ (`GET /crop-cycles?farmId=...&plotId=...`).
- [ ] API Chi tiết vụ mùa (`GET /crop-cycles/:id`).
- [ ] API Cập nhật trạng thái vụ mùa (`PATCH /crop-cycles/:id/status` - Đang canh tác, Tạm ngưng, Đã hoàn thành/Thu hoạch xong).
- [ ] Logic kiểm tra xung đột thời gian canh tác trên cùng một lô đất.

### Frontend
- [ ] Trang Quản lý Vụ mùa (`CropCyclesPage.jsx` hoặc tích hợp trong `FarmDetailPage`).
- [ ] Modal Khởi tạo Vụ mùa mới (chọn Cây trồng, Chu kỳ sinh trưởng mẫu, ngày bắt đầu).
- [ ] Card/Giao diện theo dõi trạng thái vụ mùa (giai đoạn hiện tại, thời gian còn lại).
- [ ] Nút đóng vụ / Tổng kết vụ canh tác.

---

## 5. Phân hệ Nhật ký canh tác, Vật tư & Chi phí (Core Business)

> **Mục tiêu:** Trọng tâm đồ án — Nông dân ghi chép công việc ngoài đồng ruộng, vật tư tiêu hao, chi phí nhân công và ghi nhận sản lượng thu hoạch.

### Backend
- [ ] Module `ActivityLogsModule` trong NestJS.
- [ ] DTO: `CreateActivityLogDto` (loại việc: Làm đất, Bón phân, Xịt thuốc, Tưới nước, Cắt cành, Thu hoạch, Ghi chú).
- [ ] Hỗ trợ đa vật tư trong 1 lần làm việc (`ActivityMaterial` - tên phân/thuốc, số lượng dùng, đơn giá).
- [ ] Tự động tính toán tổng chi phí hoạt động = Chi phí nhân công/máy móc + Tổng tiền vật tư tiêu hao.
- [ ] Nghiệp vụ Thu hoạch: Ghi nhận khối lượng (kg/tấn), phẩm cấp nông sản và doanh thu ước tính/thực tế.
- [ ] Tự động cập nhật tổng sản lượng `totalYield` vào bảng `CropCycle`.
- [ ] Module `InventoryModule` (Quản lý kho nông hộ):
  - [ ] API Nhập kho vật tư (`POST /inventory/import`).
  - [ ] API Xem tồn kho theo Nông hộ (`GET /inventory?farmId=...`).
  - [ ] Tự động trừ tồn kho khi ghi nhật ký có sử dụng vật tư (Database Transaction).
  - [ ] Cảnh báo khi xuất kho vượt quá số lượng tồn.
- [ ] Bộ lọc & Phân trang nhật ký: theo ngày, theo lô, theo loại hoạt động.

### Frontend
- [ ] Trang Nhật ký canh tác dạng Dòng thời gian (`Timeline / ActivityLogPage.jsx`).
- [ ] Bộ lọc trực quan (lọc theo Lô, theo Vụ mùa, theo Loại công việc: Tưới, Bón phân, Thu hoạch...).
- [ ] Form ghi nhật ký hiện trường (`ActivityLogModal.jsx`):
  - [ ] Thiết kế tối ưu cho điện thoại di động (nút bấm to, thao tác 1 tay thuận tiện).
  - [ ] Chọn nhanh loại hoạt động bằng biểu tượng (icon trực quan).
  - [ ] Thêm linh hoạt các loại phân bón/thuốc BVTV kèm số lượng và thành tiền.
  - [ ] Nhập thông tin thu hoạch (sản lượng kg, giá bán dự kiến).
  - [ ] Ghi chú hiện trường hoặc tình trạng sâu bệnh.
- [ ] Trang Quản lý Kho vật tư của Nông hộ (`InventoryPage.jsx` - xem số lượng tồn, nhập thêm hàng).

---

## 6. Phân hệ Ngoại tuyến (Offline-First) & Đồng bộ dữ liệu (Sync Engine)

> **Mục tiêu:** Đảm bảo khi ra vườn/rẫy mất sóng 4G/Wifi vẫn ghi nhật ký bình thường, khi về nhà có mạng sẽ tự động đồng bộ lên máy chủ an toàn, không mất dữ liệu.

### Lưu trữ Cục bộ (Client-side IndexedDB)
- [ ] Cài đặt thư viện `dexie` (Wrapper tối ưu cho IndexedDB trên trình duyệt).
- [ ] Khởi tạo Local Database Schema (`db.js`):
  - Bảng `localActivityLogs` (kèm cờ `syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'`).
  - Bảng `localFarms`, `localPlots`, `localCrops`, `localMaterials` (cache dữ liệu để hiển thị khi offline).
  - Bảng `syncQueue` (hàng đợi ghi nhận các thao tác tạo/sửa/xóa cần gửi lên server).

### PWA & Service Worker
- [ ] Cài đặt cấu hình `vite-plugin-pwa`.
- [ ] Tạo file `manifest.json` (icon app 192x192, 512x512, màu theme, display standalone như app mobile gốc).
- [ ] Đăng ký Service Worker với chiến lược:
  - Cache First / Stale-While-Revalidate cho static assets (HTML, CSS, JS, icons).
  - Network First fallback to IndexedDB cho dữ liệu API.
- [ ] Banner thông báo trạng thái mạng: "Đang ngoại tuyến (Offline)" và "Đã có mạng - Đang đồng bộ...".
- [ ] Hỗ trợ nút "Cài đặt ứng dụng vào màn hình chính" (Install PWA Prompt).

### Cơ chế Đồng bộ hai chiều (Sync Engine)
- [ ] Backend API Đẩy đồng bộ hàng loạt (`POST /sync/push` - nhận mảng nhật ký từ client, xử lý Idempotency Key tránh trùng lặp).
- [ ] Backend API Kéo dữ liệu mới nhất (`GET /sync/pull?lastSyncTimestamp=...`).
- [ ] Giải quyết xung đột (Conflict Resolution Strategy): Áp dụng Last-Write-Wins (LWW) hoặc ưu tiên dữ liệu mới nhất.
- [ ] Frontend `SyncManager.js`: Tự động kích hoạt khi trình duyệt bắt sự kiện `window.addEventListener('online')`.
- [ ] Nút "Đồng bộ ngay" thủ công kèm hiển thị số lượng bản ghi đang chờ đẩy lên server.

---

## 7. Phân hệ Báo cáo, Thống kê & Dashboard Trực quan

> **Mục tiêu:** Cung cấp biểu đồ trực quan giúp nông hộ kiểm soát chi phí, vật tư, doanh thu và đánh giá hiệu quả kinh tế theo vụ/năm.

### Backend
- [ ] Module `ReportsModule` trong NestJS.
- [ ] API Thống kê tổng quan KPI (`GET /reports/summary?cropCycleId=...`):
  - Tổng chi phí phát sinh (Vật tư + Nhân công).
  - Tổng sản lượng thu hoạch.
  - Tổng doanh thu dự kiến / thực tế.
  - Lợi nhuận tạm tính = Doanh thu - Tổng chi phí.
- [ ] API Cơ cấu chi phí (`GET /reports/cost-breakdown` - tỷ lệ % chi cho Phân bón, Thuốc BVTV, Công làm đất, Tưới...).
- [ ] API Thống kê lượng vật tư tiêu thụ theo chu kỳ (`GET /reports/material-consumption`).
- [ ] API Biến động chi phí theo thời gian/tháng (`GET /reports/cost-trends`).

### Frontend
- [ ] Trang Báo cáo & Thống kê (`DashboardPage.jsx` hoặc `ReportsPage.jsx`).
- [ ] Thanh lọc dữ liệu: Chọn Nông hộ -> Chọn Lô trồng -> Chọn Vụ mùa canh tác hoặc khoảng ngày.
- [ ] Khối thẻ KPI nổi bật: Doanh thu, Chi phí, Lợi nhuận, Sản lượng (màu sắc trực quan).
- [ ] Biểu đồ tròn (Pie Chart - thư viện Recharts): Cơ cấu các khoản chi phí.
- [ ] Biểu đồ cột (Bar Chart): Lượng vật tư tiêu thụ so sánh với định mức.
- [ ] Biểu đồ đường (Line Chart): Chi phí phát sinh qua các tháng trong chu kỳ.
- [ ] Chức năng Xuất báo cáo (In trực tiếp / Xuất PDF hoặc Excel để lưu trữ).

---

## 8. Kiểm thử, Triển khai & Hồ sơ Đồ án Tốt nghiệp

### Kiểm thử (Testing)
- [ ] Viết Unit Test cho các Service chính bằng Jest (`AuthService`, `FarmsService`, `ActivityLogsService`).
- [ ] Viết Integration Test kiểm thử toàn bộ các API endpoint bằng Postman Collection (đạt chuẩn mã lỗi 200, 201, 400, 401, 403, 404).
- [ ] Kiểm thử kịch bản Offline - Sync (mất mạng ghi nhật ký -> bật mạng kiểm tra dữ liệu trên PostgreSQL).
- [ ] Kiểm thử giao diện đa thiết bị: Desktop, Tablet, Màn hình điện thoại (iOS Safari, Android Chrome).
- [ ] Đo lường hiệu năng bằng Google Lighthouse (PWA Score ≥ 90, Performance ≥ 85).

### Đóng gói & Triển khai (Deployment)
- [x] Dockerfile & `docker-compose.yml` cho cơ sở dữ liệu PostgreSQL.
- [ ] Dockerfile cho Backend NestJS.
- [ ] Build tối ưu Frontend React (`npm run build`).
- [ ] Triển khai thử nghiệm lên môi trường Cloud (Vercel / Render / Supabase / Railway).

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
