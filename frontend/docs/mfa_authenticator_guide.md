# 🔐 Hướng Dẫn Tích Hợp MFA — Google Authenticator (TOTP)

> **Phiên bản:** 1.0  
> **Cập nhật:** 03/09/2026  
> **Áp dụng:** DalatAgri — Tùy chọn nâng cao (Phase 4 Auth)

---

## 1. Tổng Quan

**Multi-Factor Authentication (MFA)** bổ sung thêm một lớp bảo mật cho tài khoản bằng cách yêu cầu mã OTP từ ứng dụng Authenticator (Google Authenticator, Authy, Microsoft Authenticator) khi đăng nhập.

### Tại sao cần MFA?
- Bảo vệ tài khoản khi mật khẩu bị lộ.
- Tuân thủ OWASP A07:2021 (Identification and Authentication Failures).
- Tăng độ tin cậy cho ứng dụng quản lý dữ liệu nông nghiệp.

### Chuẩn sử dụng
- **TOTP** (Time-based One-Time Password) — RFC 6238
- Mã 6 chữ số, thay đổi mỗi 30 giây.

---

## 2. Công Nghệ

| Thành phần | Package | Version |
|-----------|---------|---------|
| TOTP generation & verification | `otpauth` | ^9.x |
| QR Code generation | `qrcode` | ^1.x |
| Frontend QR display | HTML `<img>` hoặc `react-qr-code` | — |

### Cài đặt (Backend)
```bash
cd backend
npm install otpauth qrcode
npm install -D @types/qrcode
```

---

## 3. Database Schema

Bổ sung vào model `User` (Prisma):
```prisma
model User {
  // ... existing fields ...
  
  // MFA
  mfaEnabled     Boolean   @default(false)
  mfaSecret      String?              // TOTP secret (encrypted)
  mfaBackupCodes String[]  @default([]) // Backup codes (hashed)
}
```

---

## 4. API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/auth/mfa/setup` | Bắt đầu thiết lập MFA → trả QR code | ✅ |
| `POST` | `/auth/mfa/verify-setup` | Xác nhận MFA bằng mã OTP | ✅ |
| `POST` | `/auth/mfa/disable` | Tắt MFA (cần mật khẩu + OTP) | ✅ |
| `POST` | `/auth/mfa/verify` | Xác thực OTP khi đăng nhập | Partial ✅ |
| `POST` | `/auth/mfa/backup-verify` | Xác thực bằng backup code | Partial ✅ |

### 4.1 Setup MFA — Luồng

```
1. User vào Settings → Bật MFA
2. POST /auth/mfa/setup
   → Server tạo TOTP secret
   → Trả: { qrCodeUrl, secret, backupCodes }
3. User quét QR bằng Google Authenticator
4. User nhập mã 6 chữ số từ app
5. POST /auth/mfa/verify-setup { token: "123456" }
   → Server verify → Nếu đúng → mfaEnabled = true
   → Trả: { backupCodes: [...] }
6. User LƯU backup codes (hiển thị 1 lần duy nhất)
```

### 4.2 Login with MFA — Luồng

```
1. POST /auth/login { email, password }
   → Server kiểm tra credentials
   → Nếu mfaEnabled = true:
      Trả: { requiresMfa: true, tempToken: "..." }
   → Nếu mfaEnabled = false:
      Trả: { access_token, refresh_token } (bình thường)

2. POST /auth/mfa/verify { tempToken: "...", token: "123456" }
   → Server verify TOTP
   → Nếu đúng: Trả { access_token, refresh_token }
   → Nếu sai: 401 Unauthorized

3. Nếu mất điện thoại:
   POST /auth/mfa/backup-verify { tempToken: "...", backupCode: "ABCD-EFGH" }
   → Sử dụng 1 backup code (xóa sau khi dùng)
```

---

## 5. Backend Implementation

### 5.1 MFA Service
```typescript
// src/auth/mfa.service.ts
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class MfaService {
  
  generateSecret(email: string) {
    const totp = new OTPAuth.TOTP({
      issuer: 'DalatAgri',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    return {
      secret: totp.secret.base32,
      uri: totp.toString(), // otpauth://totp/DalatAgri:email?...
    };
  }

  async generateQRCode(uri: string): Promise<string> {
    return QRCode.toDataURL(uri);
  }

  verifyToken(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token, window: 1 }); // ±1 period tolerance
    return delta !== null;
  }

  generateBackupCodes(count: number = 8): string[] {
    return Array.from({ length: count }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase().match(/.{4}/g)!.join('-')
    ); // VD: "A1B2-C3D4"
  }

  hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}
```

---

## 6. Frontend — MFA Setup UI

### 6.1 MFA Setup Page
```
┌─────────────────────────────────────┐
│  🔐 Thiết lập xác thực 2 bước      │
├─────────────────────────────────────┤
│                                     │
│  Bước 1: Tải ứng dụng              │
│  📱 Google Authenticator            │
│                                     │
│  Bước 2: Quét mã QR                │
│  ┌───────────────┐                  │
│  │  ██ ▄ █ ▄ ██  │                  │
│  │  █ ▄██ ▄█ █   │                  │
│  │  ██ ▄ █ ▄ ██  │ ← QR Code       │
│  │  █ ▄██ ▄█ █   │                  │
│  │  ██ ▄ █ ▄ ██  │                  │
│  └───────────────┘                  │
│  Hoặc nhập thủ công: JBSWY3DPEHPK  │
│                                     │
│  Bước 3: Nhập mã xác thực          │
│  ┌────────────────────────────┐     │
│  │  _ _ _ _ _ _               │     │
│  └────────────────────────────┘     │
│  [        Xác nhận         ]        │
│                                     │
│  Bước 4: Lưu mã dự phòng           │
│  ⚠️ Lưu lại các mã này, bạn sẽ     │
│     cần chúng nếu mất điện thoại:   │
│  ┌────────────────────────────┐     │
│  │  A1B2-C3D4  E5F6-G7H8     │     │
│  │  I9J0-K1L2  M3N4-O5P6     │     │
│  │  Q7R8-S9T0  U1V2-W3X4     │     │
│  │  Y5Z6-A7B8  C9D0-E1F2     │     │
│  └────────────────────────────┘     │
│  [   Tôi đã lưu, hoàn tất    ]     │
└─────────────────────────────────────┘
```

### 6.2 MFA Login Step
```
┌─────────────────────────────────┐
│  🔐 Xác thực 2 bước             │
│                                  │
│  Nhập mã 6 chữ số từ ứng dụng   │
│  Google Authenticator:           │
│                                  │
│  ┌──────────────────────┐       │
│  │  _ _ _ _ _ _          │       │
│  └──────────────────────┘       │
│                                  │
│  [      Xác nhận      ]         │
│                                  │
│  Mất điện thoại?                 │
│  → Dùng mã dự phòng             │
└─────────────────────────────────┘
```

---

## 7. Bảo Mật MFA

| Biện pháp | Chi tiết |
|-----------|---------|
| Secret storage | Mã hóa secret trước khi lưu DB |
| Backup codes | Hash (SHA-256) trước khi lưu |
| Temp token | JWT ngắn hạn (5 phút) cho MFA step |
| Rate limiting | Max 5 lần verify sai → khóa tạm |
| Backup code | Mỗi code dùng 1 lần rồi xóa |

---

## 8. Tiêu Chí Hoàn Thành

- [ ] MFA setup: QR code + manual entry
- [ ] MFA verify: 6-digit TOTP
- [ ] Login flow: 2-step khi MFA enabled
- [ ] Backup codes: 8 mã, dùng 1 lần
- [ ] Disable MFA: cần mật khẩu + OTP
- [ ] Rate limiting: 5 lần sai → lock
- [ ] UI: Setup wizard 4 bước
- [ ] UI: MFA input khi login
