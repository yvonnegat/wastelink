import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { tokenStore } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const bootstrapped = useRef(false);

  // On mount — try to restore session from stored tokens
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const token = tokenStore.getAccess();
    if (!token) { setLoading(false); return; }

    authService.me()
      .then(u => setUser(u))
      .catch(() => tokenStore.clearTokens())
      .finally(() => setLoading(false));
  }, []);

  // Listen for forced logout events (e.g. 401 with no refresh)
  useEffect(() => {
    const handler = () => { setUser(null); };
    window.addEventListener('wl:logout', handler);
    return () => window.removeEventListener('wl:logout', handler);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    const u = await authService.login({ email, password });
    setUser(u);
    return u;
  }, []);

 const register = useCallback(async (payload) => {
  setError(null);
  const u = await authService.register(payload);
  setUser(u);
  return u;
}, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
