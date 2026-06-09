import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { usersService } from '../services/userService'; // ADD THIS
import { tokenStore } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const token = tokenStore.getAccess();
    if (!token) {
      const cached = localStorage.getItem('wastelink_user_profile');
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch { /* ignore */ }
      }
      setLoading(false);
      return;
    }

    // USE usersService.getMe() — returns user + map_locations + recycler_profiles
    usersService.getMe()
      .then(u => {
        setUser(u);
        localStorage.setItem('wastelink_user_profile', JSON.stringify(u));
      })
      .catch(() => {
        tokenStore.clearTokens();
        localStorage.removeItem('wastelink_user_profile');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('wl:logout', handler);
    return () => window.removeEventListener('wl:logout', handler);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    // eslint-disable-next-line
    const u = await authService.login({ email, password });
    // After login, fetch full user with locations
    const fullUser = await usersService.getMe();
    setUser(fullUser);
    localStorage.setItem('wastelink_user_profile', JSON.stringify(fullUser));
    return fullUser;
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    await authService.register(payload);
    // After register, fetch full user with locations
    const fullUser = await usersService.getMe();
    setUser(fullUser);
    localStorage.setItem('wastelink_user_profile', JSON.stringify(fullUser));
    return fullUser;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { console.warn('logout failed'); }
    finally {
      setUser(null);
      localStorage.removeItem('wastelink_user_profile');
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem('wastelink_user_profile', JSON.stringify(next));
      return next;
    });
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