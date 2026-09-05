import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogIn, IconUserPlus, IconLogOut } from './icons';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          <img src="/logo.png" className="logo-img" alt="DalatAgri logo" />
          DalatAgri
        </Link>

        <nav className="nav">
          <Link to="/">Trang chủ</Link>
          <Link to="/crops">Cây trồng</Link>
          <Link to="/farms">Nông hộ</Link>
          <Link to="/dashboard">Nhật ký</Link>
        </nav>

        <div className="header-auth">
          {user ? (
            <>
              <Link to="/account" className="user-menu-btn" title="Tài khoản của tôi">
                <span className="user-avatar-hdr">
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </span>
                <span className="user-name-hdr">{user.fullName}</span>
              </Link>
              <button className="logout-btn-hdr" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <IconLogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <Link className="login-btn" to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <IconLogIn size={15} />
                <span>Đăng nhập</span>
              </Link>
              <Link className="register-btn" to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <IconUserPlus size={15} />
                <span>Đăng ký</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
