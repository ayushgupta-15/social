"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFollow } from "@/actions/user.action";
import { toast } from "react-hot-toast";

/**
 * Hook to follow/unfollow a user
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Error handling
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await toggleFollow(userId);
      return { userId, result };
    },

    onMutate: async (userId) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ["user", userId] });
      await queryClient.cancelQueries({ queryKey: ["suggestions"] });

      const previousUser = queryClient.getQueryData(["user", userId]);

      // Optimistically update user data
      queryClient.setQueryData(["user", userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: !old.isFollowing,
          _count: {
            ...old._count,
            followers: old.isFollowing ? old._count.followers - 1 : old._count.followers + 1,
          },
        };
      });

      return { previousUser };
    },

    onError: (error, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["user", variables], context.previousUser);
      }
      toast.error("Failed to update follow status");
    },

    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
}
