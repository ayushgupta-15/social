"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "@/actions/post.action";
import { toast } from "react-hot-toast";

/**
 * Hook to add a comment to a post
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Error handling
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { postId: string; content: string }) => {
      const result = await createComment(data);
      return result;
    },

    onMutate: async (newComment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      type PostsCache = {
        pages: Array<{
          items: Array<{
            id: string;
            _count: { comments: number };
          }>;
        }>;
      };

      const previousPosts = queryClient.getQueryData<PostsCache>(["posts"]);

      // Optimistically update comment count
      queryClient.setQueryData<PostsCache | undefined>(["posts"], (old) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((post) => {
              if (post.id === newComment.postId) {
                return {
                  ...post,
                  _count: {
                    ...post._count,
                    comments: post._count.comments + 1,
                  },
                };
              }
              return post;
            }),
          })),
        };
      });

      return { previousPosts };
    },

    onError: (error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast.error("Failed to add comment. Please try again.");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added!");
    },
  });
}
