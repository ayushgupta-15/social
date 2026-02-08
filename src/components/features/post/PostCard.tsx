"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";
import Link from "next/link";
import Image from "next/image";

interface PostAuthor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: PostAuthor;
}

interface PostCardProps {
  post: {
    id: string;
    content: string | null;
    image: string | null;
    createdAt: Date;
    author: PostAuthor;
    _count: {
      likes: number;
      comments: number;
    };
    likes?: Array<{ userId: string }>;
    comments: Comment[];
  };
  dbUserId: string | null;
  onDelete?: (postId: string) => void;
}

/**
 * PostCard Component (Modernized)
 *
 * Features:
 * - React 19 useOptimistic for instant like updates
 * - Extracted PostActions component
 * - Extracted CommentSection component
 * - Better organization and readability
 * - Optimized image loading with Next.js Image
 */
export function PostCard({ post, dbUserId, onDelete }: PostCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthenticated = !!session?.user;
  const isAuthor = dbUserId === post.author.id;
  const hasLiked = post.likes?.some((like) => like.userId === dbUserId) ?? false;

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      // Import dynamically to avoid circular dependencies
      const { deletePost } = await import("@/actions/post.action");
      const result = await deletePost(post.id);

      if (result.success) {
        onDelete?.(post.id);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Post Header */}
          <div className="flex space-x-3 sm:space-x-4">
            <Link href={`/profile/${post.author.username ?? post.author.id}`}>
              <Avatar className="size-8 sm:size-10 ring-2 ring-border transition-transform hover:scale-105">
                <AvatarImage
                  src={post.author.image ?? "/avatar.png"}
                  alt={post.author.name ?? "User avatar"}
                />
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                  <Link
                    href={`/profile/${post.author.username ?? post.author.id}`}
                    className="font-semibold truncate hover:underline"
                  >
                    {post.author.name ?? post.author.username ?? post.author.id}
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link
                      href={`/profile/${post.author.username ?? post.author.id}`}
                      className="hover:underline"
                    >
                      @{post.author.username ?? post.author.id}
                    </Link>
                    <span>•</span>
                    <time dateTime={new Date(post.createdAt).toISOString()}>
                      {formatDistanceToNow(new Date(post.createdAt))} ago
                    </time>
                  </div>
                </div>

                {/* Delete Button (only for post author) */}
                {isAuthor && (
                  <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                )}
              </div>

              {/* Post Content */}
              {post.content && (
                <p className="mt-2 text-sm sm:text-base text-foreground break-words whitespace-pre-wrap">
                  {post.content}
                </p>
              )}
            </div>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="rounded-lg overflow-hidden bg-muted">
              <Image
                src={post.image}
                alt="Post image"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
                loading="lazy"
                quality={85}
              />
            </div>
          )}

          {/* Post Actions (Like & Comment) */}
          <PostActions
            postId={post.id}
            initialLikeCount={post._count.likes}
            initialHasLiked={hasLiked}
            commentCount={post._count.comments}
            showComments={showComments}
            onToggleComments={() => setShowComments((prev) => !prev)}
            isAuthenticated={isAuthenticated}
          />

          {/* Comments Section */}
          {showComments && (
            <CommentSection
              postId={post.id}
              comments={post.comments}
              isAuthenticated={isAuthenticated}
              currentUserImage={session?.user?.image}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PostCard;
