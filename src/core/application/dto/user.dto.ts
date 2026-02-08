import { z } from "zod";

/**
 * DTO for updating user profile
 */
export const UpdateProfileDto = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  image: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;

/**
 * User profile with follower/following counts
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  image: string | null;
  location: string | null;
  website: string | null;
  createdAt: Date;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

/**
 * Minimal user info for suggestions
 */
export interface UserSuggestion {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
}

/**
 * Follow operation result
 */
export interface FollowResult {
  following: boolean;
  followerCount: number;
}
