import pino from "pino";

/**
 * Structured Logger Configuration
 *
 * Uses Pino for high-performance structured logging with different
 * transports for development and production environments.
 *
 * Features:
 * - Pretty printing in development
 * - JSON output in production for log aggregation
 * - Different log levels per environment
 * - Request correlation IDs
 * - Performance optimizations (async logging)
 */

const isDevelopment = process.env.NODE_ENV === "development";
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

export const logger = pino({
  level: logLevel,
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        node_version: process.version,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "apiKey",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },
  // Pretty print in development
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,
});

/**
 * Creates a child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Logger for HTTP requests
 */
export const requestLogger = createLogger({ module: "http" });

/**
 * Logger for database operations
 */
export const dbLogger = createLogger({ module: "database" });

/**
 * Logger for authentication
 */
export const authLogger = createLogger({ module: "auth" });

/**
 * Logger for business logic / use cases
 */
export const useCaseLogger = createLogger({ module: "use-case" });
