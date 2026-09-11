import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    apiGetMe,
    apiUpdateMe,
    apiGetAllUsers,
    apiUpdateUserRole,
    apiToggleUserActive,
    apiDeleteUser,
    apiGetMyFarms,
    apiCreateFarm,
    apiUpdateFarm,
    apiDeleteFarm,
} from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
    IconUser,
    IconWarehouse,
    IconSettings,
    IconCheckCircle,
    IconXCircle,
    IconPlus,
    IconPenLine,
    IconTrash,
    IconMapPin,
    IconSprout,
    IconSearch,
    IconLock,
    IconUnlock,
    IconLogOut,
} from '../components/icons';
import './AccountPage.css';

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: IconUser },
    { id: 'farms', label: 'Nông hộ của tôi', icon: IconWarehouse },
    { id: 'admin', label: 'Quản lý người dùng', icon: IconSettings, adminOnly: true },
];

// ── Profile Tab ────────────────────────────────────────────────
function ProfileTab({ currentUser, onUpdate }) {
    const [form, setForm] = useState({ fullName: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser) {
            setForm({ fullName: currentUser.fullName || '', phone: currentUser.phone || '' });
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const updated = await apiUpdateMe(form);
            onUpdate(updated);
            setSuccess('Cập nhật thành công!');
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return <div className="tab-loading">Đang tải...</div>;

    const roleLabel = { OWNER: 'Chủ nông hộ', ADMIN: 'Quản trị viên', WORKER: 'Nhân viên' };

    return (
        <div className="tab-content">
            <div className="profile-card">
                <div className="profile-avatar">
                    {currentUser.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="profile-meta">
                    <h2>{currentUser.fullName}</h2>
                    <span className={`role-badge role-${currentUser.role?.toLowerCase()}`}>
                        {roleLabel[currentUser.role] || currentUser.role}
                    </span>
                    <p className="profile-email">{currentUser.email}</p>
                    {currentUser.lastLoginAt && (
                        <p className="profile-last-login">
                            Đăng nhập lần cuối: {new Date(currentUser.lastLoginAt).toLocaleString('vi-VN')}
                        </p>
                    )}
                </div>
            </div>

            <div className="section-card">
                <h3>Cập nhật thông tin</h3>
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="profile-fullname">Họ và tên</label>
                            <input
                                id="profile-fullname"
                                type="text"
                                value={form.fullName}
                                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                className="form-input"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profile-phone">Số điện thoại</label>
                            <input
                                id="profile-phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="form-input"
                                placeholder="0xxxxxxxxx"
                            />
                        </div>
                    </div>

                    {success && <div className="feedback-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconCheckCircle size={16} /> {success}</div>}
                    {error && <div className="feedback-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconXCircle size={16} /> {error}</div>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </form>
            </div>

            <div className="section-card info-only">
                <h3>Thông tin tài khoản</h3>
                <dl className="info-list">
                    <div className="info-item">
                        <dt>Email</dt>
                        <dd>{currentUser.email}</dd>
                    </div>
                    <div className="info-item">
                        <dt>Vai trò</dt>
                        <dd>{roleLabel[currentUser.role] || currentUser.role}</dd>
                    </div>
                    <div className="info-item">
                        <dt>Ngày tạo</dt>
                        <dd>{new Date(currentUser.createdAt).toLocaleDateString('vi-VN')}</dd>
                    </div>
                    <div className="info-item">
                        <dt>Trạng thái</dt>
                        <dd>
                            <span className={`status-dot ${currentUser.isActive ? 'active' : 'inactive'}`} />
                            {currentUser.isActive ? 'Đang hoạt động' : 'Bị vô hiệu hóa'}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

// ── Farms Tab ─────────────────────────────────────────────────
function FarmsTab() {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingFarm, setEditingFarm] = useState(null);
    const [form, setForm] = useState({ name: '', location: '', totalArea: '', unit: 'ha' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFarms();
    }, []);

    const loadFarms = async () => {
        try {
            setLoading(true);
            const data = await apiGetMyFarms();
            setFarms(data || []);
        } catch {
            setError('Không thể tải danh sách nông hộ');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingFarm(null);
        setForm({ name: '', location: '', totalArea: '', unit: 'ha' });
        setShowForm(true);
    };

    const openEdit = (farm) => {
        setEditingFarm(farm);
        setForm({ name: farm.name, location: farm.location, totalArea: String(farm.totalArea), unit: farm.unit || 'ha' });
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                location: form.location.trim(),
                totalArea: Number(form.totalArea),
                unit: form.unit || 'ha',
            };
            if (editingFarm) {
                await apiUpdateFarm(editingFarm.id, payload);
            } else {
                await apiCreateFarm(payload);
            }
            setShowForm(false);
            await loadFarms();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi lưu nông hộ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa nông hộ này?')) return;
        try {
            await apiDeleteFarm(id);
            await loadFarms();
        } catch {
            setError('Không thể xóa nông hộ');
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header-row">
                <h2>Nông hộ của tôi</h2>
                <button className="btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconPlus size={16} /> Thêm nông hộ
                </button>
            </div>

            {error && <div className="feedback-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconXCircle size={16} /> {error}</div>}

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingFarm ? 'Chỉnh sửa nông hộ' : 'Thêm nông hộ mới'}</h3>
                            <button className="modal-close-btn" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="farm-name">Tên nông hộ / nông trại</label>
                                <input
                                    id="farm-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="form-input"
                                    placeholder="VD: Nông trại Sơn Hà"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="farm-location">Địa điểm</label>
                                <input
                                    id="farm-location"
                                    type="text"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    className="form-input"
                                    placeholder="VD: Huyện Cư M'gar, Đắk Lắk hoặc Di Linh, Lâm Đồng..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="farm-area">Tổng diện tích nông hộ</label>
                                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                    <input
                                        id="farm-area"
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={form.totalArea}
                                        onChange={(e) => setForm({ ...form, totalArea: e.target.value })}
                                        className="form-input"
                                        placeholder={form.unit === 'ha' ? 'VD: 2.5 (hecta)' : 'VD: 25000 (m²)'}
                                        required
                                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none', flex: 1 }}
                                    />
                                    <select
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        className="form-input"
                                        style={{ width: '130px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, background: '#f0fdf4', color: '#15803d', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        <option value="ha">ha (Hecta)</option>
                                        <option value="m2">m² (Mét vuông)</option>
                                    </select>
                                </div>
                                {Number(form.totalArea) > 0 && (
                                    <div style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 600, background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: '8px', padding: '0.4rem 0.75rem', marginTop: '0.45rem' }}>
                                        💡 Quy đổi: {form.unit === 'ha'
                                            ? `${form.totalArea} ha = ${new Intl.NumberFormat('vi-VN').format(Math.round(Number(form.totalArea) * 10000))} m²`
                                            : `${new Intl.NumberFormat('vi-VN').format(Number(form.totalArea))} m² = ${(Number(form.totalArea) / 10000).toFixed(4)} ha`}
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Đang lưu...' : (editingFarm ? 'Cập nhật' : 'Tạo nông hộ')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="tab-loading">Đang tải nông hộ...</div>
            ) : farms.length === 0 ? (
                <div className="empty-state-box">
                    <span className="empty-icon"><IconWarehouse size={36} /></span>
                    <h3>Chưa có nông hộ nào</h3>
                    <p>Hãy thêm nông hộ đầu tiên của bạn để bắt đầu quản lý.</p>
                    <button className="btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <IconPlus size={16} /> Thêm nông hộ
                    </button>
                </div>
            ) : (
                <div className="farms-grid">
                    {farms.map((farm) => (
                        <div key={farm.id} className="farm-card">
                            <div className="farm-card-header">
                                <div className="farm-icon"><IconWarehouse size={22} /></div>
                                <div className="farm-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => openEdit(farm)}
                                        title="Chỉnh sửa"
                                    ><IconPenLine size={15} /></button>
                                    <button
                                        className="btn-icon btn-danger"
                                        onClick={() => handleDelete(farm.id)}
                                        title="Xóa"
                                    ><IconTrash size={15} /></button>
                                </div>
                            </div>
                            <h3 className="farm-name">{farm.name}</h3>
                            <p className="farm-location" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <IconMapPin size={15} /> {farm.location}
                            </p>
                            <div className="farm-stats">
                                <div className="farm-stat" title="1 ha = 10.000 m²">
                                    <span className="stat-label">Diện tích</span>
                                    <span className="stat-value">
                                        {farm.totalArea} ha
                                        <small style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                            ({new Intl.NumberFormat('vi-VN').format(Math.round(farm.totalArea * 10000))} m²)
                                        </small>
                                    </span>
                                </div>
                                <div className="farm-stat">
                                    <span className="stat-label">Khu đất</span>
                                    <span className="stat-value">{farm.plots?.length || 0} khu</span>
                                </div>
                            </div>
                            {farm.plots?.length > 0 && (
                                <div className="farm-plots">
                                    {farm.plots.slice(0, 3).map((plot) => (
                                        <span key={plot.id} className="plot-tag">{plot.name}</span>
                                    ))}
                                    {farm.plots.length > 3 && (
                                        <span className="plot-tag">+{farm.plots.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Admin Users Tab ───────────────────────────────────────────
function AdminTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await apiGetAllUsers();
            setUsers(data);
        } catch {
            setError('Không có quyền truy cập hoặc lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await apiUpdateUserRole(userId, role);
            setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể thay đổi vai trò');
        }
    };

    const handleToggleActive = async (userId) => {
        try {
            const updated = await apiToggleUserActive(userId);
            setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: updated.isActive } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể thay đổi trạng thái');
        }
    };

    const handleDelete = async (userId) => {
        if (!confirm('Bạn có chắc muốn xóa người dùng này không?')) return;
        try {
            await apiDeleteUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể xóa người dùng');
        }
    };

    const filtered = users.filter(
        (u) =>
            u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const roleLabel = { OWNER: 'Chủ nông hộ', ADMIN: 'Quản trị viên', WORKER: 'Nhân viên' };

    return (
        <div className="tab-content">
            <div className="tab-header-row">
                <h2>Quản lý người dùng</h2>
                <div className="admin-stats">
                    <span className="stat-badge">{users.length} tổng</span>
                    <span className="stat-badge active">{users.filter((u) => u.isActive).length} hoạt động</span>
                </div>
            </div>

            <div className="search-bar-wrapper">
                <span className="search-icon"><IconSearch size={16} /></span>
                <input
                    id="admin-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    className="search-input"
                />
            </div>

            {error && <div className="feedback-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconXCircle size={16} /> {error}</div>}

            {loading ? (
                <div className="tab-loading">Đang tải danh sách người dùng...</div>
            ) : (
                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Vai trò</th>
                                <th>Nông hộ</th>
                                <th>Trạng thái</th>
                                <th>Đăng nhập cuối</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user) => (
                                <tr key={user.id} className={!user.isActive ? 'row-inactive' : ''}>
                                    <td className="user-cell">
                                        <div className="user-avatar-sm">
                                            {user.fullName?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <strong>{user.fullName}</strong>
                                            <small>{user.email}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            className={`role-select role-${user.role?.toLowerCase()}`}
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        >
                                            <option value="OWNER">Chủ nông hộ</option>
                                            <option value="ADMIN">Quản trị viên</option>
                                            <option value="WORKER">Nhân viên</option>
                                        </select>
                                    </td>
                                    <td className="farms-count" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <IconSprout size={15} /> {user.farms?.length || 0} nông hộ
                                    </td>
                                    <td>
                                        <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                                            {user.isActive ? '● Hoạt động' : '● Vô hiệu'}
                                        </span>
                                    </td>
                                    <td className="last-login">
                                        {user.lastLoginAt
                                            ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN')
                                            : 'Chưa đăng nhập'}
                                    </td>
                                    <td className="action-cell">
                                        <button
                                            className={`btn-action ${user.isActive ? 'btn-warn' : 'btn-success'}`}
                                            onClick={() => handleToggleActive(user.id)}
                                            title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                        >
                                            {user.isActive ? <IconLock size={15} /> : <IconUnlock size={15} />}
                                        </button>
                                        <button
                                            className="btn-action btn-danger-sm"
                                            onClick={() => handleDelete(user.id)}
                                            title="Xóa tài khoản"
                                        >
                                            <IconTrash size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="table-empty">Không tìm thấy người dùng nào</div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main AccountPage ─────────────────────────────────────────
function AccountPage() {
    const { user: authUser, token, login, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        apiGetMe()
            .then(setCurrentUser)
            .catch(() => logout());
    }, [token]);

    const handleProfileUpdate = (updatedUser) => {
        setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
        login(token, { ...authUser, ...updatedUser });
    };

    const visibleTabs = TABS.filter((tab) => !tab.adminOnly || authUser?.role === 'ADMIN');

    return (
        <div className="app">
            <Header />
            <main className="account-main container">
                <div className="account-layout">
                    <aside className="account-sidebar">
                        <div className="sidebar-user-info">
                            <div className="sidebar-avatar">
                                {authUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <strong>{authUser?.fullName}</strong>
                                <small>{authUser?.email}</small>
                            </div>
                        </div>
                        <nav className="sidebar-nav">
                            {visibleTabs.map((tab) => {
                                const TabIcon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        {TabIcon && <TabIcon size={16} />}
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        <button className="sidebar-logout-btn" onClick={logout} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <IconLogOut size={16} /> <span>Đăng xuất</span>
                        </button>
                    </aside>

                    <section className="account-content">
                        {activeTab === 'profile' && (
                            <ProfileTab currentUser={currentUser} onUpdate={handleProfileUpdate} />
                        )}
                        {activeTab === 'farms' && <FarmsTab />}
                        {activeTab === 'admin' && authUser?.role === 'ADMIN' && <AdminTab />}
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default AccountPage;
