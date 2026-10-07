import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/index.js';
import { setAccessToken, setRefreshHandler } from '../api/http.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  const apply = useCallback((session) => {
    setAccessToken(session?.accessToken || '');
    setUser(session?.user || null);
  }, []);

  const refreshFlight = useRef(null);
  const refresh = useCallback(async () => {
    if (refreshFlight.current) return refreshFlight.current;
    const job = (async () => {
      try {
        const payload = await authApi.refresh();
        apply(payload.data);
        return true;
      } catch {
        apply(null);
        return false;
      } finally {
        refreshFlight.current = null;
      }
    })();
    refreshFlight.current = job;
    return job;
  }, [apply]);

  useEffect(() => {
    setRefreshHandler(refresh);
    refresh().finally(() => setStatus('ready'));
  }, [refresh]);

  const login = useCallback(async (body) => {
    const payload = await authApi.login(body);
    apply(payload.data);
    return payload.data.user;
  }, [apply]);

  const register = useCallback(async (body) => {
    const payload = await authApi.register(body);
    apply(payload.data);
    return payload.data.user;
  }, [apply]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      sessionStorage.removeItem('ieds.emailVerified');
      apply(null);
    }
  }, [apply]);

  const logoutAll = useCallback(async () => {
    await authApi.logoutAll();
    sessionStorage.removeItem('ieds.emailVerified');
    apply(null);
  }, [apply]);

  const updateUser = useCallback((next) => {
    setUser(next);
  }, []);

  const value = useMemo(() => ({
    user, status, login, register, logout, logoutAll, refresh, updateUser,
  }), [user, status, login, register, logout, logoutAll, refresh, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
