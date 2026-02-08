import { describe, it, expect, beforeEach, vi } from "vitest";
import { FollowUserUseCase } from "@/core/application/use-cases/user/follow-user.use-case";
import type { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import { createMockUserRepository } from "../../../helpers/mock-repositories";
import { NotFoundError } from "@/lib/errors/app-error";

describe("FollowUserUseCase", () => {
  let useCase: FollowUserUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new FollowUserUseCase(mockUserRepository);
  });

  describe("successful follow/unfollow", () => {
    it("should follow a user successfully", async () => {
      const mockResult = {
        isFollowing: true,
        followersCount: 11,
      };

      vi.mocked(mockUserRepository.toggleFollow).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        followerId: "user-123",
        followingId: "user-456",
      });

      expect(result).toEqual(mockResult);
      expect(result.isFollowing).toBe(true);
      expect(result.followersCount).toBe(11);
      expect(mockUserRepository.toggleFollow).toHaveBeenCalledWith("user-123", "user-456");
    });

    it("should unfollow a user successfully", async () => {
      const mockResult = {
        isFollowing: false,
        followersCount: 9,
      };

      vi.mocked(mockUserRepository.toggleFollow).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        followerId: "user-123",
        followingId: "user-456",
      });

      expect(result).toEqual(mockResult);
      expect(result.isFollowing).toBe(false);
    });
  });

  describe("validation errors", () => {
    it("should throw error when trying to follow yourself", async () => {
      await expect(
        useCase.execute({
          followerId: "user-123",
          followingId: "user-123",
        })
      ).rejects.toThrow("Cannot follow yourself");

      expect(mockUserRepository.toggleFollow).not.toHaveBeenCalled();
    });

    it("should throw error for invalid followerId", async () => {
      await expect(
        useCase.execute({
          followerId: "",
          followingId: "user-456",
        })
      ).rejects.toThrow();

      expect(mockUserRepository.toggleFollow).not.toHaveBeenCalled();
    });

    it("should throw error for invalid followingId", async () => {
      await expect(
        useCase.execute({
          followerId: "user-123",
          followingId: "",
        })
      ).rejects.toThrow();

      expect(mockUserRepository.toggleFollow).not.toHaveBeenCalled();
    });
  });

  describe("error scenarios", () => {
    it("should throw NotFoundError when following user does not exist", async () => {
      vi.mocked(mockUserRepository.toggleFollow).mockRejectedValue(
        new NotFoundError("User", "user-999")
      );

      await expect(
        useCase.execute({
          followerId: "user-123",
          followingId: "user-999",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle database errors", async () => {
      vi.mocked(mockUserRepository.toggleFollow).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        useCase.execute({
          followerId: "user-123",
          followingId: "user-456",
        })
      ).rejects.toThrow("Database connection failed");
    });
  });
});
