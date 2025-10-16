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

interface SessionResponse {
  readonly session: {
    token: string;
    expiresAt?: string;
    id?: string;
  };
  readonly user: {
    id: string;
    email: string;
    name: string | null;
  };
}

function normalizeSessionPayload(payload: unknown): SessionResponse | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const userCandidate = raw.user;

  if (!userCandidate || typeof userCandidate !== "object") {
    return null;
  }

  const user = userCandidate as {
    id?: unknown;
    email?: unknown;
    name?: unknown;
  };

  if (typeof user.id !== "string" || typeof user.email !== "string") {
    return null;
  }

  const sessionCandidate = raw.session;
  const sessionToken =
    (typeof raw.token === "string" && raw.token) ||
    (sessionCandidate &&
      typeof sessionCandidate === "object" &&
      typeof (sessionCandidate as { token?: unknown }).token === "string" &&
      (sessionCandidate as { token: string }).token) ||
    null;

  if (!sessionToken) {
    return null;
  }

  const session =
    sessionCandidate && typeof sessionCandidate === "object"
      ? {
          token: sessionToken,
          expiresAt:
            typeof (sessionCandidate as { expiresAt?: unknown }).expiresAt ===
            "string"
              ? (sessionCandidate as { expiresAt: string }).expiresAt
              : undefined,
          id:
            typeof (sessionCandidate as { id?: unknown }).id === "string"
              ? (sessionCandidate as { id: string }).id
              : undefined,
        }
      : { token: sessionToken };

  return {
    session,
    user: {
      id: user.id,
      email: user.email,
      name:
        typeof user.name === "string" && user.name.length > 0
          ? user.name
          : null,
    },
  };
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

  const applySession = useCallback((payload: SessionResponse | null) => {
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
      applySession(normalizeSessionPayload(data));
    } catch (refreshError) {
      applySession(null);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Kunne ikke hente innloggingstatus.",
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

          const message =
            body && typeof body === "object" && body !== null && "message" in body
              ? (body as { message?: string }).message ??
                "Feil e-post eller passord."
              : "Feil e-post eller passord.";
          throw new Error(message);
        }

        const data = await response.json();
        const sessionPayload = normalizeSessionPayload(data);

        if (!sessionPayload) {
          throw new Error("Feil e-post eller passord.");
        }

        applySession(sessionPayload);
      } catch (loginError) {
        applySession(null);
        setError(
          loginError instanceof Error
            ? loginError.message
            : "Kunne ikke logge inn.",
        );
        throw loginError;
      } finally {
        setLoading(false);
      }
    },
    [applySession],
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
    [error, getAuthHeader, loading, login, logout, refresh, token, user],
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
