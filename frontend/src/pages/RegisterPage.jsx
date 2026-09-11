import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRegister, apiGoogleLogin } from '../services/api';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { IconEye, IconEyeOff } from '../components/icons';
import './AuthPage.css';

function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await apiRegister({ fullName, email, password });
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
            setError(err.response?.data?.message || 'Đăng ký bằng Google thất bại');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = () => {
        if (password.length === 0) return null;
        if (password.length < 8) return { level: 'weak', label: 'Yếu', color: '#ef4444' };
        if (password.length < 12) return { level: 'medium', label: 'Trung bình', color: '#f59e0b' };
        return { level: 'strong', label: 'Mạnh', color: '#22c55e' };
    };

    const strength = passwordStrength();

    return (
        <div className="auth-page">
            {/* Left panel - branding */}
            <div className="auth-branding">
                <div className="auth-branding-content">
                    <div className="auth-logo">
                        <span className="auth-logo-text">DalatAgri</span>
                    </div>
                    <h1 className="auth-tagline">Bắt đầu hành trình<br />canh tác số hóa.</h1>
                    <p className="auth-sub">
                        Tham gia cùng hàng nghìn nông hộ đang quản lý hiệu quả
                        nông trại của mình trên DalatAgri.
                    </p>
                    <div className="auth-features">
                        <div className="auth-feature-item">
                            <span>Miễn phí hoàn toàn</span>
                        </div>
                        <div className="auth-feature-item">
                            <span>Dữ liệu bảo mật tuyệt đối</span>
                        </div>
                        <div className="auth-feature-item">
                            <span>Hoạt động trên mọi thiết bị</span>
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
                        <h2>Tạo tài khoản mới</h2>
                        <p>Chỉ cần vài giây để bắt đầu quản lý nông trại</p>
                    </div>

                    <form id="register-form" className="auth-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="register-fullname">Họ và tên</label>
                            <div className="input-wrapper">
                                <input
                                    id="register-fullname"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder=""
                                    required
                                    autoComplete="name"
                                    className="auth-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="register-email">Địa chỉ Email</label>
                            <div className="input-wrapper">
                                <input
                                    id="register-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="auth-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="register-password">Mật khẩu</label>
                            <div className="input-wrapper">
                                <input
                                    id="register-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ít nhất 8 ký tự"
                                    required
                                    autoComplete="new-password"
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
                            {strength && (
                                <div className="password-strength">
                                    <div
                                        className="strength-bar"
                                        style={{
                                            width: strength.level === 'weak' ? '33%' : strength.level === 'medium' ? '66%' : '100%',
                                            backgroundColor: strength.color,
                                        }}
                                    />
                                    <span style={{ color: strength.color }}>{strength.label}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="register-confirm">Xác nhận mật khẩu</label>
                            <div className="input-wrapper">
                                <input
                                    id="register-confirm"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    autoComplete="new-password"
                                    className={`auth-input ${confirmPassword && password !== confirmPassword ? 'input-error' : ''}`}
                                />
                                {confirmPassword && (
                                    <span className={`input-status ${password === confirmPassword ? 'status-valid' : 'status-invalid'}`}>
                                        {password === confirmPassword ? 'Hợp lệ' : 'Không khớp'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            id="register-submit"
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="spinner" />  Đang tạo tài khoản...</>
                            ) : (
                                'Tạo tài khoản'
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>Hoặc tiếp tục với</span>
                    </div>

                    <GoogleLoginButton
                        isRegister
                        onSuccess={handleGoogleSuccess}
                        onError={(msg) => setError(msg)}
                    />

                    <p className="auth-switch-text">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="auth-link">Đăng nhập ngay</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
