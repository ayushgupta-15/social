import { z } from "zod";

/**
 * Schema for updating user profile
 * All fields are optional (partial update)
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(100, "Name is too long (maximum 100 characters)")
    .trim()
    .optional(),
  bio: z
    .string()
    .max(500, "Bio is too long (maximum 500 characters)")
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  location: z
    .string()
    .max(100, "Location is too long (maximum 100 characters)")
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  website: z
    .string()
    .url("Invalid website URL format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  image: z
    .string()
    .url("Invalid image URL format")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema for getting user profile by username
 */
export const getUserProfileSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username is too long").trim(),
});

export type GetUserProfileInput = z.infer<typeof getUserProfileSchema>;

/**
 * Schema for toggling follow
 */
export const toggleFollowSchema = z.object({
  userId: z.string().cuid("Invalid user ID format"),
});

export type ToggleFollowInput = z.infer<typeof toggleFollowSchema>;

/**
 * Schema for checking if following
 */
export const isFollowingSchema = z.object({
  userId: z.string().cuid("Invalid user ID format"),
});

export type IsFollowingInput = z.infer<typeof isFollowingSchema>;
