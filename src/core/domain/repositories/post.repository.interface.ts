import type {
  CreatePostInput,
  PostWithDetails,
  GetFeedParams,
  LikeResult,
  CreateCommentInput,
  CommentWithAuthor,
} from "@/core/application/dto/post.dto";
import type { PaginatedResult, PaginationParams } from "@/core/application/dto/pagination.dto";

/**
 * Post Repository Interface
 *
 * Defines all post-related data operations following the Repository Pattern.
 * This abstraction enables:
 * - Easy testing with mock implementations
 * - Swapping database implementations (Dependency Inversion Principle)
 * - Clear separation of business logic from data access
 */
export interface IPostRepository {
  /**
   * Create a new post
   */
  create(data: CreatePostInput): Promise<PostWithDetails>;

  /**
   * Find a post by ID with all details
   */
  findById(id: string, currentUserId?: string | null): Promise<PostWithDetails | null>;

  /**
   * Get paginated feed of all posts
   */
  getFeed(params: GetFeedParams): Promise<PaginatedResult<PostWithDetails>>;

  /**
   * Get paginated posts by a specific user
   */
  getUserPosts(
    userId: string,
    params: PaginationParams & { currentUserId?: string | null }
  ): Promise<PaginatedResult<PostWithDetails>>;

  /**
   * Get posts liked by a specific user
   */
  getUserLikedPosts(
    userId: string,
    params: PaginationParams & { currentUserId?: string | null }
  ): Promise<PaginatedResult<PostWithDetails>>;

  /**
   * Delete a post by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Toggle like on a post (like if not liked, unlike if already liked)
   */
  toggleLike(postId: string, userId: string): Promise<LikeResult>;

  /**
   * Check if a user has liked a post
   */
  hasUserLiked(postId: string, userId: string): Promise<boolean>;

  /**
   * Get comments for a post
   */
  getComments(
    postId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<CommentWithAuthor>>;

  /**
   * Create a comment on a post
   */
  createComment(data: CreateCommentInput): Promise<CommentWithAuthor>;

  /**
   * Check if post exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get post author ID
   */
  getAuthorId(postId: string): Promise<string | null>;
}
