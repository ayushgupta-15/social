import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PrismaPostRepository } from "@/core/infrastructure/database/prisma/repositories/prisma-post.repository";
import { prisma } from "@/lib/prisma";
import { createMockPost, createMockComment } from "../../helpers/mock-data";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("PrismaPostRepository Integration Tests", () => {
  let repository: PrismaPostRepository;

  beforeEach(() => {
    repository = new PrismaPostRepository();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("create", () => {
    it("should create a post with proper data transformation", async () => {
      const input = {
        content: "Test post",
        image: "",
        authorId: "user-123",
      };

      const mockDbPost = {
        id: "post-123",
        content: "Test post",
        image: null,
        createdAt: new Date(),
        authorId: "user-123",
        author: {
          id: "user-123",
          name: "Test User",
          username: "testuser",
          image: "/avatar.png",
        },
        _count: {
          likes: 0,
          comments: 0,
        },
        likes: [],
      };

      vi.mocked(prisma.post.create).mockResolvedValue(mockDbPost as any);

      const result = await repository.create(input);

      expect(result).toMatchObject({
        id: "post-123",
        content: "Test post",
        likeCount: 0,
        commentCount: 0,
        hasLiked: false,
      });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          content: input.content,
          image: input.image || null,
          authorId: input.authorId,
        },
        select: expect.any(Object),
      });
    });

    it("should handle image URLs correctly", async () => {
      const input = {
        content: "Post with image",
        image: "https://example.com/image.jpg",
        authorId: "user-123",
      };

      const mockDbPost = {
        ...createMockPost(),
        image: "https://example.com/image.jpg",
      };

      vi.mocked(prisma.post.create).mockResolvedValue(mockDbPost as any);

      await repository.create(input);

      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            image: "https://example.com/image.jpg",
          }),
        })
      );
    });
  });

  describe("getFeed", () => {
    it("should retrieve feed with cursor pagination", async () => {
      const mockPosts = Array.from({ length: 11 }, (_, i) => ({
        id: `post-${i + 1}`,
        content: `Post ${i + 1}`,
        image: null,
        createdAt: new Date(),
        authorId: "user-123",
        author: {
          id: "user-123",
          name: "Test User",
          username: "testuser",
          image: null,
        },
        _count: {
          likes: i,
          comments: i % 2,
        },
        likes: [],
      }));

      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

      const result = await repository.getFeed({
        currentUserId: "user-123",
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe("post-10");

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        take: 11,
        orderBy: { createdAt: "desc" },
        select: expect.any(Object),
      });
    });

    it("should handle no next page scenario", async () => {
      const mockPosts = Array.from({ length: 5 }, (_, i) => ({
        id: `post-${i + 1}`,
        content: `Post ${i + 1}`,
        image: null,
        createdAt: new Date(),
        authorId: "user-123",
        author: {
          id: "user-123",
          name: "Test User",
          username: "testuser",
          image: null,
        },
        _count: { likes: 0, comments: 0 },
        likes: [],
      }));

      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

      const result = await repository.getFeed({
        limit: 10,
      });

      expect(result.items).toHaveLength(5);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should apply cursor when provided", async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await repository.getFeed({
        cursor: "post-10",
        limit: 10,
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: "post-10" },
          skip: 1,
        })
      );
    });
  });

  describe("toggleLike", () => {
    it("should create like when not exists", async () => {
      const mockLikeResult = {
        liked: true,
        likeCount: 6,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          like: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: "like-123" }),
          },
          post: {
            findUnique: vi.fn().mockResolvedValue({
              _count: { likes: 6 },
            }),
          },
          notification: {
            create: vi.fn(),
          },
        });
      });

      const result = await repository.toggleLike("post-123", "user-456");

      expect(result.liked).toBe(true);
    });

    it("should delete like when exists", async () => {
      const mockLikeResult = {
        liked: false,
        likeCount: 4,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          like: {
            findUnique: vi.fn().mockResolvedValue({ id: "like-123" }),
            delete: vi.fn().mockResolvedValue({ id: "like-123" }),
          },
          post: {
            findUnique: vi.fn().mockResolvedValue({
              _count: { likes: 4 },
            }),
          },
        });
      });

      const result = await repository.toggleLike("post-123", "user-456");

      expect(result.liked).toBe(false);
    });

    it("should create notification when liking", async () => {
      const mockNotificationCreate = vi.fn();

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          like: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: "like-123" }),
          },
          post: {
            findUnique: vi.fn().mockResolvedValue({
              id: "post-123",
              authorId: "author-123",
              _count: { likes: 1 },
            }),
          },
          notification: {
            create: mockNotificationCreate,
          },
        });
      });

      await repository.toggleLike("post-123", "user-456");

      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "LIKE",
          userId: "author-123",
          creatorId: "user-456",
          postId: "post-123",
        }),
      });
    });
  });

  describe("createComment", () => {
    it("should create comment with notification", async () => {
      const mockComment = createMockComment();

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          comment: {
            create: vi.fn().mockResolvedValue({
              ...mockComment,
              author: mockComment.author,
            }),
          },
          post: {
            findUnique: vi.fn().mockResolvedValue({
              authorId: "author-123",
            }),
          },
          notification: {
            create: vi.fn(),
          },
        });
      });

      const result = await repository.createComment({
        postId: "post-123",
        content: "Test comment",
        authorId: "user-456",
      });

      expect(result).toMatchObject({
        content: "Test comment",
      });
    });
  });
});
