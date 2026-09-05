import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiForgotPassword } from '../services/api';
import { IconCheckCircle, IconArrowLeft } from '../components/icons';
import './AuthPage.css';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await apiForgotPassword(email);
            setMessage(res.message || 'Nếu email hợp lệ, chúng tôi đã gửi link đặt lại mật khẩu.');
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
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
                    <h1 className="auth-tagline">Khôi phục<br />truy cập.</h1>
                    <p className="auth-sub">
                        Đừng lo lắng, hãy nhập email của bạn và chúng tôi sẽ gửi
                        hướng dẫn đặt lại mật khẩu ngay.
                    </p>
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
                        <h2>Quên mật khẩu?</h2>
                        <p>Nhập email đã đăng ký để lấy lại mật khẩu</p>
                    </div>

                    {message ? (
                        <div className="auth-success" style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IconCheckCircle size={18} />
                            <span>{message}</span>
                        </div>
                    ) : (
                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            <div className="form-group">
                                <label htmlFor="forgot-email">Địa chỉ Email</label>
                                <div className="input-wrapper">
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        required
                                        className="auth-input"
                                    />
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
                                disabled={loading || !email}
                            >
                                {loading ? (
                                    <><span className="spinner" /> Đang gửi yêu cầu...</>
                                ) : (
                                    'Gửi link khôi phục'
                                )}
                            </button>
                        </form>
                    )}

                    <p className="auth-switch-text">
                        Nhớ ra mật khẩu?{' '}
                        <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconArrowLeft size={14} /> Quay lại đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
