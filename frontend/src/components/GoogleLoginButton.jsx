import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Component GoogleLoginButton
 * Sử dụng Google Identity Services (GSI) chính thức của Google
 */
export default function GoogleLoginButton({ onSuccess, onError, isRegister = false }) {
    const containerRef = useRef(null);
    const [configError, setConfigError] = useState('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
    });

    const initGoogleBtn = useCallback(() => {
        if (!clientId || !window.google?.accounts?.id || !containerRef.current) {
            return false;
        }

        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    if (response.credential) {
                        onSuccessRef.current?.(response.credential);
                    } else {
                        onErrorRef.current?.('Không nhận được thông tin xác thực từ Google');
                    }
                },
            });

            containerRef.current.innerHTML = '';
            const containerWidth = containerRef.current.offsetWidth || 380;
            const targetWidth = Math.min(Math.max(containerWidth, 240), 400);

            window.google.accounts.id.renderButton(containerRef.current, {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: isRegister ? 'signup_with' : 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'center',
                width: targetWidth,
            });
            return true;
        } catch (err) {
            console.error('Google Sign-In initialization error:', err);
            return false;
        }
    }, [clientId, isRegister]);

    useEffect(() => {
        if (!clientId) return;

        if (initGoogleBtn()) {
            return;
        }

        const interval = setInterval(() => {
            if (initGoogleBtn()) {
                clearInterval(interval);
            }
        }, 150);

        const timeout = setTimeout(() => {
            clearInterval(interval);
        }, 8000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [clientId, initGoogleBtn]);

    const handleMissingConfigClick = () => {
        setConfigError(
            'Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong file frontend/.env. Vui lòng tạo OAuth Client ID trên Google Cloud Console và thêm vào file .env.'
        );
    };

    return (
        <div className="google-login-container">
            {clientId ? (
                <div ref={containerRef} className="google-btn-wrapper" />
            ) : (
                <button
                    type="button"
                    className="google-btn-fallback"
                    onClick={handleMissingConfigClick}
                    title="Bấm để xem hướng dẫn cấu hình Google Client ID"
                >
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                    </svg>
                    <span>{isRegister ? 'Đăng ký bằng Google' : 'Đăng nhập bằng Google'}</span>
                </button>
            )}

            {configError && (
                <div className="google-config-alert">
                    <p>{configError}</p>
                    <button type="button" onClick={() => setConfigError('')} className="close-alert-btn">
                        Đã hiểu
                    </button>
                </div>
            )}
        </div>
    );
}
