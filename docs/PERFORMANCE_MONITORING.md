# Performance Monitoring

This project includes comprehensive performance monitoring for both client and server-side operations.

## Core Web Vitals

We track all Google Core Web Vitals:

### LCP (Largest Contentful Paint)

- **Good**: < 2.5s
- **Needs Improvement**: 2.5s - 4s
- **Poor**: > 4s

Measures loading performance. The LCP should occur within 2.5 seconds of when the page first starts loading.

### FID (First Input Delay)

- **Good**: < 100ms
- **Needs Improvement**: 100ms - 300ms
- **Poor**: > 300ms

Measures interactivity. Pages should have an FID of 100 milliseconds or less.

### CLS (Cumulative Layout Shift)

- **Good**: < 0.1
- **Needs Improvement**: 0.1 - 0.25
- **Poor**: > 0.25

Measures visual stability. Pages should maintain a CLS of 0.1 or less.

### Additional Metrics

- **FCP (First Contentful Paint)**: Time to first visible content
- **TTFB (Time to First Byte)**: Server response time
- **INP (Interaction to Next Paint)**: Responsiveness to user interactions

## Client-Side Monitoring

### Setup

Add `ClientMonitor` to your root layout:

```tsx
import { ClientMonitor } from "@/lib/monitoring";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientMonitor />
        {children}
      </body>
    </html>
  );
}
```

### Performance Hooks

#### useOperationPerformance

```tsx
import { useOperationPerformance } from "@/hooks/use-performance";

function MyComponent() {
  const { start, end } = useOperationPerformance("data-fetch");

  const fetchData = async () => {
    start();
    await fetch("/api/data");
    const duration = end();
    console.log(`Fetch took ${duration}ms`);
  };
}
```

#### useRenderPerformance

```tsx
import { useRenderPerformance } from "@/hooks/use-performance";

function MyComponent() {
  const { renderCount } = useRenderPerformance("MyComponent");

  // Logs render times and counts
}
```

### Manual Performance Tracking

```tsx
import { PerformanceMonitor } from "@/lib/monitoring";

// Mark start
PerformanceMonitor.mark("operation-name");

// ... do work ...

// Measure and report
const duration = PerformanceMonitor.measure("operation-name");
```

### Async Operations

```tsx
import { PerformanceMonitor } from "@/lib/monitoring";

const result = await PerformanceMonitor.measureAsync(
  "fetch-users",
  async () => {
    return await fetchUsers();
  },
  1000 // Threshold: warn if > 1000ms
);
```

## Server-Side Monitoring

### API Performance Tracking

```tsx
import { trackAPIPerformance, createServerTimer } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  const timer = createServerTimer();

  try {
    const result = await handleRequest();
    const duration = timer.stop();

    trackAPIPerformance({
      endpoint: "/api/posts",
      method: "GET",
      duration,
      status: 200,
    });

    return NextResponse.json(result);
  } catch (error) {
    const duration = timer.stop();

    trackAPIPerformance({
      endpoint: "/api/posts",
      method: "GET",
      duration,
      status: 500,
    });

    throw error;
  }
}
```

### Performance Middleware Wrapper

```tsx
import { withPerformanceTracking } from "@/lib/monitoring";

const handler = async (request: NextRequest) => {
  // ... your handler logic
};

export const GET = withPerformanceTracking("api.posts.get", handler);
```

### Database Query Monitoring

Database queries are automatically monitored via the Prisma middleware:

```tsx
import { DatabaseMonitor } from "@/lib/monitoring";

// Get stats
const stats = DatabaseMonitor.getStats();
console.log(stats.slowQueriesCount); // Number of slow queries
console.log(stats.slowQueries); // Last 10 slow queries
```

## Monitoring Features

### Resource Timing

Automatically monitors slow-loading resources (> 1s):

- Images
- Scripts
- Stylesheets
- Fonts
- API calls

### Long Tasks

Detects tasks that block the main thread for > 50ms.

### Memory Usage

Monitors JavaScript heap usage (Chrome only) and warns when > 80% capacity.

### Route Change Performance

Tracks navigation performance between pages.

## Thresholds

### Client-Side

- **Fast**: < 100ms
- **Acceptable**: 100ms - 300ms
- **Slow**: 300ms - 1000ms
- **Critical**: > 1000ms

### Server-Side

- **Fast**: < 100ms
- **Acceptable**: 100ms - 300ms
- **Slow**: 300ms - 1000ms
- **Critical**: > 1000ms

### Database Queries

- **Acceptable**: < 500ms
- **Slow**: > 500ms (logged as warning)

## Viewing Metrics

### Development

Metrics are logged to console with pretty formatting:

```
[Performance] { metric: 'LCP', value: 1234, rating: 'good' }
```

### Production

Metrics are sent to:

1. **Structured Logs**: Via Pino logger
2. **Google Analytics**: If gtag is configured
3. **APM Services**: DataDog, New Relic, Sentry (configure in code)

## Best Practices

1. **Monitor Critical User Journeys**: Focus on sign-in, post creation, feed loading
2. **Set Performance Budgets**: Define maximum acceptable times for operations
3. **Review Slow Operations**: Check logs weekly for patterns
4. **Optimize Based on Data**: Use metrics to guide optimization efforts
5. **Test on Real Devices**: Metrics vary significantly across devices

## Performance Budget

Recommended budgets for this application:

- **Page Load (LCP)**: < 2.5s
- **API Responses**: < 300ms
- **Database Queries**: < 200ms
- **Route Changes**: < 200ms
- **Image Load**: < 1s

## Debugging Slow Performance

### Client-Side

1. Check Chrome DevTools Performance tab
2. Review Console for performance warnings
3. Check Network tab for slow resources
4. Use React DevTools Profiler

### Server-Side

1. Check structured logs for slow operations
2. Review database query logs
3. Use Prisma query logging
4. Check APM dashboard if configured

## Integration with Analytics

### Google Analytics

```tsx
// app/layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');
  `}
</Script>
```

Metrics are automatically sent to GA when configured.

### Vercel Analytics

Performance metrics are automatically collected on Vercel deployments.

## Alerting

Set up alerts for:

- LCP > 4s
- FID > 300ms
- CLS > 0.25
- API responses > 1s
- Database queries > 1s
- Memory usage > 80%

Use your logging/APM service to configure threshold-based alerts.
