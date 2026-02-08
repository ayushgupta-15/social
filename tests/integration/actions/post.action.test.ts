import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createPost, getPosts, toggleLike, createComment } from "@/actions/post.action";
import { container } from "@/core/infrastructure/di/container";
import type { IPostRepository } from "@/core/domain/repositories/post.repository.interface";
import { createMockPostRepository } from "../../helpers/mock-repositories";
import { createMockPost, createMockPosts, createMockComment } from "../../helpers/mock-data";
import * as rateLimiter from "@/lib/security/rate-limiter";

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    },
    status: "authenticated",
  }),
}));

// Mock server-side auth
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

describe("Post Actions Integration Tests", () => {
  let mockPostRepository: IPostRepository;

  beforeEach(() => {
    mockPostRepository = createMockPostRepository();

    // Mock container.resolve to return our mock repository
    vi.spyOn(container, "resolve").mockReturnValue(mockPostRepository);

    // Mock rate limiter to always allow
    vi.spyOn(rateLimiter.rateLimiter, "limit").mockResolvedValue({
      success: true,
      remaining: 9,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPost", () => {
    it("should create a post successfully", async () => {
      const mockPost = createMockPost({
        id: "post-123",
        content: "Test post content",
      });

      vi.mocked(mockPostRepository.create).mockResolvedValue(mockPost);

      const formData = new FormData();
      formData.append("content", "Test post content");
      formData.append("image", "");

      const result = await createPost(formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPost);
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Test post content",
          authorId: "test-user-id",
        })
      );
    });

    it("should enforce rate limiting", async () => {
      vi.spyOn(rateLimiter.rateLimiter, "limit").mockResolvedValue({
        success: false,
        remaining: 0,
      });

      const formData = new FormData();
      formData.append("content", "Test content");
      formData.append("image", "");

      const result = await createPost(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Too many requests");
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should validate content length", async () => {
      const formData = new FormData();
      formData.append("content", "a".repeat(5001));
      formData.append("image", "");

      const result = await createPost(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should reject empty content", async () => {
      const formData = new FormData();
      formData.append("content", "");
      formData.append("image", "");

      const result = await createPost(formData);

      expect(result.success).toBe(false);
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should validate image URL format", async () => {
      const formData = new FormData();
      formData.append("content", "Valid content");
      formData.append("image", "not-a-url");

      const result = await createPost(formData);

      expect(result.success).toBe(false);
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      vi.mocked(mockPostRepository.create).mockRejectedValue(new Error("Database error"));

      const formData = new FormData();
      formData.append("content", "Test content");
      formData.append("image", "");

      const result = await createPost(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getPosts", () => {
    it("should retrieve posts with pagination", async () => {
      const mockPosts = createMockPosts(10);
      const mockResult = {
        items: mockPosts,
        nextCursor: "post-10",
        hasNextPage: true,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await getPosts({ limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(10);
      expect(result.data?.hasNextPage).toBe(true);
      expect(mockPostRepository.getFeed).toHaveBeenCalledWith({
        currentUserId: "test-user-id",
        limit: 10,
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

      const result = await getPosts({ cursor: "post-10", limit: 10 });

      expect(result.success).toBe(true);
      expect(mockPostRepository.getFeed).toHaveBeenCalledWith({
        currentUserId: "test-user-id",
        cursor: "post-10",
        limit: 10,
      });
    });

    it("should enforce maximum limit", async () => {
      const result = await getPosts({ limit: 100 });

      expect(result.success).toBe(false);
      expect(mockPostRepository.getFeed).not.toHaveBeenCalled();
    });

    it("should work for unauthenticated users", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      const mockPosts = createMockPosts(5);
      const mockResult = {
        items: mockPosts,
        nextCursor: null,
        hasNextPage: false,
      };

      vi.mocked(mockPostRepository.getFeed).mockResolvedValue(mockResult);

      const result = await getPosts({ limit: 10 });

      expect(result.success).toBe(true);
    });
  });

  describe("toggleLike", () => {
    it("should toggle like successfully", async () => {
      const mockResult = {
        liked: true,
        likeCount: 6,
      };

      vi.mocked(mockPostRepository.toggleLike).mockResolvedValue(mockResult);

      const result = await toggleLike("post-123");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockPostRepository.toggleLike).toHaveBeenCalledWith("post-123", "test-user-id");
    });

    it("should enforce rate limiting", async () => {
      vi.spyOn(rateLimiter.rateLimiter, "limit").mockResolvedValue({
        success: false,
        remaining: 0,
      });

      const result = await toggleLike("post-123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Too many requests");
      expect(mockPostRepository.toggleLike).not.toHaveBeenCalled();
    });

    it("should require authentication", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      const result = await toggleLike("post-123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockPostRepository.toggleLike).not.toHaveBeenCalled();
    });

    it("should validate postId format", async () => {
      const result = await toggleLike("");

      expect(result.success).toBe(false);
      expect(mockPostRepository.toggleLike).not.toHaveBeenCalled();
    });
  });

  describe("createComment", () => {
    it("should create comment successfully", async () => {
      const mockComment = createMockComment({
        content: "Test comment",
      });

      vi.mocked(mockPostRepository.createComment).mockResolvedValue(mockComment);

      const result = await createComment({
        postId: "post-123",
        content: "Test comment",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockComment);
      expect(mockPostRepository.createComment).toHaveBeenCalledWith({
        postId: "post-123",
        content: "Test comment",
        authorId: "test-user-id",
      });
    });

    it("should enforce rate limiting", async () => {
      vi.spyOn(rateLimiter.rateLimiter, "limit").mockResolvedValue({
        success: false,
        remaining: 0,
      });

      const result = await createComment({
        postId: "post-123",
        content: "Test comment",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Too many requests");
      expect(mockPostRepository.createComment).not.toHaveBeenCalled();
    });

    it("should validate comment length", async () => {
      const result = await createComment({
        postId: "post-123",
        content: "a".repeat(1001),
      });

      expect(result.success).toBe(false);
      expect(mockPostRepository.createComment).not.toHaveBeenCalled();
    });

    it("should reject empty comments", async () => {
      const result = await createComment({
        postId: "post-123",
        content: "",
      });

      expect(result.success).toBe(false);
      expect(mockPostRepository.createComment).not.toHaveBeenCalled();
    });

    it("should require authentication", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      const result = await createComment({
        postId: "post-123",
        content: "Test comment",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockPostRepository.createComment).not.toHaveBeenCalled();
    });
  });
});
