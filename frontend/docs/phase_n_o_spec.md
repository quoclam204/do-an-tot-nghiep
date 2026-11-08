# 📑 Phase N-O — Đặc Tả: Báo Cáo & Dashboard

> **Thời gian:** 2 tuần  
> **Trạng thái:** ⏳ Chưa bắt đầu  
> **Phụ thuộc:** Phase 8 (ActivityLog), Phase 9 (Inventory)  
> **Tiếp theo:** Phase P (Final Review)

---

## 1. Tổng Quan

Phase N-O cung cấp khả năng **phân tích và trực quan hóa** dữ liệu canh tác, giúp nông hộ:
- Nhìn tổng quan tình hình chi phí, doanh thu, lợi nhuận.
- Phân tích cơ cấu chi phí (phân bón, thuốc, nhân công).
- So sánh hiệu quả giữa các vụ mùa.
- Theo dõi xu hướng chi phí / doanh thu theo thời gian.
- Kiểm soát lượng vật tư tiêu thụ.

---

## 2. Dashboard Layout

### 2.1 Desktop (1280px+)
```
┌─────────────────────────────────────────────────────────────┐
│  🌾 DalatAgri Dashboard                                     │
├─────────────────────────────────────────────────────────────┤
│  📍 Nông hộ: [Dropdown ▼]  🌿 Vụ mùa: [Dropdown ▼]        │
│  📅 Từ: [Date] — Đến: [Date]    🔄 Làm mới                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  💰 Tổng     │ 📈 Tổng     │ 📊 Lợi      │ 🌾 Sản        │
│  Chi Phí     │ Doanh Thu   │ Nhuận       │ Lượng         │
│  15,000,000₫ │ 25,000,000₫ │ 10,000,000₫ │ 500 kg        │
│  ▲ +12%      │ ▲ +20%      │ ▲ +35%      │ ▲ +15%        │
├──────────────┴──────────────┼──────────────┴────────────────┤
│                             │                               │
│  🥧 Cơ cấu chi phí         │  📊 Chi phí vs Doanh thu      │
│  (PieChart)                │  (BarChart — theo vụ)          │
│                             │                               │
│  ┌──────────────────┐      │  ┌─────────────────────┐      │
│  │    53% Phân bón  │      │  │  ▓▓▓▓  ████         │      │
│  │    27% Thuốc     │      │  │  ▓▓▓   ████████     │      │
│  │    13% Nhân công │      │  │  ▓▓    ██████       │      │
│  │     7% Khác      │      │  │  Vụ1   Vụ2   Vụ3   │      │
│  └──────────────────┘      │  └─────────────────────┘      │
├─────────────────────────────┴───────────────────────────────┤
│  📈 Xu hướng chi phí theo thời gian (LineChart — full width)│
│  ┌─────────────────────────────────────────────────────┐    │
│  │   ╱╲    ╱╲                                          │    │
│  │  ╱  ╲──╱  ╲──── Tổng chi phí                       │    │
│  │ ╱         ╲╱╲── Chi phí vật tư                      │    │
│  │╱              ╲─ Nhân công                          │    │
│  │  T1   T2   T3   T4   T5   T6                       │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  📦 Top vật tư tiêu thụ      │  📅 Lịch hoạt động          │
│  (Horizontal BarChart)       │  (Calendar Heatmap)         │
│  NPK 16-16-8  ████████ 250kg│  ┌─ T2 ─┬─ T3 ─┬─ T4 ─┐   │
│  Hữu cơ      ██████  180kg │  │ □■□□ │ ■■□■ │ □□■□ │   │
│  Regent      ███     45 lít │  │ □□■□ │ □■■□ │ ■□□■ │   │
│  Gramoxone   ██      30 lít │  └──────┴──────┴──────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile (< 768px)
- Layout 1 cột, scroll dọc.
- KPI cards: 2×2 grid.
- Mỗi biểu đồ full width, cuộn ngang nếu cần.
- Filter bar thu gọn: nhấn icon lọc → dropdown.

---

## 3. Backend — Report APIs

### 3.1 GET /reports/crop-cycle/:id/summary

```json
// Response
{
  "cropCycleId": "uuid",
  "cropCycleName": "Vụ cà phê 2024-2025",
  "cropName": "Cà phê Arabica",
  "plotName": "Lô A1",
  "farmName": "Nông hộ Cà phê Đà Lạt",
  "startDate": "2024-10-01",
  "expectedEndDate": "2025-09-30",
  "status": "ACTIVE",
  "totalCost": 15000000,
  "totalMaterialCost": 12000000,
  "totalLaborCost": 3000000,
  "totalRevenue": 25000000,
  "profit": 10000000,
  "profitMargin": 40.0,
  "totalYield": 500,
  "costPerKg": 30000,
  "revenuePerKg": 50000,
  "activityCount": 45,
  "daysActive": 120,
  "previousPeriod": {
    "totalCost": 13500000,
    "totalRevenue": 20000000,
    "costChange": 11.1,
    "revenueChange": 25.0
  }
}
```

### 3.2 GET /reports/crop-cycle/:id/cost-breakdown

```json
{
  "breakdown": [
    { "category": "Phân bón", "amount": 8000000, "percentage": 53.3, "color": "#22c55e" },
    { "category": "Thuốc BVTV", "amount": 4000000, "percentage": 26.7, "color": "#eab308" },
    { "category": "Nhân công", "amount": 2000000, "percentage": 13.3, "color": "#3b82f6" },
    { "category": "Khác", "amount": 1000000, "percentage": 6.7, "color": "#a855f7" }
  ],
  "total": 15000000
}
```

### 3.3 GET /reports/crop-cycle/:id/trends?groupBy=month

```json
{
  "groupBy": "month",
  "trends": [
    {
      "period": "2024-10",
      "label": "Tháng 10/2024",
      "materialCost": 3000000,
      "laborCost": 1000000,
      "totalCost": 4000000,
      "revenue": 0,
      "activityCount": 8
    },
    {
      "period": "2024-11",
      "label": "Tháng 11/2024",
      "materialCost": 2500000,
      "laborCost": 500000,
      "totalCost": 3000000,
      "revenue": 0,
      "activityCount": 6
    }
  ]
}
```

### 3.4 GET /reports/crop-cycle/:id/material-usage

```json
{
  "materials": [
    {
      "materialId": "uuid",
      "materialName": "Phân NPK 16-16-8",
      "unit": "kg",
      "totalUsed": 250,
      "totalCost": 3750000,
      "usageCount": 5,
      "avgPerUsage": 50
    }
  ],
  "totalMaterialCost": 12000000
}
```

### 3.5 GET /reports/compare?cropCycleIds=id1,id2

```json
{
  "comparison": [
    {
      "cropCycleId": "uuid1",
      "name": "Vụ 2023-2024",
      "totalCost": 12000000,
      "totalRevenue": 20000000,
      "profit": 8000000,
      "profitMargin": 40,
      "totalYield": 400,
      "costPerKg": 30000
    },
    {
      "cropCycleId": "uuid2",
      "name": "Vụ 2024-2025",
      "totalCost": 15000000,
      "totalRevenue": 25000000,
      "profit": 10000000,
      "profitMargin": 40,
      "totalYield": 500,
      "costPerKg": 30000
    }
  ]
}
```

### 3.6 GET /reports/activity-calendar?farmId=uuid&year=2025&month=3

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

## 4. Frontend Components (Recharts)

### 4.1 KPICard
```jsx
<KPICard
  icon="💰"
  title="Tổng Chi Phí"
  value={15000000}
  format="currency"
  change={12.5}       // % so với kỳ trước
  changeType="up"     // up | down
  color="red"
/>
```

### 4.2 CostBreakdownPie
```jsx
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie data={breakdownData} dataKey="amount" nameKey="category">
      {breakdownData.map((entry, i) => (
        <Cell key={i} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip formatter={(v) => formatCurrency(v)} />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

### 4.3 CostRevenueBar
```jsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={comparisonData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis tickFormatter={formatCurrency} />
    <Tooltip formatter={formatCurrency} />
    <Legend />
    <Bar dataKey="totalCost" name="Chi phí" fill="#ef4444" />
    <Bar dataKey="totalRevenue" name="Doanh thu" fill="#22c55e" />
    <Bar dataKey="profit" name="Lợi nhuận" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

### 4.4 TrendLine
```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={trendData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="label" />
    <YAxis tickFormatter={formatCurrency} />
    <Tooltip formatter={formatCurrency} />
    <Legend />
    <Line type="monotone" dataKey="totalCost" name="Tổng chi phí" stroke="#ef4444" />
    <Line type="monotone" dataKey="materialCost" name="Vật tư" stroke="#22c55e" />
    <Line type="monotone" dataKey="laborCost" name="Nhân công" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

---

## 5. Tính Toán Server-Side

### 5.1 Summary Query (Prisma)
```typescript
async getCropCycleSummary(cropCycleId: string) {
  const activities = await this.prisma.activityLog.findMany({
    where: { cropCycleId, deletedAt: null },
    include: { materials: true },
  });

  const totalLaborCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);
  const totalMaterialCost = activities.reduce((sum, a) =>
    sum + a.materials.reduce((ms, m) => ms + m.cost, 0), 0);
  const totalRevenue = activities
    .filter(a => a.activityType === 'THU_HOACH')
    .reduce((sum, a) => sum + (a.revenue || 0), 0);
  const totalYield = activities
    .filter(a => a.activityType === 'THU_HOACH')
    .reduce((sum, a) => sum + (a.harvestQuantity || 0), 0);

  const totalCost = totalLaborCost + totalMaterialCost;
  const profit = totalRevenue - totalCost;
  
  return {
    totalCost, totalMaterialCost, totalLaborCost,
    totalRevenue, profit,
    profitMargin: totalRevenue > 0 ? (profit / totalRevenue * 100) : 0,
    totalYield,
    costPerKg: totalYield > 0 ? totalCost / totalYield : 0,
    activityCount: activities.length,
  };
}
```

---

## 6. Unit Tests

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | Summary: tổng chi phí tính đúng | Σ(cost + material costs) |
| 2 | Summary: doanh thu chỉ từ THU_HOACH | Σ(revenue) where THU_HOACH |
| 3 | Summary: profit margin đúng | (revenue - cost) / revenue × 100 |
| 4 | Cost breakdown: tổng = 100% | Σ percentages = 100 |
| 5 | Trends: group by month đúng | Mỗi entry đúng tháng |
| 6 | Material usage: tổng sử dụng đúng | Σ(quantityUsed) per material |
| 7 | Compare: trả đúng số vụ | Length = số cropCycleIds |
| 8 | Calendar: count đúng số hoạt động | Σ = tổng activities trong tháng |
| 9 | Biểu đồ render không lỗi | No React errors |
| 10 | Responsive: mobile layout | 1 cột, charts co dãn |

---

## 7. Tiêu Chí Hoàn Thành

- [ ] 6 Report APIs hoạt động đúng
- [ ] Dashboard: 4 KPI cards
- [ ] PieChart: cơ cấu chi phí
- [ ] BarChart: chi phí vs doanh thu theo vụ
- [ ] LineChart: xu hướng theo thời gian
- [ ] Horizontal BarChart: top vật tư
- [ ] Calendar heatmap hoạt động
- [ ] Filter: farm, crop cycle, date range
- [ ] Responsive trên mobile
- [ ] API response time < 500ms
- [ ] Unit tests ≥ 10 cases PASS
