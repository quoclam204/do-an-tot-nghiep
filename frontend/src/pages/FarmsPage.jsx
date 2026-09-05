import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGetMyFarms, apiCreateFarm, apiDeleteFarm } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { IconPlus, IconTrash, IconMapPin, IconRuler, IconSprout } from "../components/icons";
import "./FarmsPage.css";

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", totalArea: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const data = await apiGetMyFarms();
      setFarms(data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách nông hộ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiCreateFarm({ ...form, totalArea: Number(form.totalArea) });
      setShowModal(false);
      setForm({ name: "", location: "", totalArea: "" });
      loadFarms();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo nông hộ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm("Bạn có chắc chắn muốn xóa nông hộ này?")) return;
    try {
      await apiDeleteFarm(id);
      loadFarms();
    } catch (err) {
      alert("Lỗi khi xóa nông hộ");
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="main container farms-page">
        <section className="page-intro">
          <div>
            <p className="eyebrow">QUẢN LÝ TÀI SẢN</p>
            <h1>Nông hộ của bạn</h1>
            <p className="intro-copy">
              Quản lý các trang trại và lô trồng để bắt đầu ghi nhật ký mùa vụ.
            </p>
          </div>
          <button className="primary-button" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <IconPlus size={16} strokeWidth={2.2} /> Thêm nông hộ
          </button>
        </section>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">Đang tải dữ liệu...</div>
        ) : farms.length === 0 ? (
          <div className="empty-state">
            Bạn chưa có nông hộ nào. Hãy thêm nông hộ đầu tiên.
          </div>
        ) : (
          <div className="farms-grid">
            {farms.map((farm) => (
              <Link to={`/farms/${farm.id}`} key={farm.id} className="farm-card">
                <div className="farm-card-header">
                  <h3>{farm.name}</h3>
                  <button className="delete-btn" onClick={(e) => handleDelete(farm.id, e)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IconTrash size={14} /> Xóa
                  </button>
                </div>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconMapPin size={15} strokeWidth={2} /> {farm.location}
                </p>
                <div className="farm-card-stats">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <IconRuler size={14} /> {farm.totalArea} ha
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <IconSprout size={14} /> {farm.plots?.length || 0} Lô trồng
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              <h2>Thêm Nông hộ mới</h2>
              <form onSubmit={handleCreateFarm}>
                <label>
                  Tên nông hộ
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Vị trí
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </label>
                <label>
                  Tổng diện tích (ha)
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.totalArea}
                    onChange={(e) => setForm({ ...form, totalArea: e.target.value })}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu Nông hộ"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
