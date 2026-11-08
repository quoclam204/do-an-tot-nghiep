# 📑 Phase 1 — Đặc Tả: Khởi Tạo Dự Án & Kiến Trúc

> **Thời gian:** 1 tuần  
> **Trạng thái:** ✅ Hoàn thành  
> **Tiếp theo:** Phase 2 (Database)

---

## 1. Tổng Quan

Phase 1 thiết lập nền tảng kỹ thuật cho toàn bộ dự án, bao gồm:
- Khởi tạo monorepo với Backend (NestJS) và Frontend (React + Vite).
- Cấu hình Docker Compose cho PostgreSQL.
- Thiết lập công cụ phát triển: ESLint, Prettier, Git.

---

## 2. Sản Phẩm Đầu Ra

| # | Task | Trạng thái |
|---|------|-----------|
| 1 | Khởi tạo NestJS backend project | ✅ |
| 2 | Khởi tạo React + Vite frontend project | ✅ |
| 3 | Root package.json (monorepo scripts) | ✅ |
| 4 | Docker Compose: PostgreSQL 15 Alpine | ✅ |
| 5 | .gitignore (root + backend + frontend) | ✅ |
| 6 | .env.example (backend) | ✅ |
| 7 | ESLint + Prettier (backend) | ✅ |
| 8 | OxLint (frontend) | ✅ |
| 9 | README.md | ✅ |
| 10 | Thư mục docs/ | ✅ |

---

## 3. Công Nghệ Đã Chọn

| Thành phần | Lựa chọn | Phiên bản | Lý do |
|-----------|----------|-----------|-------|
| Backend Framework | NestJS | 11.x | Modular, TypeScript-native, enterprise-ready |
| Frontend Framework | React | 19.x | Component-based, ecosystem lớn |
| Build Tool | Vite | 8.x | Nhanh, HMR, ESM-native |
| Database | PostgreSQL | 15 | ACID, JSON support, mature |
| ORM | Prisma | 5.x | Type-safe, migration, studio |
| Container | Docker Compose | — | Consistent dev environment |
| Package Manager | npm | 9.x | Built-in with Node.js |

---

## 4. Cấu Trúc Đã Tạo

```
DalatAgri/
├── backend/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   ├── test/
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .prettierrc
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── package.json
```

---

## 5. Scripts

**Root (`package.json`):**
```json
{
  "scripts": {
    "dev": "npm --prefix frontend run dev",
    "dev:backend": "npm --prefix backend run start:dev"
  }
}
```

**Backend:**
```json
{
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test": "jest",
    "test:cov": "jest --coverage"
  }
}
```

**Frontend:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint"
  }
}
```

---

## 6. Tiêu Chí Hoàn Thành

- [x] Backend chạy được: `npm run dev:backend` → http://localhost:3000
- [x] Frontend chạy được: `npm run dev` → http://localhost:5173
- [x] PostgreSQL chạy qua Docker: `docker-compose up -d`
- [x] Git repository initialized
- [x] .gitignore loại bỏ node_modules, .env, dist
