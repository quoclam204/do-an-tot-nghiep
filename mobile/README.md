# 📱 DalatAgri Mobile App (React Native - Expo SDK 52)

Ứng dụng di động độc lập dành cho Nông Dân và Quản Lý Nông Trại Đà Lạt, được xây dựng bằng **React Native (Expo)** và đồng bộ 100% dữ liệu với hệ thống **Backend NestJS** & **Web Portal**.

---

## 🏗 Kiến trúc Đồng bộ Song song (Như Facebook Web & App)
* **Web Portal (`frontend/`):** React Vite + PWA dành cho máy tính và máy tính bảng.
* **Mobile Native App (`mobile/`):** React Native dành cho điện thoại iOS & Android, thao tác trực tiếp ngoài đồng ruộng.
* **Backend API (`backend/`):** NestJS REST API đồng bộ thời gian thực hai chiều giữa Web và Mobile.

---

## 🌟 Toàn bộ Tính năng & Màn hình Đầy đủ như Bản Web

| Màn hình Mobile | Tính năng tương ứng trên Bản Web | Trạng thái |
| :--- | :--- | :---: |
| **Đăng nhập & Đăng ký** (`LoginScreen.js`) | Đăng nhập, Đăng ký tài khoản Nông hộ, Chuyển đổi máy chủ Local LAN vs Cloud Render | ✅ 100% |
| **Trang chủ Dashboard** (`HomeScreen.js`) | KPI Vườn - Vụ mùa - Nhật ký, Phím tắt điều hướng nhanh đến toàn bộ 8 phân hệ | ✅ 100% |
| **Nhật ký Canh tác** (`FarmingLogsScreen.js`) | Lọc công việc (Bón phân, Tưới nước, Phun thuốc, Cắt tỉa, Thu hoạch...), Tìm kiếm, Chọn Mùa vụ/Lô đất/Vật tư từ kho, Chi phí, Sửa & Xóa nhật ký | ✅ 100% |
| **Quản lý Mùa vụ** (`SeasonsScreen.js`) | Bộ lọc trạng thái (Đang canh tác, Đã kết thúc, Kế hoạch), Tạo vụ mới liên kết Cây trồng & Lô đất, Đánh dấu hoàn thành vụ, Báo cáo kinh tế chi tiết vụ mùa (Vốn, Doanh thu, Lợi nhuận, ROI %) | ✅ 100% |
| **Thu hoạch Nông sản** (`HarvestScreen.js`) | Cân đo sản lượng kg/tấn, Đơn giá bán, Tự động tính thành tiền, Đợt thu hoạch (Đợt 1, Rộ vụ, Cuối vụ), Tên thương lái/siêu thị, KPI sản lượng & doanh thu | ✅ 100% |
| **Nông trại & Thửa đất** (`FarmsScreen.js`) | Quản lý vườn tược (Thêm, Sửa, Xóa), Quản lý Lô đất (Diện tích, Thổ nhưỡng đất đỏ bazan), **Quản lý Thành viên Nông hộ** (Thêm tài khoản nông dân/kỹ thuật, Phân quyền, Xóa thành viên) | ✅ 100% |
| **Danh mục Cây trồng** (`CropsScreen.js`) | Bộ lọc phân loại (Ăn quả, Rau củ, Hoa, Công nghiệp), Chu kỳ sinh trưởng, Độ pH tối ưu, Mật độ gieo trồng, **Nút Nạp mẫu Lâm Đồng** (Cà phê, Sầu riêng, Dâu tây, Mắc ca...), Modal chi tiết kỹ thuật | ✅ 100% |
| **Kho Vật tư Nông nghiệp** (`InventoryScreen.js`) | Phân loại (Phân bón, Thuốc BVTV, Hạt giống, Khác), Cảnh báo sắp hết kho (< 5), **Nhập thêm hàng nhanh (Quick Restock)**, Thêm/Sửa/Xóa vật tư | ✅ 100% |
| **Báo cáo Kinh tế & Tài chính** (`ReportsScreen.js`) | Lợi nhuận ròng Hero Card, Tỷ suất lợi nhuận ROI %, Tổng doanh thu vs Tổng chi phí, Cơ cấu chi phí (Vật tư, Nhân công, Khác), Bộ lọc theo Nông trại và Vụ mùa | ✅ 100% |
| **Hồ sơ Cá nhân & Quản trị** (`ProfileScreen.js`) | Chỉnh sửa Họ tên & Số điện thoại, Thông tin kết nối mạng, **Quản trị Người dùng hệ thống (ADMIN: Xem danh sách, Đổi quyền, Khóa/Mở tài khoản)** | ✅ 100% |

---

## 🚀 Hướng dẫn Chạy Thử 

### Cách 1: Xem trực tiếp trên Trình duyệt Laptop
Trong terminal đang chạy `npx expo start`, bạn chỉ cần nhấn phím **`w`** trên bàn phím:
Expo sẽ tự động mở giao diện ứng dụng trên trình duyệt web tại `http://localhost:8081`!

### Cách 2: Chạy trực tiếp trên Điện thoại thật bằng Expo Go
1. Tải ứng dụng **Expo Go** trên CH Play (Android) hoặc App Store (iOS).
2. Kết nối điện thoại vào **cùng mạng Wifi** với laptop (IP LAN hiện tại: `192.168.155.147`).
3. Mở Expo Go (hoặc Máy ảnh trên iPhone), quét mã QR trên màn hình terminal máy tính.
4. Ứng dụng sẽ tải bundle và chạy mượt mà như một ứng dụng Native đích thực!

---

## 📦 Xuất file cài đặt APK (Android) nộp đồ án
```bash
npx eas-cli build -p android --profile preview
```
