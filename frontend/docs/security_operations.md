# 🔐 Bảo Mật & Vận Hành — DalatAgri

> **Phiên bản:** 1.0  
> **Cập nhật:** 03/09/2026  
> **Tiêu chuẩn tham chiếu:** OWASP Top 10 (2021), OWASP ASVS 4.0

---

## 1. Tổng Quan Bảo Mật

DalatAgri áp dụng mô hình **Defense in Depth** (phòng thủ theo tầng), bao gồm:

```
┌─────────────────────────────────────────────────────┐
│              Tầng 1: Network Security                │
│  HTTPS (TLS 1.2+), CORS, Rate Limiting, Firewall    │
├─────────────────────────────────────────────────────┤
│              Tầng 2: Authentication                  │
│  JWT (Access + Refresh), bcrypt, Account Lockout     │
├─────────────────────────────────────────────────────┤
│              Tầng 3: Authorization                   │
│  RBAC (Owner/Admin/Worker), Resource Ownership       │
├─────────────────────────────────────────────────────┤
│              Tầng 4: Input Validation                │
│  class-validator DTOs, Prisma parameterized queries  │
├─────────────────────────────────────────────────────┤
│              Tầng 5: Data Protection                 │
│  Soft delete, Audit trail, Encryption at rest        │
├─────────────────────────────────────────────────────┤
│              Tầng 6: Monitoring & Logging            │
│  Request logging, Error tracking, Security alerts    │
└─────────────────────────────────────────────────────┘
```

---

## 2. OWASP Top 10 — Giải Pháp Chi Tiết

### A01:2021 — Broken Access Control (Kiểm soát truy cập)

**Rủi ro:** User truy cập dữ liệu không phải của mình, leo quyền.

**Giải pháp đã triển khai:**

| Biện pháp | Chi tiết | File |
|-----------|---------|------|
| JWT Guards | Tất cả API yêu cầu Bearer token | `jwt-auth.guard.ts` |
| RBAC | Decorator `@Roles()` + `RolesGuard` | `roles.guard.ts`, `roles.decorator.ts` |
| Resource Ownership | Kiểm tra `userId` trước khi trả data | `farms.service.ts` |
| Soft Delete | Không xóa vĩnh viễn, đánh dấu `deletedAt` | Prisma Schema |

**Code mẫu — Resource Ownership Check:**
```typescript
// farms.service.ts
async findOne(id: string, userId: string) {
  const farm = await this.prisma.farm.findUnique({ where: { id } });
  if (!farm || farm.userId !== userId) {
    throw new ForbiddenException('Không có quyền truy cập');
  }
  return farm;
}
```

### A02:2021 — Cryptographic Failures (Lỗi mã hóa)

**Rủi ro:** Mật khẩu lưu plaintext, token yếu, thiếu HTTPS.

**Giải pháp:**

| Biện pháp | Chi tiết |
|-----------|---------|
| Password Hashing | bcrypt với cost factor = 10 (salt tự động) |
| JWT Signing | HS256 algorithm, secret key ≥ 32 characters |
| HTTPS | Bắt buộc trên production (Render auto-SSL) |
| Sensitive data | Không trả `passwordHash` qua API |
| Environment variables | Secrets lưu trong `.env`, không commit |

**Code mẫu — Password Hashing:**
```typescript
// auth.service.ts
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
```

### A03:2021 — Injection (Tấn công chèn mã)

**Rủi ro:** SQL Injection, NoSQL Injection, XSS.

**Giải pháp:**

| Biện pháp | Chi tiết |
|-----------|---------|
| Prisma ORM | Tự động parameterized queries (chống SQL Injection) |
| class-validator | Validate tất cả input qua DTO |
| React JSX | Tự động escape HTML (chống XSS mặc định) |
| Sanitization | Loại bỏ HTML tags trong user input nếu cần |

**Code mẫu — DTO Validation:**
```typescript
// dto/create-farm.dto.ts
import { IsNotEmpty, IsNumber, IsPositive, MaxLength } from 'class-validator';

export class CreateFarmDto {
  @IsNotEmpty({ message: 'Tên nông hộ không được để trống' })
  @MaxLength(200)
  name: string;

  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @IsNumber()
  @IsPositive({ message: 'Diện tích phải là số dương' })
  totalArea: number;
}
```

### A04:2021 — Insecure Design (Thiết kế không an toàn)

**Giải pháp:**

| Biện pháp | Chi tiết |
|-----------|---------|
| Threat Modeling | Đã xác định các threat cho từng module |
| Principle of Least Privilege | Mỗi role chỉ có quyền tối thiểu cần thiết |
| Separation of Concerns | Module hóa: Auth, Farms, Catalog, ActivityLog riêng biệt |
| Secure Defaults | `isActive: true`, `emailVerified: false`, `failedLoginAttempts: 0` |

### A05:2021 — Security Misconfiguration (Cấu hình sai)

**Giải pháp:**

| Biện pháp | Chi tiết | Trạng thái |
|-----------|---------|-----------|
| Helmet | HTTP security headers | ⏳ Cần thêm |
| CORS | Chỉ cho phép `FRONTEND_URL` | 🔄 Cơ bản |
| Error Handling | Không leak stack trace lên production | ✅ |
| `.env` management | `.env.example` (template), `.gitignore` (exclude `.env`) | ✅ |
| Docker | Non-root user trong container | ✅ Alpine image |

**Cần triển khai — Helmet:**
```typescript
// main.ts
import helmet from 'helmet';
app.use(helmet());
```

**Cần triển khai — CORS strict:**
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400,
});
```

### A06:2021 — Vulnerable Components (Thành phần có lỗ hổng)

**Giải pháp:**

| Biện pháp | Chi tiết |
|-----------|---------|
| `npm audit` | Chạy định kỳ để phát hiện vulnerabilities |
| Dependabot | GitHub tự động cảnh báo dependencies có CVE |
| Lock files | `package-lock.json` đảm bảo version consistency |
| Minimal dependencies | Chỉ cài package thực sự cần thiết |

### A07:2021 — Authentication Failures (Lỗi xác thực)

**Giải pháp đã triển khai:**

| Biện pháp | Chi tiết |
|-----------|---------|
| Account Lockout | Khóa sau 5 lần đăng nhập sai (`failedLoginAttempts`) |
| Token Rotation | Refresh token mới sau mỗi lần refresh |
| Token Revocation | Logout → revoke refresh token trong DB |
| Short-lived Access Token | JWT expires trong 15 phút |
| Password Reset | Token 1 lần, có thời hạn (`resetPasswordExpires`) |
| Device tracking | `RefreshToken.deviceInfo` (PWA/Mobile) |

**Code mẫu — Account Lockout:**
```typescript
// auth.service.ts
if (user.failedLoginAttempts >= 5) {
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // Khóa 30 phút
    },
  });
  throw new ForbiddenException('Tài khoản bị khóa tạm thời');
}
```

### A08:2021 — Software & Data Integrity Failures

**Giải pháp:**

| Biện pháp | Chi tiết |
|-----------|---------|
| JWT Signature | Verify token integrity trước khi trust |
| Prisma Migrations | Version-controlled database changes |
| Git protected branches | `main` branch yêu cầu PR review |

### A09:2021 — Security Logging & Monitoring

**Giải pháp (cần triển khai):**

| Biện pháp | Chi tiết | Trạng thái |
|-----------|---------|-----------|
| Login attempts logging | Ghi log mọi lần đăng nhập (thành công/thất bại) | ⏳ |
| Critical action logging | Ghi log: xóa data, đổi role, reset password | ⏳ |
| Request logging | Morgan / Winston middleware | ⏳ |
| Error tracking | Sentry / custom error handler | ⏳ |

### A10:2021 — Server-Side Request Forgery (SSRF)

**Rủi ro thấp** — DalatAgri không có tính năng fetch URL từ user input.

---

## 3. Quản Lý Secrets & Environment

### 3.1 Biến môi trường

```
# ===== KHÔNG BAO GIỜ commit những giá trị thật vào Git =====

# Database
DATABASE_URL=              # Connection string PostgreSQL

# JWT Secrets (≥ 32 ký tự, random)
JWT_SECRET=                # Signing key cho Access Token
JWT_EXPIRES_IN=15m         # Thời hạn Access Token
JWT_REFRESH_SECRET=        # Signing key cho Refresh Token  
JWT_REFRESH_EXPIRES_IN=7d  # Thời hạn Refresh Token

# Email (Google App Password)
EMAIL_USER=                # Email address
EMAIL_PASS=                # App-specific password (KHÔNG phải mật khẩu Gmail)

# App Config
PORT=3000
FRONTEND_URL=              # URL frontend (cho CORS)
NODE_ENV=production        # development | production
```

### 3.2 Checklist bảo mật secrets

- [x] `.env` trong `.gitignore`
- [x] `.env.example` có sẵn (giá trị placeholder)
- [ ] JWT_SECRET đủ mạnh (≥ 32 ký tự, random)
- [ ] Đổi mật khẩu PostgreSQL mặc định trên production
- [ ] Sử dụng Google App Password (không phải mật khẩu Gmail)
- [ ] Rotate JWT secrets định kỳ (3-6 tháng)

---

## 4. Vận Hành (Operations)

### 4.1 Kiến Trúc Triển Khai

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│   Vercel     │     │   Render      │     │  Render          │
│   (Frontend) │────►│   (Backend)   │────►│  (PostgreSQL)    │
│              │     │   NestJS      │     │  Managed DB      │
│   React+Vite │     │   Port: 3000  │     │  Auto-backup     │
│   HTTPS      │     │   HTTPS       │     │  SSL             │
└──────────────┘     └───────────────┘     └──────────────────┘
```

### 4.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm run test
      - run: cd backend && npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # Auto-deploy qua Render webhook hoặc Vercel webhook
      - name: Deploy Backend
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### 4.3 Database Management

| Task | Lệnh | Khi nào |
|------|-------|--------|
| Push schema | `npx prisma db push` | Khi thay đổi schema (dev) |
| Create migration | `npx prisma migrate dev --name <name>` | Khi thay đổi schema (production-ready) |
| Deploy migration | `npx prisma migrate deploy` | Deploy lên production |
| Reset database | `npx prisma migrate reset` | **CHỈ trên development** |
| Xem DB | `npx prisma studio` | Debug / kiểm tra data |
| Seed data | `npx prisma db seed` | Tạo dữ liệu mẫu |

### 4.4 Backup & Recovery

| Mục | Chi tiết |
|-----|---------|
| **Database backup** | Render managed DB: auto backup hàng ngày |
| **Code backup** | GitHub repository (main + develop branches) |
| **Recovery plan** | Restore từ Render backup + redeploy từ Git |
| **RTO** | < 30 phút (redeploy + restore DB) |
| **RPO** | < 24 giờ (daily backup) |

### 4.5 Monitoring (Giám sát)

| Mục | Công cụ | Mục đích |
|-----|---------|----------|
| Uptime | Render dashboard | Server có đang chạy? |
| Errors | Render logs / Sentry | Lỗi runtime |
| Performance | Lighthouse | FE performance score |
| Security | `npm audit` | Vulnerabilities trong dependencies |
| Database | Render DB metrics | Connections, storage, CPU |

---

## 5. Quy Trình Xử Lý Sự Cố Bảo Mật

### 5.1 Phát hiện sự cố
1. Monitor cảnh báo lỗi bất thường
2. Kiểm tra logs đăng nhập thất bại liên tục
3. User báo cáo truy cập bất thường

### 5.2 Phản ứng
1. **Đánh giá mức độ nghiêm trọng** (Low / Medium / High / Critical)
2. **Cô lập**: Khóa tài khoản bị ảnh hưởng, revoke tokens
3. **Điều tra**: Kiểm tra logs, xác định phạm vi
4. **Khắc phục**: Patch vulnerability, rotate secrets
5. **Phục hồi**: Restore data nếu cần
6. **Rút kinh nghiệm**: Ghi lại bài học, cập nhật quy trình

### 5.3 Checklist phản ứng nhanh

- [ ] Đã khóa tài khoản bị ảnh hưởng?
- [ ] Đã revoke tất cả refresh tokens?
- [ ] Đã rotate JWT secrets?
- [ ] Đã kiểm tra phạm vi ảnh hưởng?
- [ ] Đã patch lỗ hổng?
- [ ] Đã thông báo user bị ảnh hưởng?
- [ ] Đã ghi lại incident report?

---

## 6. Checklist Bảo Mật Tổng Hợp

### Đã hoàn thành ✅
- [x] Password hashing (bcrypt)
- [x] JWT-based authentication
- [x] Refresh token rotation & revocation
- [x] Role-based access control (RBAC)
- [x] Resource ownership verification
- [x] Soft delete (data integrity)
- [x] Account lockout (brute-force protection)
- [x] Password reset via email (secure token)
- [x] Prisma ORM (SQL injection prevention)
- [x] `.env` secrets management
- [x] CORS configuration

### Cần hoàn thiện ⏳
- [ ] Helmet middleware (HTTP security headers)
- [ ] Rate limiting (express-rate-limit)
- [ ] Request logging (Morgan/Winston)
- [ ] Input sanitization (XSS)
- [ ] CSRF protection (cho form submissions)
- [ ] Security headers audit
- [ ] npm audit (no high/critical vulnerabilities)
- [ ] HTTPS enforcement
- [ ] CI/CD pipeline với automated tests
- [ ] Incident response procedure documented
