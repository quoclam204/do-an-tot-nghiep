import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
} from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import UserAvatar, { getAvatarUrl } from '../../components/UserAvatar';
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
    IconCamera,
    IconUpload,
    IconMail,
    IconShield,
    IconRuler,
} from '../../components/icons';
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

    // Quản lý ảnh đại diện
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
    const [previewUrl, setPreviewUrl] = useState('');
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarMsg, setAvatarMsg] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            setForm({ fullName: currentUser.fullName || '', phone: currentUser.phone || '' });
            setAvatarUrl(currentUser.avatarUrl || '');
        }
    }, [currentUser]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setAvatarMsg({ type: 'error', text: 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 320;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxDim) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setPreviewUrl(compressedDataUrl);
                setAvatarMsg({ type: 'info', text: 'Đã tải ảnh lên để xem trước. Nhấn "Lưu ảnh này" để hoàn tất.' });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSaveAvatar = async (urlToSave) => {
        setAvatarLoading(true);
        setAvatarMsg({ type: '', text: '' });
        try {
            const updated = await apiUpdateMe({ avatarUrl: urlToSave });
            setAvatarUrl(urlToSave);
            setPreviewUrl('');
            onUpdate(updated);
            setAvatarMsg({ type: 'success', text: 'Đã cập nhật ảnh đại diện thành công!' });
        } catch (err) {
            setAvatarMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi khi lưu ảnh đại diện' });
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleUseEmailAvatar = () => {
        if (!currentUser?.email) return;
        const cleanEmail = encodeURIComponent(currentUser.email.trim().toLowerCase());
        const cleanName = encodeURIComponent(currentUser.fullName || 'User');
        const emailAvatar = `https://unavatar.io/${cleanEmail}?fallback=https%3A%2F%2Fui-avatars.com%2Fapi%2F%3Fname%3D${cleanName}%26background%3D107C10%26color%3Dfff%26bold%3Dtrue`;
        setPreviewUrl(emailAvatar);
        setAvatarMsg({ type: 'info', text: 'Đang xem trước ảnh từ Email. Hãy nhấn "Lưu ảnh này" để lưu.' });
    };

    const handleRemoveAvatar = async () => {
        if (window.confirm('Bạn có chắc muốn xóa ảnh đại diện và dùng lại ký tự mặc định?')) {
            await handleSaveAvatar('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const updated = await apiUpdateMe(form);
            onUpdate(updated);
            setSuccess('Cập nhật thông tin thành công!');
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return <div className="tab-loading">Đang tải...</div>;

    const roleLabel = {
        OWNER: 'Chủ nông hộ',
        FARMER: 'Chủ nông hộ',
        ADMIN: 'Quản trị viên',
        WORKER: 'Nhân viên',
        TECHNICIAN: 'Kỹ thuật viên',
        VIEWER: 'Quan sát viên'
    };

    return (
        <div className="tab-content">
            {/* 1. Hero Banner matching design in image */}
            <div className="farms-hero-banner">
                <div className="farms-hero-text">
                    <div className="farms-pill-tag">
                        <IconShield size={14} strokeWidth={2.2} />
                        <span>QUẢN LÝ TÀI KHOẢN & HỒ SƠ NÔNG HỘ</span>
                    </div>
                    <h1>Hồ Sơ Nông Hộ & Tài Khoản Canh Tác</h1>
                    <p className="farms-hero-desc">
                        Quản lý định danh cá nhân nông hộ, cập nhật hình ảnh đại diện và thông tin liên lạc phục vụ nhật ký nông nghiệp và chứng nhận VietGAP.
                    </p>

                    <div className="farms-quick-stats">
                        <div className="stat-card">
                            <div className="stat-icon-wrap">
                                <IconUser size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <span className="stat-number">{roleLabel[currentUser.role] || currentUser.role}</span>
                                <span className="stat-label">Vai trò hệ thống</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrap">
                                <IconCheckCircle size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <span className="stat-number">
                                    {currentUser.isActive !== false ? 'Đang hoạt động' : 'Tạm khóa'}
                                </span>
                                <span className="stat-label">Trạng thái tài khoản</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrap">
                                <IconMail size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <span className="stat-number" style={{ fontSize: '0.95rem' }}>
                                    {currentUser.email ? currentUser.email.split('@')[0] : 'Tài khoản'}
                                </span>
                                <span className="stat-label">Định danh Email</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Thẻ hồ sơ nông hộ & form cập nhật */}
            <div className="farmer-profile-card">
                {/* Phần Avatar & Tác vụ ảnh đại diện */}
                <div className="farmer-avatar-section">
                    <div className="farmer-avatar-wrapper">
                        <UserAvatar
                            user={{ ...currentUser, avatarUrl: previewUrl || avatarUrl }}
                            size={84}
                            className="farmer-main-avatar"
                        />
                        <button
                            type="button"
                            className="btn-camera-float"
                            onClick={() => fileInputRef.current?.click()}
                            title="Chọn ảnh từ máy"
                        >
                            <IconCamera size={15} />
                        </button>
                    </div>

                    <div className="farmer-meta-info">
                        <div className="farmer-name-row">
                            <h2 className="farmer-name">{currentUser.fullName}</h2>
                            <span className="farms-pill-tag">
                                {roleLabel[currentUser.role] || currentUser.role}
                            </span>
                        </div>
                        <p className="farmer-email">{currentUser.email}</p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />

                        {/* Nút bấm tác vụ ảnh theo chuẩn hình ảnh */}
                        <div className="farmer-avatar-actions">
                            <button
                                type="button"
                                className="farms-btn-primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <IconUpload size={16} strokeWidth={2.2} />
                                <span>Tải ảnh lên</span>
                            </button>

                            <button
                                type="button"
                                className="btn-outline-green"
                                onClick={handleUseEmailAvatar}
                                disabled={avatarLoading}
                                title="Đồng bộ ảnh từ tài khoản Google/Gravatar của email này"
                            >
                                <IconMail size={16} strokeWidth={2.2} />
                                <span>Ảnh theo Email</span>
                            </button>

                            {avatarUrl && (
                                <button
                                    type="button"
                                    className="btn-outline-danger"
                                    onClick={handleRemoveAvatar}
                                    disabled={avatarLoading}
                                    title="Xóa ảnh về chữ cái mặc định"
                                >
                                    <IconTrash size={15} />
                                    <span>Xóa ảnh</span>
                                </button>
                            )}
                        </div>

                        {previewUrl && (
                            <div className="farmer-preview-bar">
                                <span className="preview-label">Đang xem trước ảnh mới:</span>
                                <div className="preview-btns-group">
                                    <button
                                        type="button"
                                        className="farms-btn-primary"
                                        disabled={avatarLoading}
                                        onClick={() => handleSaveAvatar(previewUrl)}
                                    >
                                        <IconCheckCircle size={15} />
                                        <span>{avatarLoading ? 'Đang lưu...' : 'Lưu ảnh này'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-outline-secondary"
                                        disabled={avatarLoading}
                                        onClick={() => setPreviewUrl('')}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}

                        {avatarMsg.text && (
                            <div className={`farmer-feedback-msg ${avatarMsg.type}`}>
                                {avatarMsg.type === 'error' ? <IconXCircle size={16} /> : <IconCheckCircle size={16} />}
                                <span>{avatarMsg.text}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="farmer-divider" />

                {/* Phần thông tin cá nhân & form cập nhật */}
                <div className="farmer-form-section">
                    <div className="form-section-header">
                        <div className="farms-pill-tag">
                            <IconPenLine size={13} strokeWidth={2.2} />
                            <span>CẬP NHẬT THÔNG TIN</span>
                        </div>
                        <h3 className="section-title">Thông tin tài khoản nông hộ</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="farmer-edit-form">
                        <div className="form-fields-grid">
                            <div className="field-group">
                                <label htmlFor="profile-fullname">Họ và tên nông hộ</label>
                                <input
                                    id="profile-fullname"
                                    type="text"
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    className="farmer-input"
                                    placeholder="Nhập họ và tên..."
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor="profile-phone">Số điện thoại liên hệ</label>
                                <input
                                    id="profile-phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="farmer-input"
                                    placeholder="Nhập số điện thoại (VD: 0912345678)..."
                                />
                            </div>

                            <div className="field-group readonly-group">
                                <label>Địa chỉ Email (Đăng nhập)</label>
                                <input
                                    type="email"
                                    value={currentUser.email}
                                    disabled
                                    className="farmer-input readonly-input"
                                />
                            </div>

                            <div className="field-group readonly-group">
                                <label>Vai trò hệ thống</label>
                                <input
                                    type="text"
                                    value={roleLabel[currentUser.role] || currentUser.role}
                                    disabled
                                    className="farmer-input readonly-input"
                                />
                            </div>
                        </div>

                        {currentUser.lastLoginAt && (
                            <p className="farmer-last-login">
                                Đăng nhập lần cuối: {new Date(currentUser.lastLoginAt).toLocaleString('vi-VN')}
                            </p>
                        )}

                        {success && (
                            <div className="farmer-alert alert-success">
                                <IconCheckCircle size={18} />
                                <span>{success}</span>
                            </div>
                        )}
                        {error && (
                            <div className="farmer-alert alert-error">
                                <IconXCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-submit-row">
                            <button type="submit" className="farms-btn-primary btn-save-farmer" disabled={loading}>
                                <IconCheckCircle size={18} strokeWidth={2.4} />
                                <span>{loading ? 'Đang lưu thông tin...' : 'Lưu Thông Tin Cá Nhân'}</span>
                            </button>
                        </div>
                    </form>
                </div>
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

    const totalAreaAll = farms.reduce((acc, f) => acc + (Number(f.totalArea) || 0), 0);
    const totalPlotsCount = farms.reduce((acc, f) => acc + (f.plots?.length || 0), 0);

    return (
        <div className="tab-content">
            {/* EXACT Hero Banner from image */}
            <div className="farms-hero-banner">
                <div className="farms-hero-text">
                    <div className="farms-pill-tag">
                        <IconWarehouse size={15} strokeWidth={2.2} />
                        <span>QUẢN LÝ NÔNG HỘ & TRANG TRẠI</span>
                    </div>
                    <h1>Danh Sách Nông Hộ & Lô Đất Canh Tác</h1>
                    <p className="farms-hero-desc">
                        Khai báo các trang trại, phân chia từng lô/vườn chuyên canh (Cà phê, Sầu riêng, Mắc ca) để chuẩn bị
                        ghi nhật ký công việc, quản lý vật tư và theo dõi hiệu quả kinh tế theo vụ mùa.
                    </p>

                    <div className="farms-quick-stats">
                        <div className="stat-card">
                            <div className="stat-icon-wrap">
                                <IconWarehouse size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <span className="stat-number">{farms.length}</span>
                                <span className="stat-label">Trang trại / Nông hộ</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrap">
                                <IconRuler size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <span className="stat-number">{totalAreaAll.toFixed(1)} <small>ha</small></span>
                                <span className="stat-label">Tổng diện tích canh tác</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrap">
                                <IconSprout size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <span className="stat-number">{totalPlotsCount}</span>
                                <span className="stat-label">Lô trồng đã tạo</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="farms-hero-actions">
                    <button className="farms-btn-primary" onClick={openCreate}>
                        <IconPlus size={18} strokeWidth={2.4} />
                        <span>Thêm Nông Hộ Mới</span>
                    </button>
                </div>
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
    const [currentUser, setCurrentUser] = useState(authUser);

    useEffect(() => {
        const activeToken = token || localStorage.getItem('token') || localStorage.getItem('dalat-agri-token');
        if (!activeToken) {
            navigate('/login');
            return;
        }
        apiGetMe()
            .then((data) => {
                if (data) setCurrentUser(data);
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    logout();
                    navigate('/login');
                } else if (authUser) {
                    setCurrentUser(authUser);
                }
            });
    }, [token]);

    const handleProfileUpdate = (updatedUser) => {
        setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
        login(token || localStorage.getItem('token'), { ...authUser, ...updatedUser });
    };

    const visibleTabs = TABS.filter((tab) => !tab.adminOnly || authUser?.role === 'ADMIN');

    return (
        <div className="app">
            <Header />
            <main className="account-main container">
                <div className="account-layout">
                    <aside className="account-sidebar">
                        <div className="sidebar-user-info">
                            <UserAvatar user={currentUser || authUser} size={44} className="sidebar-avatar" />
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
