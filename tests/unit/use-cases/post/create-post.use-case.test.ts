import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreatePostUseCase } from "@/core/application/use-cases/post/create-post.use-case";
import type { IPostRepository } from "@/core/domain/repositories/post.repository.interface";
import { createMockPostRepository } from "../../../helpers/mock-repositories";
import { createMockPost } from "../../../helpers/mock-data";
import { ValidationError } from "@/lib/validation/validator";

describe("CreatePostUseCase", () => {
  let useCase: CreatePostUseCase;
  let mockPostRepository: IPostRepository;

  beforeEach(() => {
    mockPostRepository = createMockPostRepository();
    useCase = new CreatePostUseCase(mockPostRepository);
  });

  describe("successful post creation", () => {
    it("should create a post with content only", async () => {
      const input = {
        content: "This is a test post",
        image: "",
        authorId: "user-123",
      };

      const mockPost = createMockPost({
        id: "post-123",
        content: input.content,
        authorId: input.authorId,
      });

      vi.mocked(mockPostRepository.create).mockResolvedValue(mockPost);

      const result = await useCase.execute(input);

      expect(result).toEqual(mockPost);
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        content: input.content,
        image: input.image,
        authorId: input.authorId,
      });
      expect(mockPostRepository.create).toHaveBeenCalledTimes(1);
    });

    it("should create a post with content and image", async () => {
      const input = {
        content: "Post with image",
        image: "https://example.com/image.jpg",
        authorId: "user-123",
      };

      const mockPost = createMockPost({
        content: input.content,
        image: input.image,
      });

      vi.mocked(mockPostRepository.create).mockResolvedValue(mockPost);

      const result = await useCase.execute(input);

      expect(result).toEqual(mockPost);
      expect(result.image).toBe(input.image);
    });

    it("should trim whitespace from content", async () => {
      const input = {
        content: "  Content with whitespace  ",
        image: "",
        authorId: "user-123",
      };

      const mockPost = createMockPost({
        content: "Content with whitespace",
      });

      vi.mocked(mockPostRepository.create).mockResolvedValue(mockPost);

      await useCase.execute(input);

      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Content with whitespace",
        })
      );
    });
  });

  describe("validation errors", () => {
    it("should throw ValidationError for empty content", async () => {
      const input = {
        content: "",
        image: "",
        authorId: "user-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for whitespace-only content", async () => {
      const input = {
        content: "   ",
        image: "",
        authorId: "user-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for content exceeding max length", async () => {
      const input = {
        content: "a".repeat(5001),
        image: "",
        authorId: "user-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for invalid image URL", async () => {
      const input = {
        content: "Valid content",
        image: "not-a-valid-url",
        authorId: "user-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for missing authorId", async () => {
      const input = {
        content: "Valid content",
        image: "",
        authorId: "",
      };

      await expect(useCase.execute(input)).rejects.toThrow();
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle exactly 5000 characters", async () => {
      const input = {
        content: "a".repeat(5000),
        image: "",
        authorId: "user-123",
      };

      const mockPost = createMockPost({ content: input.content });
      vi.mocked(mockPostRepository.create).mockResolvedValue(mockPost);

      const result = await useCase.execute(input);

      expect(result).toBeDefined();
      expect(mockPostRepository.create).toHaveBeenCalled();
    });

    it("should handle special characters in content", async () => {
      const input = {
        content: "Test with emojis 🚀 and symbols @#$%",
        image: "",
        authorId: "user-123",
      };

      const mockPost = createMockPost({ content: input.content });
      vi.mocked(mockPostRepository.create).mockResolvedValue(mockPost);

      const result = await useCase.execute(input);

      expect(result.content).toBe(input.content);
    });

    it("should handle database errors gracefully", async () => {
      const input = {
        content: "Valid content",
        image: "",
        authorId: "user-123",
      };

      vi.mocked(mockPostRepository.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(useCase.execute(input)).rejects.toThrow("Database connection failed");
    });
  });
});
