"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { signIn, signOut, useSession } from "@/lib/auth/auth-client";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  readonly user: AuthUser | null;
  readonly loading: boolean;
  readonly error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending, error: sessionError } = useSession();
  const [error, setError] = useState<string | null>(null);

  const user = useMemo<AuthUser | null>(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? session.user.email,
    };
  }, [session]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setError(null);

      try {
        const result = await signIn.email(
          { email, password },
          {
            onRequest: () => {
              setError(null);
            },
            onSuccess: () => {
              setError(null);
            },
            onError: (ctx) => {
              const message = ctx.error.message || "Feil e-post eller passord.";
              setError(message);
            },
          },
        );

        if (result.error) {
          throw new Error(result.error.message || "Feil e-post eller passord.");
        }
      } catch (loginError) {
        const message =
          loginError instanceof Error
            ? loginError.message
            : "Kunne ikke logge inn.";
        setError(message);
        throw loginError;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Kunne ikke logge ut.",
      );
    }
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading: isPending,
      error: error || (sessionError?.message ?? null),
      login,
      logout,
      refresh,
    }),
    [error, isPending, login, logout, refresh, sessionError, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
