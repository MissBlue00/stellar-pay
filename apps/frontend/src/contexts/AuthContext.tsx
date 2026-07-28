'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_STORAGE_KEY = 'stellarpay-auth';

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user?: AuthUser | null) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    return JSON.parse(storedValue) as { token: string; user: AuthUser };
  } catch {
    return null;
  }
}

function persistAuth(token: string | null, user: AuthUser | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
}

function parseJwt(token: string) {
  if (!token) {
    return null;
  }

  if (!token.includes('.')) {
    return {
      sub: 'demo-user',
      email: 'demo@stellarpay.dev',
      name: 'Demo User',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };
  }

  const [, payload] = token.split('.');
  const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');

  try {
    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
}

function deriveUser(token: string, fallbackUser?: AuthUser | null): AuthUser | null {
  const payload = parseJwt(token);
  if (!payload) {
    return fallbackUser ?? null;
  }

  const email = payload.email ?? payload.sub ?? 'user@stellarpay.dev';
  return {
    id: payload.sub ?? 'user',
    email,
    name: payload.name ?? email.split('@')[0],
    role: payload.role ?? 'user',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredAuth()?.token ?? null);
  const [user, setUser] = useState<AuthUser | null>(() => readStoredAuth()?.user ?? null);
  const [loading] = useState(false);

  useEffect(() => {
    persistAuth(token, user);
  }, [token, user]);

  const login = useCallback((nextToken: string, nextUser?: AuthUser | null) => {
    const resolvedUser = nextUser ?? deriveUser(nextToken, null);
    setToken(nextToken);
    setUser(resolvedUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    if (!token) {
      logout();
      return false;
    }

    const payload = parseJwt(token);
    const expiresAt = payload?.exp;

    if (expiresAt && Date.now() >= expiresAt * 1000) {
      logout();
      return false;
    }

    setUser((currentUser) => currentUser ?? deriveUser(token, null));
    return true;
  }, [logout, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
      refreshToken,
    }),
    [loading, login, logout, refreshToken, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
