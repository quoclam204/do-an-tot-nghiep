import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  IconCheck,
  IconTrash,
} from '../icons';
import {
  scanWithGemini,
  scanWithTesseract,
} from '../../services/ocrService';

export default function ReceiptOcrModal({ isOpen, onClose, onApplyData }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Chế độ nhận dạng
  const [engine, setEngine] = useState('gemini'); // 'gemini' | 'tesseract'
  const [showRawText, setShowRawText] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setScanError(null);
    }
  };

  const handleClearData = () => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanProgress(0);
    setScanStatus('');
    setResult(null);
    setScanError(null);
    setShowRawText(false);
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
      const activeEngine = engine;

      let extractedData = null;

      // 1. Quét bằng Gemini nếu có API key
      if (activeEngine === 'gemini') {
        extractedData = await scanWithGemini(selectedFile, '', (pct, status) => {
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

  return createPortal(
    (
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
                <span className="ocr-engine-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {engine === 'gemini' ? (
                    <>
                      <IconZap size={13} strokeWidth={2.4} />
                      <span>Gemini AI</span>
                    </>
                  ) : (
                    <>
                      <IconSearch size={13} strokeWidth={2.4} />
                      <span>Tesseract</span>
                    </>
                  )}
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
                    className={`ocr-mode-btn ${engine === 'gemini' ? 'active' : ''}`}
                    onClick={() => setEngine('gemini')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <IconZap size={14} strokeWidth={2.2} />
                    <span>Gemini Vision (Máy chủ)</span>
                  </button>
                  <button
                    type="button"
                    className={`ocr-mode-btn ${engine === 'tesseract' ? 'active' : ''}`}
                    onClick={() => setEngine('tesseract')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <IconSearch size={14} strokeWidth={2.2} />
                    <span>OCR Cục Bộ (Tesseract)</span>
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

            <button
              type="button"
              className="ocr-btn-clear"
              onClick={handleClearData}
              disabled={isScanning || (!selectedFile && !previewUrl && !result && !scanError)}
              title="Xóa ảnh và kết quả OCR"
              aria-label="Xóa ảnh và kết quả OCR"
            >
              <IconTrash size={15} strokeWidth={2.2} />
              <span>Xóa</span>
            </button>
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
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <IconSearch size={14} strokeWidth={2} />
                      <span>{showRawText ? 'Ẩn văn bản gốc OCR' : 'Xem văn bản gốc OCR đọc được'}</span>
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
    ),
    document.body,
  );
}
