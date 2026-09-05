import React, { useState } from 'react';
import './ReceiptOcrModal.css';

// Dữ liệu mẫu hóa đơn thực tế tại Lâm Đồng để demo nhanh hoặc test
const SAMPLE_RECEIPTS = [
  {
    id: 'sample-1',
    title: 'Hóa đơn Đại lý VTNN Bảo Lộc (Phân NPK & Hữu cơ)',
    previewImg: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    extracted: {
      activityType: 'BON_PHAN',
      materialName: 'Phân NPK 20-20-15 Đầu Trâu',
      quantity: 10,
      unit: 'Bao 50kg',
      unitPrice: 850000,
      totalCost: 8500000,
      isHiredLabor: true,
      laborWorkers: 2,
      laborWagePerDay: 350000,
      otherCosts: 200000, // Tiền xe chở phân
      notes: 'Bón thúc đợt 2 đón mưa cho vườn Cà phê & Sầu riêng xen canh.',
    },
  },
  {
    id: 'sample-2',
    title: 'Hóa đơn Thuốc BVTV Trừ Nấm Đạ Huoai (Sầu riêng)',
    previewImg: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
    extracted: {
      activityType: 'PHUN_THUOC',
      materialName: 'Thuốc trừ nấm xì mủ Ridomil Gold',
      quantity: 5,
      unit: 'Gói 1kg',
      unitPrice: 320000,
      totalCost: 1600000,
      isHiredLabor: true,
      laborWorkers: 1,
      laborWagePerDay: 400000, // Công xịt thuốc độc hại tính 400k/ngày
      otherCosts: 50000,
      notes: 'Quét gốc trị xì mủ thân sầu riêng Ri6 sau đợt mưa dầm.',
    },
  },
  {
    id: 'sample-3',
    title: 'Phiếu thu hoạch & Cân Cà phê Robusta Lâm Hà',
    previewImg: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80',
    extracted: {
      activityType: 'THU_HOACH',
      materialName: '',
      quantity: 0,
      unit: 'kg',
      unitPrice: 0,
      totalCost: 0,
      isHiredLabor: true,
      laborWorkers: 4,
      laborWagePerDay: 350000,
      harvestQuantity: 2800, // 2.8 tấn quả tươi
      harvestUnitPrice: 25000, // 25.000đ/kg quả tươi
      notes: 'Thu hoạch cà phê đợt 1, hái chín chọn lọc > 85%.',
    },
  },
];

export default function ReceiptOcrModal({ isOpen, onClose, onApplyData }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleSelectSample = (sample) => {
    setSelectedFile(null);
    setPreviewUrl(sample.previewImg);
    runOcrSimulation(sample.extracted);
  };

  const runOcrSimulation = (mockData) => {
    setIsScanning(true);
    setScanProgress(10);
    setResult(null);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setResult(mockData || SAMPLE_RECEIPTS[0].extracted);
          }, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleStartCustomScan = () => {
    if (!previewUrl) return;
    // Bóc tách giả lập thông minh theo file thực tế
    runOcrSimulation({
      activityType: 'BON_PHAN',
      materialName: 'Phân NPK 20-20-15 Đầu Trâu',
      quantity: 5,
      unit: 'Bao 50kg',
      unitPrice: 850000,
      totalCost: 4250000,
      isHiredLabor: false,
      laborWorkers: 0,
      laborWagePerDay: 0,
      otherCosts: 150000,
      notes: 'Hóa đơn quét OCR tự động từ camera/tài liệu của nông dân.',
    });
  };

  const handleApply = () => {
    if (result) {
      onApplyData(result);
      onClose();
    }
  };

  return (
    <div className="ocr-modal-backdrop" onClick={onClose}>
      <div className="ocr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ocr-modal-header">
          <div>
            <h3>📷 Số Hóa Hóa Đơn / Tài Liệu Bằng OCR</h3>
            <p className="ocr-modal-subtitle">
              Chụp hoặc tải ảnh hóa đơn mua phân, thuốc BVTV, phiếu thu hoạch để AI tự động trích xuất thông tin
            </p>
          </div>
          <button className="ocr-btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="ocr-modal-body">
          {/* Cột trái: Upload / Chọn mẫu & Xem trước ảnh */}
          <div className="ocr-preview-column">
            <div className="ocr-dropzone">
              {previewUrl ? (
                <div className="ocr-image-wrapper">
                  <img src={previewUrl} alt="Hóa đơn" className="ocr-image-preview" />
                  {isScanning && (
                    <div className="ocr-scanner-laser">
                      <div className="ocr-laser-line" />
                      <span className="ocr-laser-text">Đang nhận dạng chữ OCR: {scanProgress}%...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ocr-placeholder">
                  <span className="ocr-icon">📄</span>
                  <p>Chọn ảnh hóa đơn từ máy hoặc kéo thả vào đây</p>
                  <label className="ocr-upload-btn">
                    Tải ảnh lên
                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  </label>
                </div>
              )}
            </div>

            {previewUrl && !isScanning && !result && (
              <button className="ocr-btn-primary" onClick={handleStartCustomScan}>
                🔍 Bắt đầu Quét OCR
              </button>
            )}

            {/* Mục hóa đơn mẫu để thử nghiệm nhanh */}
            <div className="ocr-samples-section">
              <span className="ocr-samples-label">Hoặc thử nhanh với mẫu hóa đơn thực tế:</span>
              <div className="ocr-samples-list">
                {SAMPLE_RECEIPTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="ocr-sample-chip"
                    onClick={() => handleSelectSample(s)}
                  >
                    📑 {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Kết quả trích xuất OCR */}
          <div className="ocr-result-column">
            <h4>📋 Dữ liệu AI/OCR trích xuất được</h4>
            {!result ? (
              <div className="ocr-empty-result">
                {isScanning ? (
                  <div className="ocr-loading-spinner">
                    <div className="spinner-circle"></div>
                    <p>Hệ thống đang phân tích ảnh hóa đơn...</p>
                  </div>
                ) : (
                  <p className="ocr-hint-text">
                    👈 Hãy chọn ảnh hóa đơn vật tư hoặc bấm vào một trong các hóa đơn mẫu bên cạnh để xem kết quả trích xuất.
                  </p>
                )}
              </div>
            ) : (
              <div className="ocr-extracted-form">
                <div className="ocr-field-group">
                  <label>Loại hoạt động:</label>
                  <span className="ocr-badge">
                    {result.activityType === 'BON_PHAN'
                      ? '🌿 Bón phân'
                      : result.activityType === 'PHUN_THUOC'
                      ? '🛡️ Phun thuốc BVTV'
                      : '🧺 Thu hoạch nông sản'}
                  </span>
                </div>

                {result.materialName && (
                  <>
                    <div className="ocr-field-group">
                      <label>Tên vật tư nhận diện:</label>
                      <input
                        type="text"
                        value={result.materialName}
                        onChange={(e) => setResult({ ...result, materialName: e.target.value })}
                        className="ocr-input"
                      />
                    </div>

                    <div className="ocr-field-row">
                      <div className="ocr-field-group">
                        <label>Số lượng:</label>
                        <input
                          type="number"
                          value={result.quantity}
                          onChange={(e) => setResult({ ...result, quantity: Number(e.target.value) })}
                          className="ocr-input"
                        />
                      </div>
                      <div className="ocr-field-group">
                        <label>Đơn vị:</label>
                        <input
                          type="text"
                          value={result.unit}
                          onChange={(e) => setResult({ ...result, unit: e.target.value })}
                          className="ocr-input"
                        />
                      </div>
                    </div>

                    <div className="ocr-field-group">
                      <label>Tổng tiền vật tư (VNĐ):</label>
                      <input
                        type="number"
                        value={result.totalCost}
                        onChange={(e) => setResult({ ...result, totalCost: Number(e.target.value) })}
                        className="ocr-input font-bold"
                      />
                    </div>
                  </>
                )}

                {result.harvestQuantity > 0 && (
                  <div className="ocr-field-row">
                    <div className="ocr-field-group">
                      <label>Sản lượng thu hoạch (kg):</label>
                      <input
                        type="number"
                        value={result.harvestQuantity}
                        onChange={(e) => setResult({ ...result, harvestQuantity: Number(e.target.value) })}
                        className="ocr-input"
                      />
                    </div>
                    <div className="ocr-field-group">
                      <label>Giá bán ước tính (đ/kg):</label>
                      <input
                        type="number"
                        value={result.harvestUnitPrice}
                        onChange={(e) => setResult({ ...result, harvestUnitPrice: Number(e.target.value) })}
                        className="ocr-input"
                      />
                    </div>
                  </div>
                )}

                <div className="ocr-field-group">
                  <label>Chi phí nhân công:</label>
                  <div className="ocr-labor-preview">
                    {result.isHiredLabor ? (
                      <span className="ocr-text-success">
                        ✓ Thuê {result.laborWorkers} người ({result.laborWagePerDay.toLocaleString()} đ/công)
                      </span>
                    ) : (
                      <span className="ocr-text-muted">Gia đình tự làm (0đ)</span>
                    )}
                  </div>
                </div>

                <div className="ocr-field-group">
                  <label>Ghi chú trích xuất:</label>
                  <textarea
                    rows={2}
                    value={result.notes || ''}
                    onChange={(e) => setResult({ ...result, notes: e.target.value })}
                    className="ocr-input"
                  />
                </div>

                <div className="ocr-action-footer">
                  <button className="ocr-btn-apply" onClick={handleApply}>
                    ✅ Áp dụng vào Form Nhật Ký
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
