import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import api from '../utils/api';
import { unwrapData } from '../utils/apiResponse';

const TOKEN_KEY = 'leave_token';
const USER_KEY = 'leave_user';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const refreshProfile = async () => {
    const response = await api.get('/profile');
    const profile = unwrapData(response);
    setUser(profile || null);
    if (profile) {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    }
    return profile;
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    refreshProfile()
      .then((response) => {
        if (!response) {
          clearSession();
        }
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, user]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const payload = unwrapData(response);

    if (!payload?.token || !payload?.user) {
      throw new Error('Invalid login response');
    }

    persistSession(payload.token, payload.user);

    toast.success('Welcome back');
  };

  const updateProfileLocal = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const logout = () => {
    clearSession();

    toast.success('Logged out');
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      refreshProfile,
      updateProfileLocal,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
