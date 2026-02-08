import { Suspense } from "react";
import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import WhoToFollow from "@/components/WhoToFollow";
import { getAuthSession } from "@/auth";
import { FeedSkeleton, PostCardSkeleton } from "@/components/shared/LoadingSpinner";

export const dynamic = "force-dynamic";

/**
 * PostFeed Component - Wrapped for Suspense
 */
async function PostFeed() {
  const posts = await getPosts();
  const dbUserId = await getDbUserId();

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} dbUserId={dbUserId} />
      ))}
    </div>
  );
}

/**
 * CreatePostSection - Wrapped for Suspense
 */
async function CreatePostSection() {
  const session = await getAuthSession();

  if (!session?.user) {
    return null;
  }

  return <CreatePost />;
}

/**
 * Home Page with Suspense Boundaries
 *
 * Features:
 * - Suspense boundaries for parallel loading
 * - Independent loading states for each section
 * - Better perceived performance with streaming
 * - Graceful loading skeletons
 */
export default function Home() {
  // Build-time rendering fallback
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6">
          <FeedSkeleton />
        </div>
        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <div className="rounded-lg border bg-card p-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/2 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      {/* Main Feed Column */}
      <div className="lg:col-span-6 space-y-6">
        {/* Create Post Section */}
        <Suspense fallback={<PostCardSkeleton />}>
          <CreatePostSection />
        </Suspense>

        {/* Post Feed */}
        <Suspense fallback={<FeedSkeleton count={3} />}>
          <PostFeed />
        </Suspense>
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block lg:col-span-4 sticky top-20">
        <Suspense
          fallback={
            <div className="rounded-lg border bg-card p-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/2 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="size-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <WhoToFollow />
        </Suspense>
      </aside>
    </div>
  );
}
