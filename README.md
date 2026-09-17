# 🌿 DalatAgri — Nền Tảng Quản Lý Canh Tác & Kinh Tế Nông Hộ

<p align="center">
  <img src="frontend/public/plots/coffee.png" alt="DalatAgri Banner" width="100%" style="max-height: 280px; object-fit: cover; border-radius: 12px;" />
</p>

<p align="center">
  <b>Hệ thống số hóa nhật ký nông nghiệp, theo dõi vật tư kho bãi, quản lý nhân công và phân tích tài chính nông hộ</b><br/>
  <i>Đồ án Tốt nghiệp Kỹ sư / Cử nhân Công nghệ Thông tin</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Backend-NestJS%2011%20Modular-ea2845?style=flat-square&logo=nestjs" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%2015-336791?style=flat-square&logo=postgresql" alt="PostgreSQL 15" />
  <img src="https://img.shields.io/badge/ORM-Prisma%205.21-2d3748?style=flat-square&logo=prisma" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/PWA-Offline--First%20IndexedDB-16a34a?style=flat-square" alt="PWA Offline" />
  <img src="https://img.shields.io/badge/Security-OWASP%20Top%2010-blue?style=flat-square&logo=shield" alt="OWASP Security" />
</p>

---

## 📌 Mục Lục
1. [Giới Thiệu Đề Tài](#-giới-thiệu-đề-tài)
2. [Điểm Nổi Bật Của Hệ Thống](#-điểm-nổi-bật-của-hệ-thống)
3. [Kiến Trúc & Công Nghệ (Tech Stack)](#-kiến-trúc--công-nghệ-tech-stack)
4. [Tính Năng Chính](#-tính-năng-chính)
5. [Chuẩn Bảo Mật OWASP Top 10](#-chuẩn-bảo-mật-owasp-top-10)
6. [Mô Hình Dữ Liệu (ERD Summary)](#-mô-hình-dữ-liệu-erd-summary)
7. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
8. [Hướng Dẫn Cài Đặt & Chạy Hệ Thống](#-hướng-dẫn-cài-đặt--chạy-hệ-thống)
9. [Tài Liệu API & Kiểm Thử](#-tài-liệu-api--kiểm-thử)
10. [Thông Tin Đồ Án](#-thông-tin-đồ-án)

---

## 📖 Giới Thiệu Đề Tài

* **Tên đề tài:** *Xây dựng ứng dụng quản lý nhật ký canh tác cây dài ngày, vật tư và chi phí nông nghiệp cho nông hộ.*
* **Bối cảnh thực tế:** Lâm Đồng và Tây Nguyên là thủ phủ của các loại cây công nghiệp và cây ăn trái xuất khẩu chủ lực (Cà phê, Sầu riêng, Bơ, Mắc ca, Chè, Hồ tiêu...). Tuy nhiên, đa số nông dân vẫn quản lý mùa vụ bằng sổ tay giấy, dễ thất lạc, khó tính toán giá thành sản xuất, thiếu kiểm soát dư lượng phân thuốc và không chứng minh được nguồn gốc nông sản khi xuất khẩu.
* **Mục tiêu giải pháp:**
  - Cung cấp giải pháp **PWA Offline-First** giúp nông dân ghi chép nhật ký ngay tại vườn rẫy dù **không có sóng 4G/Wifi**.
  - Chuẩn hóa quy trình sinh trưởng theo tiêu chuẩn của **Viện WASI** và **VietGAP**.
  - Tự động hóa tính toán chi phí (nhân công thuê ngoài, vật tư xuất kho) đối chiếu với sản lượng thu hoạch để kết toán **lợi nhuận ròng** từng lô đất.

---

## 🌟 Điểm Nổi Bật Của Hệ Thống

| Tính năng cốt lõi | Giá trị đem lại cho nông dân & HTX |
|---|---|
| 📶 **PWA Offline-First (IndexedDB)** | Hoạt động bình thường ngoài nương rẫy, tự động đồng bộ (Auto-Sync) khi có mạng trở lại. |
| 🥑 **Catalog Cây Trồng Chuẩn Hóa** | 10 bộ dữ liệu cây mẫu chi tiết: mật độ, năm ra hoa, năm bói quả, cảnh báo sâu bệnh và quy trình sinh trưởng từng giai đoạn. |
| 🧑‍🌾 **Nhật Ký & Quản Lý Nhân Công** | Tách bạch giữa công nhà tự làm và công thuê mướn ngoài, tự động nhân đơn giá ngày công. |
| 📦 **Kho Vật Tư Thông Minh** | Tự động trừ tồn kho khi ghi nhật ký bón phân/phun thuốc, cảnh báo sắp hết hạn và hết hàng. |
| 📈 **Báo Cáo Tài Chính & Lợi Nhuận** | Biểu đồ trực quan Recharts: Doanh thu bán quả, chi phí phân thuốc, công cán, phân tích lãi/lỗ theo mùa vụ. |
| 🛡️ **Bảo Mật Cấp Doanh Nghiệp** | Phân quyền RBAC (Chủ hộ, Quản lý, Công nhân), MFA Google Authenticator, chống tấn công Brute-force. |

---

## 🏗️ Kiến Trúc & Công Nghệ (Tech Stack)

### Kiến trúc tổng thể hệ thống (System Architecture)

```
┌──────────────────────────────────────────────────────────────────────────┐
│              CLIENT LAYER: React 19 + Vite 8 + PWA Offline               │
│  - Giao diện nương rẫy: Nút bấm lớn, tương phản cao, tối ưu di động     │
│  - Lưu trữ ngoại tuyến: Dexie.js (IndexedDB) + Idempotency Keys          │
│  - Trực quan hóa số liệu: Recharts (Doanh thu, Chi phí, Tồn kho)         │
│  - Thiết kế UI: Modern Vanilla CSS Design System, Responsive Mobile       │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTPS / RESTful API (Bearer JWT)
┌────────────────────────────────────┴─────────────────────────────────────┐
│                 SERVER LAYER: NestJS 11 Modular Engine                   │
│  - Modular Architecture: Auth, Users, Farms, Catalog, Sales, Activities   │
│  - Security & Guards: JwtAuthGuard, RolesGuard, RateLimiter (Throttler)  │
│  - Validation: class-validator, class-transformer (Strict Validation)    │
│  - Background Tasks: Mailer Service (Nodemailer), Quản lý Token Rotation │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ Prisma Client (Type-Safe Query)
┌────────────────────────────────────┴─────────────────────────────────────┐
│                  DATABASE LAYER: PostgreSQL 15 Engine                    │
│  - PostgreSQL 15 Containerized with Docker Compose                       │
│  - Prisma ORM 5.21: Quản lý Migration, Quan hệ bảng, Soft Delete         │
└──────────────────────────────────────────────────────────────────────────┘
```

### Công nghệ sử dụng chi tiết

* **Frontend:**
  - `React 19` & `Vite 8`: Hiệu năng render tối ưu, thời gian HMR siêu tốc.
  - `React Router v7`: Điều hướng client-side mượt mà với Protected Routes.
  - `Recharts`: Biểu đồ tài chính (AreaChart, BarChart, PieChart).
  - `Axios`: Tự động đính kèm Token và xử lý Refresh Token xoay vòng.
  - `PWA / Service Worker`: Bộ đệm tài nguyên tĩnh và lưu trữ dữ liệu ngoại tuyến.
* **Backend:**
  - `NestJS 11`: Framework Node.js dạng mô-đun chuẩn doanh nghiệp.
  - `Prisma ORM 5.21`: Truy vấn kiểu tĩnh an toàn (Type-safe), quản lý schema tập trung.
  - `Passport & JWT`: Cơ chế xác thực phân tán, bảo vệ phiên làm việc.
  - `Bcrypt`: Băm mật khẩu một chiều với salt rounds an toàn.
  - `Nodemailer`: Dịch vụ gửi email khôi phục mật khẩu và thông báo tài khoản.
* **Cơ sở dữ liệu & Hạ tầng:**
  - `PostgreSQL 15 Alpine`: CSDL quan hệ tin cậy, ACID toàn diện.
  - `Docker & Docker Compose`: Đóng gói môi trường nhất quán.

---

## 🚀 Tính Năng Chính

### 1. Quản lý Nông trại & Phân lô Canh tác (Farms & Plots)
* Tạo và quản lý nhiều trang trại/vườn rẫy cho từng chủ hộ.
* Chia tách thành các **Lô/Thửa đất chuyên canh** (Lô cà phê, Lô sầu riêng ghép, Lô bơ 034, Lô xen canh).
* Ràng buộc nghiệp vụ: Tổng diện tích các lô không vượt quá diện tích nông trại.
* Gán ảnh mẫu thực tế cho từng khu vườn để nhận diện nhanh.

### 2. Danh mục Giống cây & Chu kỳ Sinh trưởng (Crops & Growth Stages)
* Bộ dữ liệu chuẩn hóa 10 loại cây giá trị kinh tế cao:
  1. ☕ **Cà phê Robusta** (Xuất khẩu chủ lực)
  2. 🍈 **Sầu riêng Ri6 / Monthong** (Giá trị kinh tế cao)
  3. 🥑 **Cây Bơ sáp / Bơ 034** (Năng suất cao)
  4. 🌰 **Cây Mắc ca** (Nông nghiệp bền vững)
  5. 🍵 **Cây Chè (Trà)** (Đặc sản cao nguyên)
  6. 🌶️ **Cây Hồ tiêu** (Gia vị xuất khẩu)
  7. 🌳 **Cây Cao su** (Mủ cao su công nghiệp)
  8. 🍊 **Cây Bưởi da xanh** (Trái cây xuất khẩu)
  9. 🍒 **Cây Vải thiều** (Đặc sản xuất khẩu)
  10. 🥭 **Cây Xoài** (Trái cây cao cấp)
* Mỗi giống cây tích hợp sẵn:
  - Thông số kỹ thuật: Mật độ canh tác, thời gian ra hoa, thời điểm bói quả, thời gian nuôi quả, đơn vị thu hoạch, phân hạng thương phẩm.
  - Cảnh báo sâu bệnh hại đặc thù và biện pháp phòng ngừa.
  - **Quy trình sinh trưởng chuẩn (Timeline Stages)**: Từng giai đoạn kèm số ngày chuẩn và hướng dẫn thao tác (siết nước bung hoa, tỉa cành, bao trái, hái búp...).

### 3. Nhật ký Canh tác & Quản lý Nhân công (Farming Logs)
* Ghi chép tức thời các công việc: Làm đất, Bón phân, Phun thuốc, Cắt tỉa, Tưới nước, Thu hoạch.
* **Quản lý nhân công chuyên sâu:**
  - Phân loại: *Công nhà tự làm* hoặc *Thuê mướn bên ngoài*.
  - Nhập số lượng công nhân và đơn giá/công $\rightarrow$ Tự động hạch toán vào chi phí lô đất.
* **Tích hợp vật tư:** Một công việc có thể sử dụng nhiều loại phân bón/thuốc BVTV cùng lúc, hệ thống tự động xuất kho theo định lượng.

### 4. Quản lý Vật tư & Kho bãi Nông nghiệp (Inventory)
* Quản lý danh mục phân bón hữu cơ, vô cơ NPK, thuốc BVTV sinh học/hóa học, túi bao trái...
* Nhập kho (nhà cung cấp, số lượng, đơn giá, ngày nhập, hạn sử dụng).
* Xuất kho tự động khi phát sinh hoạt động canh tác ngoài vườn.
* Cảnh báo thông minh: Cảnh báo tồn kho dưới mức an toàn và vật tư cận hạn sử dụng.

### 5. Thu hoạch, Bán hàng & Báo cáo Tài chính (Financials & Reports)
* Ghi nhận sản lượng thu hoạch theo mùa vụ và theo từng lô đất.
* Quản lý hóa đơn bán hàng cho thương lái, vựa thu mua hoặc hợp tác xã.
* **Báo cáo kinh tế tự động:**
  $$\text{Lợi nhuận ròng} = \text{Doanh thu bán nông sản} - (\text{Chi phí nhân công} + \text{Chi phí vật tư} + \text{Chi phí khác})$$
* Biểu đồ trực quan theo thời gian thực giúp nông dân biết chính xác vườn nào đang có lãi, vụ nào chi phí vật tư vượt định mức.

---

## 🛡️ Chuẩn Bảo Mật OWASP Top 10

Hệ thống được thiết kế và kiểm thử nghiêm ngặt theo khuyến nghị an toàn thông tin OWASP:

| Tiêu chuẩn | Mối nguy hại | Giải pháp kỹ thuật trong DalatAgri |
|:---:|---|---|
| **A01:2021** | Broken Access Control | Kiểm soát quyền truy cập RBAC (`OWNER`, `ADMIN`, `WORKER`). Mọi truy vấn đều kiểm tra `userId` và quan hệ quyền sở hữu nông hộ, chống rò rỉ dữ liệu chéo (IDOR). |
| **A02:2021** | Cryptographic Failures | Mật khẩu được băm bằng `bcrypt` với 10 salt rounds. Token JWT ký số an toàn, hỗ trợ cơ chế thu hồi Refresh Token trong CSDL. |
| **A03:2021** | Injection Attacks | 100% truy vấn CSDL thông qua Prisma ORM tham số hóa tự động, triệt tiêu hoàn toàn nguy cơ SQL Injection. |
| **A04:2021** | Insecure Design | Hỗ trợ xác thực hai yếu tố (2FA/TOTP) tương thích Google Authenticator, Microsoft Authenticator. |
| **A05:2021** | Security Misconfiguration | Đóng gói môi trường chạy chuẩn hóa qua Docker, cấu hình CORS nghiêm ngặt, tách biệt biến môi trường `.env`. |
| **A07:2021** | Identification & Auth Failures | Token Rotation (cấp lại cặp Access/Refresh Token mới mỗi phiên), giới hạn số lần đăng nhập sai (Brute-force Limiter tự khóa tài khoản). |
| **A08:2021** | Software & Data Integrity | Dữ liệu đồng bộ ngoại tuyến từ IndexedDB được kiểm tra tính toàn vẹn và idempotency, ngăn ngừa trùng lặp bản ghi. |

---

## 📊 Mô Hình Dữ Liệu (ERD Summary)

```
[User] 1 ──── n [Farm] 1 ──── n [Plot] 1 ──── n [CropCycle]
  │               │                                │
  │ (MFA/Auth)    │                                ├── 1 ──── n [ActivityLog]
  │               │                                │                 │
  ▼               ▼                                │                 ▼
[RefreshToken]  [FarmMember]                       │       [ActivityMaterial]
                  │                                │                 │
                  ▼                                ▼                 ▼
               [Role]                           [Harvest] ──► [Inventory / Material]
                                                   │
                                                   ▼
                                             [SalesOrder]
```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```bash
DalatAgri/
├── backend/                         # Source code API NestJS
│   ├── prisma/
│   │   ├── schema.prisma            # Định nghĩa CSDL Prisma Type-Safe
│   │   └── migrations/              # Lịch sử migration CSDL
│   ├── src/
│   │   ├── auth/                    # Module xác thực JWT, RBAC, TOTP MFA
│   │   ├── users/                   # Quản lý hồ sơ người dùng & nông hộ
│   │   ├── farms/                   # Quản lý nông trại, phân lô, thành viên
│   │   ├── catalog/                 # Danh mục giống cây trồng & chu kỳ mẫu
│   │   ├── sales/                   # Quản lý thu hoạch, bán hàng & doanh thu
│   │   ├── activity-types/          # Phân loại công việc canh tác
│   │   ├── prisma/                  # Prisma Service dùng chung
│   │   ├── app.module.ts            # Root module NestJS
│   │   └── main.ts                  # Điểm khởi chạy Backend (CORS, Pipes)
│   ├── test/                        # Bộ kiểm thử E2E & Unit Test
│   └── package.json
│
├── frontend/                        # Source code ứng dụng React Vite
│   ├── public/
│   │   ├── plots/                   # Thư viện ảnh mẫu thực tế cho 10 cây trồng
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/              # Các UI Component dùng chung
│   │   │   ├── Header.jsx           # Thanh điều hướng cố định (Sticky Fixed)
│   │   │   ├── Footer.jsx           # Chân trang thông tin hệ thống
│   │   │   ├── icons.jsx            # Bộ thư viện SVG Icons vector độc quyền
│   │   │   └── ProtectedRoute.jsx   # Bảo vệ định tuyến người dùng
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Quản lý trạng thái đăng nhập toàn cục
│   │   ├── pages/                   # Các trang giao diện chức năng
│   │   │   ├── home/                # Trang chủ giới thiệu hệ thống
│   │   │   ├── crops/               # Quản lý giống cây, Preset & Drawer quy trình
│   │   │   ├── farms/               # Trang trại & Chi tiết phân lô
│   │   │   ├── farming-log/         # Nhật ký canh tác ngoài vườn
│   │   │   ├── materials/           # Quản lý phân bón & thuốc BVTV
│   │   │   ├── inventory/           # Quản lý kho hàng & cảnh báo tồn
│   │   │   ├── harvest/             # Nhật ký thu hoạch mùa vụ
│   │   │   ├── sales/               # Đơn hàng xuất bán nông sản
│   │   │   ├── reports/             # Báo cáo doanh thu, chi phí, lợi nhuận
│   │   │   ├── admin/               # Bảng điều khiển quản trị hệ thống
│   │   │   └── offline/             # Giao diện ngoại tuyến PWA
│   │   ├── services/
│   │   │   └── api.js               # Cấu hình Axios Interceptors & Endpoint calls
│   │   ├── App.jsx                  # Thiết lập định tuyến Router v7
│   │   ├── App.css                  # Style toàn cục & biến CSS Design System
│   │   └── main.jsx                 # Điểm khởi chạy ứng dụng Frontend
│   └── package.json
│
├── docs/                            # Tài liệu đặc tả kỹ thuật đồ án tốt nghiệp
│   ├── REQUIREMENTS_PLAN.md         # Kế hoạch triển khai & checklist theo tuần
│   ├── PROJECT_TRACKER.md           # Tiến độ 6 giai đoạn phát triển
│   ├── api_reference.md             # Đặc tả chi tiết các RESTful API endpoints
│   ├── security_operations.md       # Báo cáo rà soát an toàn bảo mật OWASP
│   └── mfa_authenticator_guide.md   # Hướng dẫn thiết lập xác thực 2 bước
│
├── docker-compose.yml               # Cấu hình PostgreSQL 15 Container
├── package.json                     # Root orchestrator scripts
└── README.md                        # Tài liệu hướng dẫn đồ án
```

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### Yêu cầu môi trường
* **Node.js:** Phiên bản `>= 20.x` (khuyên dùng Node LTS 20 hoặc 22).
* **Docker & Docker Compose:** Để chạy PostgreSQL tự động (hoặc cài sẵn PostgreSQL 15 trên máy).
* **Git:** Quản lý mã nguồn.

---

### Bước 1: Khởi động Cơ sở Dữ liệu PostgreSQL
Bạn có thể sử dụng Docker để khởi chạy CSDL PostgreSQL một cách nhanh chóng:

```bash
# Tại thư mục gốc của dự án:
docker compose up -d
```
> CSDL PostgreSQL sẽ chạy tại cổng `5433` (được cấu hình sẵn trong `docker-compose.yml` để tránh xung đột cổng 5432 mặc định).

---

### Bước 2: Cấu hình & Chạy Backend (NestJS)

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Cấu hình biến môi trường
# Tạo file .env dựa trên mẫu dưới đây:
```

**Mẫu file `backend/.env`:**
```env
DATABASE_URL="postgresql://postgres:password123@localhost:5433/dalat_agri?schema=public"
JWT_SECRET="dalat_agri_super_secret_jwt_key_2026_capstone"
JWT_EXPIRES_IN="1d"
REFRESH_TOKEN_EXPIRES_DAYS="7"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

```bash
# 4. Đẩy lược đồ CSDL và khởi tạo Prisma Client
npx prisma db push
npx prisma generate

# 5. Khởi chạy Backend ở chế độ phát triển
npm run start:dev
```
> Backend sẽ khởi chạy thành công tại: `http://localhost:3000/api`

---

### Bước 3: Cấu hình & Chạy Frontend (React Vite)

Mở một cửa sổ Terminal mới:

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt thư viện phụ thuộc
npm install

# 3. Cấu hình biến môi trường
# Tạo file frontend/.env:
```

**Mẫu file `frontend/.env`:**
```env
VITE_API_URL="http://localhost:3000/api"
```

```bash
# 4. Khởi chạy máy chủ phát triển Frontend
npm run dev
```
> Mở trình duyệt và truy cập: **`http://localhost:5173`**

---

### Bước 4: Nạp Dữ Liệu Mẫu Nông Nghiệp Lâm Đồng (1-Click Seed Data)
1. Đăng ký một tài khoản nông hộ mới tại trang `/register`.
2. Đăng nhập vào hệ thống tại trang `/login`.
3. Truy cập mục **Cây Trồng** (`/crops`).
4. Nhấn nút **"Nạp Dữ Liệu Mẫu Lâm Đồng"** trên thanh tiêu đề: Hệ thống sẽ tự động khởi tạo đầy đủ dữ liệu thực nghiệm gồm 10 loại cây trồng, các chu kỳ sinh trưởng và danh mục vật tư phân thuốc chuẩn.

---

## 📡 Tài Liệu API & Kiểm Thử

### Các Endpoint chính của hệ thống

| Nhóm API | Phương thức | Đường dẫn (Path) | Mô tả chức năng |
|---|:---:|---|---|
| **Auth** | `POST` | `/api/auth/register` | Đăng ký tài khoản nông hộ mới |
| **Auth** | `POST` | `/api/auth/login` | Đăng nhập nhận Access Token & Refresh Token |
| **Auth** | `POST` | `/api/auth/refresh` | Cơ chế xoay vòng Refresh Token |
| **Farms** | `GET` | `/api/farms` | Lấy danh sách nông trại của nông hộ |
| **Farms** | `POST` | `/api/farms` | Tạo mới nông trại |
| **Plots** | `POST` | `/api/farms/:farmId/plots` | Tạo mới lô/thửa đất chuyên canh |
| **Crops** | `GET` | `/api/catalog/crops` | Danh mục cây trồng & thông số nông học |
| **Crops** | `POST` | `/api/catalog/crops` | Thêm cây trồng mới kèm quy trình sinh trưởng |
| **Logs** | `POST` | `/api/activity-logs` | Ghi nhật ký công việc (kèm công thợ & vật tư) |
| **Sales** | `POST` | `/api/sales` | Ghi nhận hóa đơn bán nông sản xuất vườn |
| **Reports** | `GET` | `/api/reports/financial` | Báo cáo doanh thu, chi phí, lợi nhuận ròng |

*Chi tiết toàn bộ đặc tả Request/Response tham khảo tại:* [`docs/api_reference.md`](docs/api_reference.md).

### Chạy kiểm thử tự động (Automated Testing)
```bash
# Chạy Unit Test Backend
cd backend
npm run test

# Chạy Test Coverage
npm run test:cov
```

---

## 🎓 Thông Tin Đồ Án

* **Đề tài:** Ứng dụng Quản lý Nhật ký Canh tác Cây Dài ngày, Vật tư và Chi phí Nông nghiệp cho Nông hộ (**DalatAgri**)
* **Chuyên ngành:** Kỹ thuật Phần mềm / Công nghệ Thông tin
* **Giảng viên hướng dẫn:** **Thầy Thắng La Quốc**
* **Năm thực hiện:** 2026

---

<p align="center">
  <b>© 2026 DalatAgri — Nâng tầm nông nghiệp số Việt Nam</b><br/>
  <i>Made with passion for farmers in Lam Dong & Central Highlands</i>
</p>
