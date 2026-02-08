/**
 * Base Application Error
 *
 * All custom errors extend this class for consistent error handling.
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 404 Not Found Error
 * Resource doesn't exist in the database
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID "${id}" not found` : `${resource} not found`;

    super(message, 404, "NOT_FOUND", { resource, id });
  }
}

/**
 * 401 Unauthorized Error
 * User is not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "You must be logged in to perform this action") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * 403 Forbidden Error
 * User is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * 400 Validation Error
 * Input data failed validation
 */
export class ValidationError extends AppError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR", { errors });
  }
}

/**
 * 429 Rate Limit Error
 * Too many requests from user
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests. Please try again later.", retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { retryAfter });
  }
}

/**
 * 409 Conflict Error
 * Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, resource?: string) {
    super(message, 409, "CONFLICT", { resource });
  }
}

/**
 * 500 Internal Server Error
 * Unexpected error occurred
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = "An unexpected error occurred. Please try again later.",
    originalError?: Error
  ) {
    super(message, 500, "INTERNAL_SERVER_ERROR", {
      originalError: originalError?.message,
    });
  }
}

/**
 * 400 Bad Request Error
 * Request is malformed or invalid
 */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, "BAD_REQUEST");
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Get error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
