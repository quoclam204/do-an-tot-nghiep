import React, { useMemo } from 'react';
import './FinancialExplanationModal.css';
import {
  IconX,
  IconCircleDollar,
  IconLineChart,
  IconCalculator,
  IconClipboardList,
} from '../icons';

export default function FinancialExplanationModal({
  isOpen,
  onClose,
  financials,
  logs = [],
  initialTab = 'EXPENSE',
}) {
  // Bóc tách chi tiết số liệu từ danh sách nhật ký
  const breakdown = useMemo(() => {
    let materialTotal = 0;
    let laborTotal = 0;
    let otherTotal = 0;
    let revenueTotal = 0;
    let harvestQtyTotal = 0;

    const materialItems = [];
    const otherItems = [];
    const harvestItems = [];
    const careLogs = [];

    logs.forEach((log) => {
      // 1. Phân thuốc & Vật tư
      if (log.materials && log.materials.length > 0) {
        log.materials.forEach((m) => {
          const c = Number(m.cost) || 0;
          materialTotal += c;
          materialItems.push({
            date: log.activityDate,
            name: m.material?.name || m.materialName || 'Vật tư',
            unit: m.material?.unit || m.unit || 'đơn vị',
            quantity: m.quantityUsed,
            cost: c,
          });
        });
      }

      // 2. Nhân công
      const laborC = Number(log.laborCost) || 0;
      laborTotal += laborC;

      // 3. Chi phí khác
      const otherC = Number(log.otherCosts) || 0;
      if (otherC > 0) {
        otherTotal += otherC;
        let costName = 'Chi phí phát sinh khác';
        if (log.notes) {
          const match = log.notes.match(/^\[Chi phí khác:\s*([^\]]+)\]/);
          if (match) costName = match[1].trim();
        }
        otherItems.push({
          date: log.activityDate,
          name: costName,
          cost: otherC,
        });
      }

      // 4. Thu hoạch & Doanh thu
      const rev = Number(log.revenue) || 0;
      const qty = Number(log.harvestQuantity) || 0;
      if (rev > 0 || qty > 0 || log.activityType === 'THU_HOACH') {
        revenueTotal += rev;
        harvestQtyTotal += qty;
        harvestItems.push({
          date: log.activityDate,
          quantity: qty,
          unitPrice: Number(log.unitPrice) || 0,
          revenue: rev,
          notes: log.notes,
        });
      } else {
        careLogs.push(log);
      }
    });

    const totalExpense =
      financials?.totalExpense !== undefined
        ? financials.totalExpense
        : materialTotal + laborTotal + otherTotal;

    const totalRevenue =
      financials?.totalRevenue !== undefined ? financials.totalRevenue : revenueTotal;

    const netProfit =
      financials?.netProfit !== undefined
        ? financials.netProfit
        : totalRevenue - totalExpense;

    const roi =
      totalExpense > 0
        ? ((netProfit / totalExpense) * 100).toFixed(2)
        : 0;

    return {
      materialTotal: financials?.totalMaterialCost ?? materialTotal,
      laborTotal: financials?.totalLaborCost ?? laborTotal,
      otherTotal: financials?.totalOtherCosts ?? otherTotal,
      totalExpense,
      totalRevenue,
      harvestQtyTotal: financials?.totalHarvestQty ?? harvestQtyTotal,
      netProfit,
      roi: financials?.roiPercentage ?? roi,
      materialItems,
      otherItems,
      harvestItems,
      careCount: financials?.careLogsCount ?? careLogs.length,
      harvestCount: financials?.harvestLogsCount ?? harvestItems.length,
      totalLogs: financials?.logsCount ?? logs.length,
    };
  }, [logs, financials]);

  if (!isOpen) return null;

  // Cấu hình tiêu đề & icon riêng cho từng thẻ
  const cardConfig = {
    EXPENSE: {
      title: 'Chi Tiết Tổng Chi Phí Đầu Tư',
      subtitle: 'Bóc tách tiền phân bón, thuốc BVTV, nhân công và chi phí khác',
      icon: <IconCircleDollar size={22} strokeWidth={2.2} />,
    },
    REVENUE: {
      title: 'Chi Tiết Doanh Thu Thu Hoạch',
      subtitle: 'Sản lượng thu được và số tiền bán nông sản theo từng đợt',
      icon: <IconLineChart size={22} strokeWidth={2.2} />,
    },
    PROFIT: {
      title: 'Chi Tiết Lợi Nhuận Ròng (Net Profit)',
      subtitle: 'Công thức tính tiền lãi thực tế và tỷ suất hoàn vốn (ROI)',
      icon: <IconCalculator size={22} strokeWidth={2.2} />,
    },
    LOGS: {
      title: 'Chi Tiết Lượt Ghi Nhật Ký',
      subtitle: 'Thống kê số lần chăm sóc cây trồng và số đợt thu hoạch',
      icon: <IconClipboardList size={22} strokeWidth={2.2} />,
    },
  };

  const currentTab = ['EXPENSE', 'REVENUE', 'PROFIT', 'LOGS'].includes(initialTab)
    ? initialTab
    : 'EXPENSE';
  const config = cardConfig[currentTab];

  return (
    <div className="explain-modal-overlay" onClick={onClose}>
      <div className="explain-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* HEADER MODAL */}
        <div className="explain-modal-header">
          <div className="explain-header-left">
            <div className="explain-header-icon">{config.icon}</div>
            <div>
              <h3 className="explain-modal-title">{config.title}</h3>
              <p className="explain-modal-subtitle">{config.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="explain-btn-close"
            onClick={onClose}
            title="Đóng bảng chi tiết"
          >
            <IconX size={20} strokeWidth={2} />
          </button>
        </div>

        {/* NỘI DUNG CHI TIẾT - CHỈ HIỆN RIÊNG THẺ ĐANG CHỌN */}
        <div className="explain-modal-body">
          {/* 1. CHI TIẾT CHI PHÍ ĐẦU TƯ */}
          {currentTab === 'EXPENSE' && (
            <div className="card-detail-content">
              {/* Tổng số lớn & Công thức */}
              <div className="detail-summary-banner">
                <div className="summary-banner-label">Tổng chi phí đã đầu tư</div>
                <div className="summary-banner-value text-red">
                  {breakdown.totalExpense.toLocaleString('vi-VN')} đ
                </div>
                <div className="summary-banner-formula">
                  <strong>Cách tính:</strong> Tiền phân thuốc + Tiền nhân công + Chi phí khác
                </div>
              </div>

              {/* Bóc tách chi tiết từng khoản */}
              <div className="detail-section">
                <div className="detail-section-title">
                  <span>1. Phân bón & Thuốc BVTV</span>
                  <span className="section-total">
                    {breakdown.materialTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {breakdown.materialItems.length > 0 ? (
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Ngày dùng</th>
                          <th>Tên vật tư / phân thuốc</th>
                          <th>Số lượng</th>
                          <th className="text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.materialItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                            <td><strong>{item.name}</strong></td>
                            <td>{item.quantity} {item.unit}</td>
                            <td className="text-right font-medium">
                              {item.cost.toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="detail-empty-hint">Chưa ghi nhận chi phí phân thuốc nào.</p>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <span>2. Tiền thuê nhân công ngoài</span>
                  <span className="section-total">
                    {breakdown.laborTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {breakdown.laborTotal > 0 ? (
                  <p className="detail-section-desc">
                    Tổng tiền công đã trả cho thợ thuê ngoài là{' '}
                    <strong>{breakdown.laborTotal.toLocaleString('vi-VN')} đ</strong>.
                  </p>
                ) : (
                  <p className="detail-empty-hint">
                    Gia đình tự làm, không phát sinh chi phí thuê thợ ngoài (0 đ).
                  </p>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <span>3. Chi phí phát sinh khác</span>
                  <span className="section-total">
                    {breakdown.otherTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {breakdown.otherItems.length > 0 ? (
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Khoản chi</th>
                          <th className="text-right">Số tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.otherItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                            <td>{item.name}</td>
                            <td className="text-right font-medium">
                              {item.cost.toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="detail-empty-hint">Không có chi phí phát sinh khác.</p>
                )}
              </div>
            </div>
          )}

          {/* 2. CHI TIẾT DOANH THU THU HOẠCH */}
          {currentTab === 'REVENUE' && (
            <div className="card-detail-content">
              {/* Tổng số lớn & Công thức */}
              <div className="detail-summary-banner">
                <div className="summary-banner-label">Tổng doanh thu bán nông sản</div>
                <div className="summary-banner-value text-blue">
                  {breakdown.totalRevenue.toLocaleString('vi-VN')} đ
                </div>
                <div className="summary-banner-formula">
                  <strong>Cách tính:</strong> Tổng cộng tiền bán của tất cả các đợt thu hoạch
                  (Số kg × Giá bán mỗi kg)
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <span>Danh sách các đợt thu hoạch đã ghi nhận</span>
                  <span className="section-total">
                    Tổng: {breakdown.harvestQtyTotal.toLocaleString('vi-VN')} kg
                  </span>
                </div>

                {breakdown.harvestItems.length > 0 ? (
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Đợt</th>
                          <th>Ngày thu hoạch</th>
                          <th>Sản lượng</th>
                          <th>Giá bán</th>
                          <th className="text-right">Tiền thu được</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.harvestItems.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>Đợt {idx + 1}</strong></td>
                            <td>{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                            <td><strong>{item.quantity.toLocaleString('vi-VN')} kg</strong></td>
                            <td>{item.unitPrice.toLocaleString('vi-VN')} đ/kg</td>
                            <td className="text-right font-bold text-blue">
                              {item.revenue.toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="detail-empty-hint">
                    Chưa có đợt thu hoạch nào được ghi nhận. Bấm nút <strong>"+ Ghi Nhận Thu Hoạch Ngay"</strong> trên thẻ để nhập nhanh số kg và giá bán.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. CHI TIẾT LỢI NHUẬN RÒNG */}
          {currentTab === 'PROFIT' && (
            <div className="card-detail-content">
              {/* Tổng số lớn & Công thức */}
              <div className="detail-summary-banner">
                <div className="summary-banner-label">Tiền lãi thực tế (Lợi nhuận ròng)</div>
                <div
                  className={`summary-banner-value ${
                    breakdown.netProfit >= 0 ? 'text-green' : 'text-red'
                  }`}
                >
                  {breakdown.netProfit >= 0 ? '+' : ''}
                  {breakdown.netProfit.toLocaleString('vi-VN')} đ
                </div>
                <div className="summary-banner-formula">
                  <strong>Cách tính:</strong> Tiền bán nông sản (Doanh thu) − Chi phí đầu tư
                </div>
              </div>

              <div className="detail-calc-card">
                <div className="calc-row">
                  <span>Tiền thu được từ bán nông sản:</span>
                  <span className="text-blue font-bold">
                    +{breakdown.totalRevenue.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="calc-row">
                  <span>Trừ chi phí đầu tư (phân thuốc, công, khác):</span>
                  <span className="text-red font-bold">
                    −{breakdown.totalExpense.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="calc-divider" />
                <div className="calc-row calc-result-row">
                  <span>
                    👉 <strong>Tiền lời thực tế đút túi:</strong>
                  </span>
                  <span
                    className={`font-bold ${
                      breakdown.netProfit >= 0 ? 'text-green' : 'text-red'
                    }`}
                  >
                    {breakdown.netProfit >= 0 ? '+' : ''}
                    {breakdown.netProfit.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="detail-section" style={{ marginTop: '1.2rem' }}>
                <div className="detail-section-title">
                  <span>Tỷ suất lợi nhuận trên vốn đầu tư (ROI)</span>
                  <span className="section-total font-bold">{breakdown.roi}%</span>
                </div>
                <p className="detail-section-desc">
                  {Number(breakdown.roi) > 0
                    ? `Nghĩa là: Cứ bỏ ra 100.000 đ tiền vốn, bạn thu về thêm ${Math.round(
                        (Number(breakdown.roi) / 100) * 100000
                      ).toLocaleString('vi-VN')} đ tiền lãi ròng.`
                    : 'Hiện tại doanh thu bán ra chưa đủ bù đắp tổng chi phí đầu tư ban đầu.'}
                </p>
              </div>
            </div>
          )}

          {/* 4. CHI TIẾT TỔNG LƯỢT GHI NHẬT KÝ */}
          {currentTab === 'LOGS' && (
            <div className="card-detail-content">
              {/* Tổng số lớn & Công thức */}
              <div className="detail-summary-banner">
                <div className="summary-banner-label">Tổng số lượt ghi nhật ký</div>
                <div className="summary-banner-value text-purple">
                  {breakdown.totalLogs} lượt
                </div>
                <div className="summary-banner-formula">
                  <strong>Cách tính:</strong> Số lần chăm sóc canh tác + Số đợt thu hoạch nông sản
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <span>1. Lượt chăm sóc cây trồng</span>
                  <span className="section-total">{breakdown.careCount} lần</span>
                </div>
                <p className="detail-section-desc">
                  Bao gồm các công việc: bón phân, phun thuốc BVTV, tưới tiêu, làm cỏ, tỉa cành...
                </p>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">
                  <span>2. Đợt thu hoạch nông sản</span>
                  <span className="section-total">{breakdown.harvestCount} đợt</span>
                </div>
                <p className="detail-section-desc">
                  Mỗi đợt cắt hái nông sản và bán cho thương lái hoặc đem tiêu thụ.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="explain-modal-footer">
          <button type="button" className="explain-btn-close-footer" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
