# 🛡️ Hướng Dẫn Tích Hợp Cloudflare Turnstile

> **Phiên bản:** 1.0  
> **Cập nhật:** 03/09/2026  
> **Áp dụng:** DalatAgri — Chống bot trên form đăng nhập, đăng ký, quên mật khẩu

---

## 1. Tổng Quan

**Cloudflare Turnstile** là giải pháp CAPTCHA miễn phí, thân thiện với người dùng, thay thế Google reCAPTCHA. Turnstile xác minh người dùng **không cần giải captcha** (invisible hoặc managed mode).

### Tại sao Turnstile?
| So sánh | reCAPTCHA v2 | reCAPTCHA v3 | **Turnstile** |
|---------|-------------|-------------|---------------|
| UX | ❌ Phải click/giải | ✅ Invisible | ✅ Invisible/Managed |
| Privacy | ❌ Tracking Google | ❌ Tracking | ✅ Privacy-first |
| Giá | Free (giới hạn) | Free (giới hạn) | **Free (không giới hạn)** |
| GDPR | ⚠️ Cần consent | ⚠️ | ✅ Compliant |
| OWASP | A07 | A07 | **A07 + A05** |

---

## 2. Đăng Ký Turnstile

### 2.1 Tạo site trên Cloudflare Dashboard
1. Đăng nhập: [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Vào **Turnstile** → **Add Site**
3. Nhập:
   - **Site Name:** DalatAgri
   - **Domain:** `localhost`, `dalat-agri.vercel.app` (thêm cả 2)
   - **Widget Type:** Managed (khuyến nghị)
4. Nhận 2 keys:
   - **Site Key** (public) → dùng ở Frontend
   - **Secret Key** (private) → dùng ở Backend

### 2.2 Lưu keys vào .env

**Frontend (`frontend/.env`):**
```env
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAXXXXXXXXXXXXXXX
```

**Backend (`backend/.env`):**
```env
TURNSTILE_SECRET_KEY=0x4AAAAAAXXXXXXXXXXXXXXX
```

---

## 3. Frontend — Tích Hợp Widget

### 3.1 Cài đặt
```bash
cd frontend
npm install @marsidev/react-turnstile
```

### 3.2 Component TurnstileWidget
```jsx
// src/components/common/TurnstileWidget.jsx
import { Turnstile } from '@marsidev/react-turnstile';

export function TurnstileWidget({ onVerify, onError }) {
  return (
    <Turnstile
      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
      onSuccess={onVerify}
      onError={onError}
      onExpire={() => onVerify(null)}
      options={{
        theme: 'dark',      // 'light' | 'dark' | 'auto'
        size: 'normal',     // 'normal' | 'compact'
        language: 'vi',     // Tiếng Việt
      }}
    />
  );
}
```

### 3.3 Sử dụng trong LoginPage
```jsx
// src/pages/LoginPage.jsx
import { TurnstileWidget } from '../components/common/TurnstileWidget';

function LoginPage() {
  const [turnstileToken, setTurnstileToken] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError('Vui lòng xác minh bạn không phải robot');
      return;
    }

    const response = await authApi.login({
      email,
      password,
      turnstileToken, // Gửi token cho backend
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" ... />
      <input type="password" ... />
      
      {/* Turnstile Widget */}
      <TurnstileWidget
        onVerify={(token) => setTurnstileToken(token)}
        onError={() => setError('Xác minh thất bại, vui lòng thử lại')}
      />
      
      <button type="submit" disabled={!turnstileToken}>
        Đăng nhập
      </button>
    </form>
  );
}
```

### 3.4 Áp dụng cho các form khác
- `RegisterPage.jsx` — Form đăng ký
- `ForgotPasswordPage.jsx` — Form quên mật khẩu

---

## 4. Backend — Xác Minh Token

### 4.1 Turnstile Service
```typescript
// src/auth/turnstile.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnstileService {
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private config: ConfigService) {
    this.secretKey = this.config.get<string>('TURNSTILE_SECRET_KEY');
  }

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    const formData = new URLSearchParams();
    formData.append('secret', this.secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const response = await fetch(this.verifyUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new BadRequestException('Xác minh Turnstile thất bại');
    }

    return true;
  }
}
```

### 4.2 Sử dụng trong AuthService
```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private turnstile: TurnstileService, // Inject
  ) {}

  async login(dto: LoginDto, remoteIp?: string) {
    // 1. Verify Turnstile TRƯỚC khi check credentials
    if (dto.turnstileToken) {
      await this.turnstile.verify(dto.turnstileToken, remoteIp);
    }

    // 2. Tiếp tục logic đăng nhập bình thường...
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // ...
  }
}
```

### 4.3 DTO cập nhật
```typescript
// src/auth/dto/login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  turnstileToken?: string; // Tùy chọn (để backward compatible)
}
```

---

## 5. Testing

### 5.1 Development Testing
Cloudflare cung cấp test keys cho dev:

| Key | Giá trị | Kết quả |
|-----|---------|---------|
| Site Key (luôn pass) | `1x00000000000000000000AA` | Always pass |
| Site Key (luôn fail) | `2x00000000000000000000AB` | Always fail |
| Secret Key (luôn pass) | `1x0000000000000000000000000000000AA` | Always pass |

### 5.2 Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Login với turnstileToken hợp lệ | Verify pass → Login OK |
| 2 | Login không có turnstileToken | Bỏ qua verify (backward compatible) |
| 3 | Login với turnstileToken không hợp lệ | 400 Bad Request |
| 4 | Register với Turnstile | Verify pass → Register OK |
| 5 | Widget hiển thị trên form | Render không lỗi |

---

## 6. Lưu Ý Quan Trọng

| Lưu ý | Chi tiết |
|-------|---------|
| **Token dùng 1 lần** | Mỗi Turnstile token chỉ verify 1 lần trên server |
| **Token hết hạn** | Sau 300 giây (5 phút) → yêu cầu user verify lại |
| **Offline mode** | Turnstile KHÔNG hoạt động offline → Bỏ qua khi offline |
| **Rate limit** | Cloudflare tự rate limit → Không cần thêm |
| **Test mode** | Dùng test keys trong development/CI |

---

## 7. Tiêu Chí Hoàn Thành

- [ ] Turnstile widget hiển thị trên Login, Register, Forgot Password
- [ ] Backend verify token thành công
- [ ] Login bị block nếu Turnstile fail
- [ ] Development mode dùng test keys
- [ ] Offline mode: bỏ qua Turnstile
- [ ] Widget theme phù hợp (dark mode)
- [ ] Unit tests ≥ 5 cases PASS
