'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type AuthResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    api.auth
      .me()
      .then((u) => setUser(u))
      .catch((err) => {
        // 401/403만 토큰 삭제 (네트워크 에러·서버 재시작 시에는 유지)
        if (
          err instanceof ApiError &&
          (err.statusCode === 401 || err.statusCode === 403)
        ) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuthResponse = useCallback((res: AuthResponse) => {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    setUser(res.user);
  }, []);

  const login = useCallback(
    async (data: { email: string; password: string }) => {
      const res = await api.auth.login(data);
      handleAuthResponse(res);
    },
    [handleAuthResponse],
  );

  const signup = useCallback(
    async (data: { email: string; password: string; name: string }) => {
      const res = await api.auth.signup(data);
      handleAuthResponse(res);
    },
    [handleAuthResponse],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
