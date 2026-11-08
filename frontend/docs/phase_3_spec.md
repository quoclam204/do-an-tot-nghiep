# 📑 Phase 3 — Đặc Tả: Xác Thực (Authentication)

> **Thời gian:** 2 tuần  
> **Trạng thái:** ✅ Hoàn thành (94%)  
> **Phụ thuộc:** Phase 2 (Database)  
> **Tiếp theo:** Phase 4 (RBAC)

---

## 1. Tổng Quan

Phase 3 xây dựng hệ thống xác thực an toàn dựa trên JWT (Access Token + Refresh Token), bao gồm đăng ký, đăng nhập, đăng xuất, làm mới token, quên/đặt lại mật khẩu.

---

## 2. Luồng Xác Thực

### 2.1 Register
```
Client                    Server
  │  POST /auth/register    │
  │  { email, password,     │
  │    fullName, phone }    │
  ├────────────────────────►│
  │                         ├── Validate input (DTO)
  │                         ├── Check email unique
  │                         ├── Hash password (bcrypt, cost=10)
  │                         ├── Create User
  │     201 { user }        │
  │◄────────────────────────┤
```

### 2.2 Login
```
Client                    Server
  │  POST /auth/login       │
  │  { email, password }    │
  ├────────────────────────►│
  │                         ├── Find user by email
  │                         ├── Check account locked?
  │                         ├── Verify password (bcrypt.compare)
  │                         ├── Reset failedLoginAttempts
  │                         ├── Generate Access Token (15m)
  │                         ├── Generate Refresh Token (7d)
  │                         ├── Save RefreshToken to DB
  │   200 { access_token,   │
  │         refresh_token,  │
  │         user }          │
  │◄────────────────────────┤
```

### 2.3 Token Refresh
```
Client                    Server
  │  POST /auth/refresh     │
  │  { refresh_token }      │
  ├────────────────────────►│
  │                         ├── Verify refresh token
  │                         ├── Check not revoked
  │                         ├── Revoke old token
  │                         ├── Generate new Access + Refresh
  │   200 { new tokens }    │
  │◄────────────────────────┤
```

### 2.4 Forgot / Reset Password
```
Client                    Server
  │  POST /auth/forgot-pw   │
  │  { email }              │
  ├────────────────────────►│
  │                         ├── Generate reset token
  │                         ├── Save to User.resetPasswordToken
  │                         ├── Send email with link
  │   200 "Email sent"      │
  │◄────────────────────────┤
  │                         │
  │  POST /auth/reset-pw    │
  │  { token, newPassword } │
  ├────────────────────────►│
  │                         ├── Validate token
  │                         ├── Check not expired
  │                         ├── Hash new password
  │                         ├── Clear reset token
  │   200 "Password updated"│
  │◄────────────────────────┤
```

---

## 3. API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `POST` | `/auth/register` | ❌ | Đăng ký |
| `POST` | `/auth/login` | ❌ | Đăng nhập |
| `POST` | `/auth/refresh` | ❌ | Refresh token |
| `POST` | `/auth/logout` | ✅ | Đăng xuất |
| `POST` | `/auth/forgot-password` | ❌ | Quên mật khẩu |
| `POST` | `/auth/reset-password` | ❌ | Đặt lại mật khẩu |
| `GET` | `/auth/profile` | ✅ | Xem thông tin |

---

## 4. Backend Files

| File | Mô tả | Status |
|------|-------|--------|
| `auth.module.ts` | Module config | ✅ |
| `auth.controller.ts` | Route handlers | ✅ |
| `auth.service.ts` | Business logic | ✅ |
| `jwt.strategy.ts` | Passport JWT strategy | ✅ |
| `jwt-auth.guard.ts` | Auth guard | ✅ |
| `mail.service.ts` | Nodemailer integration | ✅ |
| `dto/register.dto.ts` | Register validation | ✅ |
| `dto/login.dto.ts` | Login validation | ✅ |
| `auth.service.spec.ts` | Unit tests | ⏳ |

---

## 5. Frontend Pages

| Page | File | Status |
|------|------|--------|
| Login | `LoginPage.jsx` | ✅ |
| Register | `RegisterPage.jsx` | ✅ |
| Forgot Password | `ForgotPasswordPage.jsx` | ✅ |
| Reset Password | `ResetPasswordPage.jsx` | ✅ |

---

## 6. Bảo Mật (OWASP)

| Biện pháp | Chi tiết | Status |
|-----------|---------|--------|
| Password hashing | bcrypt (cost=10) | ✅ |
| Short-lived access token | 15 phút | ✅ |
| Refresh token in DB | Revocable | ✅ |
| Token rotation | New refresh on each use | ✅ |
| Password reset token | 1 lần, có thời hạn | ✅ |
| No password in response | Exclude passwordHash | ✅ |

---

## 7. Tiêu Chí Hoàn Thành

- [x] Register: tạo user, hash password
- [x] Login: trả Access + Refresh token
- [x] Refresh: rotate tokens
- [x] Logout: revoke refresh token
- [x] Forgot/Reset password via email
- [x] JWT Strategy + Guard
- [x] FE: 4 auth pages
- [x] FE: AuthContext + ProtectedRoute
- [ ] Unit tests: AuthService (⏳)
