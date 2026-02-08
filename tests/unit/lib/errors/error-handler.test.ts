import { describe, it, expect } from "vitest";
import { handleError } from "@/lib/errors/error-handler";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ValidationError as AppValidationError,
  RateLimitError,
} from "@/lib/errors/app-error";
import { ZodError } from "zod";

describe("Error Handler", () => {
  describe("handleError", () => {
    it("should handle AppError correctly", () => {
      const error = new AppError("Test error", 500, "TEST_ERROR");
      const result = handleError(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Test error");
      expect(result.code).toBe("TEST_ERROR");
      expect(result.statusCode).toBe(500);
    });

    it("should handle NotFoundError", () => {
      const error = new NotFoundError("User", "user-123");
      const result = handleError(error);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.code).toBe("NOT_FOUND");
      expect(result.details).toHaveProperty("resource", "User");
      expect(result.details).toHaveProperty("id", "user-123");
    });

    it("should handle UnauthorizedError", () => {
      const error = new UnauthorizedError("Invalid credentials");
      const result = handleError(error);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe("UNAUTHORIZED");
      expect(result.error).toBe("Invalid credentials");
    });

    it("should handle ValidationError", () => {
      const error = new AppValidationError("Validation failed");
      const result = handleError(error);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.code).toBe("VALIDATION_ERROR");
    });

    it("should handle RateLimitError", () => {
      const error = new RateLimitError("Too many requests");
      const result = handleError(error);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(429);
      expect(result.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should handle ZodError", () => {
      const zodError = new ZodError([
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "Required field",
          path: ["name"],
        },
      ]);

      const result = handleError(zodError);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.details).toHaveProperty("errors");
    });

    it("should handle generic Error", () => {
      const error = new Error("Something went wrong");
      const result = handleError(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unknown error types", () => {
      const error = "String error";
      const result = handleError(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe("An unknown error occurred");
      expect(result.statusCode).toBe(500);
    });

    it("should include details when provided", () => {
      const error = new AppError("Error with details", 400, "DETAILED_ERROR", {
        field: "email",
        value: "invalid",
      });

      const result = handleError(error);

      expect(result.details).toEqual({
        field: "email",
        value: "invalid",
      });
    });
  });
});
