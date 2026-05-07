import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { AuthUser } from "@/src/types/auth";

import * as authService from "../services/authService";

type AuthContextData = {
  user: AuthUser | null;
  loading: boolean;
  signed: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService
      .loadStoredSession()
      .then(async (session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        if (session) {
          try {
            const current = await authService.refreshMe();
            if (active && current) setUser(current);
          } catch {
            await authService.clearSession();
            if (active) setUser(null);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function signIn(email: string, senha: string) {
    const session = await authService.login(email.trim(), senha);
    setUser(session.user);
  }

  async function signOut() {
    await authService.logout();
    setUser(null);
  }

  async function refreshUser() {
    const current = await authService.refreshMe();
    if (current) setUser(current);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      signed: Boolean(user),
      signIn,
      signOut,
      refreshUser,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
