import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetFarm, apiCreatePlot, apiDeletePlot, apiUpdatePlot } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  IconArrowLeft,
  IconMapPin,
  IconRuler,
  IconPlus,
  IconPenLine,
  IconTrash,
  IconWarehouse,
  IconSprout,
  IconX,
  IconCheckCircle,
} from "../components/icons";
import "./FarmDetailPage.css";

const PRESET_PLOTS = [
  { name: "Lô A - Cà phê Robusta cao sản", area: 1.2 },
  { name: "Lô B - Sầu riêng Ri6 ghép", area: 0.8 },
  { name: "Lô C - Mắc ca xen Cà phê", area: 1.0 },
  { name: "Lô D - Bơ sáp 034", area: 0.5 },
];

export default function FarmDetailPage() {
  const { id } = useParams();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPlotModal, setShowPlotModal] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [plotForm, setPlotForm] = useState({ name: "", area: "", unit: "ha" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFarm();
  }, [id]);

  const loadFarm = async () => {
    try {
      setLoading(true);
      const data = await apiGetFarm(id);
      setFarm(data);
    } catch (err) {
      setError("Không thể tải chi tiết nông hộ: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPlot(null);
    setPlotForm({ name: "", area: "", unit: "ha" });
    setShowPlotModal(true);
  };

  const openEditModal = (plot) => {
    setEditingPlot(plot);
    setPlotForm({ name: plot.name, area: String(plot.area), unit: "ha" });
    setShowPlotModal(true);
  };

  // Chuyển đổi đơn vị và tự động quy đổi giá trị đang nhập
  const handleUnitToggle = (newUnit) => {
    if (newUnit === plotForm.unit) return;
    const rawNum = Number(String(plotForm.area || "").replace(',', '.'));
    if (!isNaN(rawNum) && rawNum > 0) {
      if (newUnit === "m2") {
        // ha -> m2
        const converted = Math.round(rawNum * 10000);
        setPlotForm({ ...plotForm, unit: newUnit, area: String(converted) });
      } else {
        // m2 -> ha
        const converted = Number((rawNum / 10000).toFixed(4));
        setPlotForm({ ...plotForm, unit: newUnit, area: String(converted) });
      }
    } else {
      setPlotForm({ ...plotForm, unit: newUnit });
    }
  };

  // Xử lý khi gõ vào ô diện tích (chấp nhận số, dấu chấm, dấu phẩy)
  const handleAreaChange = (val) => {
    const cleaned = val.replace(/[^0-9.,]/g, '');
    setPlotForm((prev) => ({ ...prev, area: cleaned }));
  };

  const handleSavePlot = async (e) => {
    e.preventDefault();
    if (!plotForm.name.trim()) return alert("Vui lòng nhập tên lô trồng!");
    
    // Chuẩn hóa dấu phẩy thành dấu chấm
    const numArea = Number(String(plotForm.area || "").replace(',', '.'));
    if (isNaN(numArea) || numArea <= 0) return alert("Vui lòng nhập diện tích lô đất hợp lệ lớn hơn 0!");

    // Tính diện tích quy đổi ra ha để kiểm tra trước
    const plotAreaInHa = plotForm.unit === "m2" ? numArea / 10000 : numArea;
    const otherPlots = (farm?.plots || []).filter((p) => !editingPlot || p.id !== editingPlot.id);
    const otherUsedArea = otherPlots.reduce((sum, p) => sum + Number(p.area || 0), 0);

    if (otherUsedArea + plotAreaInHa > Number(farm.totalArea) + 0.0001) {
      const maxCanAdd = Math.max(0, Number(farm.totalArea) - otherUsedArea);
      return alert(
        `Không thể lưu! Tổng diện tích các lô (${(otherUsedArea + plotAreaInHa).toFixed(2)} ha) vượt quá diện tích nông hộ (${farm.totalArea} ha).\nNông hộ chỉ còn trống tối đa ${maxCanAdd.toFixed(2)} ha (${new Intl.NumberFormat('vi-VN').format(Math.round(maxCanAdd * 10000))} m²).`
      );
    }

    setSaving(true);
    try {
      const payload = {
        name: plotForm.name.trim(),
        area: numArea,
        unit: plotForm.unit || "ha",
      };
      if (editingPlot) {
        await apiUpdatePlot(id, editingPlot.id, payload);
      } else {
        await apiCreatePlot(id, payload);
      }
      setShowPlotModal(false);
      loadFarm();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi lưu lô trồng");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlot = async (plotId, plotName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lô đất "${plotName}"?`)) return;
    try {
      await apiDeletePlot(id, plotId);
      loadFarm();
    } catch (err) {
      alert("Lỗi khi xóa lô trồng: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="farm-detail-page-container">
        <Header />
        <main className="farm-detail-content container">
          <div className="plots-loading-state">
            <div className="plots-spinner" />
            <p>Đang tải chi tiết nông hộ và các lô canh tác...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="farm-detail-page-container">
        <Header />
        <main className="farm-detail-content container">
          <div className="breadcrumb-bar">
            <Link to="/farms" className="back-link">
              <IconArrowLeft size={16} strokeWidth={2.2} />
              <span>Quay lại danh sách Nông hộ</span>
            </Link>
          </div>
          <div className="plots-error-alert">{error || "Không tìm thấy nông hộ"}</div>
        </main>
        <Footer />
      </div>
    );
  }

  const plots = farm.plots || [];
  const farmTotalArea = Number(farm.totalArea || 0);
  const usedArea = plots.reduce((sum, p) => sum + Number(p.area || 0), 0);
  const remainingArea = Math.max(0, farmTotalArea - usedArea);
  const percentUsed = Math.min(100, Math.round((usedArea / (farmTotalArea || 1)) * 100));
  const isOverAllocated = usedArea > farmTotalArea + 0.0001;

  // Tính số liệu cho modal
  const otherPlots = plots.filter((p) => !editingPlot || p.id !== editingPlot.id);
  const otherPlotsArea = otherPlots.reduce((sum, p) => sum + Number(p.area || 0), 0);
  const availableForPlot = Math.max(0, farmTotalArea - otherPlotsArea);
  const parsedPlotArea = Number(String(plotForm.area || "").replace(',', '.'));
  const enteredHa = plotForm.unit === "m2" ? parsedPlotArea / 10000 : parsedPlotArea;
  const isExceeding = !isNaN(parsedPlotArea) && parsedPlotArea > 0 && (enteredHa > availableForPlot + 0.0001);

  return (
    <div className="farm-detail-page-container">
      <Header />

      <main className="farm-detail-content container">
        {/* Breadcrumb */}
        <div className="breadcrumb-bar">
          <Link to="/farms" className="back-link">
            <IconArrowLeft size={16} strokeWidth={2.2} />
            <span>Quay lại Nông hộ</span>
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{farm.name}</span>
        </div>

        {/* Farm Header Summary */}
        <section className="farm-summary-header">
          <div className="farm-summary-top-row">
            <div className="farm-summary-main">
              <div className="farm-summary-icon">
                <IconWarehouse size={28} strokeWidth={2} />
              </div>
              <div className="farm-summary-text">
                <div className="farm-summary-tag">
                  <IconCheckCircle size={13} strokeWidth={2.4} />
                  <span>Nông hộ đang canh tác</span>
                </div>
                <h1>{farm.name}</h1>
                <div className="farm-summary-meta">
                  <span className="meta-item">
                    <IconMapPin size={15} strokeWidth={2} />
                    <span>{farm.location || "Việt Nam"}</span>
                  </span>
                  <span className="meta-dot">•</span>
                  <span className="meta-item">
                    <IconSprout size={15} strokeWidth={2} />
                    <span>Tổng: <strong>{plots.length} lô đất</strong></span>
                  </span>
                </div>
              </div>
            </div>

            <button className="add-plot-btn" onClick={openAddModal}>
              <IconPlus size={18} strokeWidth={2.4} />
              <span>Thêm Lô Trồng Mới</span>
            </button>
          </div>

          {/* Allocation Details Card */}
          <div className="farm-allocation-card">
            <div className="allocation-stats-grid">
              <div className="alloc-stat-box total">
                <span className="alloc-stat-label">Tổng diện tích nông hộ</span>
                <span className="alloc-stat-value">
                  {farm.totalArea} <small>ha</small>
                </span>
                <span className="alloc-stat-sub">
                  ≈ {new Intl.NumberFormat("vi-VN").format(Math.round(farmTotalArea * 10000))} m²
                </span>
              </div>

              <div className="alloc-stat-box used">
                <span className="alloc-stat-label">Đã phân chia cho các lô</span>
                <span className="alloc-stat-value">
                  {usedArea.toFixed(2)} <small>ha</small>
                </span>
                <span className="alloc-stat-sub">
                  ≈ {new Intl.NumberFormat("vi-VN").format(Math.round(usedArea * 10000))} m² ({percentUsed}%)
                </span>
              </div>

              <div className={`alloc-stat-box remaining ${isOverAllocated ? 'danger' : ''}`}>
                <span className="alloc-stat-label">
                  {isOverAllocated ? "Vượt mức diện tích" : "Còn trống có thể lập lô"}
                </span>
                <span className="alloc-stat-value">
                  {isOverAllocated ? `+${(usedArea - farmTotalArea).toFixed(2)}` : remainingArea.toFixed(2)} <small>ha</small>
                </span>
                <span className="alloc-stat-sub">
                  {isOverAllocated
                    ? `Vượt ${new Intl.NumberFormat("vi-VN").format(Math.round((usedArea - farmTotalArea) * 10000))} m²`
                    : `≈ ${new Intl.NumberFormat("vi-VN").format(Math.round(remainingArea * 10000))} m²`}
                </span>
              </div>
            </div>

            <div className="allocation-progress-wrapper">
              <div className="allocation-progress-bar-bg">
                <div
                  className={`allocation-progress-bar-fill ${isOverAllocated ? 'danger' : ''}`}
                  style={{ width: `${Math.min(100, percentUsed)}%` }}
                />
              </div>
            </div>

            {isOverAllocated && (
              <div className="allocation-warning-banner">
                <IconX size={16} strokeWidth={2.5} />
                <span>
                  <strong>Cảnh báo:</strong> Tổng diện tích các lô hiện tại ({usedArea.toFixed(2)} ha) đang lớn hơn diện tích nông hộ ({farm.totalArea} ha).
                  Vui lòng bấm <strong>Chỉnh sửa</strong> hoặc <strong>Xóa</strong> bớt lô bên dưới để các vụ mùa được tính toán chính xác!
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Plots List Section */}
        <section className="plots-list-section">
          <div className="plots-section-title-row">
            <div>
              <h2>Danh Sách Các Lô Đất Canh Tác</h2>
              <p className="section-subtitle">
                Mỗi lô đất tương ứng với một khu vườn chuyên canh cây dài ngày để áp dụng quy trình và hạch toán kinh tế riêng.
              </p>
            </div>
            <span className="plots-count-badge">{plots.length} Lô đất</span>
          </div>

          {plots.length === 0 ? (
            <div className="plots-empty-state">
              <div className="empty-icon-wrap">
                <IconSprout size={44} strokeWidth={1.8} />
              </div>
              <h3>Chưa có lô trồng nào trong nông hộ này</h3>
              <p>Phân chia các lô đất (Lô Cà phê, Lô Sầu riêng, Lô Mắc ca) để bắt đầu ghi nhật ký mùa vụ.</p>
              <button className="add-plot-btn" onClick={openAddModal}>
                <IconPlus size={18} strokeWidth={2.4} />
                <span>Thêm Lô Đất Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="plots-grid-layout">
              {plots.map((plot) => (
                <div key={plot.id} className="plot-card-box">
                  <div className="plot-card-top">
                    <div className="plot-icon-box">
                      <IconSprout size={22} strokeWidth={2} />
                    </div>
                    <div className="plot-actions-box">
                      <button
                        className="btn-icon-action edit"
                        onClick={() => openEditModal(plot)}
                        title="Chỉnh sửa lô đất"
                      >
                        <IconPenLine size={16} strokeWidth={2} />
                      </button>
                      <button
                        className="btn-icon-action delete"
                        onClick={() => handleDeletePlot(plot.id, plot.name)}
                        title="Xóa lô đất"
                      >
                        <IconTrash size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <h3 className="plot-box-title">{plot.name}</h3>

                  <div className="plot-area-badge" title="1 ha = 10.000 m²">
                    <IconRuler size={14} strokeWidth={2} />
                    <span>
                      Diện tích: <strong>{plot.area} ha</strong>
                      <small style={{ color: "#64748b", marginLeft: "4px" }}>
                        ({new Intl.NumberFormat("vi-VN").format(Math.round(plot.area * 10000))} m²)
                      </small>
                    </span>
                  </div>

                  <div className="plot-card-footer">
                    <Link to="/dashboard" className="plot-link-journal">
                      <span>Xem nhật ký lô này</span>
                      <IconSprout size={14} strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal Thêm / Sửa Lô */}
        {showPlotModal && (
          <div className="farm-modal-backdrop" onClick={() => setShowPlotModal(false)}>
            <div className="farm-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="farm-modal-header">
                <div className="modal-title-with-icon">
                  <div className="modal-icon-badge">
                    <IconSprout size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3>{editingPlot ? "Chỉnh Sửa Lô Trồng" : "Thêm Lô Trồng Mới"}</h3>
                    <p className="modal-subtitle">Khai báo khu vườn canh tác trực thuộc nông hộ {farm.name}</p>
                  </div>
                </div>
                <button className="farm-modal-close" onClick={() => setShowPlotModal(false)}>
                  <IconX size={18} strokeWidth={2.2} />
                </button>
              </div>

              <form onSubmit={handleSavePlot} className="farm-modal-form">
                {!editingPlot && (
                  <div className="location-suggestions" style={{ marginBottom: "1.25rem" }}>
                    <span className="suggestions-label">Gợi ý tên lô & diện tích mẫu:</span>
                    <div className="suggestions-list scrollable-chips">
                      {PRESET_PLOTS.map((p, i) => (
                        <button
                          type="button"
                          key={i}
                          className="suggestion-chip"
                          onClick={() => {
                            const val = plotForm.unit === "m2" ? String(Math.round(p.area * 10000)) : String(p.area);
                            setPlotForm({ ...plotForm, name: p.name, area: val });
                          }}
                        >
                          <IconSprout size={13} strokeWidth={2} />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Tên Lô / Khu vườn <span className="text-red">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lô A - Cà phê Robusta cao sản"
                    value={plotForm.name}
                    onChange={(e) => setPlotForm({ ...plotForm, name: e.target.value })}
                    className="farm-input"
                  />
                </div>

                <div className="form-group">
                  <div className="form-label-with-unit">
                    <label>
                      Diện tích lô đất <span className="text-red">*</span>
                    </label>

                    {/* Thanh chuyển đổi đơn vị Segmented Toggle cực nhạy */}
                    <div className="unit-selector-bar">
                      <button
                        type="button"
                        className={`unit-btn ${plotForm.unit === "ha" ? "active" : ""}`}
                        onClick={() => handleUnitToggle("ha")}
                      >
                        🌿 Hecta (ha)
                      </button>
                      <button
                        type="button"
                        className={`unit-btn ${plotForm.unit === "m2" ? "active" : ""}`}
                        onClick={() => handleUnitToggle("m2")}
                      >
                        📐 Mét vuông (m²)
                      </button>
                    </div>
                  </div>

                  <div className="area-input-field-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder={plotForm.unit === "ha" ? "VD: 1.2 hoặc 1,5" : "VD: 12000 hoặc 15.000"}
                      value={plotForm.area}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      className="farm-input area-text-input"
                      autoComplete="off"
                    />
                    <span className="area-unit-badge">
                      {plotForm.unit === "ha" ? "ha" : "m²"}
                    </span>
                  </div>

                  {parsedPlotArea > 0 && (
                    <div className={`area-helper-hint ${isExceeding ? "warning" : ""}`}>
                      <span>{isExceeding ? "⚠️ Cảnh báo:" : "💡 Tương đương:"}</span>
                      <strong>
                        {plotForm.unit === "ha"
                          ? `${plotForm.area} ha = ${new Intl.NumberFormat("vi-VN").format(Math.round(parsedPlotArea * 10000))} m²`
                          : `${new Intl.NumberFormat("vi-VN").format(Math.round(parsedPlotArea))} m² = ${(parsedPlotArea / 10000).toFixed(4)} ha`}
                      </strong>
                      {isExceeding && (
                        <span>— Vượt quá mức còn trống của nông hộ ({availableForPlot.toFixed(2)} ha)!</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="farm-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPlotModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : editingPlot ? "Cập Nhật Lô Đất" : "Lưu Lô Đất"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
