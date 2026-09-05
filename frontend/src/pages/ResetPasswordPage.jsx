import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiResetPassword } from '../services/api';
import { IconEye, IconEyeOff } from '../components/icons';
import './AuthPage.css';

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setError('Đường dẫn không hợp lệ. Vui lòng yêu cầu lại link đặt lại mật khẩu.');
            return;
        }
        
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
            const res = await apiResetPassword(token, password);
            setMessage(res.message || 'Mật khẩu đã được thay đổi thành công.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra hoặc token hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-branding">
                <div className="auth-branding-content">
                    <div className="auth-logo">
                        <span className="auth-logo-text">DalatAgri</span>
                    </div>
                    <h1 className="auth-tagline">Bảo mật<br />tuyệt đối.</h1>
                    <p className="auth-sub">
                        Tạo mật khẩu mới mạnh mẽ để bảo vệ dữ liệu nông trại của bạn.
                    </p>
                </div>
                <div className="auth-branding-bg" aria-hidden="true">
                    <div className="bg-circle bg-circle-1" />
                    <div className="bg-circle bg-circle-2" />
                    <div className="bg-circle bg-circle-3" />
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-wrapper">
                    <div className="auth-form-header">
                        <h2>Tạo mật khẩu mới</h2>
                        <p>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>
                    </div>

                    {message ? (
                        <div className="auth-success" style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500, textAlign: 'center' }}>
                            {message}
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                Đang chuyển hướng về trang đăng nhập...
                            </p>
                        </div>
                    ) : (
                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            {!token && (
                                <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
                                    Đường dẫn không hợp lệ hoặc đã hết hạn.
                                </div>
                            )}
                            
                            <div className="form-group">
                                <label htmlFor="reset-password">Mật khẩu mới</label>
                                <div className="input-wrapper">
                                    <input
                                        id="reset-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Ít nhất 8 ký tự"
                                        required
                                        className="auth-input"
                                        disabled={!token}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        disabled={!token}
                                    >
                                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reset-confirm">Xác nhận mật khẩu</label>
                                <div className="input-wrapper">
                                    <input
                                        id="reset-confirm"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Nhập lại mật khẩu"
                                        required
                                        className={`auth-input ${confirmPassword && password !== confirmPassword ? 'input-error' : ''}`}
                                        disabled={!token}
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
                                type="submit"
                                className="auth-submit-btn"
                                disabled={loading || !token}
                            >
                                {loading ? (
                                    <><span className="spinner" /> Đang cập nhật...</>
                                ) : (
                                    'Lưu mật khẩu mới'
                                )}
                            </button>
                        </form>
                    )}

                    <p className="auth-switch-text">
                        <Link to="/login" className="auth-link">Về trang đăng nhập</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
