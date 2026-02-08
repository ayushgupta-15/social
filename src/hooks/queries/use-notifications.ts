"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";

/**
 * Hook to fetch notifications with infinite scroll
 */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      const result = await getNotifications({ cursor: pageParam, limit: 20 });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for notifications)
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await markNotificationsAsRead();
      return result;
    },

    onSuccess: () => {
      // Invalidate notifications to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadNotificationCount() {
  const { data } = useNotifications();

  // Count unread notifications from the cached data
  const unreadCount =
    data?.pages.reduce((count, page) => {
      const unread = page.items.filter((n: any) => !n.read).length;
      return count + unread;
    }, 0) ?? 0;

  return unreadCount;
}
