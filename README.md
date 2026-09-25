<p align="center">
  <img src="frontend/public/logo.png" alt="DalatAgri Logo" width="140" style="border-radius: 50%;" />
</p>

<h1 align="center">🌿 DalatAgri - Hệ Thống Quản Lý Nông Trại & Nhật Ký Canh Tác Số</h1>

<p align="center">
  <b>Nền tảng số hóa quản lý nông trại, quy trình canh tác nông nghiệp công nghệ cao và tối ưu chuỗi giá trị nông sản Đà Lạt.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📑 Mục Lục
- [Giới thiệu](#-giới-thiệu)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Kiến Trúc & Thiết Kế Cơ Sở Dữ Liệu](#-kiến-trúc--thiết-kế-cơ-sở-dữ-liệu)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Hướng Dẫn Cài Đặt & Chạy Dự Án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
- [Biến Môi Trường (Environment Variables)](#-biến-môi-trường-environment-variables)
- [Quy Chuẩn & Thiết Kế API](#-quy-chuẩn--thiết-kế-api)
- [Lộ Trình Phát Triển (Roadmap)](#-lộ-trình-phát-triển-roadmap)
- [Tác Giả & Bản Quyền](#-tác-giả--bản-quyền)

---

## 📖 Giới Thiệu

Tại các vùng nông nghiệp đặc thù như Đà Lạt và các tỉnh Tây Nguyên, việc quản lý sản xuất nông nghiệp thường gặp phải các rào cản:
- Ghi chép nhật ký canh tác bằng sổ sách thủ công, dễ thất lạc, khó tra cứu.
- Khó kiểm soát định lượng và chi phí vật tư tiêu hao (phân bón, giống, thuốc BVTV).
- Thiếu công cụ đối chiếu chi phí đầu tư với doanh thu thực tế sau mỗi vụ thu hoạch.
- Chưa đáp ứng được yêu cầu minh bạch để truy xuất nguồn gốc nông sản tiêu chuẩn VietGAP/GlobalGAP.

**DalatAgri** ra đời như một giải pháp chuyển đổi số toàn diện cho nông hộ và hợp tác xã: từ khâu phân chia lô đất, lên kế hoạch mùa vụ, ghi nhật ký hoạt động hàng ngày, quản lý kho vật tư đến hạch toán chi phí và doanh thu.

---

## 🌟 Tính Năng Nổi Bật

| Phân hệ | Tính năng chi tiết | Trạng thái |
| :--- | :--- | :---: |
| 🏡 **Quản lý Trang trại & Phân khu** | • Quản lý danh sách nông trại, vị trí địa lý, tổng diện tích.<br>• Phân chia thành nhiều thửa ruộng/lô đất (`Plot`) canh tác độc lập. | ✅ Hoàn thiện |
| 🌾 **Quản lý Mùa vụ & Giống cây** | • Quản lý danh mục cây trồng (`Crop`).<br>• Thiết lập vòng đời vụ mùa (`CropCycle`) với ngày bắt đầu, dự kiến kết thúc, tổng sản lượng. | ✅ Hoàn thiện |
| 📝 **Nhật ký Canh tác Số** | • Ghi chép chi tiết hoạt động: *Làm đất, tưới nước, bón phân, phun thuốc, thu hoạch...*<br>• Ghi nhận chi phí công lao động & chi phí thuê máy móc trực tiếp. | ✅ Hoàn thiện |
| 📦 **Kho & Vật tư Nông nghiệp** | • Quản lý danh mục vật tư (`Material`) với đơn giá niêm yết.<br>• Quản lý tồn kho theo nông trại (`Inventory`).<br>• Trừ hao vật tư tự động theo từng nhật ký hoạt động (`ActivityMaterial`). | ✅ Hoàn thiện |
| 💰 **Sản lượng & Hạch toán** | • Ghi nhận khối lượng nông sản thu hoạch và doanh thu tương ứng.<br>• Đánh giá hiệu quả kinh tế của từng mùa vụ. | ✅ Hoàn thiện |
| 🔄 **Đồng bộ Ngoại tuyến (Offline-ready)** | • Cơ chế gắn cờ trạng thái (`PENDING`, `SYNCED`, `CONFLICT`) hỗ trợ làm việc ngay cả khi mất sóng Internet tại nông trại. | 🔄 Sẵn sàng kiến trúc |
| 🔐 **Tài khoản & Bảo mật** | • Xác thực bảo mật với JWT và tích hợp Google OAuth 2.0.<br>• Hỗ trợ cơ chế Soft Delete (`deletedAt`) an toàn dữ liệu. | ✅ Hoàn thiện |

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) (Tốc độ biên dịch và HMR cực nhanh).
- **Ngôn ngữ**: JavaScript (ESNext).
- **Linter & Code Quality**: [Oxlint](https://oxc-project.github.io/).

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) (Kiến trúc Module hóa, Dependency Injection chuẩn doanh nghiệp).
- **Ngôn ngữ**: [TypeScript 5](https://www.typescriptlang.org/).
- **ORM**: [Prisma ORM 5](https://www.prisma.io/) (Type-safe query builder & auto migration).
- **Bảo mật**: JWT (JSON Web Token), Google Auth API, CORS configured.

### Cơ sở dữ liệu & Hạ tầng
- **Database**: [PostgreSQL 15](https://www.postgresql.org/) (Container hóa qua Docker).
- **DevOps**: Docker & Docker Compose.

---

## 📐 Kiến Trúc & Thiết Kế Cơ Sở Dữ Liệu

### 1. Luồng Hoạt Động (System Architecture)

```mermaid
flowchart LR
    A[Client Web / Mobile\nReact 19 + Vite] -->|RESTful API / JSON| B[Backend Server\nNestJS 11]
    B -->|Type-safe Query| C[Prisma ORM 5]
    C -->|Port 5433| D[(PostgreSQL 15 DB\nDocker Container)]
```

### 2. Mô Hình Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    User ||--o{ Farm : "sở hữu"
    Farm ||--o{ Plot : "gồm các lô đất"
    Farm ||--o{ Inventory : "quản lý kho"
    Plot ||--o{ CropCycle : "diễn ra các vụ mùa"
    Crop ||--o{ CropCycle : "áp dụng giống cây"
    CropCycle ||--o{ ActivityLog : "ghi chép nhật ký"
    Material ||--o{ Inventory : "tồn trữ trong kho"
    Material ||--o{ ActivityMaterial : "sử dụng vật tư"
    ActivityLog ||--o{ ActivityMaterial : "tiêu hao chi tiết"

    User {
        uuid id PK
        string email
        string fullName
        string role
    }

    Farm {
        uuid id PK
        uuid userId FK
        string name
        string location
        float totalArea
    }

    Plot {
        uuid id PK
        uuid farmId FK
        string name
        float area
    }

    Crop {
        uuid id PK
        string name
        string type
    }

    CropCycle {
        uuid id PK
        uuid plotId FK
        uuid cropId FK
        string name
        datetime startDate
        string status
        float totalYield
    }

    ActivityLog {
        uuid id PK
        uuid cropCycleId FK
        string activityType
        datetime activityDate
        string syncStatus
        float cost
        float harvestQuantity
        float revenue
    }
```

---

## 📂 Cấu Trúc Thư Mục

```text
DalatAgri/
├── backend/                  # Mã nguồn NestJS REST API
│   ├── prisma/
│   │   └── schema.prisma     # Thiết kế Database Schema với Prisma
│   ├── src/
│   │   ├── prisma/           # Prisma Service & Module kết nối DB
│   │   ├── users/            # Quản lý tài khoản & phân quyền người dùng
│   │   ├── app.module.ts     # Root Application Module
│   │   └── main.ts           # Entrypoint khởi tạo máy chủ NestJS
│   ├── .env.example          # Mẫu cấu hình môi trường backend
│   └── package.json
│
├── frontend/                 # Giao diện người dùng Web App (React 19)
│   ├── public/               # Tài nguyên tĩnh, favicon, logo ứng dụng
│   ├── src/
│   │   ├── assets/           # Hình ảnh, icons
│   │   ├── components/       # Các component dùng chung (Header, Footer, v.v.)
│   │   ├── App.jsx           # Root UI Component
│   │   └── main.jsx          # Entrypoint React
│   ├── .env.example          # Mẫu cấu hình môi trường frontend
│   └── package.json
│
├── docker-compose.yml        # Định nghĩa dịch vụ PostgreSQL 15 Container
└── README.md                 # Tài liệu hướng dẫn toàn diện dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Tiên Quyết
- [Node.js](https://nodejs.org/) (phiên bản `>= 18.x`, khuyến nghị LTS).
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) đã được cài đặt và đang chạy.

---

### Bước 1: Khởi động Cơ sở Dữ liệu (PostgreSQL)

Tại thư mục gốc dự án:
```bash
docker compose up -d
```
> Kiểm tra container `dalat_agri_postgres` đã chạy thành công trên cổng `5433` (được ánh xạ từ `5432` của Postgres bên trong container).

---

### Bước 2: Thiết lập & Khởi chạy Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` từ file mẫu:
   ```bash
   cp .env.example .env
   ```
4. Đồng bộ Schema và tạo cơ sở dữ liệu qua Prisma:
   ```bash
   npx prisma db push
   # Hoặc sinh Prisma Client nếu cần:
   npx prisma generate
   ```
5. Khởi chạy Backend ở chế độ phát triển:
   ```bash
   npm run start:dev
   ```
   *Máy chủ API sẽ hoạt động tại:* `http://localhost:3000`

---

### Bước 3: Thiết lập & Khởi chạy Frontend

1. Mở một terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
4. Khởi chạy giao diện phát triển:
   ```bash
   npm run dev
   ```
   *Truy cập ứng dụng tại:* `http://localhost:5173`

---

## ⚙️ Biến Môi Trường (Environment Variables)

### Backend (`backend/.env`)
| Tên Biến | Ý Nghĩa / Giá Trị Mặc Định |
| :--- | :--- |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL (vd: `postgresql://postgres:password123@localhost:5433/dalat_agri?schema=public`) |
| `JWT_SECRET` | Khóa bí mật dùng để mã hóa và ký Token xác thực |
| `GOOGLE_CLIENT_ID` | Client ID ứng dụng Google Cloud phục vụ tính năng đăng nhập Google |
| `PORT` | Cổng dịch vụ Backend lắng nghe (mặc định: `3000`) |

### Frontend (`frontend/.env`)
| Tên Biến | Ý Nghĩa / Giá Trị Mặc Định |
| :--- | :--- |
| `VITE_API_URL` | URL kết nối tới máy chủ Backend API (`http://localhost:3000`) |
| `VITE_GOOGLE_CLIENT_ID` | Google Client ID phục vụ SDK OAuth đăng nhập |

---

## 📡 Quy Chuẩn & Thiết Kế API

Tất cả API tuân theo chuẩn **RESTful JSON**, hỗ trợ CORS:

| Phương thức | Endpoint | Mô tả |
| :---: | :--- | :--- |
| `GET` | `/users` | Lấy danh sách người dùng hệ thống |
| `POST` | `/users` | Khởi tạo người dùng / đăng ký tài khoản |
| `GET` | `/farms` | Lấy danh sách nông trại của người dùng *(Đang mở rộng)* |
| `GET` | `/crops` | Danh mục cây trồng nông nghiệp *(Đang mở rộng)* |
| `POST` | `/crop-cycles` | Thiết lập một mùa vụ canh tác mới *(Đang mở rộng)* |
| `POST` | `/activity-logs` | Ghi nhật ký canh tác (chăm sóc, bón phân, thu hoạch) *(Đang mở rộng)* |
| `GET` | `/inventories` | Thống kê tồn kho vật tư theo từng nông trại *(Đang mở rộng)* |

---

## 🗺️ Lộ Trình Phát Triển (Roadmap)

- [x] **Giai đoạn 1**: Thiết kế kiến trúc tổng thể, mô hình quan hệ cơ sở dữ liệu (ERD) và Prisma Schema.
- [x] **Giai đoạn 2**: Khởi tạo cấu trúc dự án chuẩn Monorepo (NestJS Backend + React Vite Frontend + Docker DB).
- [ ] **Giai đoạn 3**: Hoàn thiện bộ RESTful API nghiệp vụ cho Farm, Plot, CropCycle, ActivityLog, Inventory.
- [ ] **Giai đoạn 4**: Xây dựng UI/UX Dashboard trực quan: biểu đồ sản lượng, phân tích chi phí và tiến độ mùa vụ.
- [ ] **Giai đoạn 5**: Tích hợp PWA (Progressive Web App) hỗ trợ bà con nông dân ghi nhật ký ngay cả khi không có kết nối mạng tại ruộng.
- [ ] **Giai đoạn 6**: Module tạo mã QR phục vụ người tiêu dùng truy xuất nguồn gốc nông sản an toàn.

---

## 👥 Tác Giả & Bản Quyền

- **Đơn vị phát triển**: Đồ án tốt nghiệp / Dự án Quản lý Nông nghiệp DalatAgri.
- **Giấy phép**: Phát hành theo chuẩn mã nguồn mở phục vụ mục đích học tập & nghiên cứu.

<p align="center">
  Được phát triển với niềm đam mê dành cho nền nông nghiệp Đà Lạt hiện đại 🌿🌾
</p>
