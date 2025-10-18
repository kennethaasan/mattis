"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type AuthSession,
  AuthSessionResponseSchema,
  EmailPasswordSignInResponseSchema,
  ProblemDetailsSchema,
} from "@/lib/api/schemas";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  readonly user: AuthUser | null;
  readonly token: string | null;
  readonly loading: boolean;
  readonly error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getAuthHeader: () => Record<string, string> | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((payload: AuthSession | null) => {
    if (!payload) {
      setUser(null);
      setToken(null);
      return;
    }

    setUser({
      id: payload.user.id,
      email: payload.user.email,
      name: payload.user.name ?? payload.user.email,
    });
    setToken(payload.session.token);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/get-session", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        applySession(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const parsed = AuthSessionResponseSchema.safeParse(data);
      applySession(parsed.success ? parsed.data : null);
    } catch (refreshError) {
      applySession(null);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Kunne ikke hente innloggingstatus."
      );
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          let body: unknown = null;
          try {
            body = await response.json();
          } catch {
            body = null;
          }

          const problem = ProblemDetailsSchema.safeParse(body);
          const message =
            (problem.success && problem.data.detail) ||
            "Feil e-post eller passord.";
          throw new Error(message);
        }

        const data = await response.json();
        const parsed = EmailPasswordSignInResponseSchema.safeParse(data);

        if (!parsed.success) {
          throw new Error("Feil e-post eller passord.");
        }

        applySession({
          session: { token: parsed.data.token },
          user: parsed.data.user,
        });
      } catch (loginError) {
        applySession(null);
        setError(
          loginError instanceof Error
            ? loginError.message
            : "Kunne ikke logge inn."
        );
        throw loginError;
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      applySession(null);
      setLoading(false);
    }
  }, [applySession]);

  const getAuthHeader = useCallback(() => {
    if (!token) {
      return null;
    }

    const bearer = `Bearer ${token}`;

    return {
      Authorization: bearer,
      "x-forwarded-authorization": bearer,
    };
  }, [token]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      logout,
      refresh,
      getAuthHeader,
    }),
    [error, getAuthHeader, loading, login, logout, refresh, token, user]
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
