import { describe, expect, test } from "vitest";

import {
  amzContentSha256FetchPlugin,
  withAmzContentSha256Header,
  withAmzContentSha256Request,
} from "@/lib/api/amz-content-sha256";

const EMPTY_PAYLOAD_HASH =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("withAmzContentSha256Header", () => {
  test("returns init unchanged for GET requests", async () => {
    const init: RequestInit = { method: "GET" };
    const result = await withAmzContentSha256Header(init);

    expect(result).toBe(init);
  });

  test("returns init unchanged for DELETE requests", async () => {
    const init: RequestInit = { method: "DELETE" };
    const result = await withAmzContentSha256Header(init);

    expect(result).toBe(init);
  });

  test("returns init unchanged when method is undefined", async () => {
    const init: RequestInit = {};
    const result = await withAmzContentSha256Header(init);

    expect(result).toBe(init);
  });

  test("adds empty payload hash for POST without body", async () => {
    const init: RequestInit = { method: "POST" };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    expect(headers.get("x-amz-content-sha256")).toBe(EMPTY_PAYLOAD_HASH);
  });

  test("adds empty payload hash for PUT with null body", async () => {
    const init: RequestInit = { method: "PUT", body: null };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    expect(headers.get("x-amz-content-sha256")).toBe(EMPTY_PAYLOAD_HASH);
  });

  test("hashes string body for POST request", async () => {
    const body = '{"foo":"bar"}';
    const init: RequestInit = { method: "POST", body };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    const hash = headers.get("x-amz-content-sha256");

    expect(hash).not.toBe(EMPTY_PAYLOAD_HASH);
    expect(hash).toHaveLength(64); // SHA-256 hex is 64 characters
    expect(result.body).toBe(body);
  });

  test("hashes URLSearchParams body", async () => {
    const body = new URLSearchParams({ key: "value" });
    const init: RequestInit = { method: "POST", body };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    const hash = headers.get("x-amz-content-sha256");

    expect(hash).not.toBe(EMPTY_PAYLOAD_HASH);
    expect(hash).toHaveLength(64);
  });

  test("hashes ArrayBuffer body", async () => {
    const body = new TextEncoder().encode("test data").buffer;
    const init: RequestInit = { method: "POST", body };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    const hash = headers.get("x-amz-content-sha256");

    expect(hash).not.toBe(EMPTY_PAYLOAD_HASH);
    expect(hash).toHaveLength(64);
  });

  test("hashes Uint8Array body", async () => {
    const body = new TextEncoder().encode("test data");
    const init: RequestInit = { method: "POST", body };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    const hash = headers.get("x-amz-content-sha256");

    expect(hash).not.toBe(EMPTY_PAYLOAD_HASH);
    expect(hash).toHaveLength(64);
  });

  test("hashes Blob body", async () => {
    const body = new Blob(["test data"], { type: "text/plain" });
    const init: RequestInit = { method: "POST", body };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    const hash = headers.get("x-amz-content-sha256");

    expect(hash).not.toBe(EMPTY_PAYLOAD_HASH);
    expect(hash).toHaveLength(64);
  });

  test("preserves existing headers", async () => {
    const init: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("x-amz-content-sha256")).toBeTruthy();
  });

  test("handles lowercase method", async () => {
    const init: RequestInit = { method: "post", body: "test" };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    expect(headers.get("x-amz-content-sha256")).toBeTruthy();
  });

  test("handles Uint8Array with offset", async () => {
    const fullBuffer = new TextEncoder().encode("prefix-test-suffix");
    const body = new Uint8Array(fullBuffer.buffer, 7, 4); // "test"
    const init: RequestInit = { method: "POST", body };
    const result = await withAmzContentSha256Header(init);

    const headers = new Headers(result.headers);
    expect(headers.get("x-amz-content-sha256")).toHaveLength(64);
  });
});

describe("withAmzContentSha256Request", () => {
  test("returns request unchanged for GET", async () => {
    const request = new Request("https://example.com", { method: "GET" });
    const result = await withAmzContentSha256Request(request);

    expect(result).toBe(request);
  });

  test("adds hash header for POST request", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: '{"test":true}',
    });
    const result = await withAmzContentSha256Request(request);

    expect(result.headers.get("x-amz-content-sha256")).toHaveLength(64);
  });

  test("adds hash header for PUT request with empty body", async () => {
    const request = new Request("https://example.com", {
      method: "PUT",
    });
    const result = await withAmzContentSha256Request(request);

    expect(result.headers.get("x-amz-content-sha256")).toBe(EMPTY_PAYLOAD_HASH);
  });

  test("preserves request URL", async () => {
    const url = "https://example.com/api/test?param=value";
    const request = new Request(url, {
      method: "POST",
      body: "data",
    });
    const result = await withAmzContentSha256Request(request);

    expect(result.url).toBe(url);
  });
});

describe("amzContentSha256FetchPlugin", () => {
  test("has correct id and name", () => {
    expect(amzContentSha256FetchPlugin.id).toBe("amz-content-sha256");
    expect(amzContentSha256FetchPlugin.name).toBe("amz-content-sha256");
  });

  test("onRequest hook adds hash for POST", async () => {
    const context = {
      method: "POST",
      headers: new Headers(),
      body: '{"data":"test"}',
    };

    const result = await amzContentSha256FetchPlugin.hooks?.onRequest?.(
      context as never,
    );

    expect(result).toBeDefined();
    const headers = result?.headers as Headers;
    expect(headers.get("x-amz-content-sha256")).toHaveLength(64);
  });

  test("onRequest hook preserves context for GET", async () => {
    const originalHeaders = new Headers({ Authorization: "Bearer token" });
    const context = {
      method: "GET",
      headers: originalHeaders,
      body: undefined,
    };

    const result = await amzContentSha256FetchPlugin.hooks?.onRequest?.(
      context as never,
    );

    expect(result?.headers).toStrictEqual(originalHeaders);
  });
});
