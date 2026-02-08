import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InMemoryRateLimiter } from "@/lib/security/rate-limiter";

describe("InMemoryRateLimiter", () => {
  let rateLimiter: InMemoryRateLimiter;

  beforeEach(() => {
    rateLimiter = new InMemoryRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    rateLimiter.destroy();
    vi.useRealTimers();
  });

  describe("rate limiting", () => {
    it("should allow requests within limit", async () => {
      const result1 = await rateLimiter.limit("user-123", 5, 60000);
      const result2 = await rateLimiter.limit("user-123", 5, 60000);
      const result3 = await rateLimiter.limit("user-123", 5, 60000);

      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(4);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(3);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(2);
    });

    it("should block requests exceeding limit", async () => {
      // Make 5 requests (max)
      for (let i = 0; i < 5; i++) {
        await rateLimiter.limit("user-123", 5, 60000);
      }

      // 6th request should be blocked
      const result = await rateLimiter.limit("user-123", 5, 60000);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after time window", async () => {
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.limit("user-123", 5, 60000);
      }

      // Should be blocked
      const blocked = await rateLimiter.limit("user-123", 5, 60000);
      expect(blocked.success).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(61000);

      // Should be allowed again
      const allowed = await rateLimiter.limit("user-123", 5, 60000);
      expect(allowed.success).toBe(true);
      expect(allowed.remaining).toBe(4);
    });

    it("should isolate limits by identifier", async () => {
      // Exhaust limit for user-123
      for (let i = 0; i < 5; i++) {
        await rateLimiter.limit("user-123", 5, 60000);
      }

      // user-456 should still have full limit
      const result = await rateLimiter.limit("user-456", 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe("cleanup", () => {
    it("should clean up expired entries", async () => {
      // Create entry
      await rateLimiter.limit("user-123", 5, 60000);

      // Advance time past expiry
      vi.advanceTimersByTime(65000);

      // Trigger cleanup (runs every minute)
      vi.advanceTimersByTime(5000);

      // Entry should be cleaned, new request should start fresh
      const result = await rateLimiter.limit("user-123", 5, 60000);
      expect(result.remaining).toBe(4);
    });
  });

  describe("edge cases", () => {
    it("should handle limit of 1", async () => {
      const result1 = await rateLimiter.limit("user-123", 1, 60000);
      const result2 = await rateLimiter.limit("user-123", 1, 60000);

      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(0);
      expect(result2.success).toBe(false);
    });

    it("should handle very short windows", async () => {
      const result1 = await rateLimiter.limit("user-123", 2, 100);

      vi.advanceTimersByTime(50);
      const result2 = await rateLimiter.limit("user-123", 2, 100);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      vi.advanceTimersByTime(60);
      const result3 = await rateLimiter.limit("user-123", 2, 100);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(1);
    });

    it("should handle concurrent requests for same identifier", async () => {
      const promises = Array.from({ length: 10 }, () => rateLimiter.limit("user-123", 5, 60000));

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.success);
      const blocked = results.filter((r) => !r.success);

      expect(successful).toHaveLength(5);
      expect(blocked).toHaveLength(5);
    });
  });
});
