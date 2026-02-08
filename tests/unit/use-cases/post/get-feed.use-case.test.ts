import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetFeedUseCase } from "@/core/application/use-cases/post/get-feed.use-case";
import type { IPostRepository } from "@/core/domain/repositories/post.repository.interface";
import { createMockPostRepository } from "../../../helpers/mock-repositories";
import { createMockPosts } from "../../../helpers/mock-data";

describe("GetFeedUseCase", () => {
  let useCase: GetFeedUseCase;
  let mockPostRepository: IPostRepository;

  beforeEach(() => {
    mockPostRepository = createMockPostRepository();
    useCase = new GetFeedUseCase(mockPostRepository);
  });

  describe("successful feed retrieval", () => {
    it("should return paginated feed with default limit", async () => {
      const mockPosts = createMockPosts(10);
      const mockResult = {
        items: mockPosts,
        nextCursor: "post-10",
        hasNextPage: true,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        currentUserId: "user-123",
      });

      expect(result).toEqual(mockResult);
      expect(mockPostRepository.getFeed).toHaveBeenCalledWith({
        currentUserId: "user-123",
        limit: 10,
        cursor: undefined,
      });
    });

    it("should respect custom limit parameter", async () => {
      const mockPosts = createMockPosts(20);
      const mockResult = {
        items: mockPosts,
        nextCursor: "post-20",
        hasNextPage: false,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        currentUserId: "user-123",
        limit: 20,
      });

      expect(result.items).toHaveLength(20);
      expect(mockPostRepository.getFeed).toHaveBeenCalledWith({
        currentUserId: "user-123",
        limit: 20,
        cursor: undefined,
      });
    });

    it("should handle cursor-based pagination", async () => {
      const mockPosts = createMockPosts(10);
      const mockResult = {
        items: mockPosts,
        nextCursor: "post-20",
        hasNextPage: true,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        currentUserId: "user-123",
        cursor: "post-10",
        limit: 10,
      });

      expect(result).toEqual(mockResult);
      expect(mockPostRepository.getFeed).toHaveBeenCalledWith({
        currentUserId: "user-123",
        limit: 10,
        cursor: "post-10",
      });
    });

    it("should work without currentUserId (unauthenticated)", async () => {
      const mockPosts = createMockPosts(10);
      const mockResult = {
        items: mockPosts,
        nextCursor: null,
        hasNextPage: false,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await useCase.execute({});

      expect(result).toEqual(mockResult);
      expect(mockPostRepository.getFeed).toHaveBeenCalledWith({
        currentUserId: undefined,
        limit: 10,
        cursor: undefined,
      });
    });
  });

  describe("empty feed scenarios", () => {
    it("should return empty array when no posts exist", async () => {
      const mockResult = {
        items: [],
        nextCursor: null,
        hasNextPage: false,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        currentUserId: "user-123",
      });

      expect(result.items).toHaveLength(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should indicate no next page when fewer items than limit", async () => {
      const mockPosts = createMockPosts(5);
      const mockResult = {
        items: mockPosts,
        nextCursor: null,
        hasNextPage: false,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        currentUserId: "user-123",
        limit: 10,
      });

      expect(result.hasNextPage).toBe(false);
      expect(result.items).toHaveLength(5);
    });
  });

  describe("validation", () => {
    it("should enforce maximum limit of 50", async () => {
      await expect(
        useCase.execute({
          currentUserId: "user-123",
          limit: 100,
        })
      ).rejects.toThrow();

      expect(mockPostRepository.getFeed).not.toHaveBeenCalled();
    });

    it("should reject negative limit", async () => {
      await expect(
        useCase.execute({
          currentUserId: "user-123",
          limit: -5,
        })
      ).rejects.toThrow();

      expect(mockPostRepository.getFeed).not.toHaveBeenCalled();
    });

    it("should reject zero limit", async () => {
      await expect(
        useCase.execute({
          currentUserId: "user-123",
          limit: 0,
        })
      ).rejects.toThrow();

      expect(mockPostRepository.getFeed).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should propagate database errors", async () => {
      vi.mocked(mockPostRepository.getFeed).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        useCase.execute({
          currentUserId: "user-123",
        })
      ).rejects.toThrow("Database connection failed");
    });
  });
});
