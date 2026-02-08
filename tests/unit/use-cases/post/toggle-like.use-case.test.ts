import { describe, it, expect, beforeEach, vi } from "vitest";
import { ToggleLikeUseCase } from "@/core/application/use-cases/post/toggle-like.use-case";
import type { IPostRepository } from "@/core/domain/repositories/post.repository.interface";
import { createMockPostRepository } from "../../../helpers/mock-repositories";
import { NotFoundError, UnauthorizedError } from "@/lib/errors/app-error";

describe("ToggleLikeUseCase", () => {
  let useCase: ToggleLikeUseCase;
  let mockPostRepository: IPostRepository;

  beforeEach(() => {
    mockPostRepository = createMockPostRepository();
    useCase = new ToggleLikeUseCase(mockPostRepository);
  });

  describe("successful like toggle", () => {
    it("should like a post successfully", async () => {
      const mockResult = {
        liked: true,
        likeCount: 6,
      };

      vi.mocked(mockPostRepository.toggleLike).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        postId: "post-123",
        userId: "user-123",
      });

      expect(result).toEqual(mockResult);
      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(6);
      expect(mockPostRepository.toggleLike).toHaveBeenCalledWith("post-123", "user-123");
    });

    it("should unlike a post successfully", async () => {
      const mockResult = {
        liked: false,
        likeCount: 4,
      };

      vi.mocked(mockPostRepository.toggleLike).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        postId: "post-123",
        userId: "user-123",
      });

      expect(result).toEqual(mockResult);
      expect(result.liked).toBe(false);
      expect(result.likeCount).toBe(4);
    });

    it("should handle like count reaching zero", async () => {
      const mockResult = {
        liked: false,
        likeCount: 0,
      };

      vi.mocked(mockPostRepository.toggleLike).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        postId: "post-123",
        userId: "user-123",
      });

      expect(result.likeCount).toBe(0);
    });
  });

  describe("validation errors", () => {
    it("should throw error for invalid postId", async () => {
      await expect(
        useCase.execute({
          postId: "",
          userId: "user-123",
        })
      ).rejects.toThrow();

      expect(mockPostRepository.toggleLike).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when userId is missing", async () => {
      await expect(
        useCase.execute({
          postId: "post-123",
          userId: "",
        })
      ).rejects.toThrow();

      expect(mockPostRepository.toggleLike).not.toHaveBeenCalled();
    });
  });

  describe("error scenarios", () => {
    it("should throw NotFoundError when post does not exist", async () => {
      vi.mocked(mockPostRepository.toggleLike).mockRejectedValue(
        new NotFoundError("Post", "post-999")
      );

      await expect(
        useCase.execute({
          postId: "post-999",
          userId: "user-123",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle database errors", async () => {
      vi.mocked(mockPostRepository.toggleLike).mockRejectedValue(new Error("Transaction failed"));

      await expect(
        useCase.execute({
          postId: "post-123",
          userId: "user-123",
        })
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("idempotency", () => {
    it("should be idempotent when called multiple times", async () => {
      const mockResult = {
        liked: true,
        likeCount: 6,
      };

      vi.mocked(mockPostRepository.toggleLike).mockResolvedValue(mockResult);

      const result1 = await useCase.execute({
        postId: "post-123",
        userId: "user-123",
      });

      const result2 = await useCase.execute({
        postId: "post-123",
        userId: "user-123",
      });

      expect(result1).toEqual(result2);
      expect(mockPostRepository.toggleLike).toHaveBeenCalledTimes(2);
    });
  });
});
