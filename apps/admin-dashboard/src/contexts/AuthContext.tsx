'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { adminApi } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'stellarpay-admin-auth';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token && parsed.user) {
          setToken(parsed.token);
          setUser(parsed.user);
          adminApi.setToken(parsed.token);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminApi.login(email, password);
    adminApi.setToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: result.access_token, user: result.user }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    adminApi.setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
