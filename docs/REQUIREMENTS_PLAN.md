# 🌿 DALATAGRI — KẾ HOẠCH TRIỂN KHAI & CHECKLIST ĐỒ ÁN TỐT NGHIỆP
## Theo Yêu Cầu Giảng Viên Hướng Dẫn: Thầy Thắng La Quốc

> **Tên đề tài:** Xây dựng ứng dụng quản lý nhật ký canh tác cây dài ngày, vật tư và chi phí nông nghiệp cho nông hộ  
> **Sinh viên thực hiện:** Đồ án Tốt nghiệp Ngành Công nghệ Thông tin  
> **Giảng viên hướng dẫn:** Thầy Thắng La Quốc  
> **Công nghệ chủ đạo:** React (Vite, PWA Offline-First) + NestJS (Modular Clean Architecture) + PostgreSQL (Prisma ORM) + Dexie.js (IndexedDB) + Recharts  
> **Tiêu chuẩn chất lượng:** Chuẩn bảo mật quốc tế OWASP Top 10, phát triển định hướng kiểm thử TDD (Test-Driven Development), Docker hóa toàn hệ thống.

---

## 📑 BẢNG THEO DÕI TIẾN ĐỘ THEO CÁC GIAI ĐOẠN (MILESTONES TRACKER)

| Giai đoạn | Tên Giai Đoạn | Đặc tả (Spec) | Sản phẩm (Code) | Kiểm thử (TDD/Test) | Tài liệu (Docs) | Tiến độ |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Giai đoạn 1** | Nền tảng, Bảo mật OWASP & Auth Nông hộ | [x] | [x] | [x] | [x] | **100%** |
| **Giai đoạn 2** | Quản lý Nông hộ, Lô trồng & Cây lâu năm (Cà phê, Sầu riêng, Mắc-ca) | [x] | [x] | [x] | [x] | **100%** |
| **Giai đoạn 3** | Vụ canh tác & Nhật ký nông nghiệp đa vật tư, nhân công | [x] | [x] | [x] | [x] | **100%** |
| **Giai đoạn 4** | Quản lý Tài chính, Doanh thu, Lợi nhuận & Báo cáo thống kê | [x] | [x] | [x] | [x] | **100%** |
| **Giai đoạn 5** | UI/UX Hiện trường, Số hóa OCR Hóa đơn & Trợ lý Nông nghiệp AI | [x] | [x] | [x] | [x] | **100%** |
| **Giai đoạn 6** | Kiểm thử TDD tự động, Đóng gói Docker & Hồ sơ ĐATN | [x] | [x] | [x] | [x] | **100%** |

---

## 1. KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU

### 1.1. Kiến Trúc Dự Án (System Architecture)
Hệ thống được thiết kế theo mô hình **Modular Clean Architecture** kết hợp giải pháp **PWA Offline-First**:

```
┌────────────────────────────────────────────────────────────────────────┐
│               FRONTEND: React 19 + Vite 8 + PWA Offline                │
│  - Giao diện tối ưu nương rẫy (nút bấm to, phản hồi trực quan)        │
│  - Trợ lý Nông nghiệp AI (Agri AI Assistant) tư vấn kỹ thuật cây trồng  │
│  - Module OCR số hóa hóa đơn phân bón & thuốc BVTV                     │
│  - Lưu trữ ngoại tuyến IndexedDB (Dexie.js) khi mất sóng ngoài vườn   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + JWT (Token Rotation)
┌───────────────────────────────────┴────────────────────────────────────┐
│                    BACKEND: NestJS 11 Modular Engine                   │
│  - Controller Layer: Tiếp nhận request, Validation Pipe               │
│  - Guard & Security: JwtAuthGuard, RolesGuard, Rate Limiter (OWASP)   │
│  - Service Layer: Nghiệp vụ tính chi phí, nhân công, doanh thu, lãi lỗ│
│  - AI & OCR Service: Xử lý thực thể hóa đơn & tri thức nông nghiệp     │
│  - Repository / ORM: Prisma Client quản lý quan hệ thực thể           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Type-Safe Queries
┌───────────────────────────────────┴────────────────────────────────────┐
│                    DATABASE: PostgreSQL 15                             │
│  - Users, RefreshTokens, Farms, Plots, Crops, GrowthCycles,            │
│  - CropCycles, Materials, Inventories, ActivityLogs, ActivityMaterials│
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2. Mô Hình Dữ Liệu Thực Tế (ERD)
1. **Farm <-> Farmer:**
   - Mỗi `User` (Farmer) sở hữu nhiều `Farm` (Nông trại/Vườn cây).
   - Mỗi `Farm` được chia thành nhiều `Plot` (Lô/Thửa đất). Ràng buộc: Tổng diện tích các lô $\le$ Diện tích nông trại.
2. **Cây trồng dài ngày:**
   - Bảng `Crop`: Quản lý các giống cây dài ngày chủ lực Tây Nguyên:
     * *Cà phê Robusta (Lâm Hà)*
     * *Cà phê Arabica (Cầu Đất)*
     * *Sầu riêng Ri6 (Đạ Huoai)*
     * *Sầu riêng Monthong Dona*
     * *Mắc-ca ghép (Đơn Dương)*
     * *Bơ 034 (Bảo Lộc)*
   - Bảng `GrowthCycle` & `GrowthStage`: Giai đoạn kiến thiết cơ bản, kinh doanh, phục hồi sau thu hoạch.
3. **Mùa vụ & Nhật ký canh tác:**
   - `CropCycle`: Gắn cây trồng vào một lô cụ thể theo niên vụ canh tác.
   - `ActivityLog`: Nhật ký công việc thực tế (Làm đất, Bón phân, Xịt thuốc BVTV, Cắt cành, Tưới nước, Thu hoạch).
   - `ActivityMaterial`: Cho phép dùng nhiều loại vật tư (phân NPK, phân chuồng, thuốc trừ nấm Ridomil Gold...) trong cùng 1 lần làm việc.
4. **Nhân công & Tài chính:**
   - Quản lý nhân công: Nông dân tự làm (`isHiredLabor = false`) hoặc thuê công ngoài (`isHiredLabor = true`).
   - Ghi nhận số công nhân thuê, tiền công theo ngày (ví dụ 350.000đ - 400.000đ/công) $\rightarrow$ Tự động tính tổng chi phí nhân công.
   - Thu hoạch: Sản lượng thu được (kg/tấn), đơn giá bán $\rightarrow$ Doanh thu.
   - Lợi nhuận ròng = $\text{Doanh thu} - (\text{Chi phí nhân công} + \text{Chi phí vật tư} + \text{Chi phí khác})$.

---

## 2. TIÊU CHUẨN BẢO MẬT OWASP TOP 10

Hệ thống triển khai nghiêm ngặt các biện pháp bảo mật theo tiêu chuẩn OWASP:

| Mã OWASP | Nguy cơ bảo mật | Giải pháp kỹ thuật triển khai trong DalatAgri |
|---|---|---|
| **A01** | Broken Access Control | Phân quyền RBAC (`OWNER`, `ADMIN`, `WORKER`). Kiểm tra quyền sở hữu nông hộ (`userId`), ngăn chặn rò rỉ dữ liệu giữa các hộ nông dân. |
| **A02** | Cryptographic Failures | Mật khẩu băm an toàn với `bcrypt` (10 vòng salt). Token JWT ký bằng bí mật mạnh, hỗ trợ thu hồi Token trong CSDL. |
| **A03** | Injection | 100% truy vấn CSDL qua Prisma ORM tham số hóa (Parameterized queries), hoàn toàn miễn nhiễm với SQL Injection. |
| **A04** | Insecure Design | Thiết kế xác thực 2 lớp (MFA/TOTP với Google Authenticator) và bảo vệ form với Cloudflare Turnstile. |
| **A05** | Security Misconfiguration | Đóng gói môi trường đồng nhất qua Docker Compose, cấu hình CORS nghiêm ngặt chỉ chấp nhận nguồn tin cậy. |
| **A07** | Identification & Auth Failures | Token Rotation ngăn chặn replay attack; cơ chế Brute-force Limiter tự động khóa tài khoản tạm sau 5 lần đăng nhập sai. |
| **A08** | Software & Data Integrity | Dữ liệu đồng bộ từ Offline lên Server có kiểm tra tính toàn vẹn (Idempotency Key) tránh trùng lặp bản ghi. |

---

## 3. ĐẶC TẢ CHI TIẾT 6 GIAI ĐOẠN DỰ ÁN

### Giai đoạn 1: Nền tảng, Bảo mật OWASP & Xác thực Nông hộ (Auth & Farmer Profile)
- **Đặc tả nghiệp vụ:** Đăng ký, đăng nhập tài khoản nông hộ, phân quyền 3 cấp độ, bảo vệ Brute-force và hỗ trợ xác thực 2 bước Google Authenticator.
- **Sản phẩm bàn giao:** Các module `auth`, `users`, các Guard kiểm soát quyền truy cập, các trang `LoginPage`, `RegisterPage`, `AccountPage`.
- **Kiểm thử (TDD):** Kiểm thử đăng nhập sai 5 lần bị khóa; kiểm thử xác thực JWT token; kiểm thử quyền truy cập theo vai trò.
- **Tài liệu:** `docs/phase_3_spec.md`, `docs/security_operations.md`.

### Giai đoạn 2: Quản lý Nông hộ, Lô trồng & Danh mục Cây lâu năm
- **Đặc tả nghiệp vụ:** Một nông dân quản lý nhiều vườn (`Farm`), chia vườn thành nhiều lô (`Plot`) với ràng buộc không vượt quá diện tích. Quản lý danh mục cây trồng Cà phê, Sầu riêng, Mắc-ca, Bơ và các giai đoạn sinh trưởng.
- **Sản phẩm bàn giao:** `backend/src/farms`, `backend/src/catalog`, giao diện `FarmsPage`, `FarmDetailPage`, `CatalogPanel`.
- **Kiểm thử (TDD):** Kiểm thử ràng buộc tổng diện tích lô $\le$ diện tích vườn; kiểm thử bảo vệ dữ liệu giữa các chủ vườn khác nhau.
- **Tài liệu:** `docs/phase_5_spec.md`, `docs/phase_6_spec.md`.

### Giai đoạn 3: Vụ canh tác & Nhật ký nông nghiệp đa vật tư, nhân công
- **Đặc tả nghiệp vụ:** Khởi tạo vụ mùa theo năm/lô. Ghi chép nhật ký công việc thực tế, hỗ trợ pha trộn nhiều loại phân/thuốc, tính toán tiền công thuê ngoài vs tự làm, chi phí máy móc phát sinh.
- **Sản phẩm bàn giao:** Bảng điều khiển `FarmingLogPage`, modal ghi nhật ký thông minh, module CSDL `ActivityLog` và `ActivityMaterial`.
- **Kiểm thử (TDD):** Unit test công thức tính chi phí: Vật tư + Nhân công + Khác = Tổng chi phí hoạt động.
- **Tài liệu:** `docs/phase_7_spec.md`, `docs/phase_8_spec.md`.

### Giai đoạn 4: Quản lý Tài chính, Doanh thu, Lợi nhuận & Báo cáo thống kê
- **Đặc tả nghiệp vụ:** Ghi nhận đợt thu hoạch (sản lượng kg, giá bán) $\rightarrow$ Doanh thu. Tính toán lợi nhuận ròng, tỷ suất sinh lời ROI%, biểu đồ cơ cấu chi phí (% phân bón, % thuốc BVTV, % công lao động).
- **Sản phẩm bàn giao:** API `GET /catalog/financial-report`, hệ thống biểu đồ Recharts trên `FarmingLogPage`.
- **Kiểm thử (TDD):** Test suite kiểm tra tính đúng đắn của doanh thu, chi phí, lợi nhuận và ROI trong mọi trường hợp.
- **Tài liệu:** Báo cáo phân tích tài chính nông nghiệp và phương pháp luận tính toán kinh tế nông hộ.

### Giai đoạn 5: UI/UX Hiện trường, Số hóa OCR Hóa đơn & Trợ lý Nông nghiệp AI
- **Đặc tả nghiệp vụ:** 
  1. Giao diện tối ưu nương rẫy, dễ nhìn dưới trời nắng.
  2. Số hóa tài liệu qua **OCR quét hóa đơn**: Nông dân chụp ảnh hóa đơn mua phân thuốc $\rightarrow$ Hệ thống tự bóc tách tên hàng, số lượng, đơn giá, tự điền vào form ghi nhật ký.
  3. **Trợ lý Nông nghiệp AI (Agri AI Assistant)**: Chatbot thông minh hỗ trợ giải đáp kỹ thuật canh tác Cà phê, Sầu riêng, Mắc-ca và phân tích tài chính.
- **Sản phẩm bàn giao:** Component `ReceiptOcrModal.jsx`, Component `AgriAiAssistant.jsx`, bộ tri thức cây trồng tích hợp.
- **Kiểm thử (TDD):** Kiểm thử luồng trích xuất dữ liệu hóa đơn và luồng hỏi đáp AI chuyên sâu.
- **Tài liệu:** Hướng dẫn sử dụng OCR số hóa tài liệu hóa đơn và kịch bản demo tính năng AI trong buổi bảo vệ.

### Giai đoạn 6: Kiểm thử TDD tự động, Đóng gói Docker & Hồ sơ ĐATN
- **Đặc tả nghiệp vụ:** Đạt độ bao phủ kiểm thử cao, đóng gói triển khai 1 lệnh qua Docker Compose, hoàn thiện toàn bộ bản thảo báo cáo tốt nghiệp.
- **Sản phẩm bàn giao:** Bộ Unit Test Jest `catalog.service.spec.ts`, file `docker-compose.yml`, toàn bộ mã nguồn kiểm thử đạt 100% Pass.
- **Kiểm thử (TDD):** Chạy kiểm thử tự động `npm test` thành công không lỗi.
- **Tài liệu:** Quyển báo cáo đồ án tốt nghiệp 5 chương hoàn chỉnh.

---

## 4. HƯỚNG DẪN BÁO CÁO VỚI THẦY HƯỚNG DẪN (DEMO FLOW)

Khi trình chiếu báo cáo cho Thầy Thắng La Quốc, sinh viên thực hiện theo kịch bản chuẩn sau:
1. **Bước 1 (Bảo mật & Auth):** Đăng nhập với tài khoản nông dân `farmer@dalatagri.vn`, giải thích cơ chế Token Rotation và bảo vệ Brute-force chống tấn công.
2. **Bước 2 (Farm & Lô & Cây trồng):** Mở trang Vườn của tôi, cho thầy thấy việc chia lô và quản lý các loại cây chủ lực: **Cà phê Robusta Lâm Hà, Cà phê Arabica Cầu Đất, Sầu riêng Ri6, Mắc-ca**.
3. **Bước 3 (Số hóa tài liệu OCR):** Vào trang Nhật ký canh tác $\rightarrow$ Bấm **"Quét Hóa Đơn (OCR)"** $\rightarrow$ Chọn hóa đơn mua phân bón hoặc thuốc BVTV $\rightarrow$ Trình diễn việc hệ thống tự động bóc tách tên vật tư, số lượng, tiền công thuê để điền vào form mà không cần gõ phím.
4. **Bước 4 (Tài chính & Thu hoạch):** Trình diễn việc nhập công thuê (ví dụ: 2 người x 350.000đ/ngày) và ghi nhận thu hoạch cà phê 2.8 tấn $\rightarrow$ Chỉ vào biểu đồ và thẻ KPI: Doanh thu, Tổng chi phí, Lợi nhuận và ROI%.
5. **Bước 5 (Trợ lý Nông nghiệp AI):** Mở Trợ lý AI ở góc phải màn hình, đặt câu hỏi thực tế: *"Quy trình bón phân cho cà phê mùa mưa như thế nào?"* hoặc *"Cách trị xì mủ trên cây sầu riêng?"* $\rightarrow$ Cho thầy thấy phản hồi chuyên sâu, chuẩn kỹ thuật nông nghiệp.
6. **Bước 6 (Kỹ năng kiểm thử TDD):** Mở Terminal chạy lệnh `npm test` cho thấy các test case kiểm thử tự động đạt 100% Pass.
