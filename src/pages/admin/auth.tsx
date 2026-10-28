import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { api, ApiError, clearToken, getToken, setToken } from "@/lib/api";

export type AdminUser = { id: string; name: string; email: string };

export type AuthState = {
  admin: AdminUser | null;
  /** True while the stored token is being validated against the API. */
  checking: boolean;
  /** Reachability failure — shown instead of the login form. */
  offline: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAdminAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside the admin area");
  return context;
}

export function AdminAuth({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [offline, setOffline] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    api
      .get<{ admin: AdminUser }>("/api/auth/me", { auth: true })
      .then((result) => {
        if (cancelled) return;
        setAdmin(result.admin);
        setOffline(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 0) {
          setOffline(error.message);
        } else {
          clearToken();
          setAdmin(null);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; admin: AdminUser }>("/api/auth/login", {
      email,
      password,
    });
    setToken(result.token);
    setAdmin(result.admin);
    setOffline(null);
    setChecking(false);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, checking, offline, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
