# Structured Logging

This module provides structured logging capabilities using Pino for high-performance logging.

## Features

- **Structured JSON Logs**: Easy to parse and analyze in production
- **Pretty Printing**: Human-readable logs in development
- **Multiple Log Levels**: debug, info, warn, error
- **Context Loggers**: Separate loggers for different modules (http, database, auth, use-case)
- **Performance Monitoring**: Track slow operations and database queries
- **Request Correlation**: Track requests across the application with unique IDs
- **Sensitive Data Redaction**: Automatically redacts passwords, tokens, secrets

## Usage

### Basic Logging

```typescript
import { logger } from "@/lib/logger";

logger.info("Application started");
logger.debug({ userId: "123" }, "User action");
logger.warn({ duration: 5000 }, "Slow operation");
logger.error({ error }, "Operation failed");
```

### Context Loggers

```typescript
import { authLogger, dbLogger, useCaseLogger } from "@/lib/logger";

authLogger.info({ userId: "123" }, "User logged in");
dbLogger.warn({ query: "SELECT *", duration: 600 }, "Slow query");
useCaseLogger.debug({ useCase: "CreatePost" }, "Executing use case");
```

### Performance Monitoring

```typescript
import { measurePerformance, createTimer } from "@/lib/logger";

// Measure async operation
const result = await measurePerformance(
  "fetchUserData",
  async () => {
    return await getUserData(userId);
  },
  { userId }
);

// Manual timer
const timer = createTimer("complexOperation");
await doSomething();
const duration = timer.stop();
```

### Request Logging

```typescript
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const { requestId, logResponse, logError } = logRequest(request);

  try {
    const result = await handleRequest();
    const response = NextResponse.json(result);
    logResponse(response);
    return response;
  } catch (error) {
    logError(error as Error);
    throw error;
  }
}
```

### Custom Context Logger

```typescript
import { createLogger } from "@/lib/logger";

const paymentLogger = createLogger({ module: "payment" });

paymentLogger.info({ amount: 100, currency: "USD" }, "Payment processed");
```

## Configuration

Set environment variables:

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Node environment
NODE_ENV=production
```

## Log Levels

- **debug**: Detailed information for debugging (only in development)
- **info**: General informational messages
- **warn**: Warning messages (slow queries, deprecated features)
- **error**: Error messages that need attention

## Redacted Fields

The following fields are automatically redacted from logs:

- `password`
- `token`, `accessToken`, `refreshToken`
- `secret`, `apiKey`
- `req.headers.authorization`
- `req.headers.cookie`

## Best Practices

1. **Use appropriate log levels**: Reserve `error` for actual errors, use `warn` for concerns
2. **Include context**: Add relevant data like `userId`, `postId`, etc.
3. **Don't log sensitive data**: Passwords, tokens, and PII are redacted automatically
4. **Use child loggers**: Create module-specific loggers with `createLogger()`
5. **Monitor performance**: Use `measurePerformance()` for critical operations
6. **Add request IDs**: Use `logRequest()` middleware to track requests

## Production Logging

In production, logs are output as JSON for easy parsing by log aggregation tools like:

- CloudWatch
- DataDog
- Splunk
- ELK Stack
- Grafana Loki

Example production log:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "pid": 1234,
  "hostname": "server-1",
  "module": "http",
  "requestId": "abc123xyz",
  "method": "POST",
  "url": "/api/posts",
  "status": 200,
  "duration": 45,
  "msg": "Request completed"
}
```
