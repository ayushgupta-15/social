import type { z } from "zod";
import { ZodError } from "zod";

/**
 * Validation error with formatted messages
 */
export class ValidationError extends Error {
  public readonly errors: Record<string, string[]>;

  constructor(zodError: ZodError) {
    const formattedErrors: Record<string, string[]> = {};

    zodError.errors.forEach((error) => {
      const path = error.path.join(".");
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(error.message);
    });

    const firstError = Object.values(formattedErrors)[0]?.[0] || "Validation failed";
    super(firstError);

    this.name = "ValidationError";
    this.errors = formattedErrors;
  }

  /**
   * Get all error messages as a flat array
   */
  getAllMessages(): string[] {
    return Object.values(this.errors).flat();
  }

  /**
   * Get first error message
   */
  getFirstMessage(): string {
    return this.getAllMessages()[0] || "Validation failed";
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): string[] {
    return this.errors[field] || [];
  }
}

/**
 * Validate data against a Zod schema
 * Throws ValidationError with formatted messages on failure
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

/**
 * Safely validate data against a Zod schema
 * Returns result object instead of throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and data or error
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
):
  | { success: true; data: z.infer<T>; error: null }
  | { success: false; data: null; error: ValidationError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, data: null, error: new ValidationError(error) };
    }
    throw error;
  }
}

/**
 * Validate partial data (useful for updates)
 * Only validates fields that are present
 */
export function validatePartial<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Partial<z.infer<T>> {
  const partialSchema = schema.partial();
  return validate(partialSchema, data);
}
