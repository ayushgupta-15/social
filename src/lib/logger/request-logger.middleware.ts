import type { NextRequest, NextResponse } from "next/server";
import { requestLogger } from "./logger";
import { nanoid } from "nanoid";

/**
 * Request Logging Middleware
 *
 * Logs all incoming HTTP requests with:
 * - Request ID for correlation
 * - Method, URL, user agent
 * - Response status and duration
 * - Error details if request fails
 */

export function logRequest(request: NextRequest) {
  const requestId = nanoid(10);
  const startTime = Date.now();

  const logContext = {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
  };

  requestLogger.info(logContext, "Incoming request");

  return {
    requestId,
    logResponse: (response: NextResponse) => {
      const duration = Date.now() - startTime;

      requestLogger.info(
        {
          ...logContext,
          status: response.status,
          duration,
        },
        "Request completed"
      );
    },
    logError: (error: Error) => {
      const duration = Date.now() - startTime;

      requestLogger.error(
        {
          ...logContext,
          duration,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        "Request failed"
      );
    },
  };
}
