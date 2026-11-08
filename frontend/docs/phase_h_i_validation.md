# 📑 Phase H-I — Validation & Data Integrity

> **Thời gian:** 1 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase 1–9 (tất cả CRUD modules)  
> **Tiếp theo:** Phase J (Code Review)

---

## 1. Tổng Quan

Sau khi hoàn thành các module CRUD chính (Phase 1–9), Phase H-I tập trung vào việc **rà soát và bổ sung validation** ở mọi tầng, đảm bảo dữ liệu luôn chính xác và toàn vẹn.

**Mục tiêu:**
- Mọi input từ user đều được validate ở cả Frontend lẫn Backend.
- Database constraints đủ mạnh để ngăn dữ liệu xấu.
- Error messages rõ ràng, bằng tiếng Việt, giúp user sửa nhanh.

---

## 2. Validation 3 Tầng

```
┌─────────────────────────────────────────┐
│  Tầng 1: Frontend Validation            │
│  React forms, realtime feedback         │
│  → Phản hồi nhanh, UX tốt              │
├─────────────────────────────────────────┤
│  Tầng 2: Backend Validation (DTO)       │
│  class-validator, ValidationPipe        │
│  → An toàn, không tin client            │
├─────────────────────────────────────────┤
│  Tầng 3: Database Constraints           │
│  Prisma Schema, UNIQUE, NOT NULL, FK    │
│  → Tuyến phòng thủ cuối cùng           │
└─────────────────────────────────────────┘
```

---

## 3. Tầng 1: Frontend Validation

### 3.1 Quy tắc chung
- Validate ngay khi user rời khỏi input (`onBlur`) hoặc khi submit.
- Hiển thị lỗi bằng **text đỏ** ngay dưới input.
- Disable nút Submit khi form chưa valid.
- Focus vào input lỗi đầu tiên khi submit fail.

### 3.2 Danh sách validation theo form

#### Register Form
| Field | Rule | Error message (VN) |
|-------|------|---------------------|
| Email | Required, email format | "Vui lòng nhập email hợp lệ" |
| Password | Required, min 8 chars, 1 uppercase, 1 number | "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa và số" |
| Confirm Password | Must match password | "Mật khẩu xác nhận không khớp" |
| Full Name | Required, max 100 | "Họ tên không được để trống" |
| Phone | Optional, VN format | "Số điện thoại không hợp lệ" |

#### Create Farm Form
| Field | Rule | Error message |
|-------|------|---------------|
| Name | Required, max 200 | "Tên nông hộ không được để trống" |
| Location | Required, max 500 | "Địa chỉ không được để trống" |
| Total Area | Required, number > 0 | "Diện tích phải là số dương" |

#### Create ActivityLog Form
| Field | Rule | Error message |
|-------|------|---------------|
| Activity Type | Required, in enum | "Vui lòng chọn loại hoạt động" |
| Activity Date | Required, ≤ today | "Ngày không được ở tương lai" |
| Notes | Optional, max 1000 | "Ghi chú tối đa 1000 ký tự" |
| Cost | Optional, ≥ 0 | "Chi phí không được âm" |
| Material Qty | Required if added, > 0 | "Số lượng phải lớn hơn 0" |
| Harvest Qty | Required if THU_HOACH, > 0 | "Sản lượng phải lớn hơn 0" |
| Revenue | Required if THU_HOACH, ≥ 0 | "Doanh thu không được âm" |

#### Create CropCycle Form
| Field | Rule | Error message |
|-------|------|---------------|
| Plot | Required | "Vui lòng chọn lô trồng" |
| Crop | Required | "Vui lòng chọn cây trồng" |
| Name | Required, max 200 | "Tên vụ mùa không được để trống" |
| Start Date | Required | "Vui lòng chọn ngày bắt đầu" |
| Expected End | Required, > Start Date | "Ngày kết thúc phải sau ngày bắt đầu" |

---

## 4. Tầng 2: Backend Validation (NestJS)

### 4.1 Global ValidationPipe
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // Loại bỏ fields không khai báo trong DTO
  forbidNonWhitelisted: true, // Throw error nếu có field lạ
  transform: true,            // Auto-transform types
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (errors) => {
    // Custom error format tiếng Việt
    const messages = errors.map(error => ({
      field: error.property,
      errors: Object.values(error.constraints || {}),
    }));
    return new BadRequestException({ message: 'Dữ liệu không hợp lệ', details: messages });
  },
}));
```

### 4.2 Custom Validators

```typescript
// validators/is-future-date.validator.ts
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: string) {
    return new Date(date) <= new Date();
  }
  defaultMessage() {
    return 'Ngày không được ở tương lai';
  }
}

// validators/is-after-date.validator.ts
@ValidatorConstraint({ name: 'isAfterDate', async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const startDate = (args.object as any).startDate;
    return new Date(endDate) > new Date(startDate);
  }
  defaultMessage() {
    return 'Ngày kết thúc phải sau ngày bắt đầu';
  }
}
```

### 4.3 Error Response Format
```json
{
  "statusCode": 400,
  "message": "Dữ liệu không hợp lệ",
  "details": [
    {
      "field": "email",
      "errors": ["Vui lòng nhập email hợp lệ"]
    },
    {
      "field": "password",
      "errors": ["Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa và số"]
    }
  ]
}
```

---

## 5. Tầng 3: Database Constraints (Prisma)

### 5.1 Constraints hiện có
| Constraint | Model | Fields |
|-----------|-------|--------|
| `@unique` | User | email, phone |
| `@unique` | RefreshToken | token |
| `@unique` | User | resetPasswordToken |
| `@@unique` | GrowthStage | [growthCycleId, sequence] |
| FK cascade | Tất cả | `@relation(fields: [...])` |
| `@default` | Tất cả | createdAt, updatedAt, uuid |

### 5.2 Constraints cần bổ sung
| Constraint | Model | Mô tả |
|-----------|-------|-------|
| `@@unique` | Inventory | [farmId, materialId] — 1 vật tư/farm |
| Check | ActivityLog | harvestQuantity ≥ 0 |
| Check | Inventory | quantity ≥ -100 (soft limit) |
| Index | ActivityLog | [cropCycleId, activityDate] — query performance |
| Index | Inventory | [farmId] — filter by farm |

---

## 6. Data Integrity Rules

### 6.1 Referential Integrity
- **Không xóa Crop** đang có CropCycle active → Block hoặc Warning.
- **Không xóa Material** đang có Inventory hoặc ActivityMaterial → Block.
- **Không xóa Farm** đang có Plot → Block.
- **Không xóa Plot** đang có CropCycle active → Block.
- **Soft delete everywhere** → Dữ liệu không bao giờ thực sự bị xóa.

### 6.2 Business Integrity
- `CropCycle.expectedEndDate > CropCycle.startDate`.
- `ActivityLog.activityDate ≤ TODAY` (không ghi nhật ký tương lai).
- `ActivityLog.activityDate ≥ CropCycle.startDate` (không ghi trước khi vụ bắt đầu).
- `ActivityMaterial.quantityUsed > 0`.
- `Inventory.quantity` không nên < 0 nhiều (log warning).

### 6.3 Consistency
- `CropCycle.totalYield = Σ(ActivityLog.harvestQuantity)` where type=THU_HOACH.
- Tổng xuất kho ≤ tổng nhập kho (lý thuyết).

---

## 7. Sanitization

### 7.1 Input Sanitization
```typescript
// Loại bỏ HTML tags khỏi text inputs
function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

// Trim whitespace
function sanitize(input: string): string {
  return sanitizeHtml(input.trim());
}
```

### 7.2 Áp dụng
- `notes` field trong ActivityLog
- `description` trong GrowthCycle, GrowthStage
- `name`, `location` trong Farm
- Tất cả text input từ user

---

## 8. Kiểm Thử Validation

| # | Test Case | Tầng | Expected |
|---|-----------|------|----------|
| 1 | Submit form thiếu required field | FE | Hiện lỗi đỏ ngay |
| 2 | API gửi thiếu required field | BE | 400 + chi tiết lỗi |
| 3 | Email format sai | FE+BE | Lỗi "email không hợp lệ" |
| 4 | Password < 8 ký tự | FE+BE | Lỗi rõ ràng |
| 5 | Số lượng vật tư = 0 | FE+BE | Lỗi "phải > 0" |
| 6 | Ngày kết thúc < ngày bắt đầu | FE+BE | Lỗi "phải sau ngày bắt đầu" |
| 7 | Xóa Crop đang có CropCycle active | BE | 400 "Không thể xóa" |
| 8 | Insert duplicate (farmId, materialId) | DB | Upsert thay vì lỗi |
| 9 | XSS payload trong notes field | BE | HTML tags bị loại bỏ |
| 10 | Whitelist — gửi field lạ | BE | Field bị loại bỏ |

---

## 9. Tiêu Chí Hoàn Thành

- [ ] Frontend validation realtime trên tất cả forms
- [ ] Error messages bằng tiếng Việt
- [ ] Backend ValidationPipe + custom error format
- [ ] Custom validators: IsNotFutureDate, IsAfterDate
- [ ] Referential integrity checks (xóa entity đang dùng)
- [ ] Input sanitization (XSS prevention)
- [ ] Database indexes cho query performance
- [ ] Validation tests ≥ 10 cases PASS
- [ ] Focus vào input lỗi đầu tiên khi submit
