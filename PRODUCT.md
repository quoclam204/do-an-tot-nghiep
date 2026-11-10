# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Nông hộ & Chủ vườn gia đình tại Đà Lạt, Lâm Đồng & Tây Nguyên:** Trực tiếp canh tác cây công nghiệp và cây ăn trái lâu năm (cà phê, sầu riêng, bơ, mắc-ca, tiêu...). Người dùng thường lớn tuổi, ít rành công nghệ, cần ghi chép công việc hàng ngày ngay tại nương rẫy, vườn đồi.
- **Thành viên & Nông dân làm việc trong nông hộ (Workers):** Nhân công hoặc thành viên gia đình được giao quyền ghi nhật ký, theo dõi và xuất nhập vật tư (phân bón, thuốc bảo vệ thực vật) theo từng ca làm việc.
- **Ban quản lý Hợp tác xã (HTX) / Doanh nghiệp liên kết:** Giám sát nhật ký canh tác của các nông hộ thành viên, quản lý hồ sơ mã số vùng trồng (PUC), kiểm soát dư lượng thuốc bảo vệ thực vật (thời gian cách ly PHI) để phục vụ xuất khẩu chính ngạch hoặc chứng nhận VietGAP/GlobalGAP.
- **Quản trị viên hệ thống (Admin):** Kiểm duyệt tài khoản nông hộ, chuẩn hóa danh mục cây trồng mẫu, danh mục vật tư dùng chung và giám sát báo cáo toàn hệ thống.

## Product Purpose
DalatAgri là "Sổ tay nông nghiệp thông minh" số hóa toàn diện quy trình canh tác cho nông dân và hợp tác xã tại vùng nông sản Đà Lạt / Lâm Đồng. Sản phẩm thay thế cuốn sổ tay giấy truyền thống vốn dễ ướt mưa, rách nát và thất lạc ngoài nương rẫy; giúp bà con dễ dàng ghi chép nhật ký phân thuốc, tự động cộng chi phí mùa vụ, minh bạch hóa dữ liệu xuất xứ vùng trồng và kiểm soát thời gian cách ly nông sản trước khi thu hoạch.

## Positioning
Khác với các hệ thống ERP hoặc phần mềm quản lý nông trại phức tạp vốn thiết kế cho chuyên viên văn phòng, DalatAgri định vị là **Sổ tay điện tử ngoại tuyến (Offline-First) siêu tối giản, thiết kế riêng cho người lớn tuổi (Elder-friendly UI)**:
- Chữ to, nút bấm lớn bản rộng, tương phản cao, thao tác 1-chạm không gây bối rối.
- Mất sóng 4G/WiFi ngoài nương rẫy vẫn mở sổ ghi chép trơn tru (lưu trữ IndexedDB cục bộ), tự động đồng bộ lên máy chủ ngay khi có mạng trở lại.
- Tích hợp chuẩn hóa nông học chuyên sâu cho cây dài ngày Tây Nguyên: chu kỳ kiến thiết cơ bản nhiều năm (CapEx), khấu hao vườn cây và mã số vùng trồng xuất khẩu (PUC).

## Operating Context
- **Môi trường hoạt động thực tế:** Nương rẫy dốc, vườn đồi, nhà kính nông nghiệp cách xa khu dân cư; điều kiện thời tiết nắng gắt hoặc mưa gió, kết nối mạng 3G/4G chập chờn hoặc mất sóng hoàn toàn.
- **Thiết bị:** Điện thoại thông minh bình dân của nông dân (màn hình nhỏ, cấu hình vừa phải), máy tính bảng hoặc máy tính để bàn tại văn phòng hợp tác xã.
- **Thói quen & Nghi thức:** Nông dân vừa xong ca làm đất, bón phân, xịt thuốc hoặc thu hoạch; tay lấm lem, cần ghi nhận trong vòng 1-2 phút; cuối vụ cần mở sổ xem lại tổng tiền phân thuốc, công thợ và tính lời/lỗ mà không phải bấm máy tính tay.

## Capabilities and Constraints
- **Nhật ký canh tác & Mùa vụ (Farming Logs & Seasons):** Ghi chép hoạt động (Làm đất, Tưới nước, Bón phân, Xịt thuốc, Tỉa cành, Thu hoạch), chọn ca làm việc, ghi nhận công thợ tự làm hay thuê ngoài.
- **Cơ chế Ngoại tuyến (Offline-First Architecture):** Lưu trữ hàng đợi đồng bộ và dữ liệu danh mục trên IndexedDB (`DalatAgriLocalDB`), hỗ trợ PWA cài đặt lên màn hình chính điện thoại, hiển thị trạng thái mạng và số bản ghi chờ sync ở thanh điều hướng.
- **Quản lý Vườn, Lô đất & Cây trồng:** Phân bổ diện tích, quản lý giống cây chủ lực Tây Nguyên (Cà phê Robusta/Arabica, Sầu riêng Ri6/Monthong Dona, Mắc-ca, Bơ 034...), quy trình sinh trưởng đa giai đoạn.
- **Quản lý Mã số vùng trồng (PUC) & Khấu hao CapEx:** Theo dõi mã số vùng trồng xuất khẩu sang Trung Quốc (GACC) hay Châu Âu (EUDR), kiểm soát thời gian cách ly thuốc BVTV (PHI), tính khấu hao đầu tư kiến thiết cơ bản vườn cây nhiều năm.
- **Kho vật tư & Bóc tách hóa đơn (OCR):** Quản lý phân bón, thuốc BVTV, tồn kho; hỗ trợ quét hóa đơn bằng camera/ảnh chụp thông qua OCR/AI Vision.
- **Báo cáo tài chính & Xuất dữ liệu:** Báo cáo chi phí phân thuốc, nhân công, máy móc, doanh thu thu hoạch, ước tính lời lỗ; xuất báo cáo PDF, DOCX, Excel.
- **Ràng buộc:** Tính năng Bán hàng/Hóa đơn thương mại hiện đang tạm ẩn (chuyển hướng về Dashboard) để dồn toàn bộ trọng tâm vào Sổ nhật ký canh tác và Quản lý nông hộ.
- **Ngôn ngữ:** Giao diện 100% tiếng Việt thân thuộc với từ ngữ nhà nông ("luống", "lô", "rẫy", "nông hộ", "xịt thuốc", "cách ly PHI", "công thợ").

## Brand Commitments
- **Tên sản phẩm:** DalatAgri (Sổ Tay Nông Nghiệp Thông Minh).
- **Nhận diện cốt lõi:** Màu xanh lá nông nghiệp (#137a3a), phong cách thiết kế phẳng, thanh thoát, tinh gọn lấy cảm hứng từ Fluent Design.
- **Tông giọng (Voice):** Chân thành, mộc mạc, gần gũi, rõ ràng và kính trọng đối với bà con nông dân ("Xin chào", "Chúc bạn một ngày làm việc thuận lợi và mùa màng bội thu", "Bà con", "Vào ghi sổ ngay").

## Evidence on Hand
- Mã nguồn đầy đủ gồm Frontend (React 19, Vite, React Router 7, PWA, IndexedDB) và Backend (NestJS, Prisma, PostgreSQL).
- Bộ dữ liệu mẫu chuẩn nông học Lâm Đồng (`seedLamDongData`) với các giống cây chủ lực và loại vật tư, chu kỳ sinh trưởng chuẩn khoa học.
- Đồ án tốt nghiệp ứng dụng thực tế cao, phục vụ cộng đồng bà con nông dân miễn phí.

## Product Principles
1. **Ưu tiên số một cho ngoài đồng ruộng (Field-First & Offline-First):** Ứng dụng phải hoạt động mượt mà kể cả khi không có một vạch sóng nào; không bao giờ để nông dân mất dòng nhật ký vừa ghi.
2. **Thiết kế tối giản, dễ đọc cho người lớn tuổi (Elder-Centric Accessibility):** Chữ phải to, nút phải rõ, hạn chế tối đa nhập liệu văn bản tự do bằng các danh mục chọn nhanh và số lượng gợi ý.
3. **Chính xác về mặt nông học & pháp lý xuất khẩu:** Dữ liệu nhật ký phải đáp ứng được yêu cầu cách ly thuốc (PHI) và truy xuất nguồn gốc mã số vùng trồng (PUC) khi cần thẩm định xuất khẩu.
4. **Minh bạch tài chính không cần tính toán thủ công:** Tự động quy đổi và tổng hợp mọi chi phí vật tư, công thợ thành sổ thu chi rõ ràng, giúp nông dân biết chính xác lời lỗ sau từng vụ mùa.

## Accessibility & Inclusion
- Hỗ trợ chế độ "Chữ to dễ đọc" với font size lớn (tối thiểu 16px trên di động để tránh zoom tự động trên iOS, tỷ lệ tương phản cao WCAG AA).
- Nút bấm và vùng chạm cảm ứng lớn (tối thiểu 44x44px) hỗ trợ thao tác dễ dàng ngay cả khi tay nông dân đeo găng tay hoặc dính đất.
- Hỗ trợ cài đặt PWA (Progressive Web App) để nông dân có thể sử dụng biểu tượng ứng dụng ngoài màn hình chính như một app di động nguyên bản mà không cần qua app store phức tạp.
