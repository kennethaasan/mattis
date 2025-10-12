import { BASIC_AUTH_PREFIX } from "@/lib/auth/credentials";

interface StoredAuthUser {
  id: string;
  username: string;
}

export interface StoredAuthPayload {
  token: string;
  user: StoredAuthUser;
}

const STORAGE_KEY = "mattis.auth";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readStoredAuth(): StoredAuthPayload | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthPayload;
    if (
      typeof parsed === "object" &&
      typeof parsed.token === "string" &&
      parsed.token.length > 0 &&
      typeof parsed.user === "object" &&
      typeof parsed.user.id === "string" &&
      typeof parsed.user.username === "string"
    ) {
      return parsed;
    }
  } catch {
    // Ignore malformed payloads and fall through to cleanup.
  }

  window.localStorage.removeItem(STORAGE_KEY);
  return null;
}

export function writeStoredAuth(payload: StoredAuthPayload): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredAuth(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function getStoredAuthorizationHeader(): string | null {
  const stored = readStoredAuth();
  if (!stored?.token) {
    return null;
  }

  return stored.token.startsWith(BASIC_AUTH_PREFIX)
    ? stored.token
    : `${BASIC_AUTH_PREFIX}${stored.token}`;
}

export function storeAuthorizationToken(token: string): string {
  return token.startsWith(BASIC_AUTH_PREFIX)
    ? token
    : `${BASIC_AUTH_PREFIX}${token}`;
}

export { STORAGE_KEY as AUTH_STORAGE_KEY };
