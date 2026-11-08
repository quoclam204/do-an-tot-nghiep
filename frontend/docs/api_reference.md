# 📘 API Reference — DalatAgri

> **Base URL (Dev):** `http://localhost:3000`  
> **Base URL (Prod):** `https://dalat-agri-api.onrender.com`  
> **Authentication:** Bearer JWT Token  
> **Content-Type:** `application/json`  
> **Cập nhật:** 03/09/2026

---

## Quy Ước Chung

### Authentication Header
```
Authorization: Bearer <access_token>
```

### Response Format (Thành công)
```json
{
  "statusCode": 200,
  "message": "Thành công",
  "data": { ... }
}
```

### Response Format (Lỗi)
```json
{
  "statusCode": 400,
  "message": "Mô tả lỗi",
  "error": "Bad Request"
}
```

### HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| `200` | OK — Thành công |
| `201` | Created — Tạo mới thành công |
| `400` | Bad Request — Dữ liệu không hợp lệ |
| `401` | Unauthorized — Chưa đăng nhập / token hết hạn |
| `403` | Forbidden — Không có quyền |
| `404` | Not Found — Không tìm thấy |
| `409` | Conflict — Trùng lặp (email đã tồn tại) |
| `500` | Internal Server Error — Lỗi server |

---

## 1. Auth Module

### 1.1 POST /auth/register — Đăng ký

**Auth:** ❌ Không yêu cầu

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "MyStr0ng!Pass",
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567"
}
```

**Validation:**
| Trường | Quy tắc |
|--------|---------|
| `email` | Required, email format, unique |
| `password` | Required, min 8 ký tự |
| `fullName` | Required, max 100 ký tự |
| `phone` | Optional, phone format VN |

**Response (201):**
```json
{
  "id": "uuid",
  "email": "farmer@example.com",
  "fullName": "Nguyễn Văn A",
  "role": "OWNER",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**Errors:**
| Code | Khi nào |
|------|--------|
| `400` | Thiếu trường bắt buộc hoặc format sai |
| `409` | Email đã tồn tại |

---

### 1.2 POST /auth/login — Đăng nhập

**Auth:** ❌ Không yêu cầu

**Request Body:**
```json
{
  "email": "farmer@example.com",
  "password": "MyStr0ng!Pass"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "farmer@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "OWNER"
  }
}
```

**Errors:**
| Code | Khi nào |
|------|--------|
| `401` | Email không tồn tại hoặc sai mật khẩu |
| `403` | Tài khoản bị khóa (quá 5 lần sai) |

---

### 1.3 POST /auth/refresh — Làm mới Access Token

**Auth:** ❌ Không yêu cầu (dùng Refresh Token)

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...(new)",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...(new)"
}
```

---

### 1.4 POST /auth/logout — Đăng xuất

**Auth:** ✅ Bearer Token

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "message": "Đăng xuất thành công"
}
```

---

### 1.5 POST /auth/forgot-password — Quên mật khẩu

**Auth:** ❌ Không yêu cầu

**Request Body:**
```json
{
  "email": "farmer@example.com"
}
```

**Response (200):**
```json
{
  "message": "Email đặt lại mật khẩu đã được gửi"
}
```

> **Lưu ý:** Luôn trả 200 kể cả email không tồn tại (bảo mật).

---

### 1.6 POST /auth/reset-password — Đặt lại mật khẩu

**Auth:** ❌ Không yêu cầu (dùng reset token)

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "MyNewStr0ng!Pass"
}
```

**Response (200):**
```json
{
  "message": "Mật khẩu đã được cập nhật"
}
```

---

### 1.7 GET /auth/profile — Xem thông tin cá nhân

**Auth:** ✅ Bearer Token

**Response (200):**
```json
{
  "id": "uuid",
  "email": "farmer@example.com",
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "role": "OWNER",
  "isActive": true,
  "emailVerified": false,
  "lastLoginAt": "2025-01-01T08:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## 2. Farms Module

### 2.1 POST /farms — Tạo nông hộ

**Auth:** ✅ Bearer Token (OWNER)

**Request Body:**
```json
{
  "name": "Nông hộ Cà phê Đà Lạt",
  "location": "Phường 7, TP Đà Lạt, Lâm Đồng",
  "totalArea": 2.5
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Nông hộ Cà phê Đà Lạt",
  "location": "Phường 7, TP Đà Lạt, Lâm Đồng",
  "totalArea": 2.5,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### 2.2 GET /farms — Danh sách nông hộ

**Auth:** ✅ Bearer Token

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Nông hộ Cà phê Đà Lạt",
    "location": "Phường 7, TP Đà Lạt",
    "totalArea": 2.5,
    "plotCount": 3,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

---

### 2.3 GET /farms/:id — Chi tiết nông hộ

**Auth:** ✅ Bearer Token

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Nông hộ Cà phê Đà Lạt",
  "location": "Phường 7, TP Đà Lạt",
  "totalArea": 2.5,
  "plots": [
    { "id": "uuid", "name": "Lô A1", "area": 1.0 },
    { "id": "uuid", "name": "Lô A2", "area": 0.8 }
  ],
  "inventories": [
    { "id": "uuid", "materialName": "Phân NPK", "quantity": 100, "unit": "kg" }
  ],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### 2.4 PATCH /farms/:id — Cập nhật nông hộ

**Auth:** ✅ Bearer Token (OWNER)

**Request Body (partial):**
```json
{
  "name": "Nông hộ Cà phê Đà Lạt (mới)",
  "totalArea": 3.0
}
```

---

### 2.5 DELETE /farms/:id — Xóa nông hộ

**Auth:** ✅ Bearer Token (OWNER)

**Response (200):**
```json
{
  "message": "Đã xóa nông hộ"
}
```

---

## 3. Catalog Module

### 3.1 Crops (Cây trồng)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/catalog/crops` | Tạo mới |
| `GET` | `/catalog/crops` | Danh sách |
| `PATCH` | `/catalog/crops/:id` | Cập nhật |
| `DELETE` | `/catalog/crops/:id` | Xóa |

**Create Crop Body:**
```json
{
  "name": "Cà phê Arabica",
  "type": "Cây công nghiệp dài ngày"
}
```

### 3.2 Materials (Vật tư)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/catalog/materials` | Tạo mới |
| `GET` | `/catalog/materials` | Danh sách |
| `PATCH` | `/catalog/materials/:id` | Cập nhật |
| `DELETE` | `/catalog/materials/:id` | Xóa |

**Create Material Body:**
```json
{
  "name": "Phân NPK 16-16-8",
  "unit": "kg",
  "defaultPrice": 15000
}
```

### 3.3 Growth Cycles (Chu kỳ sinh trưởng)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/catalog/growth-cycles` | Tạo mới |
| `GET` | `/catalog/growth-cycles` | Danh sách |
| `PATCH` | `/catalog/growth-cycles/:id` | Cập nhật |
| `DELETE` | `/catalog/growth-cycles/:id` | Xóa |

**Create Growth Cycle Body:**
```json
{
  "cropId": "uuid",
  "name": "Chu kỳ cà phê 3 năm",
  "description": "Chu kỳ sinh trưởng cà phê Arabica từ khi trồng đến thu hoạch",
  "stages": [
    { "name": "Giai đoạn cây con", "sequence": 1, "durationDays": 180 },
    { "name": "Giai đoạn phát triển", "sequence": 2, "durationDays": 365 },
    { "name": "Giai đoạn ra hoa", "sequence": 3, "durationDays": 90 },
    { "name": "Giai đoạn đậu quả", "sequence": 4, "durationDays": 120 },
    { "name": "Giai đoạn thu hoạch", "sequence": 5, "durationDays": 60 }
  ]
}
```

---

## 4. CropCycle Module (Phase 1)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/crop-cycles` | Tạo vụ mùa |
| `GET` | `/crop-cycles?plotId=uuid` | Danh sách theo lô |
| `GET` | `/crop-cycles/:id` | Chi tiết |
| `PATCH` | `/crop-cycles/:id` | Cập nhật |
| `DELETE` | `/crop-cycles/:id` | Xóa |

**Create CropCycle Body:**
```json
{
  "plotId": "uuid",
  "cropId": "uuid",
  "growthCycleId": "uuid",
  "name": "Vụ cà phê 2024-2025",
  "startDate": "2024-10-01",
  "expectedEndDate": "2025-09-30",
  "status": "ACTIVE"
}
```

---

## 5. ActivityLog Module (Phase 2)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/activity-logs` | Ghi nhật ký |
| `GET` | `/activity-logs?cropCycleId=uuid&page=1&limit=20` | Danh sách (phân trang) |
| `GET` | `/activity-logs/:id` | Chi tiết |
| `PATCH` | `/activity-logs/:id` | Cập nhật |
| `DELETE` | `/activity-logs/:id` | Xóa |

*(Xem chi tiết request/response tại [phase_2_spec.md](./phase_2_spec.md))*

---

## 6. Inventory Module (Phase 2)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/inventory/import` | Nhập kho |
| `GET` | `/inventory?farmId=uuid` | Danh sách tồn kho |
| `PATCH` | `/inventory/:id` | Điều chỉnh |

---

## 7. Sync Module (Phase 3)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/sync/push` | Đẩy dữ liệu offline lên server |
| `GET` | `/sync/pull?since=timestamp` | Lấy dữ liệu mới từ server |

*(Xem chi tiết tại [phase_3_spec.md](./phase_3_spec.md))*

---

## 8. Reports Module (Phase 4)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/reports/crop-cycle/:id/summary` | Tóm tắt vụ |
| `GET` | `/reports/crop-cycle/:id/cost-breakdown` | Cơ cấu chi phí |
| `GET` | `/reports/crop-cycle/:id/trends?groupBy=month` | Xu hướng |
| `GET` | `/reports/crop-cycle/:id/material-usage` | Vật tư tiêu thụ |
| `GET` | `/reports/compare?cropCycleIds=id1,id2` | So sánh vụ |
| `GET` | `/reports/activity-calendar?farmId=uuid&year=2025&month=3` | Lịch hoạt động |

*(Xem chi tiết response tại [phase_4_spec.md](./phase_4_spec.md))*

---

## Postman Collection

Import file Postman collection để test nhanh tất cả API:
- **File:** `docs/DalatAgri.postman_collection.json` *(cần tạo)*
- **Environment:** Tạo Postman environment với biến `base_url` và `access_token`
