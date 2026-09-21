import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { apiGetMyFarms, apiCreateFarm, apiUpdateFarm, apiDeleteFarm } from "../../services/api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  IconWarehouse,
  IconPlus,
  IconTrash,
  IconPenLine,
  IconMapPin,
  IconRuler,
  IconSprout,
  IconSearch,
  IconX,
  IconEye,
  IconArrowRight,
  IconCheckCircle,
  IconUpload,
  IconImage,
} from "../../components/icons";
import "./FarmsPage.css";

// Ảnh nông hộ mặc định thực tế nông nghiệp
const DEFAULT_FARM_IMAGE = "/farms/farm-1.jpg";

// Danh sách ảnh mẫu trang trại thực tế
const PRESET_FARM_IMAGES = [
  { label: "Nông trại mẫu 1", url: "/farms/farm-1.jpg" },
  { label: "Nông trại mẫu 2", url: "/farms/farm-2.jpg" },
];

const FARM_IMAGES_STORAGE_KEY = "dalatagri_farm_images";

const getStoredFarmImages = () => {
  try {
    const raw = localStorage.getItem(FARM_IMAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredFarmImage = (idOrName, url) => {
  try {
    const current = getStoredFarmImages();
    current[idOrName] = url;
    localStorage.setItem(FARM_IMAGES_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Không thể lưu ảnh nông hộ vào bộ nhớ cục bộ:", e);
  }
};

const getFarmImage = (farm) => {
  if (!farm) return DEFAULT_FARM_IMAGE;
  const stored = getStoredFarmImages();
  return stored[farm.id] || stored[farm.name] || DEFAULT_FARM_IMAGE;
};

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [form, setForm] = useState({ name: "", location: "", totalArea: "", unit: "ha", image: "" });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef(null);

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

  // Lấy vị trí thực tế hiện tại qua GPS trình duyệt
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS!");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Sử dụng dịch vụ Reverse Geocoding miễn phí OpenStreetMap để lấy tên địa danh tiếng Việt
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1&accept-language=vi`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const addr = data.address;
              const villageOrSuburb = addr.village || addr.suburb || addr.quarter || addr.town || addr.commune || "";
              const district = addr.district || addr.county || addr.city_district || "";
              const stateOrCity = addr.state || addr.city || "";
              const parts = [villageOrSuburb, district, stateOrCity].filter(Boolean);

              if (parts.length > 0) {
                setForm((prev) => ({ ...prev, location: parts.join(", ") }));
                return;
              } else if (data.display_name) {
                const shortName = data.display_name.split(",").slice(0, 3).join(",").trim();
                setForm((prev) => ({ ...prev, location: shortName }));
                return;
              }
            }
          }
          setForm((prev) => ({
            ...prev,
            location: `Tọa độ GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          }));
        } catch (err) {
          console.warn("Lỗi dịch ngược địa chỉ:", err);
          setForm((prev) => ({
            ...prev,
            location: `Tọa độ GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          }));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật quyền định vị trên trình duyệt hoặc nhập địa chỉ thủ công.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          alert("Không thể xác định vị trí hiện tại. Vui lòng kiểm tra kết nối mạng hoặc GPS.");
        } else if (err.code === err.TIMEOUT) {
          alert("Quá thời gian lấy vị trí GPS. Vui lòng thử lại hoặc nhập tay.");
        } else {
          alert("Lỗi khi lấy vị trí: " + err.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const handleOpenAdd = () => {
    setEditingFarm(null);
    setForm({ name: "", location: "", totalArea: "", unit: "ha", image: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (farm, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingFarm(farm);
    const stored = getStoredFarmImages();
    const currentImg = stored[farm.id] || stored[farm.name] || "";
    setForm({
      name: farm.name,
      location: farm.location || "",
      totalArea: String(farm.totalArea),
      unit: "ha",
      image: currentImg,
    });
    setShowModal(true);
  };

  const handleAreaChange = (val) => {
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

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh tối đa là 5MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitFarm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Vui lòng nhập tên nông hộ!");
    const areaNum = Number(String(form.totalArea).replace(",", "."));
    if (isNaN(areaNum) || areaNum <= 0) return alert("Vui lòng nhập diện tích hợp lệ lớn hơn 0!");
    setSaving(true);
    try {
      // Nếu người dùng để trống ảnh thì tự lấy ảnh mặc định
      const finalImage = form.image.trim() || DEFAULT_FARM_IMAGE;

      if (editingFarm) {
        await apiUpdateFarm(editingFarm.id, {
          name: form.name.trim(),
          location: form.location.trim(),
          totalArea: areaNum,
          unit: form.unit || "ha",
        });
        saveStoredFarmImage(editingFarm.id, finalImage);
        saveStoredFarmImage(form.name.trim(), finalImage);
      } else {
        const res = await apiCreateFarm({
          name: form.name.trim(),
          location: form.location.trim(),
          totalArea: areaNum,
          unit: form.unit || "ha",
        });
        if (res && res.id) {
          saveStoredFarmImage(res.id, finalImage);
        }
        saveStoredFarmImage(form.name.trim(), finalImage);
      }

      setShowModal(false);
      setEditingFarm(null);
      setForm({ name: "", location: "", totalArea: "", unit: "ha", image: "" });
      loadFarms();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi lưu nông hộ");
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

  // Lọc theo tìm kiếm (Tên nông hộ, địa chỉ, HOẶC tên các lô đất canh tác bên trong)
  const filteredFarms = useMemo(() => {
    if (!searchTerm) return farms;
    const term = searchTerm.toLowerCase();
    return farms.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        (f.location && f.location.toLowerCase().includes(term)) ||
        (f.plots && f.plots.some((p) => p.name?.toLowerCase().includes(term)))
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
            <button className="farms-btn-primary" onClick={handleOpenAdd}>
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
              placeholder="Tìm kiếm theo tên nông hộ, địa chỉ hoặc tên lô đất..."
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
            <button className="farms-btn-primary" onClick={handleOpenAdd}>
              <IconPlus size={18} strokeWidth={2.4} />
              <span>Thêm Nông Hộ Đầu Tiên</span>
            </button>
          </div>
        ) : (
          <section className="farms-cards-grid">
            {filteredFarms.map((farm) => {
              const farmImg = getFarmImage(farm);
              const plotsCount = farm.plots?.length || 0;

              return (
                <div key={farm.id} className="farm-card-item">
                  <div className="farm-card-cover">
                    <img src={farmImg} alt={farm.name} onError={(e) => { e.target.src = DEFAULT_FARM_IMAGE; }} />
                    <div className="farm-card-badge">
                      <IconCheckCircle size={13} strokeWidth={2.5} />
                      <span>Trang trại hoạt động</span>
                    </div>
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

                    {/* Hiển thị danh sách các lô đất bên trong để bác nông dân nhận biết ngay */}
                    {farm.plots && farm.plots.length > 0 && (
                      <div className="farm-plots-preview-box">
                        <span className="plots-preview-title">Lô đất canh tác:</span>
                        <div className="plots-preview-tags">
                          {farm.plots.map((p) => (
                            <Link
                              key={p.id}
                              to={`/farms/${farm.id}`}
                              className="plot-preview-pill"
                              title={`Bấm để xem chi tiết lô ${p.name}`}
                            >
                              <IconSprout size={13} className="pill-icon" />
                              <span className="pill-name">{p.name}</span>
                              {p.area ? <span className="pill-area">({p.area} ha)</span> : null}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="farm-card-footer">
                      <Link to={`/farms/${farm.id}`} className="farm-btn-manage">
                        <IconEye size={15} strokeWidth={2.2} />
                        <span>Xem Lô Trồng</span>
                        <IconArrowRight size={14} strokeWidth={2.2} />
                      </Link>

                      <div className="farm-card-actions">
                        <button
                          type="button"
                          className="farm-btn-edit"
                          onClick={(e) => handleOpenEdit(farm, e)}
                          title="Chỉnh sửa nông hộ & ảnh"
                        >
                          <IconPenLine size={15} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="farm-btn-delete"
                          onClick={(e) => handleDelete(farm.id, farm.name, e)}
                          title="Xóa nông hộ"
                        >
                          <IconTrash size={15} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ================= MODAL: THÊM / SỬA NÔNG HỘ ================= */}
        {showModal && (
          <div className="farm-modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="farm-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="farm-modal-header">
                <div className="modal-title-with-icon">
                  <div className="modal-icon-badge">
                    <IconWarehouse size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3>{editingFarm ? "Chỉnh Sửa Nông Hộ" : "Thêm Nông Hộ Mới"}</h3>
                    <p className="modal-subtitle">
                      {editingFarm
                        ? `Cập nhật thông tin & hình ảnh cho nông hộ "${editingFarm.name}"`
                        : "Khai báo thông tin trang trại và khu đất sản xuất"}
                    </p>
                  </div>
                </div>
                <button className="farm-modal-close" onClick={() => setShowModal(false)}>
                  <IconX size={18} strokeWidth={2.2} />
                </button>
              </div>

              <form onSubmit={handleSubmitFarm} className="farm-modal-form">
                <div className="form-group">
                  <label>Tên nông hộ / Trang trại <span className="text-red">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nông trại Cà phê..."
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
                    placeholder="VD: Thôn/Xã, Huyện/Thị xã, Tỉnh thành..."
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="farm-input"
                  />

                  {/* Nút bật lấy vị trí hiện tại qua GPS */}
                  <div className="location-detect-bar">
                    <button
                      type="button"
                      className={`btn-detect-location ${locating ? "loading" : ""}`}
                      onClick={handleGetCurrentLocation}
                      disabled={locating}
                      title="Bật GPS để tự động điền địa chỉ hiện tại của bạn"
                    >
                      <IconMapPin size={14} strokeWidth={2.2} />
                      <span>{locating ? "Đang định vị GPS..." : "Lấy vị trí hiện tại (GPS)"}</span>
                    </button>
                    {locating && (
                      <span className="location-detecting-spinner" />
                    )}
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

                {/* ================= KHỐI CÀI ĐẶT ẢNH NÔNG HỘ ================= */}
                <div className="form-group farm-image-group">
                  <div className="farm-image-header-row">
                    <label className="farm-image-label">
                      <IconImage size={15} strokeWidth={2} />
                      <span>Hình ảnh nông hộ / Trang trại</span>
                    </label>
                    <span className="farm-image-fallback-note">
                      (Để trống sẽ tự lấy ảnh mặc định)
                    </span>
                  </div>

                  {/* Khung xem trước ảnh */}
                  <div className="farm-image-preview-card">
                    <div className="preview-img-container">
                      <img
                        src={form.image || DEFAULT_FARM_IMAGE}
                        alt="Xem trước ảnh nông hộ"
                        onError={(e) => { e.target.src = DEFAULT_FARM_IMAGE; }}
                      />
                      <span className={`preview-badge ${form.image ? "custom" : "default"}`}>
                        {form.image ? "✓ Ảnh đã chọn" : "Ảnh mặc định hệ thống"}
                      </span>
                    </div>

                    <div className="preview-controls-col">
                      <div className="preview-upload-row">
                        <label className="btn-upload-file">
                          <IconUpload size={14} strokeWidth={2} />
                          <span>Tải ảnh từ máy</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            style={{ display: "none" }}
                          />
                        </label>

                        {form.image && (
                          <button
                            type="button"
                            className="btn-clear-img"
                            onClick={handleClearImage}
                            title="Khôi phục về ảnh mặc định"
                          >
                            <IconX size={14} strokeWidth={2} />
                            <span>Về ảnh mặc định</span>
                          </button>
                        )}
                      </div>

                      <div className="image-url-input-wrap">
                        <input
                          type="text"
                          placeholder="Hoặc dán đường link ảnh hoặc đường dẫn (/farms/...)"
                          value={form.image}
                          onChange={(e) => setForm({ ...form, image: e.target.value })}
                          className="farm-input-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ảnh gợi ý mẫu nhanh */}
                  <div className="preset-images-section">
                    <span className="preset-images-label">Chọn nhanh ảnh trang trại mẫu:</span>
                    <div className="preset-images-chips">
                      {PRESET_FARM_IMAGES.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`preset-chip-btn ${form.image === p.url ? "active" : ""}`}
                          onClick={() => setForm({ ...form, image: p.url })}
                        >
                          <img src={p.url} alt={p.label} className="preset-chip-thumb" />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
                    {saving ? "Đang lưu..." : editingFarm ? "Cập Nhật Nông Hộ" : "Lưu Nông Hộ"}
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
