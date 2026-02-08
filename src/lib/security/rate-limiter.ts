/**
 * In-Memory Rate Limiter
 *
 * Implements sliding window rate limiting without external dependencies.
 * Uses in-memory storage (Map) - suitable for single-server deployments.
 *
 * For multi-server production, consider:
 * - Self-hosted Redis
 * - Upstash Redis (10k requests/day free tier)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is within rate limit
   *
   * @param identifier - Unique identifier (user ID, IP address, etc.)
   * @param maxRequests - Maximum number of requests allowed in window
   * @param windowMs - Time window in milliseconds
   * @returns Result with success flag and remaining requests
   */
  async limit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ success: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    // No entry or expired window - allow request
    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.storage.set(identifier, {
        count: 1,
        resetAt,
      });
      return {
        success: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }

    // Within window - check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Within window and under limit - increment count
    entry.count++;
    this.storage.set(identifier, entry);

    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   * Useful for testing or manual overrides
   */
  reset(identifier: string): void {
    this.storage.delete(identifier);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetAt) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval (useful for testing)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.storage.clear();
  }

  /**
   * Get current state for debugging
   */
  getStats(): {
    totalEntries: number;
    activeEntries: number;
  } {
    const now = Date.now();
    let activeCount = 0;

    for (const entry of this.storage.values()) {
      if (now <= entry.resetAt) {
        activeCount++;
      }
    }

    return {
      totalEntries: this.storage.size,
      activeEntries: activeCount,
    };
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new InMemoryRateLimiter();

/**
 * Rate limit configurations for different actions
 * Adjust these based on your application's needs
 */
export const RateLimits = {
  // Post operations
  createPost: {
    max: 10,
    windowMs: 60 * 60 * 1000, // 10 posts per hour
    message: "Too many posts created. Please try again in an hour.",
  },

  createComment: {
    max: 50,
    windowMs: 60 * 60 * 1000, // 50 comments per hour
    message: "Too many comments. Please slow down.",
  },

  toggleLike: {
    max: 100,
    windowMs: 60 * 60 * 1000, // 100 likes per hour
    message: "Too many like actions. Please slow down.",
  },

  deletePost: {
    max: 20,
    windowMs: 60 * 60 * 1000, // 20 deletions per hour
    message: "Too many deletions. Please slow down.",
  },

  // User operations
  toggleFollow: {
    max: 20,
    windowMs: 60 * 60 * 1000, // 20 follow/unfollow per hour
    message: "Too many follow actions. Please slow down.",
  },

  updateProfile: {
    max: 5,
    windowMs: 60 * 60 * 1000, // 5 profile updates per hour
    message: "Too many profile updates. Please try again later.",
  },

  // Auth operations (stricter limits)
  signIn: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
    message: "Too many login attempts. Please try again in 15 minutes.",
  },

  signUp: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 3 sign-ups per hour (per IP)
    message: "Too many sign-up attempts. Please try again later.",
  },

  // Password operations (very strict)
  resetPassword: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    message: "Too many password reset requests. Please try again later.",
  },

  changePassword: {
    max: 5,
    windowMs: 24 * 60 * 60 * 1000, // 5 changes per day
    message: "Too many password changes. Please try again tomorrow.",
  },
} as const;

/**
 * Helper function to check rate limit and throw error if exceeded
 *
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param limitConfig - Rate limit configuration
 * @throws Error if rate limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  limitConfig: (typeof RateLimits)[keyof typeof RateLimits]
): Promise<{ remaining: number; resetAt: number }> {
  const result = await rateLimiter.limit(identifier, limitConfig.max, limitConfig.windowMs);

  if (!result.success) {
    const resetIn = Math.ceil((result.resetAt - Date.now()) / 1000 / 60);
    throw new Error(
      `${limitConfig.message} Try again in ${resetIn} minute${resetIn !== 1 ? "s" : ""}.`
    );
  }

  return {
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}

/**
 * Get rate limit key for user-specific actions
 */
export function getUserRateLimitKey(action: string, userId: string): string {
  return `user:${userId}:${action}`;
}

/**
 * Get rate limit key for IP-based actions (auth, etc.)
 */
export function getIPRateLimitKey(action: string, ip: string): string {
  return `ip:${ip}:${action}`;
}
