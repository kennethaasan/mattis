import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  getErrorLogContext,
  getRequestLogContext,
} from "@/lib/observability/logging";

const Logger = vi.fn(() => ({ name: "logger" }));
const Metrics = vi.fn(() => ({ name: "metrics" }));
const Tracer = vi.fn(() => ({ name: "tracer" }));

vi.mock("@aws-lambda-powertools/logger", () => ({ Logger }));
vi.mock("@aws-lambda-powertools/metrics", () => ({ Metrics }));
vi.mock("@aws-lambda-powertools/tracer", () => ({ Tracer }));

describe("logging helpers", () => {
  test("getRequestLogContext returns method, url and requestId", () => {
    const headers = new Headers({ "x-request-id": "req-123" });
    const request = {
      method: "POST",
      url: "https://example.com/api",
      headers,
    };

    expect(getRequestLogContext(request)).toEqual({
      method: "POST",
      url: "https://example.com/api",
      requestId: "req-123",
    });
  });

  test("getRequestLogContext omits missing request id", () => {
    const request = {
      method: "GET",
      url: "https://example.com/",
      headers: new Headers(),
    };

    expect(getRequestLogContext(request)).toEqual({
      method: "GET",
      url: "https://example.com/",
      requestId: undefined,
    });
  });

  test("getErrorLogContext formats Error instances", () => {
    const error = new Error("Boom");

    expect(getErrorLogContext(error)).toEqual({
      name: error.name,
      message: "Boom",
      stack: error.stack,
    });
  });

  test("getErrorLogContext falls back to raw values", () => {
    expect(getErrorLogContext("oops")).toEqual({ raw: "oops" });
  });
});

describe("powertools", () => {
  beforeEach(() => {
    Logger.mockClear();
    Metrics.mockClear();
    Tracer.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unmock("@/env");
  });

  const loadPowertools = async (sampleRate: number, randomValue?: number) => {
    vi.resetModules();
    if (typeof randomValue === "number") {
      vi.spyOn(Math, "random").mockReturnValue(randomValue);
    }

    vi.doMock("@/env", () => ({
      config: {
        POWERTOOLS: {
          LOG_LEVEL: "INFO",
          METRICS_NAMESPACE: "mattis",
          SERVICE_NAME: "mattis-service",
          TRACING_SAMPLE_RATE: sampleRate,
        },
      },
    }));

    return import("@/lib/observability/powertools");
  };

  test("disables tracing when sample rate is zero", async () => {
    await loadPowertools(0);

    expect(Tracer).toHaveBeenCalledWith({
      serviceName: "mattis-service",
      enabled: false,
    });
  });

  test("enables tracing when sample rate is full", async () => {
    await loadPowertools(1);

    expect(Tracer).toHaveBeenCalledWith({
      serviceName: "mattis-service",
      enabled: true,
    });
    expect(Logger).toHaveBeenCalledWith({
      serviceName: "mattis-service",
      logLevel: "INFO",
    });
    expect(Metrics).toHaveBeenCalledWith({
      namespace: "mattis",
      serviceName: "mattis-service",
    });
  });

  test("samples tracing when sample rate is between 0 and 1", async () => {
    await loadPowertools(0.5, 0.4);

    expect(Tracer).toHaveBeenCalledWith({
      serviceName: "mattis-service",
      enabled: true,
    });
  });
});
