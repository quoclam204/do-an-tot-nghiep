import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || localStorage.getItem('dalat-agri-token') || null;
  });

  // Đồng bộ khi localStorage thay đổi (nếu có)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || localStorage.getItem('dalat-agri-token');
    if (storedUser && !user) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    if (storedToken && !token) setToken(storedToken);
  }, []);

  const login = (newToken, userData) => {
    // TODO 2: Lưu newToken và userData vào state
    //         Đồng thời lưu vào localStorage để giữ đăng nhập khi refresh
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    // TODO 3: Xóa state và xóa localStorage
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
