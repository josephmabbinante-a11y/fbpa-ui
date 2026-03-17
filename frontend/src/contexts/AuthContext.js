import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  );
  const [user, setUser] = useState(null);

  // Optionally, load user info from token or API here

  useEffect(() => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [token]);

  const login = useCallback((newToken, userInfo) => {
    setToken(newToken);
    if (userInfo) setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
