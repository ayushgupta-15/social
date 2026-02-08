import { z } from "zod";

/**
 * Email validation with normalization
 */
const emailSchema = z.string().email("Invalid email address format").toLowerCase().trim();

/**
 * Password validation with strength requirements
 * Requires:
 * - At least 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password is too long (maximum 100 characters)")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

/**
 * Username validation
 * Allows alphanumeric characters, underscores, and hyphens
 * Must be 3-30 characters
 */
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username is too long (maximum 30 characters)")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
  .trim();

/**
 * Schema for user sign up
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long (maximum 100 characters)")
    .trim(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Schema for user sign in
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Schema for password reset request
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Schema for password reset
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Schema for changing password (when logged in)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Helper to validate password strength
 * Returns detailed feedback on password issues
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push("Password must be at least 8 characters long");
  }

  if (!/[a-z]/.test(password)) {
    issues.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    issues.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    issues.push("Password must contain at least one number");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
