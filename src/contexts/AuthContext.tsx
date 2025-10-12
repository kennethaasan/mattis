"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearStoredAuth,
  readStoredAuth,
  storeAuthorizationToken,
  writeStoredAuth,
} from "@/lib/auth/storage";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  authorization: string | null;
  isReady: boolean;
  login: (payload: { user: User; token: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authorization, setAuthorization] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setAuthorization(storeAuthorizationToken(stored.token));
    }
    setIsReady(true);
  }, []);

  const contextValue = useMemo(() => {
    const login = (payload: { user: User; token: string }) => {
      const normalizedToken = storeAuthorizationToken(payload.token);
      setUser(payload.user);
      setAuthorization(normalizedToken);
      writeStoredAuth({
        token: normalizedToken,
        user: payload.user,
      });
    };

    const logout = () => {
      setUser(null);
      setAuthorization(null);
      clearStoredAuth();
    };

    return {
      user,
      authorization,
      isReady,
      login,
      logout,
    } satisfies AuthContextType;
  }, [authorization, isReady, user]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
