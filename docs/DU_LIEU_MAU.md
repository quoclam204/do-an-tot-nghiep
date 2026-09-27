# BẢNG DỮ LIỆU MẪU HỆ THỐNG QUẢN LÝ NÔNG NGHIỆP DALATAGRI

Tài liệu này tổng hợp 2 đến 3 bộ dữ liệu mẫu thực tế được xây dựng đặc trưng cho nền nông nghiệp công nghệ cao và cây công nghiệp tại Đà Lạt - Lâm Đồng.

Bạn có thể chỉnh sửa trực tiếp các dữ liệu này trong file [seed.ts](file:///e:/DoAnTotNghiep/DalatAgri/backend/prisma/seed.ts) hoặc xem bên dưới để điền vào hệ thống hoặc báo cáo đồ án tốt nghiệp.

---

## 1. Tài khoản người dùng (User & Farm Owner)

| STT | Họ và tên | Email | Số điện thoại | Vai trò | Mật khẩu mặc định | Ghi chú |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | Nguyễn Lê Quốc Lâm | `nguyenlequoclam@gmail.com` | `0901234567` | **ADMIN** | `Admin@123456` | Quản trị viên hệ thống |
| **1** | Nguyễn Văn An | `chuvuon.cau_dat@dalatagri.vn` | `0912345601` | **OWNER** | `Password@123` | Chủ trang trại cà phê Cầu Đất |
| **2** | Trần Thị Mai | `chuvuon.langbiang@dalatagri.vn` | `0912345602` | **OWNER** | `Password@123` | Chủ nông trại dâu tây Lạc Dương |
| **3** | Lê Hoàng Long | `chuvuon.dahuoai@dalatagri.vn` | `0912345603` | **OWNER** | `Password@123` | Chủ vườn sầu riêng Đạ Huoai |

---

## 2. Nông trại (Farms) & Thửa/Lô đất (Plots)

### Nông trại 1: Nông Trại Cà Phê Cầu Đất Farm
- **Chủ hộ:** Nguyễn Văn An
- **Địa chỉ:** Thôn Đất Làng, Xã Xuân Trường, TP. Đà Lạt, Lâm Đồng
- **Tổng diện tích:** `2.5 ha` (25.000 m²)
- **Các lô đất trực thuộc:**
  1. `Lô A1 - Sườn đồi Cầu Đất`: Diện tích `1.2 ha`
  2. `Lô A2 - Vườn dưới thung lũng`: Diện tích `1.3 ha`

### Nông trại 2: Trang Trại Dâu Tây Công Nghệ Cao Langbiang
- **Chủ hộ:** Trần Thị Mai
- **Địa chỉ:** Thị trấn Lạc Dương, Huyện Lạc Dương, Lâm Đồng
- **Tổng diện tích:** `1.0 ha` (10.000 m²)
- **Các lô đất trực thuộc:**
  1. `Nhà kính K1 - Giàn treo công nghệ cao`: Diện tích `0.5 ha`
  2. `Nhà kính K2 - Luống đất phủ bạt`: Diện tích `0.5 ha`

### Nông trại 3: Vườn Cây Ăn Trái Đạ Huoai - Lâm Đồng
- **Chủ hộ:** Lê Hoàng Long
- **Địa chỉ:** Xã Hà Lâm, Huyện Đạ Huoai, Lâm Đồng
- **Tổng diện tích:** `3.8 ha` (38.000 m²)
- **Các lô đất trực thuộc:**
  1. `Khu đồi Sầu Riêng Ri6`: Diện tích `2.0 ha`
  2. `Khu Bơ 034 xen canh`: Diện tích `1.8 ha`

---

## 3. Danh mục Cây trồng & Dữ liệu chi tiết từng Tab nhập liệu

Khi bấm "Thêm Cây Trồng Mới" trên giao diện website, form sẽ yêu cầu điền qua 3 phần (1. Thông Tin, 2. Thông Số, 3. Quy Trình). Dưới đây là 3 bộ dữ liệu đầy đủ từng trường:

---

### Cây 1: Cà phê Arabica Cầu Đất (Cà phê Bourbon / Catimor chất lượng cao)

#### **1. Tab "1. Thông Tin"**
* **Tên cây trồng / Giống cây:** `Cà phê Arabica Cầu Đất`
* **Nhóm phân loại:** `Cây công nghiệp lâu năm` (Cà phê, Chè, Hồ tiêu...)
* **Mô tả đặc tính giống cây:** `Giống Arabica Catimor và Bourbon trồng ở độ cao trên 1.500m tại Cầu Đất - Trạm Hành, hương thơm hoa quả tự nhiên, vị chua thanh thoát và hậu vị ngọt sâu. Thích hợp khí hậu lạnh ôn đới Đà Lạt.`
* **Hình ảnh đại diện:** Chọn ảnh mẫu `Cà phê` có sẵn trong hệ thống (hoặc tải ảnh vườn cà phê Cầu Đất).

#### **2. Tab "2. Thông Số" (Thông số canh tác)**
* **Mật độ trồng khuyến nghị:** `1.100 - 1.300 cây/ha (cự ly 3m x 2.5m)`
* **Thời gian nuôi quả đến thu hoạch:** `8 - 9 tháng (từ khi nở hoa đến khi quả chín rộ)`
* **Đơn vị tính thu hoạch:** `Kg quả tươi` hoặc `Tạ nhân khô`
* **Thời gian bắt đầu ra hoa:** `2 - 3 năm sau khi trồng cây con`
* **Bắt đầu cho thu hoạch:** `3 năm bắt đầu bói, năm thứ 4 - 5 cho năng suất kinh doanh đỉnh cao`
* **Sâu bệnh hại nguy hiểm & Lưu ý:** `Bệnh gỉ sắt hại lá, nấm hồng khô cành, sâu đục thân mình trắng, rệp sáp hại rễ và chùm quả non.`
* **Phân bón & Dinh dưỡng khuyên dùng:** `NPK 16-16-8 Đầu Trâu, Phân hữu cơ trùn quế vi sinh, Bo - Kẽm đón hoa, Kali sunfat vỗ hạt.`

#### **3. Tab "3. Quy Trình" (Các giai đoạn sinh trưởng)**
1. `Giai đoạn 1`: **Phục hồi cây sau thu hoạch & Tỉa cành** (`30 ngày`)
   * *Hoạt động:* Cắt tỉa cành tăm, cành sâu bệnh, quét vôi thân, bón phân hữu cơ vi sinh cải tạo đất.
2. `Giai đoạn 2`: **Phân hóa mầm hoa & Nở hoa rộ** (`25 ngày`)
   * *Hoạt động:* Xiết nước tạo khô hạn nhẹ, tưới nước đẫm bung hoa đồng loạt, phun Bo tăng đậu trái.
3. `Giai đoạn 3`: **Nuôi quả non & Phát triển cành dự trữ** (`120 ngày`)
   * *Hoạt động:* Bón NPK 16-16-8 nuôi quả, tỉa chồi vượt, phòng trừ rệp sáp và mọt đục cành.
4. `Giai đoạn 4`: **Chắc hạt & Chín đỏ tập trung** (`60 ngày`)
   * *Hoạt động:* Bón tăng cường Kali giúp vào nhân chắc hạt, ngưng thuốc BVTV trước thu hoạch 30 ngày.
5. `Giai đoạn 5`: **Thu hoạch chọn lọc quả chín** (`45 ngày`)
   * *Hoạt động:* Hái bằng tay từng quả chín đỏ (>90%), vận chuyển về xưởng sơ chế ướt trong 24h.

---

### Cây 2: Dâu tây giống Hana / New Zealand (Canh tác nhà kính công nghệ cao)

#### **1. Tab "1. Thông Tin"**
* **Tên cây trồng / Giống cây:** `Dâu tây giống Hana / New Zealand`
* **Nhóm phân loại:** `Cây trồng xen canh & nông sản khác` (hoặc Cây ăn trái)
* **Mô tả đặc tính giống cây:** `Giống dâu tây chịu nhiệt nhập ngoại, quả to đều, thịt giòn ngọt, mùi thơm đặc trưng, canh tác trên giàn treo hoặc giá thể xơ dừa tưới nhỏ giọt tiêu chuẩn VietGAP/GlobalGAP.`
* **Hình ảnh đại diện:** Chọn ảnh mẫu `Dâu tây` trong hệ thống.

#### **2. Tab "2. Thông Số" (Thông số canh tác)**
* **Mật độ trồng khuyến nghị:** `35.000 - 40.000 cây/ha (canh tác giàn treo 2 tầng)`
* **Thời gian nuôi quả đến thu hoạch:** `25 - 30 ngày từ khi hoa thụ phấn đậu trái non`
* **Đơn vị tính thu hoạch:** `Kg` (đóng hộp 500g hoặc 1kg)
* **Thời gian bắt đầu ra hoa:** `45 - 60 ngày sau khi cấy cây con mô`
* **Bắt đầu cho thu hoạch:** `2.5 - 3 tháng bắt đầu thu lứa đầu, thu hoạch kéo dài 6 - 8 tháng`
* **Sâu bệnh hại nguy hiểm & Lưu ý:** `Bệnh phấn trắng, mốc xám (Botrytis), nấm thối rễ Phytophthora, nhện đỏ, bọ trĩ chích hút hoa.`
* **Phân bón & Dinh dưỡng khuyên dùng:** `Dung dịch dinh dưỡng thủy canh A-B chuyên dụng, Canxi Nitrat, Kali Bo, Nấm đối kháng Trichoderma.`

#### **3. Tab "3. Quy Trình" (Các giai đoạn sinh trưởng)**
1. `Giai đoạn 1`: **Cây con cấy mô bén rễ** (`20 ngày`)
   * *Hoạt động:* Giữ ẩm giá thể, che lưới giảm nắng 50%, tưới kích rễ Humic và Trichoderma.
2. `Giai đoạn 2`: **Phát triển thân lá & Tỉa ngó phụ** (`30 ngày`)
   * *Hoạt động:* Vặt bỏ lá già gốc, ngắt ngó non để tập trung dinh dưỡng nuôi thân chính to khỏe.
3. `Giai đoạn 3`: **Phân hóa mầm hoa & Thụ phấn** (`25 ngày`)
   * *Hoạt động:* Bổ sung Canxi-Bo, nuôi ong thụ phấn trong nhà kính hoặc rung giàn thụ phấn nhân tạo.
4. `Giai đoạn 4`: **Nuôi trái lớn & Chuyển màu hồng đỏ** (`30 ngày`)
   * *Hoạt động:* Lót lưới bọc quả tránh chạm đất ẩm mốc, tưới nhỏ giọt dinh dưỡng Kali hữu cơ.
5. `Giai đoạn 5`: **Thu hoạch rải vụ liên tục** (`90 ngày`)
   * *Hoạt động:* Hái sáng sớm (6h - 9h), dùng kéo cắt cuống 1cm, xếp khay đệm xốp chống dập nát.

---

### Cây 3: Sầu riêng Ri6 Đạ Huoai - Lâm Đồng

#### **1. Tab "1. Thông Tin"**
* **Tên cây trồng / Giống cây:** `Sầu riêng Ri6 Đạ Huoai`
* **Nhóm phân loại:** `Cây ăn trái lâu năm` (Sầu riêng, Bơ, Bưởi, Mít...)
* **Mô tả đặc tính giống cây:** `Cây sinh trưởng mạnh, thích hợp thổ nhưỡng khí hậu nhiệt đới chân đèo Bảo Lộc - Đạ Huoai. Cơm vàng đậm, hạt lép, dẻo béo không xơ, ráo cơm, đạt chuẩn chỉ dẫn địa lý sầu riêng Đạ Huoai.`
* **Hình ảnh đại diện:** Chọn ảnh mẫu `Sầu riêng` trong hệ thống.

#### **2. Tab "2. Thông Số" (Thông số canh tác)**
* **Mật độ trồng khuyến nghị:** `120 - 150 cây/ha (cự ly 8m x 8m hoặc 9m x 9m)`
* **Thời gian nuôi quả đến thu hoạch:** `100 - 110 ngày tính từ thời điểm xả nhụy`
* **Đơn vị tính thu hoạch:** `Kg quả tươi (trái)`
* **Thời gian bắt đầu ra hoa:** `3.5 - 4 năm sau khi trồng cây giống ghép mắt`
* **Bắt đầu cho thu hoạch:** `4 năm cho trái bói, từ năm thứ 6 trở đi năng suất ổn định 15 - 20 tấn/ha`
* **Sâu bệnh hại nguy hiểm & Lưu ý:** `Bệnh nứt thân xì mủ (Phytophthora), rầy phấn trắng hại đọt non, sâu đục cuống trái, hiện tượng sượng cơm cháy múi.`
* **Phân bón & Dinh dưỡng khuyên dùng:** `Phân hữu cơ nở nhập khẩu Bỉ/Úc, Lân nung chảy Văn Điển, NPK Kali trắng Sulphate (12-12-17), Ridomil Gold 68WG.`

#### **3. Tab "3. Quy Trình" (Các giai đoạn sinh trưởng)**
1. `Giai đoạn 1`: **Phục hồi cây sau thu hoạch & Làm cơi đọt** (`45 ngày`)
   * *Hoạt động:* Rửa vườn bằng thuốc gốc đồng, tỉa bỏ cành khô, bón hữu cơ + Lân kích bộ rễ tơ mới.
2. `Giai đoạn 2`: **Xiết nước tạo mầm & Phun phân hóa hoa** (`40 ngày`)
   * *Hoạt động:* Gom sạch cỏ gốc, phủ bạt siết nước khô hạn 25 - 30 ngày, phun tạo mầm mắt cua.
3. `Giai đoạn 3`: **Xổ nhụy & Thụ phấn bổ sung** (`20 ngày`)
   * *Hoạt động:* Giữ ẩm nhẹ đất, quét chổi thụ phấn chéo ban đêm (19h - 21h), phun phòng bọ trĩ.
4. `Giai đoạn 4`: **Nuôi trái lớn & Tỉa định hình trái** (`70 ngày`)
   * *Hoạt động:* Tỉa quả vẹo chỉ để 60 - 80 quả chuẩn/cây, buộc dây neo cuống chống gió, bón Kali trắng.
5. `Giai đoạn 5`: **Cắt thu hoạch & Vận chuyển** (`25 ngày`)
   * *Hoạt động:* Gõ kiểm tra độ tuổi chín (8.5 - 9 tuổi), cắt hạ bằng dây dù, xếp rơm lót xuất kho.

---

## 4. Danh mục vật tư nông nghiệp (Materials)

| STT | Tên vật tư | Loại vật tư | Đơn vị tính | Đơn giá mặc định |
| :-- | :--- | :--- | :--- | :--- |
| **1** | Phân bón NPK 16-16-8 Đầu Trâu | `PHAN_BON` | bao (50kg) | `650.000 ₫` |
| **2** | Phân hữu cơ sinh học Trùn Quế | `PHAN_BON` | bao (25kg) | `180.000 ₫` |
| **3** | Chế phẩm nấm Trichoderma phòng nấm rễ | `THUOC_BVTV` | gói (1kg) | `95.000 ₫` |

---

## 5. Vụ mùa canh tác & Nhật ký hoạt động (Crop Cycles & Activity Logs)

### Vụ mùa 1: Vụ Thu Hoạch Cà Phê Arabica 2026
- **Lô đất:** Lô A1 - Sườn đồi Cầu Đất
- **Cây trồng:** Cà phê Arabica Cầu Đất
- **Thời gian:** `10/01/2026` đến `30/11/2026`
- **Dự kiến sản lượng:** `3.200 kg`
- **Nhật ký canh tác đã thực hiện:**
  - **Hoạt động 1 (Bón phân thúc):**
    - Ngày: `15/03/2026` (Ca sáng)
    - Loại HĐ: `BON_PHAN`
    - Nhân công thuê: 4 người x `300.000 ₫/ngày` = `1.200.000 ₫`
    - Vật tư tiêu thụ: 2 bao Phân NPK 16-16-8 = `1.300.000 ₫`
    - Chi phí phát sinh: `100.000 ₫`
    - **Tổng chi phí:** `2.600.000 ₫`
  - **Hoạt động 2 (Thu hoạch đợt 1):**
    - Ngày: `20/09/2026` (Ca sáng)
    - Loại HĐ: `THU_HOACH`
    - Nhân công thuê: 6 người x `350.000 ₫/ngày` = `2.100.000 ₫`
    - Sản lượng thu hoạch: `1.200 kg`
    - Đơn giá bán: `32.000 ₫/kg`
    - **Doanh thu đạt được:** `38.400.000 ₫`
    - **Lợi nhuận gộp:** `36.100.000 ₫`

### Vụ mùa 2: Vụ Dâu Tây Nhà Kính Hana - Quý 3/2026
- **Lô đất:** Nhà kính K1 - Giàn treo công nghệ cao
- **Cây trồng:** Dâu tây giống Hana / New Zealand
- **Thời gian:** `01/06/2026` đến `30/10/2026`
- **Nhật ký canh tác đã thực hiện:**
  - **Hoạt động (Thu hoạch dâu chín đợt rộ):**
    - Ngày: `25/09/2026` (Ca sáng)
    - Loại HĐ: `THU_HOACH`
    - Nhân công: Tự gia đình làm (`0 ₫`)
    - Chi phí hộp đựng đóng gói: `150.000 ₫`
    - Sản lượng thu hoạch: `150 kg`
    - Đơn giá bán tại vườn: `220.000 ₫/kg`
    - **Doanh thu:** `33.000.000 ₫`

---

## 6. Sản phẩm & Hóa đơn bán hàng (Products & Invoices)

- **Sản phẩm:** Cà phê Arabica Cầu Đất chế biến ướt (kg)
  - Đơn giá: `240.000 ₫/kg`
  - Tồn kho: `500 kg`
- **Hóa đơn mẫu:** Mã `HD-20260926-001`
  - Khách hàng: Công ty Cổ phần Cà phê Cao Nguyên
  - Số điện thoại: `0988776655`
  - Địa chỉ: Số 12 Phan Đình Phùng, TP. Đà Lạt
  - Mua: 100 kg x 240.000 ₫ = `24.000.000 ₫`
  - Giảm giá: `1.000.000 ₫`
  - **Tổng thanh toán:** `23.000.000 ₫`
  - Trạng thái: **COMPLETED** (Đã thanh toán)

---

## HƯỚNG DẪN NẠP DỮ LIỆU VÀO DATABASE

Mở terminal trong thư mục `backend` và chạy lệnh:
```bash
npm run seed
```
hoặc:
```bash
npx prisma db seed
```
Dữ liệu sẽ tự động được kiểm tra và nạp vào database mà không làm mất tài khoản cũ.
