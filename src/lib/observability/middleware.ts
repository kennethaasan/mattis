import { MetricUnit } from "@aws-lambda-powertools/metrics";

import { logger, metrics, tracer } from "./powertools";

type RequestLike = Request;

const isRequestLike = (value: unknown): value is RequestLike => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeRequest = value as { method?: unknown; url?: unknown };
  return typeof maybeRequest.method === "string" && typeof maybeRequest.url === "string";
};

interface ObservabilityOptions<TArgs extends unknown[], TResponse> {
  operationName?: string;
  metricName?: string;
  dimensions?:
    | Record<string, string>
    | ((request: RequestLike | undefined, args: TArgs) => Record<string, string>);
  onError?: (
    error: unknown,
    request: RequestLike | undefined,
    args: TArgs,
  ) => TResponse | Promise<TResponse>;
}

export function withObservability<TArgs extends unknown[], TResponse>(
  handler: (...args: TArgs) => Promise<TResponse>,
  options: ObservabilityOptions<TArgs, TResponse> = {},
): (...args: TArgs) => Promise<TResponse> {
  const {
    operationName = handler.name || "handler",
    metricName = "HandlerLatency",
    dimensions,
    onError,
  } = options;

  return async function observableHandler(...args: TArgs): Promise<TResponse> {
    const request = isRequestLike(args[0]) ? (args[0] as RequestLike) : undefined;
    const startTime = process.hrtime.bigint();
    const requestUrl = request ? new URL(request.url) : undefined;
    const requestId = request?.headers.get("x-request-id") ?? undefined;
    const userAgent = request?.headers.get("user-agent") ?? undefined;
    const method = request?.method ?? "UNKNOWN";
    const path = requestUrl?.pathname ?? `/${operationName}`;

    const logContextEntries = Object.entries({
      httpMethod: method,
      path,
      requestId,
    }).filter(([, value]) => value !== undefined);
    if (logContextEntries.length > 0) {
      logger.appendKeys(Object.fromEntries(logContextEntries));
    }

    tracer.putAnnotation("operation", operationName);
    tracer.putAnnotation("httpMethod", method);
    tracer.putAnnotation("path", path);
    if (requestId) {
      tracer.putAnnotation("requestId", requestId);
    }
    tracer.putMetadata("request", {
      method,
      path,
      requestId,
      userAgent,
    });

    try {
      const result = await tracer.provider.captureAsyncFunc(
        operationName,
        async () => handler(...args),
      );
      return result as TResponse;
    } catch (error) {
      tracer.addErrorAsMetadata(error as Error);
      if (onError) {
        return await onError(error, request, args);
      }
      throw error;
    } finally {
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1_000_000;

      metrics.addDimension("Operation", operationName);
      const resolvedDimensions =
        typeof dimensions === "function" ? dimensions(request, args) : dimensions;
      if (resolvedDimensions) {
        for (const [name, value] of Object.entries(resolvedDimensions)) {
          metrics.addDimension(name, value);
        }
      }

      metrics.addMetric(metricName, MetricUnit.Milliseconds, latencyMs);
      metrics.addMetadata("operation", operationName);
      metrics.addMetadata("httpMethod", method);
      metrics.addMetadata("path", path);
      if (requestId) {
        metrics.addMetadata("requestId", requestId);
      }
      metrics.publishStoredMetrics();

      if (logContextEntries.length > 0) {
        logger.removeKeys(logContextEntries.map(([key]) => key));
      }
    }
  };
}
