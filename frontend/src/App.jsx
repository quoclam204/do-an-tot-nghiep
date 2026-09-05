import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

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

import Header from "./components/Header";
import Footer from "./components/Footer";
import CatalogPanel from "./components/CatalogPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { IconRotateCw, IconCheckCircle, IconArrowRight } from "./components/icons";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountPage from "./pages/AccountPage";
import FarmsPage from "./pages/FarmsPage";
import FarmDetailPage from "./pages/FarmDetailPage";

function DashboardPage() {
  const supplies = [
    { name: "Phân hữu cơ", price: 12000 },
    { name: "NPK 16-16-8", price: 18500 },
    { name: "Thuốc sinh học", price: 45000 },
  ];

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
  const [form, setForm] = useState({
    plot: "Khu A - Cà phê",
    activity: "Bón phân",
    material: "Phân hữu cơ",
    quantity: "",
    cost: "",
    revenue: "",
    note: "",
  });

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

    setLogs((current) => [
      {
        ...form,
        id: crypto.randomUUID(),
        quantity: Number(form.quantity || 0),
        cost: calculatedCost,
        revenue: Number(form.revenue || 0),
        date: new Date().toLocaleDateString("vi-VN"),
        syncStatus: isOnline ? "SYNCED" : "PENDING",
      },
      ...current,
    ]);
    setForm((current) => ({
      ...current,
      quantity: "",
      revenue: "",
      note: "",
    }));
  };

  const syncLogs = () => {
    if (!isOnline) return;
    setLogs((current) =>
      current.map((log) => ({ ...log, syncStatus: "SYNCED" })),
    );
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

  const logout = () => {
    localStorage.removeItem("dalat-agri-token");
    localStorage.removeItem("dalat-agri-user");
    setUser(null);
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
              Ghi lại hoạt động, vật tư và chi phí ngay cả khi ngoài vùng phủ
              sóng.
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
                  <option>Khu A - Cà phê</option>
                  <option>Khu B - Dâu tây</option>
                  <option>Khu C - Bơ</option>
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

function CropsPage() {
  const { user } = useAuth();

  return (
    <div className="app">
      <Header />
      <main className="main container">
        <section className="page-intro">
          <div>
            <p className="eyebrow">DANH MỤC SẢN XUẤT</p>
            <h1>Quản lý cây trồng</h1>
            <p className="intro-copy">
              Thêm, theo dõi và cập nhật các loại cây đang được canh tác.
            </p>
          </div>
        </section>
        <CatalogPanel user={user} initialTab="crops" />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <div className="app">
                <Header />
                <HomePage />
                <Footer />
              </div>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/crops" element={<CropsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/farms" element={<ProtectedRoute><FarmsPage /></ProtectedRoute>} />
          <Route path="/farms/:id" element={<ProtectedRoute><FarmDetailPage /></ProtectedRoute>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
