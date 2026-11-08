# 📋 Hướng Dẫn Cài Đặt & Chạy Dự Án DalatAgri

> **Phiên bản:** 1.0  
> **Cập nhật:** 03/09/2026  
> **Tác giả:** Nguyễn Quốc Lâm

---

## 1. Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu | Mục đích |
|---------|---------------------|----------|
| **Node.js** | >= 18.x | Runtime cho Backend & Frontend |
| **npm** | >= 9.x | Quản lý package |
| **Docker** & **Docker Compose** | >= 24.x | Chạy PostgreSQL container |
| **Git** | >= 2.40 | Quản lý mã nguồn |
| **Postman** | Mới nhất | Test API |
| **VS Code** (khuyến nghị) | Mới nhất | IDE |

### Extensions VS Code khuyến nghị
- Prisma
- ESLint / Prettier
- REST Client
- Docker
- Thunder Client (thay thế Postman)

---

## 2. Clone Dự Án

```bash
git clone https://github.com/quoclam204/DalatAgri.git
cd DalatAgri
```

---

## 3. Cấu Trúc Thư Mục Tổng Quan

```
DalatAgri/
├── backend/                 # NestJS API Server
│   ├── prisma/              # Schema & Migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── auth/            # Module xác thực (JWT, Guards, Roles)
│   │   ├── catalog/         # Module danh mục (Crop, Material, GrowthCycle)
│   │   ├── farms/           # Module nông hộ (Farm, Plot)
│   │   ├── prisma/          # Prisma Service
│   │   ├── users/           # Module người dùng
│   │   └── main.ts          # Entry point
│   ├── test/                # E2E tests
│   └── package.json
├── frontend/                # React + Vite (PWA)
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Route pages
│   │   ├── context/         # React context (Auth, Theme, ...)
│   │   ├── services/        # API service layer (axios)
│   │   ├── styles/          # CSS
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Entry point
│   └── package.json
├── docs/                    # Tài liệu dự án
├── docker-compose.yml       # PostgreSQL container
└── package.json             # Root scripts
```

---

## 4. Khởi Động Database (PostgreSQL via Docker)

```bash
# Chạy PostgreSQL container
docker-compose up -d

# Kiểm tra container đang chạy
docker ps
```

**Thông tin kết nối mặc định:**

| Thuộc tính | Giá trị |
|-----------|---------|
| Host | `localhost` |
| Port | `5433` |
| Database | `dalat_agri` |
| User | `postgres` |
| Password | `password123` |

---

## 5. Cài Đặt & Chạy Backend

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env (copy từ .env.example)
cp .env.example .env
```

### Cấu hình file `.env` (Backend)

```env
# Database
DATABASE_URL="postgresql://postgres:password123@localhost:5433/dalat_agri?schema=public"

# JWT
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

# Email (Forgot Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password

# App
PORT=3000
FRONTEND_URL=http://localhost:5173
```

```bash
# 4. Đẩy schema lên database
npx prisma db push

# 5. Tạo Prisma Client
npx prisma generate

# 6. Chạy dev server
npm run start:dev
```

Backend sẽ chạy tại: **http://localhost:3000**

### Các lệnh hữu ích khác

```bash
# Xem database trực quan bằng Prisma Studio
npx prisma studio

# Chạy unit tests
npm run test

# Chạy tests có coverage
npm run test:cov

# Chạy e2e tests
npm run test:e2e

# Build production
npm run build
```

---

## 6. Cài Đặt & Chạy Frontend

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies
npm install

# 3. Chạy dev server
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

### Các lệnh hữu ích khác

```bash
# Build production
npm run build

# Preview bản build
npm run preview

# Chạy linter
npm run lint
```

---

## 7. Chạy Đồng Thời Cả 2 (từ Root)

```bash
# Từ thư mục gốc DalatAgri/
npm run dev          # Chạy Frontend
npm run dev:backend  # Chạy Backend (mở terminal khác)
```

---

## 8. Quy Trình Phát Triển (Development Workflow)

```
1. Tạo branch mới cho feature/fix
   git checkout -b feature/ten-feature

2. Code & Test locally

3. Commit với message rõ ràng
   git commit -m "feat(module): mô tả ngắn"

4. Push & tạo Pull Request
   git push origin feature/ten-feature

5. Review → Merge → Deploy
```

### Quy ước Commit Message

| Prefix | Ý nghĩa |
|--------|---------|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa lỗi |
| `docs` | Thay đổi tài liệu |
| `refactor` | Tái cấu trúc code |
| `test` | Thêm / sửa tests |
| `chore` | Công việc bảo trì (config, deps) |

---

## 9. Triển Khai (Deployment)

| Thành phần | Nền tảng | Ghi chú |
|-----------|---------|---------|
| **Backend** | Render.com | Web Service, auto-deploy từ GitHub |
| **Frontend** | Vercel | Auto-deploy từ GitHub |
| **Database** | Render PostgreSQL hoặc Supabase | Managed PostgreSQL |

### Biến môi trường Production

Đảm bảo cấu hình đầy đủ các biến môi trường trên nền tảng hosting:
- `DATABASE_URL` → Connection string PostgreSQL production
- `JWT_SECRET`, `JWT_REFRESH_SECRET` → Secret keys mạnh
- `FRONTEND_URL` → URL frontend production (cho CORS)
- `EMAIL_USER`, `EMAIL_PASS` → Thông tin email gửi reset password

---

## 10. Xử Lý Sự Cố Thường Gặp

### ❌ Lỗi kết nối Database
```
Error: P1001: Can't reach database server at `localhost:5433`
```
**Giải pháp:** Đảm bảo Docker container đang chạy: `docker-compose up -d`

### ❌ Lỗi Prisma Client chưa được generate
```
Error: @prisma/client did not initialize yet
```
**Giải pháp:** Chạy `npx prisma generate`

### ❌ Lỗi CORS khi gọi API từ Frontend
**Giải pháp:** Kiểm tra `FRONTEND_URL` trong `.env` backend khớp với URL frontend đang chạy.

### ❌ Port đã bị chiếm
**Giải pháp:** Đổi port trong file `.env` hoặc kill process đang dùng port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
