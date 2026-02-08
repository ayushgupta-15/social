import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validate, ValidationError } from "@/lib/validation/validator";

describe("Validator", () => {
  describe("validate function", () => {
    const testSchema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email"),
      age: z.number().min(0).max(150),
    });

    it("should validate correct data", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const result = validate(testSchema, data);

      expect(result).toEqual(data);
    });

    it("should throw ValidationError for invalid data", () => {
      const data = {
        name: "",
        email: "invalid-email",
        age: -5,
      };

      expect(() => validate(testSchema, data)).toThrow(ValidationError);
    });

    it("should provide formatted error messages", () => {
      const data = {
        name: "",
        email: "invalid",
        age: 200,
      };

      try {
        validate(testSchema, data);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors).toHaveProperty("name");
        expect(validationError.errors).toHaveProperty("email");
        expect(validationError.errors).toHaveProperty("age");
      }
    });

    it("should handle nested objects", () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            bio: z.string().max(100),
          }),
        }),
      });

      const data = {
        user: {
          profile: {
            bio: "a".repeat(101),
          },
        },
      };

      expect(() => validate(nestedSchema, data)).toThrow(ValidationError);
    });

    it("should handle array validation", () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1).max(5),
      });

      const tooManyTags = {
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
      };

      expect(() => validate(arraySchema, tooManyTags)).toThrow(ValidationError);

      const validTags = {
        tags: ["tag1", "tag2", "tag3"],
      };

      const result = validate(arraySchema, validTags);
      expect(result).toEqual(validTags);
    });
  });

  describe("ValidationError class", () => {
    it("should format errors correctly", () => {
      const zodError = new z.ZodError([
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "Name is required",
          path: ["name"],
        },
        {
          code: "invalid_string",
          validation: "email",
          message: "Invalid email",
          path: ["email"],
        },
      ]);

      const validationError = new ValidationError(zodError);

      expect(validationError.errors).toHaveProperty("name");
      expect(validationError.errors).toHaveProperty("email");
      expect(validationError.errors.name).toContain("Name is required");
      expect(validationError.errors.email).toContain("Invalid email");
    });

    it("should set message from first error", () => {
      const zodError = new z.ZodError([
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "First error",
          path: ["field1"],
        },
        {
          code: "invalid_string",
          validation: "email",
          message: "Second error",
          path: ["field2"],
        },
      ]);

      const validationError = new ValidationError(zodError);

      expect(validationError.message).toBe("First error");
    });
  });
});
