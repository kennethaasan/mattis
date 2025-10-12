const BASIC_PREFIX = "Basic ";

interface BufferLike {
  toString(encoding: string): string;
}

interface BufferCtor {
  from(value: string, encoding: string): BufferLike;
}

function encodeBase64(value: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    const utf8Bytes = new TextEncoder().encode(value);
    let binary = "";
    utf8Bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }

  const maybeBuffer = (globalThis as { Buffer?: unknown }).Buffer;
  if (typeof maybeBuffer === "function") {
    const bufferCtor = maybeBuffer as BufferCtor;
    return bufferCtor.from(value, "utf8").toString("base64");
  }

  throw new Error("Base64 encoding is not supported in this environment.");
}

function decodeBase64(value: string): string {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  const maybeBuffer = (globalThis as { Buffer?: unknown }).Buffer;
  if (typeof maybeBuffer === "function") {
    const bufferCtor = maybeBuffer as BufferCtor;
    return bufferCtor.from(value, "base64").toString("utf8");
  }

  throw new Error("Base64 decoding is not supported in this environment.");
}

export function createBasicToken(username: string, password: string): string {
  const encoded = encodeBase64(`${username}:${password}`);
  return `${BASIC_PREFIX}${encoded}`;
}

export function extractBasicToken(
  authHeader: string | null | undefined,
): string | null {
  if (!authHeader?.startsWith(BASIC_PREFIX)) {
    return null;
  }

  return authHeader.slice(BASIC_PREFIX.length);
}

export function decodeBasicToken(
  token: string,
): { username: string; password: string } | null {
  try {
    const decoded = decodeBase64(token);
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch {
    return null;
  }
}

export { BASIC_PREFIX as BASIC_AUTH_PREFIX };
