import React, { useState, useEffect } from 'react';
import './ReceiptOcrModal.css';
import {
  IconFileText,
  IconSearch,
  IconCheckCircle,
  IconX,
  IconLeaf,
  IconFlask,
  IconSprout,
  IconZap,
  IconAlertCircle,
  IconCircleDollar,
} from '../icons';
import {
  scanWithGemini,
  scanWithTesseract,
} from '../../services/ocrService';

// Dữ liệu mẫu hóa đơn thực tế nông nghiệp để demo nhanh hoặc test
const SAMPLE_RECEIPTS = [
  {
    id: 'sample-1',
    title: 'Hóa đơn Đại lý VTNN (Phân NPK & Hữu cơ)',
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
      otherCosts: 200000,
      notes: 'Bón thúc đợt 2 đón mưa cho vườn Cà phê & Sầu riêng xen canh.',
      items: [
        { name: 'Phân NPK 20-20-15 Đầu Trâu', unit: 'Bao 50kg', quantity: 10, unitPrice: 850000, total: 8500000 }
      ],
      source: 'Mẫu có sẵn',
    },
  },
  {
    id: 'sample-2',
    title: 'Hóa đơn Thuốc BVTV Trừ Nấm Bệnh (Cây ăn trái)',
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
      laborWagePerDay: 400000,
      otherCosts: 50000,
      notes: 'Quét gốc trị xì mủ thân sầu riêng Ri6 sau đợt mưa dầm.',
      items: [
        { name: 'Thuốc trừ nấm xì mủ Ridomil Gold', unit: 'Gói 1kg', quantity: 5, unitPrice: 320000, total: 1600000 }
      ],
      source: 'Mẫu có sẵn',
    },
  },
  {
    id: 'sample-3',
    title: 'Phiếu thu hoạch & Cân nông sản (Cà phê)',
    previewImg: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80',
    extracted: {
      activityType: 'THU_HOACH',
      materialName: 'Cà phê quả tươi',
      quantity: 1,
      unit: 'Tấn',
      unitPrice: 0,
      totalCost: 0,
      isHiredLabor: true,
      laborWorkers: 4,
      laborWagePerDay: 350000,
      harvestQuantity: 2800,
      harvestUnitPrice: 25000,
      notes: 'Thu hoạch cà phê đợt 1, hái chín chọn lọc > 85%.',
      items: [
        { name: 'Cà phê nhân xô / tươi', unit: 'kg', quantity: 2800, unitPrice: 25000, total: 70000000 }
      ],
      source: 'Mẫu có sẵn',
    },
  },
];

export default function ReceiptOcrModal({ isOpen, onClose, onApplyData }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Chế độ nhận dạng
  const [engine, setEngine] = useState('auto'); // 'auto' | 'gemini' | 'tesseract'
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  // Khởi tạo API key từ localStorage hoặc env
  useEffect(() => {
    const savedKey = localStorage.getItem('dalat_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    setGeminiApiKey(savedKey);
    if (savedKey) {
      setEngine('gemini');
    }
  }, []);

  if (!isOpen) return null;

  const handleSaveApiKey = (newKey) => {
    setGeminiApiKey(newKey);
    if (newKey) {
      localStorage.setItem('dalat_gemini_api_key', newKey.trim());
      setEngine('gemini');
    } else {
      localStorage.removeItem('dalat_gemini_api_key');
      setEngine('tesseract');
    }
    setShowKeyConfig(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setScanError(null);
    }
  };

  const handleSelectSample = (sample) => {
    setSelectedFile(null);
    setPreviewUrl(sample.previewImg);
    setScanError(null);
    setResult(sample.extracted);
  };

  // Bắt đầu quét thực tế từ file ảnh
  const handleStartScan = async () => {
    if (!selectedFile && !previewUrl) return;

    setIsScanning(true);
    setScanProgress(10);
    setScanStatus('Chuẩn bị hình ảnh...');
    setScanError(null);
    setResult(null);

    try {
      let activeEngine = engine;
      if (engine === 'auto') {
        activeEngine = geminiApiKey ? 'gemini' : 'tesseract';
      }

      let extractedData = null;

      // 1. Quét bằng Gemini nếu có API key
      if (activeEngine === 'gemini') {
        if (!geminiApiKey) {
          setShowKeyConfig(true);
          throw new Error('Vui lòng nhập Google Gemini API Key để kích hoạt AI Vision, hoặc chuyển sang chế độ OCR Tesseract bên dưới.');
        }

        extractedData = await scanWithGemini(selectedFile, geminiApiKey.trim(), (pct, status) => {
          setScanProgress(pct);
          setScanStatus(status);
        });
      } else {
        // 2. Quét bằng Tesseract.js cục bộ
        setScanStatus('Đang khởi động Tesseract OCR nhận diện tiếng Việt...');
        extractedData = await scanWithTesseract(selectedFile, (pct, status) => {
          setScanProgress(pct);
          setScanStatus(status);
        });
      }

      setResult(extractedData);
    } catch (err) {
      console.error('Lỗi khi quét OCR:', err);
      setScanError(err.message || 'Không thể bóc tách dữ liệu từ hóa đơn này.');
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  // Chọn 1 mặt hàng cụ thể từ danh sách các mặt hàng phát hiện được
  const handleSelectItem = (item) => {
    if (!result) return;
    setResult({
      ...result,
      materialName: item.name,
      unit: item.unit || result.unit,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || (item.total && item.quantity ? Math.round(item.total / item.quantity) : 0),
      totalCost: item.total || result.totalCost,
    });
  };

  // Chọn gộp tất cả mặt hàng
  const handleSelectAllItems = () => {
    if (!result || !result.items || result.items.length === 0) return;
    const names = result.items.map((it) => it.name).join(', ');
    const total = result.items.reduce((sum, it) => sum + (it.total || 0), 0);
    setResult({
      ...result,
      materialName: `Tổng hợp ${result.items.length} loại VTNN (${result.items.slice(0, 2).map((i) => i.name).join(', ')}...)`,
      quantity: result.items.length,
      totalCost: total > 0 ? total : result.totalCost,
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
        {/* Header */}
        <div className="ocr-modal-header">
          <div className="ocr-title-wrap">
            <div className="ocr-header-icon-box">
              <IconFileText size={22} strokeWidth={2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3>Số Hóa Hóa Đơn Bằng AI & OCR</h3>
                <span className="ocr-engine-pill">
                  {engine === 'gemini' || (engine === 'auto' && geminiApiKey)
                    ? '⚡ Gemini AI'
                    : '🔍 Tesseract'}
                </span>
              </div>
              <p className="ocr-modal-subtitle">
                Chụp ảnh hoặc tải hóa đơn mua phân, thuốc BVTV, phiếu thu hoạch để AI tự động trích xuất thông tin
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`ocr-btn-config ${showKeyConfig ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setShowKeyConfig(!showKeyConfig);
              }}
              title="Cài đặt khóa AI Gemini (Nhận dạng chuẩn xác 100%)"
            >
              🔑 Cấu hình AI
            </button>
            <button
              type="button"
              className="ocr-btn-close"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              title="Đóng"
            >
              <IconX size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Thanh cấu hình Gemini API Key */}
        {showKeyConfig && (
          <div className="ocr-config-banner">
            <div className="ocr-config-content">
              <span className="ocr-config-title">Google Gemini API Key (Miễn phí từ Google AI Studio):</span>
              <div className="ocr-config-input-wrap">
                <input
                  type="password"
                  placeholder="Dán API Key (bắt đầu bằng AIzaSy...)"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="ocr-key-input"
                />
                <button
                  type="button"
                  className="ocr-btn-save-key"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveApiKey(geminiApiKey);
                  }}
                >
                  Lưu
                </button>
                {geminiApiKey && (
                  <button
                    type="button"
                    className="ocr-btn-clear-key"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveApiKey('');
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
            <p className="ocr-config-hint">
              💡 <em>API Key được lưu an toàn trong trình duyệt của bạn. Nhận dạng được cả hóa đơn viết tay, hóa đơn bán lẻ nhiều mặt hàng. Nếu không có key, hệ thống sẽ tự động dùng bộ máy OCR Tesseract nội bộ.</em>
            </p>
          </div>
        )}

        <div className="ocr-modal-body">
          {/* Cột trái: Upload & Xem trước ảnh */}
          <div className="ocr-preview-column">
            <div className="ocr-dropzone">
              {previewUrl ? (
                <div className="ocr-image-wrapper">
                  <img src={previewUrl} alt="Hóa đơn" className="ocr-image-preview" />
                  {isScanning && (
                    <div className="ocr-scanner-laser">
                      <div className="ocr-laser-line" />
                      <div className="ocr-laser-status">
                        <span className="ocr-laser-text">{scanStatus || 'Đang quét OCR...'}</span>
                        <div className="ocr-progress-bar-wrap">
                          <div className="ocr-progress-bar-fill" style={{ width: `${scanProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ocr-placeholder">
                  <div className="ocr-icon">
                    <IconFileText size={44} strokeWidth={1.8} />
                  </div>
                  <p>Chọn ảnh hóa đơn từ máy hoặc kéo thả vào đây</p>
                  <label className="ocr-upload-btn">
                    Tải ảnh hóa đơn lên
                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  </label>
                </div>
              )}
            </div>

            {/* Công cụ điều khiển quét */}
            <div className="ocr-scan-controls">
              {previewUrl && (
                <div className="ocr-engine-selector">
                  <span className="ocr-engine-label">Phương thức:</span>
                  <button
                    type="button"
                    className={`ocr-mode-btn ${engine === 'gemini' || (engine === 'auto' && geminiApiKey) ? 'active' : ''}`}
                    onClick={() => setEngine('gemini')}
                  >
                    ⚡ Gemini Vision {geminiApiKey ? '✓' : '(Cần Key)'}
                  </button>
                  <button
                    type="button"
                    className={`ocr-mode-btn ${engine === 'tesseract' || (engine === 'auto' && !geminiApiKey) ? 'active' : ''}`}
                    onClick={() => setEngine('tesseract')}
                  >
                    🔍 OCR Cục Bộ (Tesseract)
                  </button>
                </div>
              )}

              {previewUrl && !isScanning && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="ocr-btn-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      handleStartScan();
                    }}
                    style={{ flex: 1 }}
                  >
                    <IconSearch size={16} strokeWidth={2.2} />
                    <span>{result ? 'Quét lại ảnh này' : 'Bắt đầu Quét OCR'}</span>
                  </button>
                  <label className="ocr-btn-secondary" title="Chọn ảnh khác">
                    Đổi ảnh
                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  </label>
                </div>
              )}
            </div>

            {/* Danh sách hóa đơn mẫu để test nhanh */}
            <div className="ocr-sample-section">
              <span className="ocr-sample-label">Hoặc thử với mẫu hóa đơn có sẵn:</span>
              <div className="ocr-sample-list">
                {SAMPLE_RECEIPTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="ocr-sample-card"
                    onClick={() => handleSelectSample(s)}
                  >
                    <span className="ocr-sample-title">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Kết quả trích xuất OCR */}
          <div className="ocr-result-column">
            <div className="ocr-result-header">
              <IconFileText size={18} strokeWidth={2} />
              <h4>Dữ liệu AI/OCR trích xuất được</h4>
              {result?.source && <span className="ocr-source-tag">Nguồn: {result.source}</span>}
            </div>

            {scanError && (
              <div className="ocr-error-box">
                <IconAlertCircle size={18} strokeWidth={2.4} />
                <div>
                  <strong>Quét thất bại:</strong> {scanError}
                  <div style={{ marginTop: '6px', fontSize: '0.82rem' }}>
                    Bạn có thể thử bấm chuyển sang <strong>OCR Cục Bộ (Tesseract)</strong> hoặc nhập thông tin trực tiếp.
                  </div>
                </div>
              </div>
            )}

            {!result && !scanError ? (
              <div className="ocr-empty-result">
                {isScanning ? (
                  <div className="ocr-loading-spinner">
                    <div className="spinner-circle"></div>
                    <p style={{ fontWeight: 600, color: '#10b981' }}>{scanStatus}</p>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Tiến độ: {scanProgress}%
                    </span>
                  </div>
                ) : (
                  <p className="ocr-hint-text">
                    Hãy chọn ảnh hóa đơn vật tư từ máy tính của bạn và bấm <strong>"Bắt đầu Quét OCR"</strong> để AI đọc số liệu tự động.
                  </p>
                )}
              </div>
            ) : result ? (
              <div className="ocr-extracted-form">
                {/* Loại hoạt động */}
                <div className="ocr-field-group">
                  <label>Loại hoạt động phân loại được:</label>
                  <div className="ocr-activity-selector">
                    <button
                      type="button"
                      className={`ocr-activity-btn ${result.activityType === 'BON_PHAN' ? 'selected green' : ''}`}
                      onClick={() => setResult({ ...result, activityType: 'BON_PHAN' })}
                    >
                      <IconLeaf size={14} strokeWidth={2} /> Bón phân
                    </button>
                    <button
                      type="button"
                      className={`ocr-activity-btn ${result.activityType === 'PHUN_THUOC' ? 'selected blue' : ''}`}
                      onClick={() => setResult({ ...result, activityType: 'PHUN_THUOC' })}
                    >
                      <IconFlask size={14} strokeWidth={2} /> Phun thuốc BVTV
                    </button>
                    <button
                      type="button"
                      className={`ocr-activity-btn ${result.activityType === 'THU_HOACH' ? 'selected amber' : ''}`}
                      onClick={() => setResult({ ...result, activityType: 'THU_HOACH' })}
                    >
                      <IconSprout size={14} strokeWidth={2} /> Thu hoạch
                    </button>
                  </div>
                </div>

                {/* Nếu hóa đơn có nhiều mặt hàng, hiển thị danh sách để nông dân chọn */}
                {result.items && result.items.length > 0 && (
                  <div className="ocr-items-breakdown">
                    <div className="ocr-items-header">
                      <span>Các mặt hàng trong hóa đơn ({result.items.length} món):</span>
                      {result.items.length > 1 && (
                        <button
                          type="button"
                          className="ocr-btn-bundle"
                          onClick={handleSelectAllItems}
                          title="Gộp chung cả hóa đơn vào 1 dòng chi phí"
                        >
                          Gộp tất cả
                        </button>
                      )}
                    </div>
                    <div className="ocr-items-scroll">
                      {result.items.map((it, idx) => (
                        <div
                          key={idx}
                          className={`ocr-item-chip ${result.materialName === it.name ? 'active' : ''}`}
                          onClick={() => handleSelectItem(it)}
                          title="Bấm để chọn riêng món này"
                        >
                          <span className="ocr-chip-name">{it.name}</span>
                          <span className="ocr-chip-meta">
                            {it.quantity ? `${it.quantity} ${it.unit || ''}` : ''}
                            {it.total ? ` • ${(it.total).toLocaleString()}đ` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tên vật tư */}
                <div className="ocr-field-group">
                  <label>Tên vật tư nhận diện:</label>
                  <input
                    type="text"
                    value={result.materialName || ''}
                    onChange={(e) => setResult({ ...result, materialName: e.target.value })}
                    placeholder="VD: Thuốc diệt cuốn lá, Phân NPK..."
                    className="ocr-input"
                  />
                </div>

                {/* Số lượng & Đơn vị */}
                <div className="ocr-field-row">
                  <div className="ocr-field-group">
                    <label>Số lượng:</label>
                    <input
                      type="number"
                      value={result.quantity ?? ''}
                      onChange={(e) => setResult({ ...result, quantity: Number(e.target.value) })}
                      className="ocr-input"
                    />
                  </div>
                  <div className="ocr-field-group">
                    <label>Đơn vị:</label>
                    <input
                      type="text"
                      value={result.unit || ''}
                      onChange={(e) => setResult({ ...result, unit: e.target.value })}
                      placeholder="Chai, Bao, Gói..."
                      className="ocr-input"
                    />
                  </div>
                </div>

                {/* Tổng tiền vật tư */}
                <div className="ocr-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>Tổng tiền vật tư (VNĐ):</label>
                    {result.totalCost > 0 && (
                      <span className="ocr-money-formatted">
                        {Number(result.totalCost).toLocaleString()} đ
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={result.totalCost ?? ''}
                    onChange={(e) => setResult({ ...result, totalCost: Number(e.target.value) })}
                    className="ocr-input font-bold text-success"
                  />
                </div>

                {/* Sản lượng thu hoạch nếu là THU_HOACH */}
                {result.activityType === 'THU_HOACH' && (
                  <div className="ocr-field-row">
                    <div className="ocr-field-group">
                      <label>Sản lượng thu hoạch (kg):</label>
                      <input
                        type="number"
                        value={result.harvestQuantity || ''}
                        onChange={(e) => setResult({ ...result, harvestQuantity: Number(e.target.value) })}
                        className="ocr-input"
                      />
                    </div>
                    <div className="ocr-field-group">
                      <label>Giá bán ước tính (đ/kg):</label>
                      <input
                        type="number"
                        value={result.harvestUnitPrice || ''}
                        onChange={(e) => setResult({ ...result, harvestUnitPrice: Number(e.target.value) })}
                        className="ocr-input"
                      />
                    </div>
                  </div>
                )}

                {/* Ghi chú trích xuất */}
                <div className="ocr-field-group">
                  <label>Ghi chú trích xuất:</label>
                  <textarea
                    rows={2}
                    value={result.notes || ''}
                    onChange={(e) => setResult({ ...result, notes: e.target.value })}
                    className="ocr-input"
                  />
                </div>

                {/* Xem text OCR gốc */}
                {(result.rawOcrText || result.rawTextSummary) && (
                  <div className="ocr-raw-toggle-wrap">
                    <button
                      type="button"
                      className="ocr-btn-toggle-raw"
                      onClick={() => setShowRawText(!showRawText)}
                    >
                      {showRawText ? 'Ẩn văn bản gốc OCR' : '🔍 Xem văn bản gốc OCR đọc được'}
                    </button>
                    {showRawText && (
                      <pre className="ocr-raw-pre">
                        {result.rawOcrText || result.rawTextSummary}
                      </pre>
                    )}
                  </div>
                )}

                {/* Nút hành động */}
                <div className="ocr-action-footer">
                  <button
                    type="button"
                    className="ocr-btn-apply"
                    onClick={(e) => {
                      e.preventDefault();
                      handleApply();
                    }}
                  >
                    <IconCheckCircle size={16} strokeWidth={2.4} />
                    <span>Áp dụng vào Form Nhật Ký</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
