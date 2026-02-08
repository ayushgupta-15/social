"use client";

import { useOptimistic, useTransition } from "react";
import { HeartIcon, MessageCircleIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/actions/post.action";
import { signIn } from "next-auth/react";

interface PostActionsProps {
  postId: string;
  initialLikeCount: number;
  initialHasLiked: boolean;
  commentCount: number;
  showComments: boolean;
  onToggleComments: () => void;
  isAuthenticated: boolean;
}

/**
 * PostActions Component
 *
 * Handles like and comment actions with React 19's useOptimistic hook
 * for instant UI feedback without waiting for server response.
 */
export function PostActions({
  postId,
  initialLikeCount,
  initialHasLiked,
  commentCount,
  showComments,
  onToggleComments,
  isAuthenticated,
}: PostActionsProps) {
  const [isPending, startTransition] = useTransition();

  // Optimistic state for like status
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(
    initialHasLiked,
    (_, newValue: boolean) => newValue
  );

  // Optimistic state for like count
  const [optimisticLikeCount, setOptimisticLikeCount] = useOptimistic(
    initialLikeCount,
    (state, delta: number) => state + delta
  );

  const handleLike = async () => {
    if (!isAuthenticated) {
      signIn();
      return;
    }

    // Calculate delta for optimistic update
    const delta = optimisticLiked ? -1 : 1;

    startTransition(async () => {
      // Update UI immediately (optimistic)
      setOptimisticLiked(!optimisticLiked);
      setOptimisticLikeCount(delta);

      try {
        // Server action
        await toggleLike(postId);
      } catch (error) {
        // React will automatically revert optimistic updates on error
        console.error("Failed to toggle like:", error);
      }
    });
  };

  return (
    <div className="flex items-center pt-2 space-x-4">
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`gap-2 transition-colors ${
          optimisticLiked
            ? "text-red-500 hover:text-red-600"
            : "text-muted-foreground hover:text-red-500"
        }`}
        onClick={handleLike}
        disabled={isPending}
        aria-label={optimisticLiked ? "Unlike post" : "Like post"}
      >
        {isPending ? (
          <Loader2Icon className="size-5 animate-spin" />
        ) : (
          <HeartIcon
            className={`size-5 transition-all ${optimisticLiked ? "fill-current scale-110" : ""}`}
          />
        )}
        <span className="font-medium">{optimisticLikeCount}</span>
      </Button>

      {/* Comment Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`gap-2 transition-colors ${
          showComments
            ? "text-blue-500 hover:text-blue-600"
            : "text-muted-foreground hover:text-blue-500"
        }`}
        onClick={onToggleComments}
        aria-label={showComments ? "Hide comments" : "Show comments"}
      >
        <MessageCircleIcon
          className={`size-5 transition-all ${showComments ? "fill-current scale-110" : ""}`}
        />
        <span className="font-medium">{commentCount}</span>
      </Button>
    </div>
  );
}
