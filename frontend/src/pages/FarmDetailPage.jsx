import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  apiGetFarm,
  apiCreatePlot,
  apiDeletePlot,
  apiUpdatePlot,
  apiAddFarmMember,
  apiRemoveFarmMember,
} from "../services/api";
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
  IconUsers,
  IconUserPlus,
  IconUpload,
  IconImage,
} from "../components/icons";
import "./FarmDetailPage.css";

// Ảnh lô đất mặc định
const DEFAULT_PLOT_IMAGE = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80";

// Danh sách ảnh mẫu lô đất chuyên canh
const PRESET_PLOT_IMAGES = [
  { label: "Vườn Cà phê", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80" },
  { label: "Vườn Sầu riêng", url: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=800&q=80" },
  { label: "Vườn Bơ sáp 034", url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80" },
  { label: "Vườn Mắc ca ghép", url: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80" },
  { label: "Vườn Chè & Cây Trái", url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80" },
];

const PLOT_IMAGES_STORAGE_KEY = "dalatagri_plot_images";

const getStoredPlotImages = () => {
  try {
    const raw = localStorage.getItem(PLOT_IMAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredPlotImage = (idOrName, url) => {
  try {
    const current = getStoredPlotImages();
    current[idOrName] = url;
    localStorage.setItem(PLOT_IMAGES_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Không thể lưu ảnh lô đất vào bộ nhớ cục bộ:", e);
  }
};

const getPlotImage = (plot) => {
  if (!plot) return DEFAULT_PLOT_IMAGE;
  const stored = getStoredPlotImages();
  return stored[plot.id] || stored[plot.name] || DEFAULT_PLOT_IMAGE;
};

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

  const [activeTab, setActiveTab] = useState("plots"); // "plots" | "members"

  const [showPlotModal, setShowPlotModal] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [plotToDelete, setPlotToDelete] = useState(null);
  const [plotForm, setPlotForm] = useState({ name: "", area: "", unit: "ha", image: "" });
  const [saving, setSaving] = useState(false);
  const plotFileInputRef = useRef(null);

  // Quản lý thành viên nông hộ
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({
    emailOrPhone: "",
    role: "WORKER",
    canEditLog: true,
    canManageInventory: true,
  });
  const [savingMember, setSavingMember] = useState(false);

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
    setPlotForm({ name: "", area: "", unit: "ha", image: "" });
    setShowPlotModal(true);
  };

  const openEditModal = (plot) => {
    setEditingPlot(plot);
    const stored = getStoredPlotImages();
    const currentImg = stored[plot.id] || stored[plot.name] || "";
    setPlotForm({ name: plot.name, area: String(plot.area), unit: "ha", image: currentImg });
    setShowPlotModal(true);
  };

  const handlePlotImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh tối đa là 5MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPlotForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearPlotImage = () => {
    setPlotForm((prev) => ({ ...prev, image: "" }));
    if (plotFileInputRef.current) plotFileInputRef.current.value = "";
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

      // Nếu người dùng để trống ảnh thì tự lấy ảnh mặc định
      const finalImage = plotForm.image.trim() || DEFAULT_PLOT_IMAGE;

      if (editingPlot) {
        await apiUpdatePlot(id, editingPlot.id, payload);
        saveStoredPlotImage(editingPlot.id, finalImage);
        saveStoredPlotImage(payload.name, finalImage);
      } else {
        const res = await apiCreatePlot(id, payload);
        if (res && res.id) {
          saveStoredPlotImage(res.id, finalImage);
        }
        saveStoredPlotImage(payload.name, finalImage);
      }
      setShowPlotModal(false);
      loadFarm();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi lưu lô trồng");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlot = (plotId, plotName) => {
    setPlotToDelete({ id: plotId, name: plotName });
  };

  const handleConfirmDeletePlot = async () => {
    if (!plotToDelete) return;
    try {
      await apiDeletePlot(id, plotToDelete.id);
      setPlotToDelete(null);
      loadFarm();
    } catch (err) {
      alert("Lỗi khi xóa lô trồng: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!memberForm.emailOrPhone.trim()) return alert("Vui lòng nhập email hoặc số điện thoại của nông dân!");
    setSavingMember(true);
    try {
      await apiAddFarmMember(id, memberForm);
      setShowMemberModal(false);
      setMemberForm({
        emailOrPhone: "",
        role: "WORKER",
        canEditLog: true,
        canManageInventory: true,
      });
      loadFarm();
    } catch (err) {
      alert("Lỗi thêm nông dân: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản nông dân "${memberName || 'thành viên'}" khỏi trang trại này?`)) return;
    try {
      await apiRemoveFarmMember(id, memberId);
      loadFarm();
    } catch (err) {
      alert("Lỗi xóa thành viên: " + (err.response?.data?.message || err.message));
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
                  <span className="meta-dot">•</span>
                  <span className="meta-item">
                    <IconUsers size={15} strokeWidth={2} />
                    <span>Nông dân phụ trách: <strong>{(farm.members || []).length || 1} người</strong></span>
                  </span>
                </div>
              </div>
            </div>

            <div className="farm-header-actions-group">
              {activeTab === "plots" ? (
                <button className="add-plot-btn" onClick={openAddModal}>
                  <IconPlus size={18} strokeWidth={2.4} />
                  <span>Thêm Lô Trồng Mới</span>
                </button>
              ) : (
                <button className="add-plot-btn member-btn" onClick={() => setShowMemberModal(true)}>
                  <IconUserPlus size={18} strokeWidth={2.4} />
                  <span>Thêm Nông Dân Vào Vườn</span>
                </button>
              )}
            </div>
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

        {/* Navigation Tabs */}
        <div className="farm-detail-nav-tabs">
          <button
            type="button"
            className={`farm-nav-tab-btn ${activeTab === "plots" ? "active" : ""}`}
            onClick={() => setActiveTab("plots")}
          >
            <IconSprout size={18} strokeWidth={2} />
            <span>Lô Đất Canh Tác ({plots.length})</span>
          </button>
          <button
            type="button"
            className={`farm-nav-tab-btn ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            <IconUsers size={18} strokeWidth={2} />
            <span>Nông Dân Phụ Trách ({(farm.members || []).length || 1})</span>
          </button>
        </div>

        {/* Plots List Section */}
        {activeTab === "plots" && (
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
                    <div className="plot-card-cover">
                      <img
                        src={getPlotImage(plot)}
                        alt={plot.name}
                        onError={(e) => { e.target.src = DEFAULT_PLOT_IMAGE; }}
                      />
                      <span className="plot-card-badge">
                        <IconCheckCircle size={12} strokeWidth={2.4} />
                        <span>Lô canh tác</span>
                      </span>
                      <div className="plot-cover-actions">
                        <button
                          type="button"
                          className="btn-icon-action edit"
                          onClick={() => openEditModal(plot)}
                          title="Chỉnh sửa lô đất & ảnh"
                        >
                          <IconPenLine size={15} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete"
                          onClick={() => handleDeletePlot(plot.id, plot.name)}
                          title="Xóa lô đất"
                        >
                          <IconTrash size={15} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    <div className="plot-card-body">
                      <div className="plot-title-row">
                        <div className="plot-icon-box">
                          <IconSprout size={18} strokeWidth={2} />
                        </div>
                        <h3 className="plot-box-title">{plot.name}</h3>
                      </div>

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
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Members List Section */}
        {activeTab === "members" && (
          <section className="members-list-section">
            <div className="plots-section-title-row">
              <div>
                <h2>Nông Dân & Người Phụ Trách Trang Trại</h2>
                <p className="section-subtitle">
                  Một trang trại có thể có nhiều tài khoản người nông dân cùng tham gia cập nhật nhật ký canh tác và quản lý kho vật tư.
                </p>
              </div>
              <button className="add-plot-btn member-btn" onClick={() => setShowMemberModal(true)}>
                <IconUserPlus size={18} strokeWidth={2.4} />
                <span>Thêm Nông Dân Mới</span>
              </button>
            </div>

            <div className="members-grid-layout">
              {/* Chủ sở hữu gốc */}
              {farm.user && (
                <div className="member-card-box owner">
                  <div className="member-card-top">
                    <div className="member-avatar owner">
                      {farm.user.fullName?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <span className="member-role-badge owner">Chủ Trang Trại</span>
                  </div>
                  <h3 className="member-name">{farm.user.fullName}</h3>
                  <div className="member-contact-info">
                    <span>📧 {farm.user.email}</span>
                    {farm.user.phone && <span>📞 {farm.user.phone}</span>}
                  </div>
                  <div className="member-permissions-tags">
                    <span className="perm-tag success">✓ Toàn quyền quản lý & sở hữu</span>
                  </div>
                </div>
              )}

              {/* Các thành viên được mời / thêm vào */}
              {(farm.members || [])
                .filter((m) => m.userId !== farm.userId)
                .map((m) => (
                  <div key={m.id} className="member-card-box">
                    <div className="member-card-top">
                      <div className="member-avatar worker">
                        {m.user?.fullName?.charAt(0)?.toUpperCase() || "N"}
                      </div>
                      <div className="member-actions-top">
                        <span className={`member-role-badge ${m.role.toLowerCase()}`}>
                          {m.role === 'MANAGER' ? 'Quản lý vườn' : 'Nông dân làm vườn'}
                        </span>
                        <button
                          className="btn-icon-action delete"
                          onClick={() => handleDeleteMember(m.id, m.user?.fullName || m.user?.email)}
                          title="Xóa khỏi nông hộ"
                        >
                          <IconTrash size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    <h3 className="member-name">{m.user?.fullName || "Nông dân"}</h3>
                    <div className="member-contact-info">
                      <span>📧 {m.user?.email || "—"}</span>
                      {m.user?.phone && <span>📞 {m.user.phone}</span>}
                    </div>

                    <div className="member-permissions-tags">
                      {m.canEditLog && <span className="perm-tag success">✓ Ghi nhật ký canh tác</span>}
                      {m.canManageInventory && <span className="perm-tag info">✓ Quản lý kho vật tư</span>}
                    </div>

                    <div className="member-joined-date">
                      Tham gia: {new Date(m.joinedAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

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
                    <p className="modal-subtitle">
                      {editingPlot
                        ? `Cập nhật thông tin & hình ảnh cho lô "${editingPlot.name}"`
                        : `Khai báo khu vườn canh tác trực thuộc nông hộ ${farm.name}`}
                    </p>
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

                {/* ================= KHỐI CÀI ĐẶT ẢNH LÔ ĐẤT ================= */}
                <div className="form-group farm-image-group">
                  <div className="farm-image-header-row">
                    <label className="farm-image-label">
                      <IconImage size={15} strokeWidth={2} />
                      <span>Hình ảnh Lô đất / Khu vườn</span>
                    </label>
                    <span className="farm-image-fallback-note">
                      (Để trống sẽ tự lấy ảnh mặc định)
                    </span>
                  </div>

                  {/* Khung xem trước ảnh */}
                  <div className="farm-image-preview-card">
                    <div className="preview-img-container">
                      <img
                        src={plotForm.image || DEFAULT_PLOT_IMAGE}
                        alt="Xem trước ảnh lô đất"
                        onError={(e) => { e.target.src = DEFAULT_PLOT_IMAGE; }}
                      />
                      <span className={`preview-badge ${plotForm.image ? "custom" : "default"}`}>
                        {plotForm.image ? "✓ Ảnh đã chọn" : "Ảnh mặc định hệ thống"}
                      </span>
                    </div>

                    <div className="preview-controls-col">
                      <div className="preview-upload-row">
                        <label className="btn-upload-file">
                          <IconUpload size={14} strokeWidth={2} />
                          <span>Tải ảnh từ máy</span>
                          <input
                            ref={plotFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePlotImageFileChange}
                            style={{ display: "none" }}
                          />
                        </label>

                        {plotForm.image && (
                          <button
                            type="button"
                            className="btn-clear-img"
                            onClick={handleClearPlotImage}
                            title="Khôi phục về ảnh mặc định"
                          >
                            <IconX size={14} strokeWidth={2} />
                            <span>Về ảnh mặc định</span>
                          </button>
                        )}
                      </div>

                      <div className="image-url-input-wrap">
                        <input
                          type="url"
                          placeholder="Hoặc dán đường link ảnh (URL) tại đây..."
                          value={plotForm.image}
                          onChange={(e) => setPlotForm({ ...plotForm, image: e.target.value })}
                          className="farm-input-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ảnh gợi ý mẫu nhanh */}
                  <div className="preset-images-section">
                    <span className="preset-images-label">Chọn nhanh ảnh vườn mẫu chuyên canh:</span>
                    <div className="preset-images-chips">
                      {PRESET_PLOT_IMAGES.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`preset-chip-btn ${plotForm.image === p.url ? "active" : ""}`}
                          onClick={() => setPlotForm({ ...plotForm, image: p.url })}
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

        {/* Modal Thêm Nông Dân Vào Vườn */}
        {showMemberModal && (
          <div className="farm-modal-backdrop" onClick={() => setShowMemberModal(false)}>
            <div className="farm-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="farm-modal-header">
                <div className="modal-title-with-icon">
                  <div className="modal-icon-badge" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <IconUserPlus size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3>Thêm Nông Dân Vào Trang Trại</h3>
                    <p className="modal-subtitle">Gán tài khoản người làm vườn cùng quản lý nông hộ {farm.name}</p>
                  </div>
                </div>
                <button className="farm-modal-close" onClick={() => setShowMemberModal(false)}>
                  <IconX size={18} strokeWidth={2.2} />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="farm-modal-form">
                <div className="form-group">
                  <label>Email hoặc Số điện thoại nông dân <span className="text-red">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: nguyenvana@gmail.com hoặc 0912345678"
                    value={memberForm.emailOrPhone}
                    onChange={(e) => setMemberForm({ ...memberForm, emailOrPhone: e.target.value })}
                    className="farm-input"
                  />
                  <small style={{ color: '#64748b', marginTop: '6px', display: 'block', fontSize: '0.85rem' }}>
                    💡 Tài khoản này cần đã đăng ký trên DalatAgri để được gán quyền làm việc tại vườn này.
                  </small>
                </div>

                <div className="form-group">
                  <label>Vai trò trong trang trại</label>
                  <select
                    className="farm-input"
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  >
                    <option value="WORKER">Nông dân / Người làm vườn (Ghi nhật ký thực địa)</option>
                    <option value="MANAGER">Quản lý nông hộ (Điều phối lô đất, kho vật tư & vụ mùa)</option>
                  </select>
                </div>

                <div className="form-group" style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#334155', marginBottom: '8px', display: 'block' }}>
                    Quyền hạn cụ thể:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={memberForm.canEditLog}
                        onChange={(e) => setMemberForm({ ...memberForm, canEditLog: e.target.checked })}
                      />
                      <span>Cho phép cập nhật nhật ký canh tác (bón phân, phun thuốc, thu hoạch)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={memberForm.canManageInventory}
                        onChange={(e) => setMemberForm({ ...memberForm, canManageInventory: e.target.checked })}
                      />
                      <span>Cho phép quản lý & xuất nhập kho vật tư</span>
                    </label>
                  </div>
                </div>

                <div className="farm-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowMemberModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingMember}
                  >
                    {savingMember ? "Đang thêm..." : "Xác Nhận Thêm Nông Dân"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL XÁC NHẬN XÓA LÔ ĐẤT */}
        {plotToDelete && (
          <div className="farm-modal-overlay" onClick={() => setPlotToDelete(null)}>
            <div
              className="farm-modal-card"
              style={{ maxWidth: '460px', textAlign: 'center', padding: '2rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.25rem' }}>
                Xác nhận xóa lô canh tác
              </h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 1rem', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa lô đất <strong>"{plotToDelete.name}"</strong> không?
              </p>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#b91c1c',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}
              >
                ⚠️ <strong>Cảnh báo:</strong> Nếu lô này đang có lịch sử mùa vụ hoặc cây trồng, hệ thống sẽ ngăn chặn xóa để bảo vệ dữ liệu nông hộ của bạn.
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ minWidth: '110px' }}
                  onClick={() => setPlotToDelete(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ minWidth: '130px', background: '#dc2626', borderColor: '#b91c1c' }}
                  onClick={handleConfirmDeletePlot}
                >
                  Đồng ý xóa lô
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
