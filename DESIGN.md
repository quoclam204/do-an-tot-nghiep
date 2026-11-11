---
name: DalatAgri
description: Smart Agricultural Notebook & Cooperative Field Ledger for Highland Farmers
colors:
  primary: "#137a3a"
  primary-dark: "#0d5c2b"
  primary-light: "#eaf6ee"
  primary-mid: "#c9e8d2"
  neutral-bg: "#ffffff"
  neutral-surface: "#fafafa"
  neutral-border: "#d1d1d1"
  neutral-border-light: "#e8e8e8"
  neutral-text: "#334155"
  neutral-heading: "#172033"
  neutral-muted: "#64748b"
  status-success: "#15803d"
  status-danger: "#dc2626"
  status-warning: "#b45309"
  status-info: "#1d6fb8"
  status-harvest: "#6e3eae"
typography:
  display:
    fontFamily: "Inter, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Inter, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.03em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.neutral-surface}"
  button-quick-action:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  card-surface:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
  page-header:
    backgroundColor: "{colors.neutral-bg}"
    borderColor: "{colors.neutral-border-light}"
    rounded: "{rounded.md}"
    padding: "20px 24px"
  kpi-card:
    backgroundColor: "{colors.neutral-bg}"
    borderColor: "{colors.neutral-border-light}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
  input-field:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-heading}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "8px 12px"
---

# Design System: DalatAgri

## Overview

**Creative North Star: "Sổ Điền Dã Tây Nguyên" (The Highland Field Ledger)**

Hệ thống thiết kế DalatAgri được xây dựng dựa trên hình tượng cuốn sổ tay điền dã đóng gáy xoắn chống nước, đồng hành cùng người nông dân và cán bộ hợp tác xã trên những triền đồi đất đỏ bazan Lâm Đồng. Triết lý thẩm mỹ tối thượng là **sự thực dụng tuyệt đối, tương phản rõ ràng và xúc giác tin cậy**. Mỗi thành phần giao diện được tạo ra không phải để trang trí trong phòng lạnh, mà để phục vụ người nông dân vừa rời tay cuốc, tay vòi xịt thuốc, có thể mở điện thoại ghi chép một cách dứt khoát chỉ trong 1-2 phút ngay dưới ánh nắng chói chang.

Bắt nguồn từ sự giao thoa giữa ngôn ngữ Microsoft Fluent phẳng tinh gọn và văn hóa canh tác điền dã mộc mạc, DalatAgri kiên quyết cự tuyệt phong cách bóng bẩy thị thành: không có kính mờ (glassmorphism), không có gradient phát sáng neon, không có những font chữ mảnh lướt thướt và không có các nút bấm nhỏ bé đòi hỏi sự khéo léo của chuột máy tính. Giao diện ưu tiên độ sắc nét, phân cấp rõ rệt từng khối tác vụ, và độ nảy cơ học (tactile scale 0.975) tạo cảm giác an tâm khi chạm ngón tay vào màn hình.

**Key Characteristics:**
- **Thực dụng ngoài thực địa (Field-First):** Màu sắc, độ tương phản và cỡ chữ được hiệu chuẩn để đọc rõ dưới ánh sáng ban ngày tự nhiên và màn hình điện thoại giá rẻ.
- **Bản lớn, một chạm tin cậy (Bold & Tactile):** Vùng tương tác tối thiểu 40px, phản hồi nhún nhẹ dứt khoát khi bấm, giảm thiểu tối đa thao tác nhập bàn phím ảo bằng các nút chọn nhanh.
- **Trật tự & Ngăn nắp điền dã:** Bố cục dạng thẻ (card) phân ranh giới bằng viền mảnh sắc nét thay vì bóng mờ phân tán, giữ cho bảng sổ sách luôn gọn gàng như cuốn sổ kế toán hợp tác xã.

## Colors

Bảng màu của DalatAgri lấy cảm hứng từ màu xanh lá thông Tây Nguyên làm hạt nhân uy tín, phối cùng hệ xám thanh sạch của Microsoft và hệ thống màu phân loại nông học chuẩn xác.

### Primary
- **Highland Pine Green** (`#137a3a`): Màu xanh lá đậm đặc trưng của nương cà phê và đồi thông Lâm Đồng. Sử dụng cho các hành động quan trọng nhất (Primary CTA, trạng thái hoạt động, chỉ số doanh thu dương, viền nhấn của sổ ghi chép).
- **Deep Pine Shade** (`#0d5c2b`): Trạng thái hover và active của nút chính, giữ độ tương phản cao khi tiếp xúc ánh sáng mạnh.
- **Pine Mist Tint** (`#eaf6ee`): Nền nhạt cho các thẻ tóm tắt, huy hiệu phân loại, tạo cảm giác dịu mắt và sạch sẽ.
- **Pine Leaf Border** (`#c9e8d2`): Đường viền cho các ô chọn nhanh và khung thông báo xanh.

### Neutral
- **Paper Canvas** (`#ffffff`): Nền chính của thẻ nội dung, ô nhập liệu và thanh điều hướng cố định.
- **Mist Surface** (`#fafafa`): Nền nền tảng toàn trang (`body`), tạo độ tương phản nhẹ êm dịu nâng đỡ các thẻ bảng dữ liệu.
- **Slate Ink** (`#172033`): Màu tiêu đề chính (`h1`, `h2`, `h3`), đen than đậm đà, không dùng đen tuyệt đối `#000000` để chống gắt mắt.
- **Bark Charcoal** (`#334155`): Màu chữ nội dung thông thường, đảm bảo chuẩn WCAG AAA trên nền trắng.
- **Soil Dust** (`#64748b`): Màu chữ phụ chú, nhãn thứ cấp, đơn vị tính và thời gian ghi chép.
- **Dry Ridge Border** (`#e8e8e8`): Viền phân cách nhẹ giữa các hàng bảng và ranh giới ô dữ liệu.
- **Slate Wire** (`#d1d1d1`): Viền tiêu chuẩn của ô input, khung thẻ và đường chia ranh giới chức năng.

### Semantic Status
- **Harvest Berry** (`#6e3eae` / `#f5f0ff`): Màu tím quả chín thu hoạch, dùng riêng cho hoạt động hái trái, sản lượng và mùa thu hoạch vàng.
- **Field Alert Red** (`#dc2626` / `#fdf3f2`): Màu đỏ cảnh báo sâu bệnh, chi phí xuất kho, nút xóa và thông báo lỗi.
- **Sun Herb Amber** (`#b45309` / `#fef3c7`): Màu vàng hổ phách cho phun thuốc BVTV, cảnh báo thời gian cách ly PHI và trạng thái ngoại tuyến.
- **Irrigation Stream** (`#1d6fb8` / `#eff6ff`): Màu xanh nước tưới và chi phí nhân công, công thợ.

### Named Rules
**The Daylight Legibility Rule.** Mọi văn bản hiển thị trên thiết bị di động phải đạt cỡ chữ tối thiểu 16px đối với trường nhập và 14px đối với nhãn đọc. Tỷ lệ tương phản màu văn bản trên màu nền luôn phải vượt ngưỡng 4.5:1 để nông dân đọc rõ ngoài nương rẫy dưới trời nắng gắt.

**The Single Voice Rule.** Màu xanh chủ đạo `#137a3a` chỉ được chiếm tối đa 15% diện tích thị giác của một màn hình. Sự hiện diện hiếm hoi và tập trung của nó chính là chỉ dấu điều hướng cho bà con nhận biết: "Đâu là nút quan trọng nhất cần bấm tiếp theo".

## Typography

**Display Font:** Inter, Segoe UI (với fallback `system-ui, -apple-system, sans-serif`)  
**Body Font:** Inter, Segoe UI (với fallback `system-ui, -apple-system, sans-serif`)  
**Label/Mono Font:** Cascadia Code, Consolas (với fallback `ui-monospace, monospace`)

**Character:** Sự kết hợp giữa nét chữ trung tính hiện đại của Inter và tính chuẩn mực công sở của Segoe UI mang lại cảm giác chữ viết rõ ràng, chân phương, không chân, nét chữ đồng đều và các số liệu tiền tệ/sản lượng hiển thị cực kỳ rành mạch.

### Hierarchy
- **Display** (`--font-display`: Bold 700, clamp(26px, 3.2vw, 36px), line-height 1.2, letter-spacing -0.02em): Tiêu đề chào đón đầu trang chủ và tên nông hộ lớn.
- **Headline** (`--font-headline`: Bold 700, clamp(20px, 2.4vw, 28px), line-height 1.25, letter-spacing -0.02em, `text-wrap: balance`): Tiêu đề trang chức năng chính (`Nhật Ký Mùa Vụ`, `Quản Lý Vườn & Thửa Đất`).
- **Title** (`--font-title`: Semi-bold 600, clamp(17px, 1.9vw, 22px), line-height 1.3, letter-spacing -0.015em, `text-wrap: balance`): Tiêu đề thẻ chức năng, tiêu đề nhóm bảng biểu và modal popup.
- **Body** (`--font-body`: Regular 400, 14.5px–15px, line-height 1.55, letter-spacing -0.01em, `text-wrap: pretty`, `max-width: 68ch`): Đoạn văn hướng dẫn, mô tả hoạt động canh tác, nội dung dòng nhật ký (tối đa 68 ký tự mỗi dòng để giữ nhịp đọc thoải mái).
- **Label** (`--font-label`: Bold 700, 12px, letter-spacing 0.035em, uppercase, `text-wrap: balance`): Nhãn danh mục, huy hiệu hoạt động (BÓN PHÂN, TƯỚI NƯỚC, XỊT THUỐC), nhãn KPI chỉ số.
- **Data & Numerals** (Extra-bold 800, clamp(24px, 2.4vw, 30px), `font-variant-numeric: tabular-nums`, `font-feature-settings: 'tnum' 1, 'cv05' 1`): Con số tài chính, tiền tệ VNĐ, sản lượng kg/tấn và ngày tháng.

### Named Rules
**The Big Numeral Rule.** Các con số thống kê tài chính (tiền lời, tổng chi, sản lượng kg) luôn được hiển thị ở kích cỡ 1.5rem (24px) trở lên với độ đậm 700 hoặc 800, kích hoạt `font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1`, đi kèm đơn vị rõ ràng (đ, kg, bao) đặt bên cạnh hoặc phía dưới, không bao giờ để số liệu dính liền gây nhầm lẫn nghìn với triệu.

**The No-Kicker Rule.** Tiêu đề trang tự mang sức nặng chính danh của mình. Huy hiệu trạng thái hoặc thẻ mùa vụ (nếu có) luôn hiển thị nội dòng (inline tag) ngay bên cạnh tiêu đề `h1`, tuyệt đối không thả lơ lửng bên trên như một dòng kicker/eyebrow thừa thãi.

## Layout

Hệ thống bố cục của DalatAgri được tổ chức theo trục dọc đơn luồng (single-column stack) trên thiết bị di động và mô hình lưới phẳng phân khu (grid-dashboard) trên máy tính bảng và máy tính để bàn:
- **Khung chứa chính (Container):** Chiều rộng trải dài tự nhiên với đệm an toàn `clamp(16px, 2.4vw, 36px)` ở hai mép, tối ưu triệt để không gian làm việc của bảng biểu và biểu mẫu.
- **Lưới chỉ số (KPI Grid):** Lưới tự co giãn đa cột `repeat(auto-fit, minmax(210px, 1fr))` với khoảng cách `gap: 1rem (16px)`, bảo đảm các ô tổng kết doanh thu, chi phí luôn dàn đều đẹp mắt.
- **Biểu mẫu & Bảng nhật ký:** Xếp chồng dọc tự nhiên (Form nhập ở trên, Lịch sử nhật ký ở dưới) giúp thao tác liền mạch: người dùng điền thông tin -> bấm Lưu -> dòng mới xuất hiện ngay đầu bảng bên dưới.
- **Khoảng cách nhịp điệu (Spacing Rhythm):** Dựa trên hệ số chuẩn 4px/8px: `xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`. Đệm bên trong các thẻ form là `18px–20px` tạo cảm giác thoáng đãng, không bị ngộp thở bởi dữ liệu.

## Elevation & Depth

DalatAgri theo đuổi triết lý **phẳng có cấu trúc (Structured Flatness)** lấy cảm hứng từ Microsoft Fluent. Hệ thống không sử dụng bóng đổ đa lớp dày đặc để tạo ảo giác lơ lửng, mà định hình không gian bằng **phân tầng sắc độ nền (Tonal Layering) và đường viền cứng cáp (Crisp Borders)**.

Mặt nền xám nhạt (`#fafafa`) làm nền tảng, các tấm thẻ trắng muốt (`#ffffff`) viền xám sáng (`#e8e8e8` hoặc `#d1d1d1`) nổi bật lên như những tờ phiếu kẹp trên bìa hồ sơ. Bóng đổ chỉ được kích hoạt trong hai trường hợp trạng thái động:
1. Khi rê chuột (Hover) hoặc nhấn chạm: Bóng mờ siêu nhẹ `0 4px 12px rgba(0, 0, 0, 0.05)` giúp xác nhận thành phần đang được tương tác.
2. Hộp thoại nổi (Modal) và thông báo (Toast): Bóng đổ nổi bật `0 6px 24px rgba(0, 0, 0, 0.18)` tách biệt hẳn lớp thao tác khẩn cấp khỏi nền làm việc.

### Shadow Vocabulary
- **Resting Surface:** `none` (viền `1px solid var(--ms-gray-200)` giữ độ phẳng tinh tươm).
- **Subtle Elevation (`--shadow-sm`):** `0 1px 2px rgba(15, 23, 42, 0.05)` — dùng cho thẻ KPI và nút bấm hành động phụ.
- **Interactive Lift (`--shadow-md`):** `0 4px 14px rgba(15, 23, 42, 0.07)` — dùng khi hover thẻ mùa vụ, vườn cây hoặc dropdown menu.
- **Modal Depth (`--shadow-lg`):** `0 12px 32px rgba(15, 23, 42, 0.12)` — dùng cho hộp thoại chi tiết vụ mùa, bóc tách hóa đơn OCR và cấp mã số vùng trồng.

### Named Rules
**The Border-Before-Shadow Rule.** Cấu trúc của khối giao diện phải được định hình hoàn toàn bằng đường viền sắc nét 1px trước khi nghĩ đến việc thêm bóng đổ. Một giao diện không bóng đổ vẫn phải rõ ràng tuyệt đối ranh giới giữa các khối.

## Shapes

Ngôn ngữ hình khối của DalatAgri mang tính kỷ luật công nghiệp nhẹ nhàng:
- **Bo góc tiêu chuẩn (`--radius-sm: 6px`):** Áp dụng cho nút bấm, ô input, ô chọn ngày tháng, dropdown menu, chip phân loại và bảng biểu. Góc bo 6px vừa đủ mềm mại để không sắc nhọn gây khó chịu, nhưng đủ dứt khoát để giữ vẻ nghiêm cẩn của hồ sơ kế toán.
- **Bo góc khung chứa (`--radius-md: 10px`):** Áp dụng cho các thẻ khối lớn (`farming-form-card`, `kpi-card`, `chart-card`).
- **Bo góc hộp thoại (`--radius-lg: 14px`):** Áp dụng cho Modal cửa sổ bật lên.
- **Bo tròn viên thuốc (`--radius-pill: 999px`):** Dành riêng cho các huy hiệu trạng thái ngoại tuyến (`header-status-badge`) và nhãn chào đón trang chủ (`welcome-tag`).

## Components

Mọi thành phần giao diện đều tuân thủ nguyên tắc: rõ ràng, dứt khoát, dễ chạm ngón tay và có phản hồi cơ học tức thì.

### Buttons
- **Shape:** Bo góc nhẹ 6px (`var(--radius-sm)`).
- **Primary (`.btn-primary`, `.elder-btn-primary`, `.btn-submit-log`):** Nền xanh lá thông `#137a3a`, chữ trắng đậm, viền đồng màu `#137a3a`, đệm `10px 20px`, chiều cao tối thiểu 40px. Khi hover chuyển sang `#0d5c2b`. Khi bấm chuột co nhẹ tỉ lệ `transform: scale(0.975)` tạo phản hồi nảy xúc giác.
- **Secondary (`.elder-btn-secondary`, `.login-btn`):** Nền trắng `#ffffff`, chữ xám `#334155`, viền xám `#d1d1d1`. Khi hover chuyển nền xám nhạt `#f5f5f5`.
- **Quick Action (`.btn-quick-today`, `.btn-seed-lamdong`):** Nền xanh ngọc nhạt `#ecfdf5`, chữ xanh lá đậm `#047857`, viền `#a7f3d0`. Nút chọn nhanh ngày "Hôm Nay" giúp ghi nhật ký trong 1 chạm.
- **Destructive (`.btn-delete-icon`):** Nền hồng nhạt `#fef2f2`, chữ đỏ `#c42b1c`, viền `#fdd`. Chỉ kích hoạt khi xóa dòng nhật ký hoặc hủy mùa vụ.

### Chips & Badges
- **Activity Badges:** Huy hiệu phân loại hoạt động canh tác với màu sắc nông học phân biệt:
  - Bón phân: Nền xanh lá nhạt (`#eaf6ee`), chữ xanh (`#137a3a`).
  - Phun thuốc: Nền vàng nắng (`#fef8ec`), chữ hổ phách (`#8a6a00`).
  - Cắt tỉa: Nền chàm nhạt (`#eef2ff`), chữ xanh chàm (`#4338ca`).
  - Làm cỏ: Nền xám nhạt (`#f5f5f5`), chữ xám vừa (`#5a5a5a`).
  - Tưới nước: Nền lam nhạt (`#eff6ff`), chữ lam đậm (`#1d6fb8`).
  - Thu hoạch: Nền tím nhạt (`#f5f0ff`), chữ tím đậm (`#6e3eae`).

### Cards / Containers
- **Corner Style:** Bo góc 8px–10px (`--radius-md: 10px`).
- **Background:** Nền trắng tuyệt đối `#ffffff` hoặc bề mặt trung tính nhẹ.
- **Border:** `1px solid var(--border-light, #e8e8e8)` (viền xám thanh mảnh theo chuẩn Structured Flatness; tuyệt đối không dùng viền màu dày `border-left > 1px` kiểu cũ). Phân cấp thẻ tiêu điểm bằng dải viền bao quanh toàn diện 1.5px hoặc nền chuyển sắc tinh tế (`#f7fbf8`).
- **Internal Padding:** `1.15rem–1.25rem` (18px–20px).

### Extracted Core UI Components (`frontend/src/components/ui/`)

Bộ thư viện thành phần giao diện chuẩn hóa tái sử dụng dùng chung cho toàn bộ các trang chức năng của DalatAgri:

#### 1. PageHeader (`PageHeader.jsx`)
Thành phần tiêu đề chuẩn hóa thay thế toàn bộ các biến thể hero banner trang riêng lẻ (`.farms-hero-banner`, `.crops-hero-banner`, `.materials-hero-banner`, `.seasons-hero-banner`, `.reports-hero-banner`, `.farming-header`).
- **Props:**
  - `title`: Tên trang / tính năng chính (chữ đậm, tương phản cao, cỡ `clamp(1.15rem, 2vw, 1.35rem)`).
  - `subtitle` / `description`: Diễn giải vắn tắt chức năng hoặc phạm vi dữ liệu.
  - `badge`: Huy hiệu phân loại hoặc tag định danh (nhận string hoặc `{ icon, label }`).
  - `icon`: Icon tiêu đề trực quan biểu trưng cho mô-đun.
  - `actions`: Vùng chứa các nút thao tác chính (`Primary CTA`, bộ lọc nhanh nông hộ, nút quét OCR...).
  - `children`: Vùng nội dung mở rộng (thẻ phụ, thống kê nhanh, thanh tiến độ...).
- **Quy cách:** Viền 1px thanh mảnh, bo góc 10px, đệm 20px 24px, hỗ trợ co giãn responsive mượt mà trên điện thoại.

#### 2. KpiCard & KpiGrid (`KpiCard.jsx`)
Thẻ chỉ số hiệu năng và lưới thống kê chuẩn hóa tuân thủ nghiêm ngặt **The Big Numeral Rule**:
- **Props:**
  - `label`: Nhãn chỉ số viết hoa tinh gọn (`font-size: 0.75rem`, `font-weight: 700`, `letter-spacing: 0.04em`).
  - `value`: Giá trị định lượng chính, hiển thị cỡ số lớn `clamp(1.5rem, 2.4vw, 1.85rem)`, `font-weight: 800`, hỗ trợ `font-feature-settings: 'tnum' 1, 'cv05' 1`.
  - `unit`: Đơn vị định lượng rõ ràng (`đ`, `ha`, `kg`, `tấn`, `vụ`, `lần`).
  - `icon`: Icon đại diện với hộp nền tròn mềm mại 34x34px.
  - `variant`: Biến thể ngữ nghĩa (`green`, `red`, `blue`, `purple`, `amber`, `neutral`).
  - `subtext`: Chú giải phụ hoặc phân rã số liệu (ví dụ: số lượt ghi, tỷ trọng vật tư).
  - `action`: Nút hành động hoặc link xem chi tiết giải trình.
  - `highlight`: Viền sáng làm nổi bật thẻ số liệu quan trọng nhất (doanh thu, lợi nhuận).
  - `onClick`: Tùy chọn tương tác chạm/click với hiệu ứng nảy xúc giác `transform: translateY(-2px)`.
- **KpiGrid:** Khung lưới bố cục tự động co giãn (`grid-template-columns: repeat(auto-fit, minmax(210px, 1fr))`, `gap: 1rem`) đảm bảo hiển thị 4 cột trên màn hình rộng và 1-2 cột trên điện thoại.

### Inputs & Selects
- **Style:** Viền `1px solid #d1d1d1`, nền trắng, bo góc 6px, chiều cao tối thiểu 40px (trên mobile cỡ chữ bắt buộc 16px để chống zoom tự động).
- **Focus:** Viền chuyển màu xanh thông `#137a3a`, vòng sáng nhẹ bao quanh `outline: 2px solid var(--ms-green); outline-offset: 2px`.
- **Currency Input:** Ô nhập tiền tệ tích hợp nhãn đơn vị `VNĐ` dính liền ở góc phải nền xám nhạt, tự động định dạng dấu chấm phân cách hàng nghìn.

### Navigation (Header & Bottom Sheet)
- **Desktop:** Thanh điều hướng màu trắng siêu mỏng cao 48px cố định trên đỉnh màn hình, viền dưới `1px solid #e8e8e8`. Tab đang chọn có đường viền gạch chân màu xanh thông 2px (`border-bottom: 2px solid var(--ms-green)`). Dropdown Quản lý mở mượt mà dạng lưới 2 cột.
- **Mobile:** Thanh trạng thái ngoại tuyến tích hợp hiển thị số bản ghi chờ đồng bộ (`pendingCount`) với icon xoay động thái, hỗ trợ chạm để ép đồng bộ tức thì.

## Do's and Don'ts

### Do:
- **Do** đảm bảo mọi nút bấm trên thiết bị di động có chiều cao tối thiểu 40px và vùng chạm tối thiểu 44x44px.
- **Do** luôn cung cấp nút chọn nhanh (ví dụ: nút "Hôm nay", danh mục cây trồng mẫu) để nông dân không phải nhập liệu tay phức tạp.
- **Do** hiển thị huy hiệu trạng thái mạng ngoại tuyến và số bản ghi chờ sync ở vị trí dễ nhìn thấy nhất.
- **Do** dùng ngôn ngữ nông nghiệp Việt Nam chuẩn xác và bình dân ("Lô", "Vườn", "Thửa đất", "Bón phân", "Cách ly PHI", "Công thợ").
- **Do** định dạng toàn bộ số tiền theo chuẩn Việt Nam có dấu phân cách nghìn (`150.000 đ`, `12.500.000 đ`).

### Don't:
- **Don't** dùng hiệu ứng kính mờ (glassmorphism / `backdrop-filter: blur`), bóng đổ mờ nhạt loang lổ gây lóa mắt ngoài trời nắng.
- **Don't** dùng font chữ thanh mảnh (font-weight dưới 400) hoặc chữ màu xám quá nhạt (dưới tương phản 4.5:1) trên nền trắng.
- **Don't** bắt người dùng phải có kết nối Internet mới mở được biểu mẫu ghi nhật ký vụ mùa.
- **Don't** dùng tiếng Anh hoặc thuật ngữ IT chuyên ngành (như "CRUD", "Sync Payload", "CapEx Depreciation" mà phải diễn giải thành "Vốn kiến thiết cơ bản & Khấu hao").
- **Don't** lạm dụng bảng màu rực rỡ neon hoặc nhiều hơn một màu chủ đạo tích cực trên cùng một bề mặt thao tác.
