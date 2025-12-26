import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { Tracer } from "@aws-lambda-powertools/tracer";

import { config } from "@/env";

const shouldEnableTracing = (() => {
  if (config.POWERTOOLS.TRACING_SAMPLE_RATE <= 0) {
    return false;
  }

  if (config.POWERTOOLS.TRACING_SAMPLE_RATE >= 1) {
    return true;
  }

  return Math.random() < config.POWERTOOLS.TRACING_SAMPLE_RATE;
})();

const logger = new Logger({
  serviceName: config.POWERTOOLS.SERVICE_NAME,
  logLevel: config.POWERTOOLS.LOG_LEVEL,
});

const tracer = new Tracer({
  serviceName: config.POWERTOOLS.SERVICE_NAME,
  enabled: shouldEnableTracing,
});

const metrics = new Metrics({
  namespace: config.POWERTOOLS.METRICS_NAMESPACE,
  serviceName: config.POWERTOOLS.SERVICE_NAME,
});

export { logger, tracer, metrics };
