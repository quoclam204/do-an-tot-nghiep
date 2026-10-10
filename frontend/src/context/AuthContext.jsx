import { createContext, useState, useContext, useEffect } from 'react';
import { prefetchAndCacheCatalogs } from '../utils/offlineSync';

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

  // Đồng bộ khi localStorage thay đổi và tự động lưu trước danh mục nông hộ
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || localStorage.getItem('dalat-agri-token');
    if (storedUser && !user) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    if (storedToken && !token) setToken(storedToken);

    if (storedToken || token) {
      // Tải ngầm danh mục để sẵn sàng 100% khi nông dân ra vườn mất mạng
      prefetchAndCacheCatalogs();
    }
  }, [token]);

  const login = (newToken, userData) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', newToken);
    // Tải trước toàn bộ lô đất, mùa vụ, vật tư ngay khi vừa đăng nhập
    prefetchAndCacheCatalogs();
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
