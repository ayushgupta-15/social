import { Loader2Icon } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

/**
 * LoadingSpinner Component
 *
 * Reusable loading spinner for Suspense fallbacks and loading states
 */
export function LoadingSpinner({ size = "md", className = "", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-8",
    lg: "size-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2Icon className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * Full page loading spinner
 */
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * Card skeleton loader
 */
export function PostCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 animate-pulse">
      <div className="flex space-x-3 sm:space-x-4">
        {/* Avatar skeleton */}
        <div className="size-8 sm:size-10 rounded-full bg-muted" />

        <div className="flex-1 space-y-3">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
            <div className="h-3 bg-muted rounded w-4/6" />
          </div>

          {/* Actions skeleton */}
          <div className="flex gap-4 pt-2">
            <div className="h-8 bg-muted rounded w-16" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Feed skeleton loader
 */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Profile skeleton loader
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="size-20 rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="flex gap-4">
              <div className="h-8 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Posts skeleton */}
      <FeedSkeleton count={2} />
    </div>
  );
}
