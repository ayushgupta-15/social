import type {
  UserProfile,
  UserSuggestion,
  UpdateProfileInput,
  FollowResult,
} from "@/core/application/dto/user.dto";

/**
 * User Repository Interface
 *
 * Defines all user-related data operations.
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserProfile | null>;

  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<UserProfile | null>;

  /**
   * Find user by email
   */
  findByEmail(
    email: string
  ): Promise<{ id: string; email: string; passwordHash: string | null } | null>;

  /**
   * Check if username exists
   */
  existsByUsername(username: string): Promise<boolean>;

  /**
   * Check if email exists
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Find usernames by prefix (for unique username generation)
   */
  findUsernamesByPrefix(prefix: string, limit: number): Promise<Array<{ username: string | null }>>;

  /**
   * Update user profile
   */
  updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile>;

  /**
   * Get random user suggestions (excluding current user and already followed)
   */
  getRandomSuggestions(currentUserId: string, limit: number): Promise<UserSuggestion[]>;

  /**
   * Toggle follow relationship
   */
  toggleFollow(followerId: string, followingId: string): Promise<FollowResult>;

  /**
   * Check if user is following another user
   */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get follower count
   */
  getFollowerCount(userId: string): Promise<number>;

  /**
   * Get following count
   */
  getFollowingCount(userId: string): Promise<number>;

  /**
   * Create a new user (for registration)
   */
  create(data: {
    email: string;
    username: string;
    name: string;
    passwordHash?: string;
  }): Promise<{ id: string; email: string; username: string | null }>;
}
