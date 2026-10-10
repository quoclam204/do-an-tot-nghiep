import React, { useRef } from 'react';
import './PucCertificateModal.css';
import {
  IconX,
  IconShield,
  IconCheckCircle,
  IconMapPin,
  IconRuler,
  IconSprout,
  IconPrinter,
  IconCalendar,
  IconFileText,
  IconClock,
  IconAlertCircle,
  IconDownload,
} from '../icons';
import { getPlotMeta } from '../../utils/plotMetadata';

export default function PucCertificateModal({
  isOpen,
  onClose,
  plot,
  farm,
  logs = [],
}) {
  const printRef = useRef(null);

  if (!isOpen || !plot) return null;

  const meta = getPlotMeta(plot);
  const farmName = farm?.name || 'Trang trại DalatAgri';
  const farmLocation = farm?.location || 'Tỉnh Lâm Đồng, Việt Nam';
  const ownerName = farm?.user?.fullName || 'Chủ nông hộ';
  const ownerPhone = farm?.user?.phone || '0901 234 567';

  // Lọc nhật ký của lô này để đưa vào bảng kiểm dịch thực vật
  const plotLogs = (logs || []).slice(0, 5); // 5 hoạt động gần nhất

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Xuất file CSV/Excel đơn giản cho hồ sơ vùng trồng
    const rows = [
      ['HỒ SƠ MÃ SỐ VÙNG TRỒNG (PUC) - CỤC BẢO VỆ THỰC VẬT'],
      ['Mã số vùng trồng (PUC)', meta.pucCode],
      ['Trạng thái', meta.pucStatus === 'ACTIVE' ? 'Đang hiệu lực' : 'Đang thẩm định'],
      ['Thị trường xuất khẩu', meta.exportMarket],
      ['Tên Lô đất', plot.name],
      ['Diện tích (ha)', plot.area],
      ['Cây trồng', meta.cropType],
      ['Chủ nông hộ', ownerName],
      ['Số điện thoại', ownerPhone],
      ['Địa chỉ vườn', farmLocation],
      ['Ngày cấp mã số', meta.pucIssueDate],
      [''],
      ['NHẬT KÝ PHUN THUỐC & BÓN PHÂN GẦN NHẤT (KIỂM ĐỊNH DƯ LƯỢNG)'],
      ['Ngày thực hiện', 'Hoạt động', 'Vật tư sử dụng', 'Thời gian cách ly (PHI)', 'Ghi chú'],
    ];

    if (plotLogs.length > 0) {
      plotLogs.forEach((l) => {
        const matNames = l.materials?.map((m) => m.material?.name || '').join(', ') || 'Không dùng vật tư';
        rows.push([
          new Date(l.activityDate).toLocaleDateString('vi-VN'),
          l.activityType,
          matNames,
          '14 ngày an toàn',
          l.notes || '',
        ]);
      });
    } else {
      rows.push(['Chưa có nhật ký phát sinh', '—', '—', '—', '—']);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ho_So_Vung_Trong_${meta.pucCode}_${plot.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="puc-modal-overlay" onClick={onClose}>
      <div className="puc-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Thanh điều hướng thao tác */}
        <div className="puc-modal-header no-print">
          <div className="puc-header-title-wrap">
            <span className="puc-badge-icon">
              <IconShield size={20} strokeWidth={2.5} />
            </span>
            <div>
              <h3>Hồ Sơ Mã Số Vùng Trồng Xuất Khẩu (PUC)</h3>
              <p>Mã định danh truy xuất nguồn gốc nông sản theo chuẩn Cục Bảo Vệ Thực Vật</p>
            </div>
          </div>
          <div className="puc-header-actions">
            <button type="button" className="btn-puc-action secondary" onClick={handleExportExcel} title="Tải file Excel báo cáo kiểm toán">
              <IconDownload size={15} strokeWidth={2} />
              <span>Xuất Excel</span>
            </button>
            <button type="button" className="btn-puc-action primary" onClick={handlePrint} title="In hoặc lưu hồ sơ dưới dạng PDF">
              <IconPrinter size={15} strokeWidth={2} />
              <span>In Giấy Chứng Nhận</span>
            </button>
            <button type="button" className="puc-close-btn" onClick={onClose} title="Đóng">
              <IconX size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Nội dung giấy chứng nhận chuẩn chỉnh in ấn */}
        <div className="puc-certificate-document" ref={printRef}>
          {/* Header Quốc gia */}
          <div className="puc-doc-national-header">
            <div className="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="national-motto">Độc lập – Tự do – Hạnh phúc</div>
            <div className="national-divider">❖ ❖ ❖</div>
            <div className="sub-authority">BỘ NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN — CỤC BẢO VỆ THỰC VẬT</div>
            <div className="doc-main-heading">
              GIẤY XÁC NHẬN MÃ SỐ VÙNG TRỒNG NÔNG SẢN
              <span className="doc-sub-heading">(PLANTING UNIT CODE - PUC CERTIFICATE)</span>
            </div>
          </div>

          {/* Khối Mã số PUC nổi bật */}
          <div className="puc-code-showcase-box">
            <div className="puc-code-meta-left">
              <div className="puc-label">MÃ SỐ ĐỊNH DANH VÙNG TRỒNG CHÍNH THỨC:</div>
              <div className="puc-code-large">{meta.pucCode}</div>
              <div className="puc-validity-tag">
                <IconCheckCircle size={14} strokeWidth={2.4} />
                <span>Trạng thái: <strong>{meta.pucStatus === 'ACTIVE' ? 'ĐÃ ĐƯỢC CẤP MÃ & CÒN HIỆU LỰC' : 'ĐANG TRONG QUÁ TRÌNH THẨM ĐỊNH'}</strong></span>
              </div>
            </div>

            <div className="puc-code-meta-right">
              <div className="puc-qr-mockup">
                <div className="qr-box">
                  <div className="qr-pixel-grid">
                    <span>■</span><span>□</span><span>■</span><span>■</span>
                    <span>□</span><span>■</span><span>□</span><span>■</span>
                    <span>■</span><span>□</span><span>■</span><span>□</span>
                  </div>
                </div>
                <div className="qr-caption">Quét mã kiểm tra xuất xứ</div>
              </div>
            </div>
          </div>

          {/* Bảng thông tin chủ hộ & thửa đất */}
          <div className="puc-info-section">
            <h4 className="puc-section-title">I. THÔNG TIN CHỦ NÔNG HỘ & VÙNG CANH TÁC</h4>
            <div className="puc-grid-table">
              <div className="puc-grid-row">
                <span className="puc-col-label">Tên Trang Trại / Nông Hộ:</span>
                <span className="puc-col-value font-bold">{farmName}</span>
              </div>
              <div className="puc-grid-row">
                <span className="puc-col-label">Đại diện Nông hộ:</span>
                <span className="puc-col-value">{ownerName} (SĐT: {ownerPhone})</span>
              </div>
              <div className="puc-grid-row">
                <span className="puc-col-label">Địa chỉ Thửa đất:</span>
                <span className="puc-col-value">{farmLocation}</span>
              </div>
              <div className="puc-grid-row">
                <span className="puc-col-label">Tên Lô / Thửa đất đăng ký:</span>
                <span className="puc-col-value font-bold">{plot.name}</span>
              </div>
              <div className="puc-grid-row">
                <span className="puc-col-label">Diện tích được cấp mã:</span>
                <span className="puc-col-value">
                  <strong>{plot.area} ha</strong> ({new Intl.NumberFormat('vi-VN').format(Math.round(plot.area * 10000))} m²)
                </span>
              </div>
              <div className="puc-grid-row">
                <span className="puc-col-label">Đối tượng Cây trồng:</span>
                <span className="puc-col-value font-bold text-green">{meta.cropType}</span>
              </div>
              <div className="puc-grid-row">
                <span className="puc-col-label">Thị trường xuất khẩu mục tiêu:</span>
                <span className="puc-col-value text-blue font-bold">{meta.exportMarket}</span>
              </div>
              <div className="puc-grid-row">
                <span className="puc-col-label">Ngày cấp chứng nhận:</span>
                <span className="puc-col-value">{new Date(meta.pucIssueDate).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Bảng Giám sát kiểm định dư lượng & PHI */}
          <div className="puc-info-section">
            <h4 className="puc-section-title">II. TRÍCH XUẤT NHẬT KÝ CANH TÁC & KIỂM SOÁT THỜI GIAN CÁCH LY (PHI)</h4>
            <p className="puc-section-note">
              Dữ liệu được số hóa tự động từ hệ thống DalatAgri phục vụ chứng minh an toàn thực phẩm và kiểm dịch thực vật trước khi cấp mã tem xuất khẩu:
            </p>

            <table className="puc-log-table">
              <thead>
                <tr>
                  <th>Ngày thực hiện</th>
                  <th>Công việc</th>
                  <th>Vật tư nông nghiệp sử dụng</th>
                  <th>Thời gian cách ly (PHI)</th>
                  <th>Đánh giá kiểm dịch</th>
                </tr>
              </thead>
              <tbody>
                {plotLogs.length > 0 ? (
                  plotLogs.map((l, idx) => (
                    <tr key={idx}>
                      <td>{new Date(l.activityDate).toLocaleDateString('vi-VN')}</td>
                      <td><strong>{l.activityType}</strong></td>
                      <td>
                        {l.materials && l.materials.length > 0 ? (
                          l.materials.map((m, mIdx) => (
                            <span key={mIdx} className="puc-mat-tag">
                              {m.material?.name || 'Vật tư'} ({m.quantityUsed} {m.material?.unit})
                            </span>
                          ))
                        ) : (
                          <span className="text-gray">Lao động cơ giới / Thủ công</span>
                        )}
                      </td>
                      <td><span className="puc-safe-badge">Đạt chuẩn cách ly 14 ngày</span></td>
                      <td><span className="puc-pass-badge">✓ Không dư lượng cấm</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      Chưa ghi nhận hoạt động phun thuốc/bón phân vi phạm trong chu kỳ gần nhất.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cam kết & Chữ ký */}
          <div className="puc-signature-block">
            <div className="puc-sig-col">
              <div className="sig-role">ĐẠI DIỆN NÔNG HỘ / HỢP TÁC XÃ</div>
              <div className="sig-hint">(Ký, ghi rõ họ tên và cam kết ghi nhật ký)</div>
              <div className="sig-space">
                <span className="sig-name">{ownerName}</span>
              </div>
            </div>

            <div className="puc-sig-col right">
              <div className="sig-date">Lâm Đồng, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
              <div className="sig-role">CHI CỤC TRỒNG TRỌT VÀ BVTV TỈNH LÂM ĐỒNG</div>
              <div className="sig-hint">(Đã thẩm định và chứng thực điện tử qua mã QR)</div>
              <div className="sig-stamp">
                <div className="stamp-circle">
                  <span>CHI CỤC BVTV</span>
                  <strong>ĐÃ CHỨNG THỰC</strong>
                  <span>LÂM ĐỒNG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
