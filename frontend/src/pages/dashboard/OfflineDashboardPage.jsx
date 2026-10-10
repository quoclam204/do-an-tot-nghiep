import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CatalogPanel from "../../components/CatalogPanel";
import { IconRotateCw, IconCheckCircle, IconArrowRight } from "../../components/icons";
import { syncOfflineQueue, getCachedCatalogs, addToOfflineQueue } from "../../utils/offlineSync";

export default function OfflineDashboardPage() {
  const cachedCatalogs = useMemo(() => getCachedCatalogs(), []);

  const availablePlots = useMemo(() => {
    if (cachedCatalogs.seasons && cachedCatalogs.seasons.length > 0) {
      return cachedCatalogs.seasons.map((s) => s.name || `Lô: ${s.plot?.name || 'Vườn'}`);
    }
    if (cachedCatalogs.farms && cachedCatalogs.farms.length > 0) {
      const list = [];
      cachedCatalogs.farms.forEach((f) => {
        (f.plots || []).forEach((p) => {
          list.push(`${f.name} - ${p.name}`);
        });
      });
      if (list.length > 0) return list;
    }
    return [
      "Khu A - Cà phê (Ngoại tuyến)",
      "Khu B - Sầu riêng (Ngoại tuyến)",
      "Khu C - Rau củ vụ mùa (Ngoại tuyến)",
    ];
  }, [cachedCatalogs]);

  const supplies = useMemo(() => {
    if (cachedCatalogs.materials && cachedCatalogs.materials.length > 0) {
      return cachedCatalogs.materials.map((m) => ({
        name: m.name,
        price: m.defaultPrice || 20000,
      }));
    }
    return [
      { name: "Phân bón NPK 16-16-8", price: 18500 },
      { name: "Phân hữu cơ vi sinh", price: 12000 },
      { name: "Phân bón lá đa lượng", price: 65000 },
      { name: "Thuốc BVTV sinh học", price: 45000 },
      { name: "Vôi bột xử lý đất", price: 35000 },
    ];
  }, [cachedCatalogs]);

  const [logs, setLogs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dalat-agri-logs")) || [];
    } catch {
      return [];
    }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dalat-agri-user")) || null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [form, setForm] = useState(() => ({
    plot: availablePlots[0] || "Khu A - Cà phê",
    activity: "Bón phân",
    material: supplies[0]?.name || "Phân bón NPK 16-16-8",
    quantity: "",
    cost: "",
    revenue: "",
    note: "",
  }));

  useEffect(() => {
    localStorage.setItem("dalat-agri-logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const totals = useMemo(
    () =>
      logs.reduce(
        (result, log) => ({
          cost: result.cost + Number(log.cost || 0),
          revenue: result.revenue + Number(log.revenue || 0),
        }),
        { cost: 0, revenue: 0 },
      ),
    [logs],
  );

  const pendingCount = logs.filter(
    (log) => log.syncStatus === "PENDING",
  ).length;
  const formatMoney = (value) =>
    `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
  const selectedSupply = supplies.find(
    (supply) => supply.name === form.material,
  );
  const calculatedCost =
    Number(form.quantity || 0) * (selectedSupply?.price || 0);

  const costBreakdown = useMemo(() => {
    const breakdown = logs.reduce(
      (result, log) => {
        const category =
          log.activity === "Bón phân" || log.activity === "Phun thuốc"
            ? "Vật tư"
            : "Nhân công";
        result[category] += Number(log.cost || 0);
        return result;
      },
      { "Vật tư": 0, "Nhân công": 0 },
    );
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [logs]);

  const plotExpenses = useMemo(
    () =>
      ["Khu A - Cà phê", "Khu B - Dâu tây", "Khu C - Bơ"].map((plot) => ({
        name: plot.replace("Khu ", "").split(" - ")[0],
        expense: logs
          .filter((log) => log.plot === plot)
          .reduce((sum, log) => sum + Number(log.cost || 0), 0),
      })),
    [logs],
  );

  const chartTooltip = {
    formatter: (value) => formatMoney(value),
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.quantity && !form.revenue) return;

    const logId = crypto.randomUUID();
    const newLog = {
      ...form,
      id: logId,
      quantity: Number(form.quantity || 0),
      cost: calculatedCost,
      revenue: Number(form.revenue || 0),
      date: new Date().toLocaleDateString("vi-VN"),
      syncStatus: isOnline ? "SYNCED" : "PENDING",
    };

    setLogs((current) => [newLog, ...current]);

    // Đưa vào Safe Sync Queue để tự động đồng bộ lên Database
    addToOfflineQueue({
      type: 'CREATE_LOG',
      payload: {
        cropCycleId: 'offline_preset_plot_a',
        activityType:
          form.activity === 'Bón phân'
            ? 'BON_PHAN'
            : form.activity === 'Tưới nước'
            ? 'TUOI_NUOC'
            : form.activity === 'Phun thuốc'
            ? 'PHUN_THUOC'
            : 'THU_HOACH',
        activityDate: new Date().toISOString().slice(0, 10),
        notes: `[Ghi nhận ngoại tuyến] Lô: ${form.plot} | ${form.note || ''}`,
        cost: calculatedCost,
        revenue: Number(form.revenue || 0),
      },
      preview: {
        activityType:
          form.activity === 'Bón phân'
            ? 'BON_PHAN'
            : form.activity === 'Tưới nước'
            ? 'TUOI_NUOC'
            : form.activity === 'Phun thuốc'
            ? 'PHUN_THUOC'
            : 'THU_HOACH',
        cropCycle: { name: form.plot },
        cost: calculatedCost,
        revenue: Number(form.revenue || 0),
        notes: form.note,
      },
    });

    setForm((current) => ({
      ...current,
      quantity: "",
      revenue: "",
      note: "",
    }));
  };

  const syncLogs = async () => {
    if (!isOnline) return;
    setLogs((current) =>
      current.map((log) => ({ ...log, syncStatus: "SYNCED" })),
    );
    try {
      await syncOfflineQueue();
    } catch (e) {
      console.error("Lỗi đồng bộ:", e);
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError("");
    const endpoint = authMode === "register" ? "" : "/login";
    const payload =
      authMode === "register"
        ? authForm
        : { email: authForm.email, password: authForm.password };

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/users${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể xác thực tài khoản");
      localStorage.setItem("dalat-agri-token", data.accessToken);
      localStorage.setItem("dalat-agri-user", JSON.stringify(data.user));
      setUser(data.user);
      setAuthMode(null);
      setAuthForm({ email: "", password: "", fullName: "" });
    } catch (error) {
      setAuthError(error.message || "Không thể kết nối máy chủ");
    }
  };

  return (
    <div className="app">
      <Header />

      {authMode && (
        <div className="auth-backdrop" onClick={() => setAuthMode(null)}>
          <form
            className="auth-modal"
            onSubmit={submitAuth}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setAuthMode(null)}
              aria-label="Đóng"
            >
              ×
            </button>
            <p className="eyebrow">TÀI KHOẢN DALATAGRI</p>
            <h2>
              {authMode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
            </h2>
            {authMode === "register" && (
              <label>
                Họ và tên
                <input
                  required
                  value={authForm.fullName}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, fullName: event.target.value })
                  }
                />
              </label>
            )}
            <label>
              Email
              <input
                required
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({ ...authForm, email: event.target.value })
                }
              />
            </label>
            <label>
              Mật khẩu
              <input
                required
                minLength="8"
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
              />
            </label>
            {authError && <p className="auth-error">{authError}</p>}
            <button className="primary-button" type="submit">
              {authMode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
            <button
              className="auth-switch"
              type="button"
              onClick={() => {
                setAuthError("");
                setAuthMode(authMode === "login" ? "register" : "login");
              }}
            >
              {authMode === "login"
                ? "Chưa có tài khoản? Đăng ký"
                : "Đã có tài khoản? Đăng nhập"}
            </button>
          </form>
        </div>
      )}

      <main className="main container">
        <section className="page-intro">
          <div>
            <p className="eyebrow">BẢNG ĐIỀU KHIỂN NÔNG HỘ</p>
            <h1>Nhật ký canh tác, rõ từng mùa vụ.</h1>
            <p className="intro-copy">
              Ghi lại hoạt động, vật tư và chi phí ngay cả khi ngoài vùng phủ sóng.
            </p>
          </div>
          <div
            className={`connection ${isOnline && pendingCount === 0 ? "online" : "offline"}`}
          >
            <span />{" "}
            {isOnline && pendingCount === 0
              ? "Đã đồng bộ"
              : `${pendingCount} bản ghi chờ đồng bộ`}
          </div>
        </section>

        <section className="summary-grid" aria-label="Tổng quan mùa vụ">
          <article className="summary-card">
            <span>Chi phí mùa vụ</span>
            <strong>{formatMoney(totals.cost)}</strong>
            <small>Toàn bộ nhật ký đã ghi</small>
          </article>
          <article className="summary-card">
            <span>Doanh thu dự kiến</span>
            <strong>{formatMoney(totals.revenue)}</strong>
            <small>Theo sản lượng và giá bán</small>
          </article>
          <article className="summary-card accent">
            <span>Chờ đồng bộ</span>
            <strong>{pendingCount}</strong>
            <small>
              {pendingCount ? "Sẽ gửi khi có mạng" : "Dữ liệu đã đồng bộ"}
            </small>
          </article>
        </section>

        <section className="workspace-grid">
          <form className="panel log-form" onSubmit={handleSubmit}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">01 / NHẬT KÝ</p>
                <h2>Ghi hoạt động mới</h2>
              </div>
              <span className="panel-mark">+</span>
            </div>
            <div className="field-grid">
              <label>
                Khu đất
                <select
                  value={form.plot}
                  onChange={(event) =>
                    setForm({ ...form, plot: event.target.value })
                  }
                >
                  {availablePlots.map((plotName) => (
                    <option key={plotName} value={plotName}>
                      {plotName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Hoạt động
                <select
                  value={form.activity}
                  onChange={(event) =>
                    setForm({ ...form, activity: event.target.value })
                  }
                >
                  <option>Bón phân</option>
                  <option>Tưới nước</option>
                  <option>Phun thuốc</option>
                  <option>Thu hoạch</option>
                </select>
              </label>
              <label>
                Vật tư
                <select
                  value={form.material}
                  onChange={(event) =>
                    setForm({ ...form, material: event.target.value })
                  }
                >
                  {supplies.map((supply) => (
                    <option key={supply.name}>{supply.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Số lượng
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                  placeholder="0"
                />
              </label>
              <label>
                Chi phí (VNĐ)
                <input
                  value={
                    calculatedCost
                      ? formatMoney(calculatedCost)
                      : "Tự động tính theo số lượng"
                  }
                  readOnly
                  className="calculated-field"
                />
              </label>
              <label>
                Doanh thu (VNĐ)
                <input
                  type="number"
                  min="0"
                  value={form.revenue}
                  onChange={(event) =>
                    setForm({ ...form, revenue: event.target.value })
                  }
                  placeholder="Chỉ nhập khi thu hoạch"
                />
              </label>
            </div>
            <label>
              Ghi chú
              <textarea
                rows="3"
                value={form.note}
                onChange={(event) =>
                  setForm({ ...form, note: event.target.value })
                }
                placeholder="Thời tiết, tình trạng cây, công việc cần theo dõi..."
              />
            </label>
            <button className="primary-button" type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Lưu nhật ký <IconArrowRight size={16} />
            </button>
          </form>

          <section className="panel report-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">02 / BÁO CÁO</p>
                <h2>Hiệu quả theo khu đất</h2>
              </div>
              <span className="period">Mùa hiện tại</span>
            </div>
            <div className="charts-grid">
              <div className="chart-block">
                <h3>Cơ cấu chi phí</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {costBreakdown.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={["#1e804d", "#e59b35"][index]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={chartTooltip.formatter} />
                      <Legend verticalAlign="bottom" height={28} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="chart-block">
                <h3>Chi phí theo khu</h3>
                <div className="chart-container bar-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={plotExpenses}
                      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#e5ece7" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis hide />
                      <Tooltip formatter={chartTooltip.formatter} />
                      <Bar
                        dataKey="expense"
                        name="Chi phí"
                        fill="#1e804d"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="report-list">
              {["Khu A - Cà phê", "Khu B - Dâu tây", "Khu C - Bơ"].map(
                (plot) => {
                  const plotLogs = logs.filter((log) => log.plot === plot);
                  const cost = plotLogs.reduce(
                    (sum, log) => sum + Number(log.cost || 0),
                    0,
                  );
                  const revenue = plotLogs.reduce(
                    (sum, log) => sum + Number(log.revenue || 0),
                    0,
                  );
                  return (
                    <div className="report-row" key={plot}>
                      <div>
                        <strong>{plot}</strong>
                        <small>{plotLogs.length} hoạt động</small>
                      </div>
                      <div className="report-values">
                        <span>Chi {formatMoney(cost)}</span>
                        <b>{formatMoney(revenue - cost)}</b>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
            <div className="report-note">
              Lãi tạm tính = doanh thu - chi phí đã ghi nhận.
            </div>
          </section>
        </section>

        <CatalogPanel user={user} />

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">03 / LỊCH SỬ</p>
              <h2>Hoạt động gần đây</h2>
            </div>
            <button
              className="sync-button"
              onClick={syncLogs}
              disabled={!isOnline || pendingCount === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconRotateCw size={14} /> Đồng bộ {pendingCount ? `(${pendingCount})` : ""}
            </button>
          </div>
          {logs.length === 0 ? (
            <div className="empty-state">
              Chưa có nhật ký. Hãy ghi hoạt động đầu tiên của mùa vụ.
            </div>
          ) : (
            <div className="activity-list">
              {logs.slice(0, 5).map((log) => (
                <div className="activity-row" key={log.id}>
                  <span className="activity-icon">
                    <IconCheckCircle size={16} />
                  </span>
                  <div>
                    <strong>{log.activity}</strong>
                    <small>
                      {log.plot} · {log.date} · {log.quantity} đơn vị{" "}
                      {log.material}
                    </small>
                  </div>
                  <div className="activity-cost">
                    {log.cost ? formatMoney(log.cost) : "Không phát sinh"}
                    <small>
                      {log.syncStatus === "SYNCED"
                        ? "Đã đồng bộ"
                        : "Chờ đồng bộ"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
