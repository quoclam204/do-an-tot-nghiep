import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetFarm, apiCreatePlot, apiDeletePlot, apiUpdatePlot } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { IconArrowLeft, IconMapPin, IconRuler, IconPlus, IconPenLine, IconTrash } from "../components/icons";
import "./FarmsPage.css"; // Reuse modal styles

export default function FarmDetailPage() {
  const { id } = useParams();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [plotForm, setPlotForm] = useState({ name: "", area: "" });
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
      setError("Không thể tải chi tiết nông hộ");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPlot(null);
    setPlotForm({ name: "", area: "" });
    setShowPlotModal(true);
  };

  const openEditModal = (plot) => {
    setEditingPlot(plot);
    setPlotForm({ name: plot.name, area: plot.area });
    setShowPlotModal(true);
  };

  const handleSavePlot = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...plotForm, area: Number(plotForm.area) };
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

  const handleDeletePlot = async (plotId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lô trồng này?")) return;
    try {
      await apiDeletePlot(id, plotId);
      loadFarm();
    } catch (err) {
      alert("Lỗi khi xóa lô trồng");
    }
  };

  if (loading) return <div className="loading-state">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!farm) return null;

  return (
    <div className="app">
      <Header />
      <main className="main container">
        <div className="breadcrumb">
          <Link to="/farms" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <IconArrowLeft size={16} /> Quay lại danh sách
          </Link>
        </div>
        
        <section className="farm-detail-header">
          <div>
            <h1>{farm.name}</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IconMapPin size={15} /> {farm.location}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IconRuler size={15} /> Tổng diện tích: {farm.totalArea} ha
              </span>
            </p>
          </div>
        </section>

        <section className="plots-section">
          <div className="section-header">
            <h2>Danh sách Lô trồng</h2>
            <button className="primary-button" onClick={openAddModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconPlus size={16} /> Thêm lô
            </button>
          </div>

          {!farm.plots || farm.plots.length === 0 ? (
            <div className="empty-state">Chưa có lô trồng nào trong nông hộ này.</div>
          ) : (
            <div className="plots-grid">
              {farm.plots.map(plot => (
                <div key={plot.id} className="plot-card">
                  <div className="plot-info">
                    <h3>{plot.name}</h3>
                    <p>Diện tích: {plot.area} ha</p>
                  </div>
                  <div className="plot-actions">
                    <button onClick={() => openEditModal(plot)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconPenLine size={13} /> Sửa
                    </button>
                    <button className="delete-text" onClick={() => handleDeletePlot(plot.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconTrash size={13} /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {showPlotModal && (
          <div className="modal-backdrop" onClick={() => setShowPlotModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPlotModal(false)}>×</button>
              <h2>{editingPlot ? "Sửa lô trồng" : "Thêm lô trồng mới"}</h2>
              <form onSubmit={handleSavePlot}>
                <label>
                  Tên lô
                  <input
                    required
                    value={plotForm.name}
                    onChange={(e) => setPlotForm({ ...plotForm, name: e.target.value })}
                  />
                </label>
                <label>
                  Diện tích (ha)
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={plotForm.area}
                    onChange={(e) => setPlotForm({ ...plotForm, area: e.target.value })}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu Lô trồng"}
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
