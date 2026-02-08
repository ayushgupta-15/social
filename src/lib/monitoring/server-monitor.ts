/**
 * Server-side Performance Monitoring
 *
 * Tracks server response times, database query performance,
 * and API endpoint latency.
 */

import { logger } from "../logger";

interface ServerMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  userId?: string;
}

/**
 * Server response time thresholds (ms)
 */
const RESPONSE_TIME_THRESHOLDS = {
  fast: 100,
  acceptable: 300,
  slow: 1000,
};

/**
 * Tracks API endpoint performance
 */
export function trackAPIPerformance(metric: ServerMetric) {
  const { endpoint, method, duration, status, userId } = metric;

  const rating =
    duration < RESPONSE_TIME_THRESHOLDS.fast
      ? "fast"
      : duration < RESPONSE_TIME_THRESHOLDS.acceptable
        ? "acceptable"
        : duration < RESPONSE_TIME_THRESHOLDS.slow
          ? "slow"
          : "critical";

  const logData = {
    endpoint,
    method,
    duration: Math.round(duration),
    status,
    userId,
    rating,
  };

  if (rating === "critical" || rating === "slow") {
    logger.warn(logData, `Slow API response: ${method} ${endpoint}`);
  } else {
    logger.debug(logData, "API request completed");
  }

  // Track metrics in production
  if (process.env.NODE_ENV === "production") {
    // Send to APM service (e.g., DataDog, New Relic, Sentry)
    // Example: sendToAPM(logData);
  }
}

/**
 * Creates a timer for measuring server operations
 */
export function createServerTimer() {
  const start = process.hrtime.bigint();

  return {
    stop: () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to ms
      return duration;
    },
  };
}

/**
 * Middleware wrapper for performance tracking
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  handler: T
): T {
  return (async (...args: any[]) => {
    const timer = createServerTimer();

    try {
      const result = await handler(...args);
      const duration = timer.stop();

      if (duration > RESPONSE_TIME_THRESHOLDS.slow) {
        logger.warn({ operation, duration: Math.round(duration) }, "Slow server operation");
      }

      return result;
    } catch (error) {
      const duration = timer.stop();
      logger.error({ operation, duration: Math.round(duration), error }, "Server operation failed");
      throw error;
    }
  }) as T;
}

/**
 * Database query performance tracker
 */
export class DatabaseMonitor {
  private static queryCount = 0;
  private static slowQueries: Array<{ query: string; duration: number }> = [];

  static trackQuery(query: string, duration: number) {
    this.queryCount++;

    if (duration > 500) {
      this.slowQueries.push({ query, duration });

      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }

      logger.warn(
        { query: query.substring(0, 200), duration: Math.round(duration) },
        "Slow database query"
      );
    }
  }

  static getStats() {
    return {
      totalQueries: this.queryCount,
      slowQueriesCount: this.slowQueries.length,
      slowQueries: this.slowQueries.slice(-10), // Last 10 slow queries
    };
  }

  static reset() {
    this.queryCount = 0;
    this.slowQueries = [];
  }
}
