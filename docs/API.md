# API Documentation

This document describes all server actions and API endpoints available in the application.

## Authentication

All authenticated endpoints require a valid session. Sessions are managed by NextAuth.js.

### Getting Session

```typescript
import { getServerSession } from "next-auth";

const session = await getServerSession();
if (!session) {
  // User is not authenticated
}
```

## Server Actions

Server actions are used for mutations and data fetching with server-side rendering.

### Post Actions

#### createPost

Creates a new post.

```typescript
import { createPost } from "@/actions/post.action";

const result = await createPost(formData);
```

**Input:**

- `formData.content` (string, required): Post content (1-5000 characters)
- `formData.image` (string, optional): Image URL

**Returns:**

```typescript
{
  success: boolean;
  data?: PostWithDetails;
  error?: string;
}
```

**Rate Limit:** 10 posts per hour per user

**Example:**

```typescript
const formData = new FormData();
formData.append("content", "Hello, world!");
formData.append("image", "https://example.com/image.jpg");

const { success, data, error } = await createPost(formData);
```

---

#### getPosts

Retrieves paginated feed of posts.

```typescript
import { getPosts } from "@/actions/post.action";

const result = await getPosts({ cursor, limit });
```

**Input:**

```typescript
{
  cursor?: string;  // Post ID for cursor pagination
  limit?: number;   // Number of posts (1-50, default: 10)
}
```

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    items: PostWithDetails[];
    nextCursor: string | null;
    hasNextPage: boolean;
  };
  error?: string;
}
```

**Example:**

```typescript
// First page
const { data } = await getPosts({ limit: 10 });

// Next page
const { data } = await getPosts({
  cursor: data.nextCursor,
  limit: 10,
});
```

---

#### toggleLike

Likes or unlikes a post.

```typescript
import { toggleLike } from "@/actions/post.action";

const result = await toggleLike(postId);
```

**Input:**

- `postId` (string): Post ID to like/unlike

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    liked: boolean;
    likeCount: number;
  };
  error?: string;
}
```

**Rate Limit:** 100 likes per hour per user

**Example:**

```typescript
const { data } = await toggleLike("post-123");
console.log(data.liked); // true or false
console.log(data.likeCount); // Updated like count
```

---

#### createComment

Adds a comment to a post.

```typescript
import { createComment } from "@/actions/post.action";

const result = await createComment({ postId, content });
```

**Input:**

```typescript
{
  postId: string; // Post ID
  content: string; // Comment content (1-1000 characters)
}
```

**Returns:**

```typescript
{
  success: boolean;
  data?: CommentWithAuthor;
  error?: string;
}
```

**Rate Limit:** 50 comments per hour per user

**Example:**

```typescript
const { data } = await createComment({
  postId: "post-123",
  content: "Great post!",
});
```

---

#### deletePost

Deletes a post (author only).

```typescript
import { deletePost } from "@/actions/post.action";

const result = await deletePost(postId);
```

**Input:**

- `postId` (string): Post ID to delete

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

**Authorization:** Only the post author can delete their posts

---

### User Actions

#### getUserProfile

Retrieves a user's profile by username.

```typescript
import { getUserProfile } from "@/actions/user.action";

const result = await getUserProfile(username);
```

**Input:**

- `username` (string): Username to lookup

**Returns:**

```typescript
{
  success: boolean;
  data?: UserProfile;
  error?: string;
}
```

**UserProfile:**

```typescript
{
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: Date;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean; // Relative to current user
}
```

**Example:**

```typescript
const { data } = await getUserProfile("johndoe");
console.log(data.followersCount);
console.log(data.isFollowing);
```

---

#### toggleFollow

Follows or unfollows a user.

```typescript
import { toggleFollow } from "@/actions/user.action";

const result = await toggleFollow(userId);
```

**Input:**

- `userId` (string): User ID to follow/unfollow

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    isFollowing: boolean;
    followersCount: number;
  };
  error?: string;
}
```

**Rate Limit:** 50 follow actions per hour per user

**Validation:** Cannot follow yourself

**Example:**

```typescript
const { data } = await toggleFollow("user-456");
console.log(data.isFollowing); // true or false
console.log(data.followersCount); // Updated follower count
```

---

#### updateProfile

Updates the current user's profile.

```typescript
import { updateProfile } from "@/actions/user.action";

const result = await updateProfile(updates);
```

**Input:**

```typescript
{
  name?: string;       // Display name (1-100 characters)
  bio?: string;        // Bio (max 500 characters)
  location?: string;   // Location (max 100 characters)
  website?: string;    // Website URL
}
```

**Returns:**

```typescript
{
  success: boolean;
  data?: UserProfile;
  error?: string;
}
```

**Example:**

```typescript
const { data } = await updateProfile({
  bio: "Software engineer",
  location: "San Francisco",
  website: "https://example.com",
});
```

---

### Notification Actions

#### getNotifications

Retrieves paginated notifications for the current user.

```typescript
import { getNotifications } from "@/actions/notification.action";

const result = await getNotifications({ cursor, limit });
```

**Input:**

```typescript
{
  cursor?: string;
  limit?: number;  // 1-50, default: 20
}
```

**Returns:**

```typescript
{
  success: boolean;
  data?: {
    items: NotificationWithRelations[];
    nextCursor: string | null;
    hasNextPage: boolean;
  };
  error?: string;
}
```

---

#### markNotificationRead

Marks a notification as read.

```typescript
import { markNotificationRead } from "@/actions/notification.action";

const result = await markNotificationRead(notificationId);
```

**Input:**

- `notificationId` (string): Notification ID

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

#### markAllNotificationsRead

Marks all notifications as read for the current user.

```typescript
import { markAllNotificationsRead } from "@/actions/notification.action";

const result = await markAllNotificationsRead();
```

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

## Data Types

### PostWithDetails

```typescript
interface PostWithDetails {
  id: string;
  content: string;
  image: string | null;
  createdAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  likeCount: number;
  commentCount: number;
  hasLiked: boolean; // Relative to current user
}
```

### CommentWithAuthor

```typescript
interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: Date;
  postId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
}
```

### NotificationWithRelations

```typescript
interface NotificationWithRelations {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  read: boolean;
  createdAt: Date;
  userId: string;
  creatorId: string;
  postId: string | null;
  creator: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  post?: {
    id: string;
    content: string;
  };
}
```

### PaginatedResult

```typescript
interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
```

---

## Error Handling

All server actions return a standardized response:

```typescript
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}
```

### Error Codes

- `UNAUTHORIZED`: User is not authenticated
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `RATE_LIMIT`: Rate limit exceeded
- `INTERNAL_ERROR`: Server error

### Example Error Handling

```typescript
const { success, data, error, code } = await createPost(formData);

if (!success) {
  if (code === "RATE_LIMIT") {
    toast.error("Too many requests. Please try again later.");
  } else if (code === "VALIDATION_ERROR") {
    toast.error(error);
  } else {
    toast.error("Something went wrong");
  }
  return;
}

// Success
toast.success("Post created!");
```

---

## Rate Limits

| Action          | Limit        | Window     |
| --------------- | ------------ | ---------- |
| Create Post     | 10 requests  | 1 hour     |
| Toggle Like     | 100 requests | 1 hour     |
| Create Comment  | 50 requests  | 1 hour     |
| Toggle Follow   | 50 requests  | 1 hour     |
| Sign In Attempt | 5 requests   | 15 minutes |

Rate limits are per user (identified by session).

When rate limited, you'll receive:

```typescript
{
  success: false,
  error: "Too many requests. Please try again later.",
  code: "RATE_LIMIT"
}
```

---

## React Query Integration

### Queries

```typescript
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getPosts, getUserProfile } from "@/actions/...";

// Simple query
const { data } = useQuery({
  queryKey: ["profile", username],
  queryFn: () => getUserProfile(username),
});

// Infinite query
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => getPosts({ cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage.data?.nextCursor,
});
```

### Mutations

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLike } from "@/actions/post.action";

const queryClient = useQueryClient();

const likeMutation = useMutation({
  mutationFn: (postId: string) => toggleLike(postId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
});

// Usage
likeMutation.mutate("post-123");
```

---

## API Routes

API routes are used for webhooks and third-party integrations.

### POST /api/uploadthing

Handles file uploads via UploadThing.

**Authentication:** Required

**Usage:**

```typescript
import { UploadButton } from '@uploadthing/react';

<UploadButton
  endpoint="imageUploader"
  onClientUploadComplete={(res) => {
    console.log('Files: ', res);
  }}
/>
```

---

## Validation Schemas

All inputs are validated using Zod schemas.

### Post Validation

```typescript
const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(5000, "Post too long")
    .transform((str) => str.trim()),
  image: z.string().url().optional().or(z.literal("")),
});
```

### Comment Validation

```typescript
const createCommentSchema = z.object({
  postId: z.string().cuid("Invalid post ID"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment too long")
    .transform((str) => str.trim()),
});
```

### Profile Update Validation

```typescript
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  location: z.string().max(100).trim().optional(),
  website: z.string().url().optional(),
});
```

---

## Best Practices

1. **Always handle errors**: Check `success` field before using `data`
2. **Show user feedback**: Use toast notifications for success/error
3. **Implement optimistic updates**: Update UI immediately, rollback on error
4. **Respect rate limits**: Disable buttons while mutating
5. **Use React Query**: Automatic caching, retries, and background refetching
6. **Validate client-side**: Use Zod schemas on client for instant feedback
7. **Handle loading states**: Show spinners/skeletons during async operations

---

## Examples

### Complete Post Creation Flow

```typescript
'use client';

import { useState } from 'react';
import { createPost } from '@/actions/post.action';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export function CreatePostForm() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('content', content);
      return createPost(formData);
    },
    onSuccess: ({ success, error }) => {
      if (success) {
        toast.success('Post created!');
        setContent('');
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      } else {
        toast.error(error || 'Failed to create post');
      }
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate();
    }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
      />
      <button
        type="submit"
        disabled={mutation.isPending || !content.trim()}
      >
        {mutation.isPending ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}
```

### Infinite Scroll Feed

```typescript
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts } from '@/actions/post.action';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

export function PostFeed() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => getPosts({ cursor: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => lastPage.data?.nextCursor,
    initialPageParam: undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap(page => page.data?.items || []) || [];

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasNextPage && (
        <div ref={ref} className="py-4">
          {isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </div>
      )}
    </div>
  );
}
```

---

## Migration Guide

If migrating from REST API to Server Actions:

1. Replace `fetch('/api/posts')` with `getPosts()`
2. Remove try/catch blocks (errors are in response)
3. Update React Query queryFn
4. Remove manual error handling (use `success` field)
5. Remove manual JSON parsing

**Before:**

```typescript
const response = await fetch("/api/posts");
const data = await response.json();
```

**After:**

```typescript
const { success, data, error } = await getPosts();
if (success) {
  // Use data
}
```
