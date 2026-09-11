import { useEffect, useState } from "react";
import {
  IconSprout,
  IconWarehouse,
  IconLeaf,
  IconBookOpen,
  IconLineChart,
  IconPenLine,
  IconTrash,
  IconRotateCw,
} from "./icons";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const emptyCycle = {
  cropId: "",
  name: "",
  description: "",
  stages: [{ name: "", durationDays: "" }],
};

async function request(path, options = {}) {
  const token = localStorage.getItem('token') || localStorage.getItem('dalat-agri-token');
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || "Không thể kết nối máy chủ",
    );
  return data;
}

function CatalogPanel({ user, initialTab = "crops" }) {
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState({
    crops: [],
    farms: [],
    plots: [],
    seasons: [],
    cycles: [],
  });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cropForm, setCropForm] = useState({ name: "", type: "" });
  const [farmForm, setFarmForm] = useState({
    name: "",
    location: "",
    totalArea: "",
  });
  const [plotForm, setPlotForm] = useState({ farmId: "", name: "", area: "" });
  const [seasonForm, setSeasonForm] = useState({
    plotId: "",
    cropId: "",
    growthCycleId: "",
    name: "",
    startDate: "",
    expectedEndDate: "",
  });
  const [cycleForm, setCycleForm] = useState(emptyCycle);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [crops, farms, plots, seasons, cycles] = await Promise.all([
        request("/catalog/crops"),
        request("/catalog/farms"),
        request("/catalog/plots"),
        request("/catalog/seasons"),
        request("/catalog/growth-cycles"),
      ]);
      setData({ crops, farms, plots, seasons, cycles });
      setPlotForm((current) => ({
        ...current,
        farmId: current.farmId || farms[0]?.id || "",
      }));
      setSeasonForm((current) => ({
        ...current,
        plotId: current.plotId || plots[0]?.id || "",
        cropId: current.cropId || crops[0]?.id || "",
      }));
      setCycleForm((current) => ({
        ...current,
        cropId: current.cropId || crops[0]?.id || "",
      }));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const save = async (event, path, body, reset, method = "POST") => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await request(path, { method, body: JSON.stringify(body) });
      reset();
      setEditing(null);
      setMessage(method === "PATCH" ? "Đã cập nhật dữ liệu" : "Đã thêm dữ liệu mới");
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (path, label) => {
    if (!window.confirm(`Xóa ${label} này?`)) return;
    try {
      setLoading(true);
      await request(path, { method: "DELETE" });
      setMessage(`Đã xóa ${label}`);
      await loadData();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setLoading(false);
    }
  };

  const edit = (type, item) => {
    setEditing({ type, id: item.id });
    if (type === "crop") setCropForm({ name: item.name, type: item.type });
    if (type === "farm")
      setFarmForm({
        name: item.name,
        location: item.location,
        totalArea: item.totalArea,
      });
    if (type === "plot")
      setPlotForm({ farmId: item.farmId, name: item.name, area: item.area });
    if (type === "season")
      setSeasonForm({
        plotId: item.plotId,
        cropId: item.cropId,
        growthCycleId: item.growthCycleId || "",
        name: item.name,
        startDate: item.startDate?.slice(0, 10) || "",
        expectedEndDate: item.expectedEndDate?.slice(0, 10) || "",
      });
  };

  const cancelEdit = () => {
    setEditing(null);
    setCropForm({ name: "", type: "" });
    setFarmForm({ name: "", location: "", totalArea: "" });
    setPlotForm({ farmId: data.farms[0]?.id || "", name: "", area: "" });
    setSeasonForm({
      plotId: data.plots[0]?.id || "",
      cropId: data.crops[0]?.id || "",
      growthCycleId: "",
      name: "",
      startDate: "",
      expectedEndDate: "",
    });
  };
  const tabs = [
    ["crops", "Cây trồng", data.crops.length, IconSprout],
    ["farms", "Vườn", data.farms.length, IconWarehouse],
    ["plots", "Lô trồng", data.plots.length, IconLeaf],
    ["seasons", "Mùa vụ", data.seasons.length, IconBookOpen],
    ["cycles", "Chu kỳ", data.cycles.length, IconLineChart],
  ];
  const formProps = (type, collection, path, body, reset) => ({
    method: editing?.type === type ? "PATCH" : "POST",
    path: editing?.type === type ? `${path}/${editing.id}` : path,
    body,
    reset,
  });

  return (
    <section className="panel catalog-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">04 / DANH MỤC</p>
          <h2>Dữ liệu nền sản xuất</h2>
          <p className="catalog-subtitle">
            Thiết lập một lần, dùng xuyên suốt mùa vụ.
          </p>
        </div>
        <button className="sync-button" type="button" onClick={loadData} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <IconRotateCw size={14} /> {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
      <div className="catalog-tabs" role="tablist">
        {tabs.map(([value, label, count, TabIcon]) => (
          <button
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "active" : ""}
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              cancelEdit();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {TabIcon && <TabIcon size={15} />}
            <span>{label}</span>
            <span>{count}</span>
          </button>
        ))}
      </div>
      {error && <p className="catalog-toast error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Đóng thông báo">×</button></p>}
      {message && <p className="catalog-toast success" role="status">{message}<button type="button" onClick={() => setMessage("")} aria-label="Đóng thông báo">×</button></p>}

      {tab === "crops" && (
        <div className="catalog-layout">
          <form
            className="catalog-form"
            onSubmit={(event) => {
              const f = formProps(
                "crop",
                data.crops,
                "/catalog/crops",
                cropForm,
                () => setCropForm({ name: "", type: "" }),
              );
              save(event, f.path, f.body, f.reset, f.method);
            }}
          >
            <h3>
              {editing?.type === "crop"
                ? "Chỉnh sửa cây trồng"
                : "Thêm cây trồng"}
            </h3>
            <label>
              Tên cây
              <input
                required
                value={cropForm.name}
                onChange={(e) =>
                  setCropForm({ ...cropForm, name: e.target.value })
                }
                placeholder="Cà phê"
              />
            </label>
            <label>
              Nhóm cây
              <input
                required
                value={cropForm.type}
                onChange={(e) =>
                  setCropForm({ ...cropForm, type: e.target.value })
                }
                placeholder="Cây công nghiệp"
              />
            </label>
            <Actions
              editing={editing?.type === "crop"}
              label="cây trồng"
              onCancel={cancelEdit}
            />
          </form>
          <List
            title={`${data.crops.length} cây trồng`}
            empty="Chưa có cây trồng."
            items={data.crops}
            render={(item) => (
              <>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.type}</small>
                </div>
                <ItemActions
                  onEdit={() => edit("crop", item)}
                  onDelete={() =>
                    remove(`/catalog/crops/${item.id}`, "cây trồng")
                  }
                />
              </>
            )}
          />
        </div>
      )}

      {tab === "farms" && (
        <div className="catalog-layout">
          <form
            className="catalog-form"
            onSubmit={(event) => {
              const currentUserId =
                user?.id ||
                JSON.parse(localStorage.getItem("user") || "{}")?.id ||
                JSON.parse(localStorage.getItem("dalat-agri-user") || "{}")?.id;
              const f = formProps(
                "farm",
                data.farms,
                "/catalog/farms",
                { ...farmForm, userId: currentUserId },
                () => setFarmForm({ name: "", location: "", totalArea: "" }),
              );
              save(event, f.path, f.body, f.reset, f.method);
            }}
          >
            <h3>{editing?.type === "farm" ? "Chỉnh sửa vườn" : "Thêm vườn"}</h3>
            {!user && (
              <p className="catalog-message error">
                Đăng nhập trước khi tạo vườn.
              </p>
            )}
            <label>
              Tên vườn
              <input
                required
                value={farmForm.name}
                onChange={(e) =>
                  setFarmForm({ ...farmForm, name: e.target.value })
                }
                placeholder="Vườn Đồi Thông"
              />
            </label>
            <label>
              Địa điểm
              <input
                required
                value={farmForm.location}
                onChange={(e) =>
                  setFarmForm({ ...farmForm, location: e.target.value })
                }
                placeholder="VD: Đắk Lắk, Lâm Đồng, Tiền Giang..."
              />
            </label>
            <label>
              Diện tích (ha)
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={farmForm.totalArea}
                onChange={(e) =>
                  setFarmForm({ ...farmForm, totalArea: e.target.value })
                }
              />
            </label>
            <Actions
              editing={editing?.type === "farm"}
              label="vườn"
              onCancel={cancelEdit}
              disabled={!user}
            />
          </form>
          <List
            title={`${data.farms.length} vườn`}
            items={data.farms}
            render={(item) => (
              <>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.location} · {item.totalArea} ha ·{" "}
                    {item.plots?.length || 0} lô
                  </small>
                </div>
                <ItemActions
                  onEdit={() => edit("farm", item)}
                  onDelete={() => remove(`/catalog/farms/${item.id}`, "vườn")}
                />
              </>
            )}
          />
        </div>
      )}

      {tab === "plots" && (
        <div className="catalog-layout">
          <form
            className="catalog-form"
            onSubmit={(event) => {
              const f = formProps(
                "plot",
                data.plots,
                "/catalog/plots",
                plotForm,
                () => setPlotForm({ ...plotForm, name: "", area: "" }),
              );
              save(event, f.path, f.body, f.reset, f.method);
            }}
          >
            <h3>
              {editing?.type === "plot"
                ? "Chỉnh sửa lô trồng"
                : "Thêm lô trồng"}
            </h3>
            <label>
              Thuộc vườn
              <select
                required
                value={plotForm.farmId}
                onChange={(e) =>
                  setPlotForm({ ...plotForm, farmId: e.target.value })
                }
              >
                {data.farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tên lô
              <input
                required
                value={plotForm.name}
                onChange={(e) =>
                  setPlotForm({ ...plotForm, name: e.target.value })
                }
                placeholder="Lô A1"
              />
            </label>
            <label>
              Diện tích (ha)
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={plotForm.area}
                onChange={(e) =>
                  setPlotForm({ ...plotForm, area: e.target.value })
                }
              />
            </label>
            <Actions
              editing={editing?.type === "plot"}
              label="lô trồng"
              onCancel={cancelEdit}
              disabled={!data.farms.length}
            />
          </form>
          <List
            title={`${data.plots.length} lô trồng`}
            items={data.plots}
            render={(item) => (
              <>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.farm?.name} · {item.area} ha
                  </small>
                </div>
                <ItemActions
                  onEdit={() => edit("plot", item)}
                  onDelete={() =>
                    remove(`/catalog/plots/${item.id}`, "lô trồng")
                  }
                />
              </>
            )}
          />
        </div>
      )}

      {tab === "seasons" && (
        <div className="catalog-layout">
          <form
            className="catalog-form"
            onSubmit={(event) => {
              const f = formProps(
                "season",
                data.seasons,
                "/catalog/seasons",
                seasonForm,
                () =>
                  setSeasonForm({
                    ...seasonForm,
                    name: "",
                    startDate: "",
                    expectedEndDate: "",
                  }),
              );
              save(event, f.path, f.body, f.reset, f.method);
            }}
          >
            <h3>
              {editing?.type === "season" ? "Chỉnh sửa mùa vụ" : "Lập mùa vụ"}
            </h3>
            <label>
              Lô trồng
              <select
                required
                value={seasonForm.plotId}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, plotId: e.target.value })
                }
              >
                {data.plots.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cây trồng
              <select
                required
                value={seasonForm.cropId}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, cropId: e.target.value })
                }
              >
                {data.crops.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chu kỳ áp dụng
              <select
                value={seasonForm.growthCycleId}
                onChange={(e) =>
                  setSeasonForm({
                    ...seasonForm,
                    growthCycleId: e.target.value,
                  })
                }
              >
                <option value="">Không áp dụng</option>
                {data.cycles
                  .filter(
                    (item) =>
                      !seasonForm.cropId || item.cropId === seasonForm.cropId,
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Tên mùa vụ
              <input
                required
                value={seasonForm.name}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, name: e.target.value })
                }
                placeholder="Mùa cà phê 2026"
              />
            </label>
            <div className="date-grid">
              <label>
                Bắt đầu
                <input
                  required
                  type="date"
                  value={seasonForm.startDate}
                  onChange={(e) =>
                    setSeasonForm({ ...seasonForm, startDate: e.target.value })
                  }
                />
              </label>
              <label>
                Dự kiến kết thúc
                <input
                  required
                  type="date"
                  value={seasonForm.expectedEndDate}
                  onChange={(e) =>
                    setSeasonForm({
                      ...seasonForm,
                      expectedEndDate: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <Actions
              editing={editing?.type === "season"}
              label="mùa vụ"
              onCancel={cancelEdit}
              disabled={!data.plots.length || !data.crops.length}
            />
          </form>
          <List
            title={`${data.seasons.length} mùa vụ`}
            items={data.seasons}
            render={(item) => (
              <>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.crop?.name} · {item.plot?.name} · {item.status}
                  </small>
                </div>
                <ItemActions
                  onEdit={() => edit("season", item)}
                  onDelete={() =>
                    remove(`/catalog/seasons/${item.id}`, "mùa vụ")
                  }
                />
              </>
            )}
          />
        </div>
      )}

      {tab === "cycles" && (
        <div className="catalog-layout">
          <form
            className="catalog-form"
            onSubmit={(event) =>
              save(
                event,
                "/catalog/growth-cycles",
                {
                  cropId: cycleForm.cropId,
                  name: cycleForm.name,
                  description: cycleForm.description,
                  stages: cycleForm.stages,
                },
                () => setCycleForm(emptyCycle),
              )
            }
          >
            <h3>Thiết lập chu kỳ</h3>
            <p className="form-hint">
              Một chu kỳ gồm các giai đoạn chăm sóc theo thứ tự.
            </p>
            <label>
              Cây trồng
              <select
                required
                value={cycleForm.cropId}
                onChange={(e) =>
                  setCycleForm({ ...cycleForm, cropId: e.target.value })
                }
              >
                {data.crops.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tên chu kỳ
              <input
                required
                value={cycleForm.name}
                onChange={(e) =>
                  setCycleForm({ ...cycleForm, name: e.target.value })
                }
                placeholder="Chu kỳ cà phê cơ bản"
              />
            </label>
            {cycleForm.stages.map((stage, index) => (
              <div className="stage-row" key={index}>
                <label>
                  Giai đoạn {index + 1}
                  <input
                    required
                    value={stage.name}
                    onChange={(e) => {
                      const stages = [...cycleForm.stages];
                      stages[index] = { ...stage, name: e.target.value };
                      setCycleForm({ ...cycleForm, stages });
                    }}
                    placeholder="Sinh trưởng thân lá"
                  />
                </label>
                <label>
                  Số ngày
                  <input
                    required
                    min="1"
                    type="number"
                    value={stage.durationDays}
                    onChange={(e) => {
                      const stages = [...cycleForm.stages];
                      stages[index] = {
                        ...stage,
                        durationDays: e.target.value,
                      };
                      setCycleForm({ ...cycleForm, stages });
                    }}
                  />
                </label>
              </div>
            ))}
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setCycleForm({
                  ...cycleForm,
                  stages: [...cycleForm.stages, { name: "", durationDays: "" }],
                })
              }
            >
              + Thêm giai đoạn
            </button>
            <Actions
              label="chu kỳ"
              onCancel={() => setCycleForm(emptyCycle)}
              disabled={!data.crops.length}
            />
          </form>
          <List
            title={`${data.cycles.length} chu kỳ sinh trưởng`}
            empty="Chưa có chu kỳ."
            items={data.cycles}
            render={(item) => (
              <>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.crop?.name} · {item.stages?.length || 0} giai đoạn
                  </small>
                </div>
                <span className="catalog-status">
                  {(item.stages || []).reduce(
                    (sum, stage) => sum + stage.durationDays,
                    0,
                  )}{" "}
                  ngày
                </span>
              </>
            )}
          />
        </div>
      )}
    </section>
  );
}

function Actions({ editing, label, onCancel, disabled }) {
  return (
    <div className="form-actions">
      <button className="primary-button" disabled={disabled} type="submit">
        {editing ? `Cập nhật ${label}` : `Lưu ${label}`}
      </button>
      {editing && (
        <button className="secondary-button" type="button" onClick={onCancel}>
          Hủy chỉnh sửa
        </button>
      )}
    </div>
  );
}
function ItemActions({ onEdit, onDelete }) {
  return (
    <div className="catalog-actions">
      <button className="text-button" type="button" onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <IconPenLine size={13} /> Sửa
      </button>
      <button className="text-button danger" type="button" onClick={onDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <IconTrash size={13} /> Xóa
      </button>
    </div>
  );
}
function List({ title, empty = "Chưa có dữ liệu.", items, render }) {
  return (
    <div className="catalog-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="empty-state">{empty}</p>
      ) : (
        items.map((item) => (
          <div className="catalog-row" key={item.id}>
            {render(item)}
          </div>
        ))
      )}
    </div>
  );
}

export default CatalogPanel;
