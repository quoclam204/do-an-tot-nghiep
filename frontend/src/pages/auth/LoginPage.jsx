import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiLogin, apiGoogleLogin } from '../../services/api';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { IconEye, IconEyeOff, IconWifiOff } from '../../components/icons';
import './AuthPage.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, token, user } = useAuth();
    const navigate = useNavigate();

    // Nếu đã đăng nhập trước đó (được lưu trong localStorage), tự động vào thẳng Dashboard
    useEffect(() => {
        if (token && user) {
            navigate('/dashboard');
        }
    }, [token, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!navigator.onLine) {
            setError('Thiết bị đang mất kết nối Internet. Không thể gửi mật khẩu về máy chủ.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await apiLogin({ email, password });
            login(res.accessToken, res.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credential) => {
        setLoading(true);
        setError('');
        try {
            const res = await apiGoogleLogin(credential);
            login(res.accessToken, res.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập Google thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Left panel - branding */}
            <div className="auth-branding">
                <div className="auth-branding-content">
                    <div className="auth-logo">
                        <span className="auth-logo-text">DalatAgri</span>
                    </div>
                    <h1 className="auth-tagline">Quản lý nông hộ<br />thông minh hơn.</h1>
                    <p className="auth-sub">
                        Ghi nhật ký canh tác, theo dõi vật tư và phân tích chi phí
                        ngay cả khi không có mạng.
                    </p>
                    <div className="auth-features">
                        <div className="auth-feature-item">
                            <span>Báo cáo chi phí tức thì</span>
                        </div>
                        <div className="auth-feature-item">
                            <span>Đồng bộ offline-first</span>
                        </div>
                        <div className="auth-feature-item">
                            <span>Quản lý nhiều nông hộ</span>
                        </div>
                    </div>
                </div>
                <div className="auth-branding-bg" aria-hidden="true">
                    <div className="bg-circle bg-circle-1" />
                    <div className="bg-circle bg-circle-2" />
                    <div className="bg-circle bg-circle-3" />
                </div>
            </div>

            {/* Right panel - form */}
            <div className="auth-form-panel">
                <div className="auth-form-wrapper">
                    <div className="auth-form-header">
                        <h2>Chào mừng trở lại!</h2>
                        <p>Đăng nhập để tiếp tục quản lý nông trại của bạn</p>
                    </div>

                    {!navigator.onLine && (
                        <div style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            marginBottom: '16px',
                            color: '#92400e',
                            fontSize: '0.85rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                                <IconWifiOff size={16} strokeWidth={2.4} />
                                <span>Đang ở chế độ ngoại tuyến (Không có mạng)</span>
                            </div>
                            <p style={{ margin: '0 0 10px', lineHeight: 1.4, color: '#78350f' }}>
                                Không thể kết nối máy chủ để kiểm tra mật khẩu. Bạn có thể sử dụng chế độ làm việc cục bộ ngay:
                            </p>
                            <Link to="/offline-dashboard" style={{
                                display: 'inline-block',
                                background: '#d97706',
                                color: '#ffffff',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '0.82rem'
                            }}>
                                Vào Chế độ Ngoại Tuyến độc lập →
                            </Link>
                        </div>
                    )}

                    <form id="login-form" className="auth-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="login-email">Địa chỉ Email</label>
                            <div className="input-wrapper">
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    required
                                    autoComplete="email"
                                    className="auth-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label htmlFor="login-password">Mật khẩu</label>
                                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Quên mật khẩu?</Link>
                            </div>
                            <div className="input-wrapper">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    required
                                    autoComplete="current-password"
                                    className="auth-input"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            id="login-submit"
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="spinner" />  Đang đăng nhập...</>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>Hoặc tiếp tục với</span>
                    </div>

                    <GoogleLoginButton
                        onSuccess={handleGoogleSuccess}
                        onError={(msg) => setError(msg)}
                    />

                    <p className="auth-switch-text">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="auth-link">Đăng ký ngay</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
