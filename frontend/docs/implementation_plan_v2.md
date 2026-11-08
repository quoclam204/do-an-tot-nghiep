# 🗺️ Kế Hoạch Triển Khai Dự Án DalatAgri — V2 (Chi Tiết)

> **Đề tài:** Xây dựng ứng dụng quản lý nhật ký canh tác cây dài ngày, vật tư và chi phí nông nghiệp cho nông hộ  
> **Phiên bản:** 2.0  
> **Cập nhật:** 03/09/2026  
> **Thay đổi so với V1:** Chia nhỏ thành 16 giai đoạn chi tiết, bổ sung Validation, Review, MFA, Turnstile, PWA riêng biệt.

---

## Tổng Quan Dự Án

### Mục tiêu chính
1. **Số hóa nhật ký canh tác** cây dài ngày, vật tư và chi phí cho nông hộ.
2. **Hỗ trợ offline-first** — ghi nhận dữ liệu khi mất mạng, đồng bộ an toàn khi có kết nối.
3. **Cung cấp báo cáo trực quan** — kiểm soát vật tư, chi phí, doanh thu và hiệu quả theo vụ/chu kỳ canh tác.

### Công nghệ sử dụng

| Thành phần | Công nghệ | Chi tiết |
|-----------|----------|---------|
| **Frontend** | React.js 19 + Vite 8 | SPA, PWA-enabled |
| **Backend** | NestJS 11 (Node.js) | REST API, modular architecture |
| **ORM** | Prisma 5 | Type-safe database access |
| **Database** | PostgreSQL 15 | Docker Compose (dev), Render (prod) |
| **Local Storage** | IndexedDB | Offline data persistence (Dexie.js) |
| **Auth** | JWT (Access + Refresh Token) | Passport.js, bcrypt |
| **Bot Protection** | Cloudflare Turnstile | Thay thế reCAPTCHA |
| **MFA** | TOTP (Google Authenticator) | Xác thực 2 lớp |
| **Charts** | Recharts 3 | Biểu đồ báo cáo |
| **Container** | Docker Compose | PostgreSQL dev environment |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Testing** | Jest 30, Supertest 7, Postman | Unit, Integration, E2E |
| **Hosting** | Render (BE) + Vercel (FE) | Cloud deployment |

---

## Kiến Trúc Hệ Thống

```
┌────────────────────────────────────────────────────────────────┐
│                FRONTEND — React 19 + Vite 8 + PWA              │
│  ┌───────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │   Pages   │ │ Components │ │ Context  │ │   Services    │  │
│  │ (Router)  │ │ (Reusable) │ │ (State)  │ │ (API/Offline) │  │
│  └───────────┘ └────────────┘ └──────────┘ └───────┬───────┘  │
│                                                     │          │
│  ┌──────────────────────────────────────────────────┼────────┐ │
│  │              Offline Layer                       │        │ │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┤        │ │
│  │  │ IndexedDB  │  │ Sync Queue │  │ Service      │        │ │
│  │  │ (Dexie.js) │  │ (FIFO Ops) │  │ Worker       │        │ │
│  │  └────────────┘  └────────────┘  └──────────────┘        │ │
│  └──────────────────────────────────────────────────┬────────┘ │
└─────────────────────────────────────────────────────┼──────────┘
                                                      │ HTTPS + JWT
┌─────────────────────────────────────────────────────┼──────────┐
│                BACKEND — NestJS 11                   │          │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌──────────┤          │
│  │ Auth │ │Users │ │ Farms  │ │Catlog│ │ Activity │          │
│  │Module│ │Module│ │ Module │ │Module│ │  Module  │          │
│  └──────┘ └──────┘ └────────┘ └──────┘ └──────────┘          │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐                      │
│  │Invent│ │ Sync │ │Reports │ │Prisma│                      │
│  │Module│ │Module│ │ Module │ │Servic│                      │
│  └──────┘ └──────┘ └────────┘ └──┬───┘                      │
└──────────────────────────────────┼───────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      PostgreSQL 15           │
                    │  Docker (dev) / Render (prod)│
                    └─────────────────────────────┘
```

---

## Tổ Chức Thư Mục Dự Án

```
DalatAgri/
├── docs/                           # 📄 Tài liệu dự án
│   ├── setup_guide.md              #    Hướng dẫn cài đặt & chạy
│   ├── implementation_plan.md      #    Kế hoạch V1 (ban đầu)
│   ├── implementation_plan_v2.md   #    Kế hoạch V2 (chi tiết — file này)
│   ├── implementation_plan_v3.md   #    Kế hoạch V3 (điều chỉnh nếu cần)
│   ├── api_reference.md            #    Tài liệu API
│   ├── security_operations.md      #    Bảo mật & vận hành
│   ├── mfa_authenticator_guide.md  #    Hướng dẫn MFA / Google Authenticator
│   ├── turnstile_guide.md          #    Hướng dẫn tích hợp Cloudflare Turnstile
│   ├── phase_1_spec.md             #    Phase 1: Khởi tạo & Kiến trúc
│   ├── phase_2_spec.md             #    Phase 2: CSDL & Prisma Schema
│   ├── phase_3_spec.md             #    Phase 3: Xác thực (Authentication)
│   ├── phase_4_spec.md             #    Phase 4: Phân quyền & Người dùng
│   ├── phase_5_spec.md             #    Phase 5: Nông hộ & Lô trồng
│   ├── phase_6_spec.md             #    Phase 6: Danh mục (Cây, Vật tư, Chu kỳ)
│   ├── phase_7_spec.md             #    Phase 7: Vụ mùa & Chu kỳ canh tác
│   ├── phase_8_spec.md             #    Phase 8: Nhật ký hoạt động
│   ├── phase_9_spec.md             #    Phase 9: Tồn kho & Vật tư
│   ├── phase_h_i_validation.md     #    Phase H-I: Validation & Data Integrity
│   ├── phase_j_review.md           #    Phase J: Code Review & Refactoring
│   ├── phase_k_spec.md             #    Phase K: Offline-First (IndexedDB)
│   ├── phase_l_spec.md             #    Phase L: PWA & Service Worker
│   ├── phase_m_spec.md             #    Phase M: Đồng bộ dữ liệu (Sync)
│   ├── phase_n_o_spec.md           #    Phase N-O: Báo cáo & Dashboard
│   ├── phase_p_review.md           #    Phase P: Review cuối & Deployment
│   ├── implementation_checklist_v2.md  # Checklist V2 (theo 16 phases)
│   └── implementation_checklist_v3.md  # Checklist V3 (cập nhật cuối)
│
├── backend/                        # ⚙️ NestJS API Server
│   ├── prisma/
│   │   ├── schema.prisma           #    Database schema
│   │   └── migrations/             #    Migration history
│   ├── src/
│   │   ├── auth/                   #    Authentication module
│   │   ├── users/                  #    User management module
│   │   ├── farms/                  #    Farm & Plot module
│   │   ├── catalog/                #    Catalog module (Crop, Material, GrowthCycle)
│   │   ├── crop-cycles/            #    CropCycle module (vụ mùa)
│   │   ├── activity-logs/          #    Activity logging module
│   │   ├── inventory/              #    Inventory module
│   │   ├── sync/                   #    Sync module (offline data)
│   │   ├── reports/                #    Reports & statistics module
│   │   ├── prisma/                 #    Prisma service (shared)
│   │   ├── common/                 #    Shared guards, decorators, filters
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                       #    E2E tests
│   └── package.json
│
├── frontend/                       # 🌐 React + Vite (PWA)
│   ├── public/
│   │   ├── manifest.json           #    PWA manifest
│   │   ├── sw.js                   #    Service Worker
│   │   └── icons/                  #    PWA icons
│   ├── src/
│   │   ├── components/             #    Reusable UI components
│   │   │   ├── common/             #    Button, Modal, Toast, ...
│   │   │   ├── forms/              #    Form components
│   │   │   ├── charts/             #    Chart wrappers (Recharts)
│   │   │   └── layout/             #    Header, Footer, Sidebar
│   │   ├── pages/                  #    Route pages
│   │   ├── context/                #    React contexts (Auth, Sync, Theme)
│   │   ├── hooks/                  #    Custom hooks
│   │   ├── services/               #    API service layer (axios)
│   │   ├── offline/                #    IndexedDB, SyncQueue, SyncManager
│   │   ├── utils/                  #    Helper functions
│   │   ├── styles/                 #    CSS files
│   │   ├── assets/                 #    Images, fonts
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── scripts/                        #  🔧 Utility scripts
│   ├── seed.ts                     #    Database seeding
│   └── generate-icons.sh           #    PWA icon generator
│
├── nginx/                          #  🌐 Nginx config (optional)
│   └── default.conf
│
├── docker-compose.yml              #  🐳 PostgreSQL container
├── .github/
│   └── workflows/
│       └── ci.yml                  #    GitHub Actions CI/CD
└── package.json                    #    Root monorepo scripts
```

---

## Phân Chia Giai Đoạn — 16 Phases

### Timeline Tổng Quan

```
 Tuần   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16
      ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
Ph 1  │███│   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ Setup
Ph 2  │███│   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ Database
Ph 3  │   │███│███│   │   │   │   │   │   │   │   │   │   │   │   │   │ Auth
Ph 4  │   │   │███│   │   │   │   │   │   │   │   │   │   │   │   │   │ RBAC
Ph 5  │   │   │   │███│   │   │   │   │   │   │   │   │   │   │   │   │ Farms
Ph 6  │   │   │   │███│███│   │   │   │   │   │   │   │   │   │   │   │ Catalog
Ph 7  │   │   │   │   │███│   │   │   │   │   │   │   │   │   │   │   │ CropCycle
Ph 8  │   │   │   │   │   │███│███│   │   │   │   │   │   │   │   │   │ ActivityLog
Ph 9  │   │   │   │   │   │   │███│   │   │   │   │   │   │   │   │   │ Inventory
Ph HI │   │   │   │   │   │   │   │███│   │   │   │   │   │   │   │   │ Validation
Ph J  │   │   │   │   │   │   │   │███│   │   │   │   │   │   │   │   │ Review
Ph K  │   │   │   │   │   │   │   │   │███│███│   │   │   │   │   │   │ Offline
Ph L  │   │   │   │   │   │   │   │   │   │███│   │   │   │   │   │   │ PWA
Ph M  │   │   │   │   │   │   │   │   │   │   │███│   │   │   │   │   │ Sync
Ph NO │   │   │   │   │   │   │   │   │   │   │   │███│███│   │   │   │ Reports
Ph P  │   │   │   │   │   │   │   │   │   │   │   │   │   │███│███│███│ Final
      └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
```

### Bảng Tóm Tắt

| Phase | Tên | Thời gian | Loại | File đặc tả |
|-------|-----|-----------|------|-------------|
| **1** | Khởi tạo dự án & Kiến trúc | 1 tuần | 🔧 Setup | `phase_1_spec.md` |
| **2** | Thiết kế CSDL & Prisma Schema | 1 tuần | 🗄️ Database | `phase_2_spec.md` |
| **3** | Xác thực — Authentication | 2 tuần | 🔐 Security | `phase_3_spec.md` |
| **4** | Phân quyền & Quản lý người dùng | 1 tuần | 🔐 Security | `phase_4_spec.md` |
| **5** | Quản lý Nông hộ & Lô trồng | 1 tuần | 🌾 Business | `phase_5_spec.md` |
| **6** | Danh mục: Cây trồng, Vật tư, Chu kỳ | 1.5 tuần | 🌾 Business | `phase_6_spec.md` |
| **7** | Vụ mùa & Chu kỳ canh tác | 1 tuần | 🌾 Business | `phase_7_spec.md` |
| **8** | Nhật ký hoạt động canh tác | 2 tuần | 📝 Core | `phase_8_spec.md` |
| **9** | Tồn kho & Quản lý vật tư | 1 tuần | 📦 Business | `phase_9_spec.md` |
| **H-I** | Validation & Data Integrity | 1 tuần | ✅ Quality | `phase_h_i_validation.md` |
| **J** | Code Review & Refactoring | 1 tuần | 🔍 Review | `phase_j_review.md` |
| **K** | Offline-First (IndexedDB) | 2 tuần | 📴 Offline | `phase_k_spec.md` |
| **L** | PWA & Service Worker | 1 tuần | 📱 PWA | `phase_l_spec.md` |
| **M** | Đồng bộ dữ liệu (Sync) | 1 tuần | 🔄 Sync | `phase_m_spec.md` |
| **N-O** | Báo cáo & Dashboard | 2 tuần | 📊 Reports | `phase_n_o_spec.md` |
| **P** | Review cuối, Testing & Deployment | 3 tuần | 🚀 Final | `phase_p_review.md` |

**Tổng: ~16 tuần (~4 tháng)**

---

## Nguyên Tắc Xuyên Suốt

### 🧪 Test-Driven Development (TDD)
```
1. Viết test trước (RED)
2. Viết code tối thiểu (GREEN)
3. Refactor (REFACTOR)
4. Lặp lại
```

### 🔒 OWASP Top 10
- **A01** – Broken Access Control → RBAC, Resource ownership
- **A02** – Cryptographic Failures → bcrypt, HTTPS, JWT
- **A03** – Injection → Prisma ORM, class-validator, React JSX
- **A04** – Insecure Design → Threat modeling, Least privilege
- **A05** – Security Misconfiguration → Helmet, CORS, env vars
- **A06** – Vulnerable Components → npm audit, Dependabot
- **A07** – Auth Failures → Account lockout, Token rotation, MFA
- **A08** – Data Integrity → JWT signature, Prisma migrations
- **A09** – Security Logging → Request logs, Audit trail
- **A10** – SSRF → Không fetch external URL từ user input

### 📐 Quy Ước Code
- **Commit**: Conventional Commits (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`)
- **Branch**: `feature/phase-X-ten-feature`, `fix/mo-ta-loi`, `docs/ten-tai-lieu`
- **Review**: PR review trước khi merge vào `develop` → `main`
- **Format**: ESLint + Prettier, auto-format on save
