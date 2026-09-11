import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiGetMyFarms, apiCreateFarm, apiDeleteFarm } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  IconWarehouse,
  IconPlus,
  IconTrash,
  IconMapPin,
  IconRuler,
  IconSprout,
  IconSearch,
  IconX,
  IconEye,
  IconArrowRight,
  IconCheckCircle,
} from "../components/icons";
import "./FarmsPage.css";

// Mẫu ảnh trang trại thực tế nông nghiệp
const FARM_IMAGES = [
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
];

const SUGGESTED_LOCATIONS = [
  "Huyện Cư M'gar, Đắk Lắk",
  "Huyện Di Linh, Lâm Đồng",
  "Huyện Chư Prông, Gia Lai",
  "Huyện Định Quán, Đồng Nai",
  "Huyện Cái Bè, Tiền Giang",
  "Huyện Mộc Châu, Sơn La",
];

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", totalArea: "", unit: "ha" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const data = await apiGetMyFarms();
      setFarms(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách nông hộ");
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (val) => {
    // Cho phép người dùng nhập số, dấu chấm (.) và dấu phẩy (,) thoải mái
    if (val === "" || /^[0-9.,]*$/.test(val)) {
      setForm((prev) => ({ ...prev, totalArea: val }));
    }
  };

  const handleUnitToggle = (newUnit) => {
    if (form.unit === newUnit) return;
    const rawVal = Number(String(form.totalArea).replace(",", "."));
    let convertedArea = form.totalArea;

    if (!isNaN(rawVal) && rawVal > 0) {
      if (newUnit === "m2" && form.unit === "ha") {
        convertedArea = String(Math.round(rawVal * 10000));
      } else if (newUnit === "ha" && form.unit === "m2") {
        convertedArea = String(Number((rawVal / 10000).toFixed(4)));
      }
    }

    setForm((prev) => ({
      ...prev,
      unit: newUnit,
      totalArea: convertedArea,
    }));
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Vui lòng nhập tên nông hộ!");
    const areaNum = Number(String(form.totalArea).replace(",", "."));
    if (isNaN(areaNum) || areaNum <= 0) return alert("Vui lòng nhập diện tích hợp lệ lớn hơn 0!");
    setSaving(true);
    try {
      await apiCreateFarm({
        name: form.name.trim(),
        location: form.location.trim(),
        totalArea: areaNum,
        unit: form.unit || "ha",
      });
      setShowModal(false);
      setForm({ name: "", location: "", totalArea: "", unit: "ha" });
      loadFarms();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo nông hộ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nông hộ "${name}"?`)) return;
    try {
      await apiDeleteFarm(id);
      loadFarms();
    } catch (err) {
      alert("Lỗi khi xóa nông hộ: " + (err.response?.data?.message || err.message));
    }
  };

  // Tổng diện tích tất cả các nông hộ
  const totalAreaAllFarms = useMemo(() => {
    return farms.reduce((sum, f) => sum + Number(f.totalArea || 0), 0);
  }, [farms]);

  // Tổng số lô trồng
  const totalPlotsCount = useMemo(() => {
    return farms.reduce((sum, f) => sum + (f.plots?.length || 0), 0);
  }, [farms]);

  // Lọc theo tìm kiếm
  const filteredFarms = useMemo(() => {
    return farms.filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.location && f.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [farms, searchTerm]);

  return (
    <div className="farms-page-container">
      <Header />

      <main className="farms-main-content container">
        {/* ================= HERO BANNER ================= */}
        <section className="farms-hero-banner">
          <div className="farms-hero-text">
            <div className="farms-pill-tag">
              <IconWarehouse size={15} strokeWidth={2.2} />
              <span>QUẢN LÝ NÔNG HỘ & TRANG TRẠI</span>
            </div>
            <h1>Danh Sách Nông Hộ & Lô Đất Canh Tác</h1>
            <p className="farms-hero-desc">
              Khai báo các trang trại, phân chia từng lô/vườn chuyên canh (Cà phê, Sầu riêng, Mắc ca)
              để chuẩn bị ghi nhật ký công việc, quản lý vật tư và theo dõi hiệu quả kinh tế theo vụ mùa.
            </p>

            <div className="farms-quick-stats">
              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <IconWarehouse size={20} strokeWidth={2} />
                </div>
                <div>
                  <span className="stat-number">{farms.length}</span>
                  <span className="stat-label">Trang trại / Nông hộ</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <IconRuler size={20} strokeWidth={2} />
                </div>
                <div>
                  <span className="stat-number">{totalAreaAllFarms.toFixed(1)} <small>ha</small></span>
                  <span className="stat-label">Tổng diện tích canh tác</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <IconSprout size={20} strokeWidth={2} />
                </div>
                <div>
                  <span className="stat-number">{totalPlotsCount}</span>
                  <span className="stat-label">Lô trồng đã tạo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="farms-hero-actions">
            <button className="farms-btn-primary" onClick={() => setShowModal(true)}>
              <IconPlus size={18} strokeWidth={2.4} />
              <span>Thêm Nông Hộ Mới</span>
            </button>
          </div>
        </section>

        {/* ================= CONTROLS BAR ================= */}
        <section className="farms-controls-bar">
          <div className="farms-search-box">
            <span className="search-icon">
              <IconSearch size={18} strokeWidth={2} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm nông hộ theo tên hoặc địa chỉ (Di Linh, Lâm Hà, Bảo Lộc...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear-btn" onClick={() => setSearchTerm("")} title="Xóa tìm kiếm">
                <IconX size={15} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </section>

        {error && <div className="farms-error-alert">{error}</div>}

        {/* ================= FARMS GRID LIST ================= */}
        {loading ? (
          <div className="farms-loading-state">
            <div className="farms-spinner" />
            <p>Đang tải danh sách trang trại của bạn...</p>
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="farms-empty-state">
            <div className="empty-icon-wrap">
              <IconWarehouse size={48} strokeWidth={1.8} />
            </div>
            <h3>{searchTerm ? "Không tìm thấy nông hộ phù hợp" : "Bạn chưa có nông hộ nào"}</h3>
            <p>
              {searchTerm
                ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."
                : "Bắt đầu bằng cách thêm trang trại đầu tiên để phân lô đất và ghi nhật ký canh tác."}
            </p>
            <button className="farms-btn-primary" onClick={() => setShowModal(true)}>
              <IconPlus size={18} strokeWidth={2.4} />
              <span>Thêm Nông Hộ Đầu Tiên</span>
            </button>
          </div>
        ) : (
          <section className="farms-cards-grid">
            {filteredFarms.map((farm, idx) => {
              const farmImg = FARM_IMAGES[idx % FARM_IMAGES.length];
              const plotsCount = farm.plots?.length || 0;

              return (
                <div key={farm.id} className="farm-card-item">
                  <div className="farm-card-cover">
                    <img src={farmImg} alt={farm.name} />
                    <span className="farm-card-badge">
                      <IconCheckCircle size={13} strokeWidth={2.4} />
                      <span>Trang trại hoạt động</span>
                    </span>
                  </div>

                  <div className="farm-card-body">
                    <div className="farm-title-row">
                      <div className="farm-icon-box">
                        <IconWarehouse size={22} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="farm-name">{farm.name}</h3>
                        <p className="farm-location">
                          <IconMapPin size={15} strokeWidth={2} />
                          <span>{farm.location || "Việt Nam"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="farm-stats-row">
                      <div className="farm-stat-chip" title="1 ha = 10.000 m²">
                        <IconRuler size={15} strokeWidth={2} />
                        <span>
                          Diện tích: <strong>{farm.totalArea} ha</strong>
                          <small style={{ color: "#64748b", marginLeft: "4px" }}>
                            ({new Intl.NumberFormat("vi-VN").format(Math.round(farm.totalArea * 10000))} m²)
                          </small>
                        </span>
                      </div>
                      <div className="farm-stat-chip">
                        <IconSprout size={15} strokeWidth={2} />
                        <span>Số lô: <strong>{plotsCount} lô trồng</strong></span>
                      </div>
                    </div>

                    <div className="farm-card-footer">
                      <Link to={`/farms/${farm.id}`} className="farm-btn-manage">
                        <IconEye size={15} strokeWidth={2.2} />
                        <span>Xem Lô Trồng</span>
                        <IconArrowRight size={14} strokeWidth={2.2} />
                      </Link>

                      <button
                        className="farm-btn-delete"
                        onClick={(e) => handleDelete(farm.id, farm.name, e)}
                        title="Xóa nông hộ"
                      >
                        <IconTrash size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ================= MODAL: THÊM NÔNG HỘ MỚI ================= */}
        {showModal && (
          <div className="farm-modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="farm-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="farm-modal-header">
                <div className="modal-title-with-icon">
                  <div className="modal-icon-badge">
                    <IconWarehouse size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3>Thêm Nông Hộ Mới</h3>
                    <p className="modal-subtitle">Khai báo thông tin trang trại và khu đất sản xuất</p>
                  </div>
                </div>
                <button className="farm-modal-close" onClick={() => setShowModal(false)}>
                  <IconX size={18} strokeWidth={2.2} />
                </button>
              </div>

              <form onSubmit={handleCreateFarm} className="farm-modal-form">
                <div className="form-group">
                  <label>Tên nông hộ / Trang trại <span className="text-red">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nông trại Cà phê Lâm Hà, Vườn Sầu riêng Di Linh..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="farm-input"
                  />
                </div>

                <div className="form-group">
                  <label>Vị trí / Địa chỉ <span className="text-red">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Huyện Cư M'gar, Đắk Lắk hoặc Huyện Di Linh, Lâm Đồng..."
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="farm-input"
                  />

                  {/* Gợi ý vị trí nhanh */}
                  <div className="location-suggestions">
                    <span className="suggestions-label">Gợi ý nhanh:</span>
                    <div className="suggestions-list">
                      {SUGGESTED_LOCATIONS.map((loc, i) => (
                        <button
                          type="button"
                          key={i}
                          className="suggestion-chip"
                          onClick={() => setForm({ ...form, location: loc })}
                        >
                          <IconMapPin size={12} strokeWidth={2} />
                          <span>{loc.split(",")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-label-with-toggle">
                    <label>
                      Tổng diện tích nông hộ <span className="text-red">*</span>
                    </label>
                    <div className="unit-selector-bar">
                      <button
                        type="button"
                        className={`unit-btn ${form.unit === "ha" ? "active" : ""}`}
                        onClick={() => handleUnitToggle("ha")}
                      >
                        Hecta (ha)
                      </button>
                      <button
                        type="button"
                        className={`unit-btn ${form.unit === "m2" ? "active" : ""}`}
                        onClick={() => handleUnitToggle("m2")}
                      >
                        Mét vuông (m²)
                      </button>
                    </div>
                  </div>

                  <div className="area-input-field-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder={form.unit === "ha" ? "Ví dụ: 2 hoặc 1.5" : "Ví dụ: 20000 hoặc 15000"}
                      value={form.totalArea}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      className="farm-input area-input-styled"
                    />
                    <span className="area-unit-badge">{form.unit === "ha" ? "ha" : "m²"}</span>
                  </div>

                  {(() => {
                    const num = Number(String(form.totalArea).replace(",", "."));
                    if (!isNaN(num) && num > 0) {
                      return (
                        <div className="area-helper-hint">
                          <span className="helper-icon">💡</span>
                          <span>
                            Tương đương quy đổi:{" "}
                            <strong>
                              {form.unit === "ha"
                                ? `${new Intl.NumberFormat("vi-VN").format(Math.round(num * 10000))} m²`
                                : `${(num / 10000).toLocaleString("vi-VN", { maximumFractionDigits: 4 })} ha`}
                            </strong>
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="farm-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : "Lưu Nông Hộ"}
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
