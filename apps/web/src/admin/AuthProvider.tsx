'use client';

import type { AdminUser } from '@btp/shared';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, onSessionExpired, refreshSession, setAccessToken } from './lib/client';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Après un changement de mot de passe, l'API renvoie une nouvelle session. */
  setSession: (user: AdminUser, accessToken: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const LOGIN_PATH = '/admin/connexion';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AdminUser | null>(null);

  // Reprise de session au chargement : le cookie httpOnly suffit à obtenir un access token.
  useEffect(() => {
    void refreshSession().then((session) => {
      setUser(session?.user ?? null);
      setStatus(session ? 'authenticated' : 'anonymous');
    });
    onSessionExpired(() => {
      setAccessToken(null);
      setUser(null);
      setStatus('anonymous');
    });
  }, []);

  // Pages protégées : sans session, retour à la connexion (et inversement).
  useEffect(() => {
    if (status === 'anonymous' && pathname !== LOGIN_PATH) {
      router.replace(`${LOGIN_PATH}?suite=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => undefined);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const setSession = useCallback((next: AdminUser, token: string) => {
    setAccessToken(token);
    setUser(next);
    setStatus('authenticated');
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout, setSession }),
    [status, user, login, logout, setSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
