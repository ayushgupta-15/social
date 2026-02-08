# Image Optimization Guide

This project uses Next.js Image component for automatic image optimization with modern formats (AVIF, WebP).

## Components

### OptimizedImage

General-purpose optimized image component with loading states and error handling.

```tsx
import { OptimizedImage } from "@/components/shared/OptimizedImage";

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false}
  quality={85}
/>;
```

**Props:**

- `src`: Image source URL
- `alt`: Alt text for accessibility
- `width/height`: Dimensions in pixels
- `fill`: Use for responsive container-based sizing
- `priority`: Set `true` for above-the-fold images (disables lazy loading)
- `quality`: Image quality (1-100, default 85)
- `sizes`: Responsive sizes (e.g., `(max-width: 768px) 100vw, 50vw`)
- `objectFit`: How image fits container (cover, contain, etc.)
- `fallbackSrc`: Fallback image if primary fails to load

### AvatarImage

Optimized component specifically for user avatars with initials fallback.

```tsx
import { AvatarImage } from "@/components/shared/OptimizedImage";

<AvatarImage src={user.image} alt={user.name} size="md" />;
```

**Sizes:**

- `xs`: 24x24px
- `sm`: 32x32px
- `md`: 40x40px (default)
- `lg`: 56x56px
- `xl`: 80x80px

### PostImage

Optimized component for post images with 16:9 aspect ratio.

```tsx
import { PostImage } from "@/components/shared/OptimizedImage";

<PostImage src={post.image} alt="Post image" priority={false} />;
```

## Image Formats

Next.js automatically converts images to modern formats:

1. **AVIF** (preferred): 50% smaller than JPEG with same quality
2. **WebP** (fallback): 25-35% smaller than JPEG
3. **Original format** (final fallback)

Browsers automatically receive the best format they support.

## Best Practices

### 1. Always provide width and height

```tsx
// Good ✅
<OptimizedImage src="/image.jpg" alt="..." width={800} height={600} />

// Bad ❌ (causes CLS - Cumulative Layout Shift)
<OptimizedImage src="/image.jpg" alt="..." />
```

### 2. Use `fill` for responsive images

```tsx
<div className="relative w-full h-96">
  <OptimizedImage src="/image.jpg" alt="..." fill sizes="(max-width: 768px) 100vw, 50vw" />
</div>
```

### 3. Set `priority` for above-the-fold images

```tsx
// Hero image, logo, or first post image
<OptimizedImage src="/hero.jpg" alt="..." priority />
```

### 4. Use appropriate quality settings

- **Avatars**: 90 (high quality for small images)
- **Posts**: 85 (balanced)
- **Backgrounds**: 75 (lower quality acceptable)
- **Thumbnails**: 80

### 5. Specify `sizes` for responsive images

```tsx
<OptimizedImage
  src="/image.jpg"
  alt="..."
  fill
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         600px"
/>
```

This tells Next.js which size to generate:

- Mobile (≤640px): Full width
- Tablet (≤1024px): Half width
- Desktop: Fixed 600px

### 6. Add external domains to Next.js config

```ts
// next.config.ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'example.com',
    },
  ],
}
```

## Image Loading States

All optimized image components include:

1. **Loading skeleton**: Animated placeholder while image loads
2. **Error fallback**: Graceful degradation if image fails
3. **Fade-in transition**: Smooth appearance once loaded

## Performance Metrics

Optimized images improve:

- **LCP (Largest Contentful Paint)**: Faster loading of main content
- **CLS (Cumulative Layout Shift)**: Reserved space prevents layout jumps
- **Bandwidth**: Smaller file sizes reduce data usage
- **FID (First Input Delay)**: Less CPU usage for image processing

## CDN Integration

Images are automatically served via Vercel's global CDN with:

- Automatic caching
- Global edge network
- On-demand optimization
- Automatic format conversion

## Local Development

In development, images are optimized on-demand. First load may be slower, but subsequent loads use cached versions.

## Monitoring

Track image performance in:

1. **Vercel Analytics**: Core Web Vitals
2. **Chrome DevTools**: Network tab (check `Content-Type` for AVIF/WebP)
3. **Lighthouse**: Performance score

## Migration Checklist

When updating existing `<img>` tags:

- [ ] Replace with `<OptimizedImage>`
- [ ] Add `width` and `height` props
- [ ] Set `priority` for above-the-fold images
- [ ] Add `sizes` for responsive images
- [ ] Update `alt` text for accessibility
- [ ] Test on mobile and desktop
- [ ] Verify in Lighthouse

## Common Issues

### Image not displaying

- Check if domain is in `remotePatterns` in `next.config.ts`
- Verify image URL is accessible
- Check browser console for errors

### Blurry images

- Increase `quality` prop (default 85)
- Ensure `width`/`height` match actual display size
- Check source image resolution

### Slow loading

- Use `priority` for important images
- Optimize source image size before upload
- Use appropriate `sizes` prop
- Enable HTTP/2 on your server
