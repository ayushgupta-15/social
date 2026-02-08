import { AppError, getErrorMessage, isAppError } from "./app-error";
import { ZodError } from "zod";

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

/**
 * Success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * API response type
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Handle errors in server actions
 *
 * Converts various error types to consistent ErrorResponse format
 * Logs errors appropriately based on severity
 */
export function handleError(error: unknown): ErrorResponse {
  // Custom application errors
  if (isAppError(error)) {
    // Log warnings for client errors (4xx), errors for server errors (5xx)
    if (error.statusCode >= 500) {
      console.error("[ERROR]", {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      });
    } else {
      console.warn("[WARNING]", {
        name: error.name,
        message: error.message,
        code: error.code,
      });
    }

    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};

    error.issues.forEach((err) => {
      const path = err.path.join(".");
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(err.message);
    });

    const firstError = Object.values(formattedErrors)[0]?.[0] || "Validation failed";

    console.warn("[VALIDATION_ERROR]", formattedErrors);

    return {
      success: false,
      error: firstError,
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { errors: formattedErrors },
    };
  }

  // Standard JavaScript errors
  if (error instanceof Error) {
    console.error("[UNEXPECTED_ERROR]", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
    };
  }

  // Unknown errors
  console.error("[UNKNOWN_ERROR]", error);

  return {
    success: false,
    error: "An unknown error occurred. Please try again later.",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Async error handler wrapper
 * Wraps async functions to automatically handle errors
 *
 * Usage:
 * export const myAction = withErrorHandling(async () => {
 *   // Your code here
 *   return data;
 * });
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ApiResponse<Awaited<ReturnType<T>>>> {
  return async (...args: Parameters<T>) => {
    try {
      const result = await fn(...args);
      return createSuccessResponse(result);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Assert condition and throw error if false
 * Useful for preconditions and validation
 */
export function assert(condition: boolean, error: AppError | string): asserts condition {
  if (!condition) {
    if (typeof error === "string") {
      throw new AppError(error);
    }
    throw error;
  }
}

/**
 * Assert value is not null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  error: AppError | string
): asserts value is T {
  if (value === null || value === undefined) {
    if (typeof error === "string") {
      throw new AppError(error);
    }
    throw error;
  }
}
