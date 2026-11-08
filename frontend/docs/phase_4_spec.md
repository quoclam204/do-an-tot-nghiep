# 📑 Phase 4 — Đặc Tả: Báo Cáo & Dashboard

> **Thời gian:** 2 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase 2 hoàn thành (Phase 3 song song được)

---

## 1. Tổng Quan

Phase 4 cung cấp khả năng **nhìn lại và phân tích** dữ liệu đã ghi nhận, giúp nông hộ:
- Biết tổng chi phí đã đầu tư và doanh thu thu hoạch.
- Hiểu cơ cấu chi phí (phân bón chiếm bao nhiêu %, thuốc trừ sâu bao nhiêu %).
- So sánh hiệu quả giữa các vụ mùa.
- Theo dõi lượng vật tư tiêu thụ theo thời gian.

---

## 2. Dashboard Tổng Quan

### 2.1 KPI Cards (4 ô trên cùng)

| KPI | Mô tả | Tính toán |
|-----|-------|----------|
| 💰 **Tổng Chi Phí** | Tổng chi phí vụ hiện tại | Σ(ActivityLog.cost + ActivityMaterial.cost) |
| 📈 **Tổng Doanh Thu** | Tổng thu hoạch | Σ(ActivityLog.revenue) where type=THU_HOACH |
| 📊 **Lợi Nhuận** | Doanh thu - Chi phí | Doanh thu - Chi phí |
| 🌾 **Sản Lượng** | Tổng kg thu hoạch | CropCycle.totalYield |

### 2.2 Bộ lọc Dashboard

| Filter | Loại | Giá trị |
|--------|------|---------|
| Nông hộ | Dropdown | Danh sách farms |
| Vụ mùa | Dropdown | Danh sách crop cycles |
| Khoảng thời gian | Date range picker | Từ ngày — Đến ngày |
| Cây trồng | Dropdown | Danh sách crops |

---

## 3. Các Loại Biểu Đồ

### 3.1 Biểu Đồ Tròn — Cơ Cấu Chi Phí (PieChart)

```
Mục đích: Phân tích chi phí theo nhóm

Dữ liệu:
- Phân bón:    Σ cost từ ActivityMaterial where material.type = "PHAN_BON"
- Thuốc BVTV:  Σ cost từ ActivityMaterial where material.type = "THUOC_BVTV"  
- Nhân công:   Σ ActivityLog.cost where type IN (LAM_DAT, CHAM_SOC, ...)
- Khác:        Σ ActivityLog.cost where type = KHAC

Recharts component: <PieChart> + <Pie> + <Cell> + <Legend>
```

### 3.2 Biểu Đồ Cột — Chi Phí vs Doanh Thu (BarChart)

```
Mục đích: So sánh hiệu quả giữa các vụ

X-axis: Tên vụ mùa (CropCycle.name)
Y-axis: VNĐ
Bars: 
  - 🔴 Tổng chi phí
  - 🟢 Tổng doanh thu
  - 🔵 Lợi nhuận

Recharts component: <BarChart> + <Bar> + <XAxis> + <YAxis> + <Tooltip>
```

### 3.3 Biểu Đồ Đường — Xu Hướng Chi Phí Theo Thời Gian (LineChart)

```
Mục đích: Theo dõi chi phí phát sinh theo tuần/tháng

X-axis: Thời gian (tuần hoặc tháng)
Y-axis: VNĐ
Lines:
  - Chi phí vật tư
  - Chi phí nhân công
  - Tổng chi phí

Recharts component: <LineChart> + <Line> + <XAxis> + <YAxis>
```

### 3.4 Biểu Đồ Cột Ngang — Vật Tư Tiêu Thụ (BarChart horizontal)

```
Mục đích: Top 10 vật tư sử dụng nhiều nhất

Y-axis: Tên vật tư
X-axis: Tổng số lượng đã sử dụng
Color: theo loại vật tư

Recharts component: <BarChart layout="vertical"> + <Bar>
```

### 3.5 Lịch Hoạt Động (Activity Heatmap / Calendar)

```
Mục đích: Nhìn nhanh ngày nào có hoạt động, ngày nào không

Hiển thị: Calendar grid, mỗi ô tô màu theo số hoạt động
  - 0 hoạt động: xám
  - 1-2: xanh nhạt
  - 3-5: xanh
  - >5: xanh đậm
```

---

## 4. API Endpoints — Reports Module

### 4.1 Tóm tắt vụ mùa

```
GET /reports/crop-cycle/:id/summary
```

**Response:**
```json
{
  "cropCycleId": "uuid",
  "cropCycleName": "Vụ cà phê 2024-2025",
  "cropName": "Cà phê Arabica",
  "plotName": "Lô A1",
  "startDate": "2024-10-01",
  "status": "ACTIVE",
  "totalCost": 15000000,
  "totalMaterialCost": 12000000,
  "totalLaborCost": 3000000,
  "totalRevenue": 25000000,
  "profit": 10000000,
  "profitMargin": 40.0,
  "totalYield": 500,
  "activityCount": 45,
  "daysActive": 120
}
```

### 4.2 Cơ cấu chi phí

```
GET /reports/crop-cycle/:id/cost-breakdown
```

**Response:**
```json
{
  "breakdown": [
    { "category": "Phân bón", "amount": 8000000, "percentage": 53.3 },
    { "category": "Thuốc BVTV", "amount": 4000000, "percentage": 26.7 },
    { "category": "Nhân công", "amount": 2000000, "percentage": 13.3 },
    { "category": "Khác", "amount": 1000000, "percentage": 6.7 }
  ],
  "total": 15000000
}
```

### 4.3 Xu hướng theo thời gian

```
GET /reports/crop-cycle/:id/trends?groupBy=month
```

**Response:**
```json
{
  "trends": [
    {
      "period": "2024-10",
      "materialCost": 3000000,
      "laborCost": 1000000,
      "totalCost": 4000000,
      "revenue": 0
    },
    {
      "period": "2024-11",
      "materialCost": 2500000,
      "laborCost": 500000,
      "totalCost": 3000000,
      "revenue": 0
    }
  ]
}
```

### 4.4 Vật tư tiêu thụ

```
GET /reports/crop-cycle/:id/material-usage
```

**Response:**
```json
{
  "materials": [
    {
      "materialId": "uuid",
      "materialName": "Phân NPK 16-16-8",
      "unit": "kg",
      "totalUsed": 250,
      "totalCost": 3750000,
      "usageCount": 5
    }
  ]
}
```

### 4.5 So sánh giữa các vụ

```
GET /reports/compare?cropCycleIds=uuid1,uuid2,uuid3
```

**Response:**
```json
{
  "comparison": [
    {
      "cropCycleId": "uuid1",
      "name": "Vụ 2023-2024",
      "totalCost": 12000000,
      "totalRevenue": 20000000,
      "profit": 8000000,
      "totalYield": 400,
      "costPerKg": 30000
    },
    {
      "cropCycleId": "uuid2",
      "name": "Vụ 2024-2025",
      "totalCost": 15000000,
      "totalRevenue": 25000000,
      "profit": 10000000,
      "totalYield": 500,
      "costPerKg": 30000
    }
  ]
}
```

### 4.6 Lịch hoạt động

```
GET /reports/activity-calendar?farmId=uuid&year=2025&month=3
```

**Response:**
```json
{
  "calendar": [
    { "date": "2025-03-01", "count": 2, "types": ["BON_PHAN", "TUOI"] },
    { "date": "2025-03-02", "count": 0, "types": [] },
    { "date": "2025-03-03", "count": 1, "types": ["PHUN_THUOC"] }
  ]
}
```

---

## 5. Frontend Pages

### 5.1 DashboardPage
- **Layout**: responsive grid (2 cột desktop, 1 cột mobile)
- **Row 1**: 4 KPI Cards
- **Row 2**: Filter bar (farm, crop cycle, date range)
- **Row 3**: PieChart (cơ cấu chi phí) + BarChart (chi phí vs doanh thu)
- **Row 4**: LineChart (xu hướng) full width
- **Row 5**: Bảng chi tiết vật tư tiêu thụ

### 5.2 ReportDetailPage
- Cho phép drill-down vào từng biểu đồ
- Export CSV (nút download)
- Print-friendly layout

---

## 6. Tiêu Chí Hoàn Thành Phase 4

- [ ] Dashboard hiển thị 4 KPI cards chính xác
- [ ] Biểu đồ tròn cơ cấu chi phí render đúng
- [ ] Biểu đồ cột chi phí vs doanh thu theo vụ
- [ ] Biểu đồ đường xu hướng theo thời gian
- [ ] Bảng vật tư tiêu thụ với sort/filter
- [ ] Filter hoạt động: theo farm, crop cycle, date range
- [ ] Responsive trên mobile (biểu đồ tự co dãn)
- [ ] API Reports trả data đúng, hiệu năng < 500ms
- [ ] Unit tests cho report calculation logic
