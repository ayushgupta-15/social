import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getUserProfile, toggleFollow, updateProfile } from "@/actions/user.action";
import { container } from "@/core/infrastructure/di/container";
import type { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import { createMockUserRepository } from "../../helpers/mock-repositories";
import { mockUserProfile } from "../../helpers/mock-data";
import * as rateLimiter from "@/lib/security/rate-limiter";
import { NotFoundError } from "@/lib/errors/app-error";

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    })
  ),
}));

describe("User Actions Integration Tests", () => {
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();

    vi.spyOn(container, "resolve").mockReturnValue(mockUserRepository);

    vi.spyOn(rateLimiter.rateLimiter, "limit").mockResolvedValue({
      success: true,
      remaining: 9,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getUserProfile", () => {
    it("should retrieve user profile by username", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUserProfile);

      const result = await getUserProfile("testuser");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserProfile);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("testuser", "test-user-id");
    });

    it("should handle non-existent users", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

      const result = await getUserProfile("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should work for unauthenticated users", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUserProfile);

      const result = await getUserProfile("testuser");

      expect(result.success).toBe(true);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("testuser", null);
    });

    it("should validate username format", async () => {
      const result = await getUserProfile("");

      expect(result.success).toBe(false);
      expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
    });
  });

  describe("toggleFollow", () => {
    it("should follow user successfully", async () => {
      const mockResult = {
        isFollowing: true,
        followersCount: 11,
      };

      vi.mocked(mockUserRepository.toggleFollow).mockResolvedValue(mockResult);

      const result = await toggleFollow("user-456");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockUserRepository.toggleFollow).toHaveBeenCalledWith("test-user-id", "user-456");
    });

    it("should prevent following yourself", async () => {
      const result = await toggleFollow("test-user-id");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot follow yourself");
      expect(mockUserRepository.toggleFollow).not.toHaveBeenCalled();
    });

    it("should enforce rate limiting", async () => {
      vi.spyOn(rateLimiter.rateLimiter, "limit").mockResolvedValue({
        success: false,
        remaining: 0,
      });

      const result = await toggleFollow("user-456");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Too many requests");
      expect(mockUserRepository.toggleFollow).not.toHaveBeenCalled();
    });

    it("should require authentication", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      const result = await toggleFollow("user-456");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockUserRepository.toggleFollow).not.toHaveBeenCalled();
    });

    it("should handle non-existent users", async () => {
      vi.mocked(mockUserRepository.toggleFollow).mockRejectedValue(
        new NotFoundError("User", "user-999")
      );

      const result = await toggleFollow("user-999");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      const updates = {
        bio: "Updated bio",
        location: "New City",
        website: "https://newsite.com",
      };

      const updatedProfile = {
        ...mockUserProfile,
        ...updates,
      };

      vi.mocked(mockUserRepository.update).mockResolvedValue(updatedProfile);

      const result = await updateProfile(updates);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
      expect(mockUserRepository.update).toHaveBeenCalledWith("test-user-id", updates);
    });

    it("should validate bio length", async () => {
      const result = await updateProfile({
        bio: "a".repeat(501),
      });

      expect(result.success).toBe(false);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("should validate website URL format", async () => {
      const result = await updateProfile({
        website: "not-a-url",
      });

      expect(result.success).toBe(false);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("should allow partial updates", async () => {
      const updates = { bio: "Just updating bio" };

      vi.mocked(mockUserRepository.update).mockResolvedValue({
        ...mockUserProfile,
        ...updates,
      });

      const result = await updateProfile(updates);

      expect(result.success).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith("test-user-id", updates);
    });

    it("should require authentication", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      const result = await updateProfile({ bio: "New bio" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("should sanitize input data", async () => {
      const updates = {
        bio: "  Bio with whitespace  ",
        location: "  City  ",
      };

      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUserProfile);

      await updateProfile(updates);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        "test-user-id",
        expect.objectContaining({
          bio: "Bio with whitespace",
          location: "City",
        })
      );
    });
  });
});
