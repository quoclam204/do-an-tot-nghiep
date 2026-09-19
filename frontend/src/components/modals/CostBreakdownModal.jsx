import React from 'react';
import './CostBreakdownModal.css';
import { IconX, IconCalendar, IconMapPin } from '../icons';

export default function CostBreakdownModal({ isOpen, onClose, log, formatActivityName }) {
  if (!isOpen || !log) return null;

  const extractOtherCostName = (notes) => {
    if (!notes) return { name: '', cleanNotes: '' };
    const match = notes.match(/^\[Chi phí khác:\s*([^\]]+)\]\s*(.*)$/s);
    if (match) {
      return { name: match[1].trim(), cleanNotes: match[2].trim() };
    }
    return { name: '', cleanNotes: notes };
  };

  const matCost = log.materials?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0;
  const laborCost = Number(log.laborCost) || 0;
  const otherCost = Number(log.otherCosts) || 0;
  const totalCost = Number(log.cost) || (matCost + laborCost + otherCost);
  const otherName = extractOtherCostName(log.notes).name || 'Chi phí khác';

  return (
    <div className="simple-modal-backdrop" onClick={onClose}>
      <div className="simple-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* TIÊU ĐỀ ĐƠN GIẢN */}
        <div className="simple-modal-header">
          <div>
            <h3 className="simple-modal-title">Chi tiết chi phí hoạt động</h3>
            <div className="simple-modal-meta">
              <span>{new Date(log.activityDate).toLocaleDateString('vi-VN')}</span>
              {log.workShift && <span>• Ca {log.workShift === 'SANG' ? 'Sáng' : log.workShift === 'CHIEU' ? 'Chiều' : 'Tối'}</span>}
              <span>• {log.cropCycle?.name || 'Mùa vụ'}</span>
              <span>• {formatActivityName ? formatActivityName(log.activityType) : log.activityType}</span>
            </div>
          </div>
          <button className="simple-modal-close" onClick={onClose} title="Đóng">
            <IconX size={18} />
          </button>
        </div>

        {/* BẢNG LIỆT KÊ CHI PHÍ TỐI GIẢN */}
        <div className="simple-modal-body">
          <table className="simple-breakdown-table">
            <thead>
              <tr>
                <th>Khoản mục chi</th>
                <th>Chi tiết / Số lượng</th>
                <th className="text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. VẬT TƯ */}
              {log.materials && log.materials.length > 0 ? (
                log.materials.map((m, idx) => (
                  <tr key={m.id || idx}>
                    <td>
                      <strong>{m.material?.name || m.materialName}</strong>
                      <div className="item-sub">
                        {m.material?.type === 'PHAN_BON' ? 'Phân bón' : m.material?.type === 'THUOC_BVTV' ? 'Thuốc BVTV' : 'Vật tư'}
                      </div>
                    </td>
                    <td>{m.quantityUsed} {m.material?.unit || m.unit}</td>
                    <td className="text-right font-medium">
                      {(Number(m.cost) || 0).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>Vật tư (Phân, thuốc)</td>
                  <td className="text-muted">Không sử dụng</td>
                  <td className="text-right">0 đ</td>
                </tr>
              )}

              {/* 2. NHÂN CÔNG */}
              <tr>
                <td>
                  <strong>Tiền công lao động</strong>
                </td>
                <td>
                  {log.isHiredLabor ? (
                    <span>Thuê {log.laborWorkers} công ({(Number(log.laborWagePerDay) || 0).toLocaleString('vi-VN')} đ/công)</span>
                  ) : (
                    <span className="text-muted">Gia đình tự làm</span>
                  )}
                </td>
                <td className="text-right font-medium">
                  {(Number(log.laborCost) || 0).toLocaleString('vi-VN')} đ
                </td>
              </tr>

              {/* 3. CHI PHÍ KHÁC */}
              {otherCost > 0 ? (
                <tr>
                  <td>
                    <strong>Chi phí phát sinh khác</strong>
                  </td>
                  <td>{otherName}</td>
                  <td className="text-right font-medium">
                    {otherCost.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          {/* DÒNG TỔNG KẾT ĐƠN GIẢN */}
          <div className="simple-total-box">
            <div className="simple-calc-line">
              <span>Công thức tính: </span>
              <span>
                {matCost.toLocaleString('vi-VN')} đ (vật tư) + {laborCost.toLocaleString('vi-VN')} đ (công) + {otherCost.toLocaleString('vi-VN')} đ (khác)
              </span>
            </div>
            <div className="simple-total-line">
              <span>Tổng chi phí:</span>
              <strong className="simple-total-val">{totalCost.toLocaleString('vi-VN')} VNĐ</strong>
            </div>
          </div>
        </div>

        {/* NÚT ĐÓNG */}
        <div className="simple-modal-footer">
          <button type="button" className="btn-simple-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
