"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Optimized Image Component
 *
 * Wrapper around Next.js Image with:
 * - Automatic WebP/AVIF format conversion
 * - Blur placeholder for better UX
 * - Error fallback handling
 * - Lazy loading by default
 * - Responsive sizing
 * - Quality optimization
 */

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 85,
  sizes,
  objectFit = "cover",
  fallbackSrc = "/images/placeholder.png",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setImgSrc(fallbackSrc);
    setIsLoading(false);
    onError?.();
  };

  // For external images, we need to use unoptimized
  const isExternal =
    imgSrc.startsWith("http") && !imgSrc.includes(process.env.NEXT_PUBLIC_APP_URL || "");

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={imgSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          "transition-opacity duration-300",
          isLoading && !hasError && "opacity-0",
          !isLoading && "opacity-100",
          objectFit === "cover" && "object-cover",
          objectFit === "contain" && "object-contain"
        )}
        quality={quality}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={isExternal}
      />

      {/* Loading skeleton */}
      {isLoading && !hasError && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
          Image unavailable
        </div>
      )}
    </div>
  );
}

/**
 * Avatar Image Component
 *
 * Optimized for user avatars with proper sizing and fallback
 */
interface AvatarImageProps {
  src: string | null | undefined;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallback?: string;
}

export function AvatarImage({ src, alt, size = "md", className, fallback }: AvatarImageProps) {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const dimension = sizeMap[size];

  // Generate fallback with initials
  const getFallback = () => {
    if (fallback) return fallback;

    const initials = alt
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}"><rect width="${dimension}" height="${dimension}" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="${
        dimension / 2
      }" fill="#6b7280">${initials}</text></svg>`
    )}`;
  };

  return (
    <div
      className={cn("relative shrink-0 rounded-full overflow-hidden bg-muted", className)}
      style={{ width: dimension, height: dimension }}
    >
      <OptimizedImage
        src={src || getFallback()}
        alt={alt}
        width={dimension}
        height={dimension}
        className="rounded-full"
        fallbackSrc={getFallback()}
        quality={90}
        objectFit="cover"
      />
    </div>
  );
}

/**
 * Post Image Component
 *
 * Optimized for post images with responsive sizing
 */
interface PostImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function PostImage({ src, alt, priority = false, className }: PostImageProps) {
  return (
    <div className={cn("relative w-full aspect-video rounded-lg overflow-hidden", className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={85}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
        objectFit="cover"
      />
    </div>
  );
}
