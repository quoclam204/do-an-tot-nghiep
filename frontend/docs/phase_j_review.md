# 📑 Phase J — Code Review & Refactoring

> **Thời gian:** 1 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase H-I (Validation hoàn thành)  
> **Tiếp theo:** Phase K (Offline-First)

---

## 1. Tổng Quan

Phase J là giai đoạn **dừng lại, nhìn lại và cải thiện** toàn bộ codebase trước khi tiến vào giai đoạn Offline-First (phức tạp nhất). Mục đích:

- Phát hiện và loại bỏ code smell, technical debt.
- Đảm bảo code nhất quán, dễ bảo trì.
- Chuẩn bị kiến trúc sẵn sàng cho offline layer.
- Tăng test coverage lên mức chấp nhận được.

---

## 2. Review Checklist — Backend

### 2.1 Kiến trúc & Module Structure

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 1 | Mỗi module có đầy đủ: Controller, Service, Module, DTO | ☐ |
| 2 | Không có business logic trong Controller (chỉ gọi Service) | ☐ |
| 3 | PrismaService được inject đúng (singleton) | ☐ |
| 4 | Không import module chéo vòng (circular dependency) | ☐ |
| 5 | Common guards/decorators/filters trong `src/common/` | ☐ |
| 6 | Environment variables đọc qua ConfigService, không hardcode | ☐ |

### 2.2 Code Quality

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 7 | Không có `any` type (strict TypeScript) | ☐ |
| 8 | Không có `console.log` (thay bằng Logger) | ☐ |
| 9 | Error handling: try-catch + NestJS exceptions | ☐ |
| 10 | Async/await đúng (không có unhandled promise) | ☐ |
| 11 | Không duplicate code (DRY principle) | ☐ |
| 12 | Naming convention: camelCase (TS), snake_case (DB) | ☐ |
| 13 | File naming: kebab-case (NestJS convention) | ☐ |

### 2.3 Security Review

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 14 | Không trả passwordHash qua API | ☐ |
| 15 | JWT Guard trên tất cả protected endpoints | ☐ |
| 16 | Role Guard đúng trên admin-only endpoints | ☐ |
| 17 | Resource ownership check (userId match) | ☐ |
| 18 | Soft delete filter (deletedAt IS NULL) trên tất cả queries | ☐ |
| 19 | Rate limiting trên auth endpoints | ☐ |
| 20 | Helmet middleware enabled | ☐ |

### 2.4 Database & Prisma

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 21 | Migrations up-to-date | ☐ |
| 22 | Indexes trên foreign keys & frequently queried fields | ☐ |
| 23 | Transactions cho operations phức tạp | ☐ |
| 24 | Seed script hoạt động | ☐ |
| 25 | Schema comments/documentation | ☐ |

---

## 3. Review Checklist — Frontend

### 3.1 Component Architecture

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 1 | Components nhỏ, tái sử dụng (< 200 dòng) | ☐ |
| 2 | Tách logic ra custom hooks | ☐ |
| 3 | Không có business logic trong JSX render | ☐ |
| 4 | Props validation (PropTypes hoặc default values) | ☐ |
| 5 | Consistent file structure: Component.jsx + Component.css | ☐ |

### 3.2 State Management

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 6 | Không prop drilling > 2 levels (dùng Context) | ☐ |
| 7 | Context không quá lớn (split nếu cần) | ☐ |
| 8 | Loading/Error/Empty states cho mọi async component | ☐ |
| 9 | Optimistic updates cho UX tốt hơn | ☐ |

### 3.3 API Layer

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 10 | Axios instance tập trung (base URL, interceptors) | ☐ |
| 11 | Auto-refresh JWT khi 401 | ☐ |
| 12 | Error handling tập trung (interceptor) | ☐ |
| 13 | API service tách riêng theo domain (authApi, farmApi, ...) | ☐ |

### 3.4 UX/UI

| # | Hạng mục | Kiểm tra |
|---|---------|----------|
| 14 | Consistent styling (CSS variables / design tokens) | ☐ |
| 15 | Responsive layout (mobile-first) | ☐ |
| 16 | Loading spinners/skeletons | ☐ |
| 17 | Toast notifications cho success/error | ☐ |
| 18 | Confirm dialogs trước khi delete | ☐ |
| 19 | Empty states (không có data → CTA tạo mới) | ☐ |
| 20 | 404 page / Error boundary | ☐ |

---

## 4. Refactoring Tasks

### 4.1 Backend Refactoring

| Priority | Task | Mô tả |
|----------|------|-------|
| 🔴 High | Tách common guards | Di chuyển JwtAuthGuard, RolesGuard → `src/common/guards/` |
| 🔴 High | Global exception filter | Custom filter cho consistent error format |
| 🟡 Medium | Logger service | Thay console.log bằng NestJS Logger |
| 🟡 Medium | Pagination helper | Reusable pagination logic |
| 🟡 Medium | Response interceptor | Wrap response với consistent format |
| 🟢 Low | API versioning | Prefix `/api/v1/` |
| 🟢 Low | Swagger documentation | `@nestjs/swagger` decorators |

### 4.2 Frontend Refactoring

| Priority | Task | Mô tả |
|----------|------|-------|
| 🔴 High | Tách App.jsx | Quá lớn → split routes, layout |
| 🔴 High | API service layer | Tách thành authService, farmService, ... |
| 🟡 Medium | Custom hooks | useAuth, useFarms, useActivityLogs |
| 🟡 Medium | Error boundary | Catch React errors gracefully |
| 🟡 Medium | Design tokens | CSS variables cho colors, spacing, fonts |
| 🟢 Low | Code splitting | React.lazy + Suspense cho pages |
| 🟢 Low | Storybook | Component documentation (tùy chọn) |

---

## 5. Test Coverage Targets

| Module | Hiện tại | Mục tiêu Phase J |
|--------|---------|-------------------|
| AuthService | ~30% | ≥ 70% |
| FarmsService | ~20% | ≥ 60% |
| CatalogService | ~10% | ≥ 60% |
| CropCycleService | 0% | ≥ 50% |
| ActivityLogService | 0% | ≥ 50% |
| InventoryService | 0% | ≥ 50% |
| **Tổng Backend** | **~15%** | **≥ 55%** |

### Chạy coverage:
```bash
cd backend
npm run test:cov
```

---

## 6. Linting & Formatting

### 6.1 Backend
```bash
# Fix tất cả linting errors
npm run lint

# Format code
npm run format
```

### 6.2 Frontend
```bash
# Chạy oxlint
npm run lint
```

### 6.3 Targets
- **0 ESLint errors** (warnings cho phép nhưng nên giảm)
- **0 TypeScript errors** (`tsc --noEmit` pass)
- **Consistent formatting** (Prettier)

---

## 7. Sản Phẩm Đầu Ra Phase J

| # | Sản phẩm | Mô tả |
|---|---------|-------|
| 1 | Refactored codebase | Code sạch, modular, consistent |
| 2 | Review report | Markdown ghi lại các issues & fixes |
| 3 | Tăng test coverage | Từ ~15% → ≥55% |
| 4 | 0 lint errors | ESLint + Prettier pass |
| 5 | Updated documentation | Comments, JSDoc nếu cần |

---

## 8. Tiêu Chí Hoàn Thành

- [ ] Backend: tất cả review items ☑️
- [ ] Frontend: tất cả review items ☑️
- [ ] Refactoring tasks (High priority) hoàn thành
- [ ] Test coverage ≥ 55%
- [ ] 0 ESLint errors
- [ ] 0 TypeScript errors
- [ ] App vẫn chạy đúng sau refactoring (regression test)
