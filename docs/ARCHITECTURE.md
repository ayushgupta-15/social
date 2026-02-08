# Architecture Documentation

## Overview

This social media application follows **Clean Architecture** principles with clear separation of concerns across multiple layers. The architecture is designed to be scalable, maintainable, and testable.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│         Presentation Layer (UI)             │
│  • Next.js App Router Pages                 │
│  • React Components                         │
│  • Server Components                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│        Application Layer (Use Cases)        │
│  • Business Logic                           │
│  • Use Case Orchestration                   │
│  • DTOs & Validation                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Domain Layer (Core)                 │
│  • Entities & Business Rules                │
│  • Repository Interfaces                    │
│  • Domain Models                            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Infrastructure Layer (Data)            │
│  • Prisma Repositories                      │
│  • Database Access                          │
│  • External Services                        │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API routes
│   ├── profile/           # Profile pages
│   ├── notifications/     # Notifications
│   └── page.tsx           # Home page
│
├── components/            # React Components
│   ├── features/          # Feature-specific components
│   │   └── post/         # Post-related components
│   ├── shared/           # Shared/reusable components
│   └── ui/               # Base UI components (shadcn/ui)
│
├── core/                  # Clean Architecture layers
│   ├── application/       # Application layer
│   │   ├── dto/          # Data Transfer Objects
│   │   └── use-cases/    # Business logic use cases
│   │
│   ├── domain/           # Domain layer
│   │   ├── entities/     # Domain entities
│   │   └── repositories/ # Repository interfaces
│   │
│   └── infrastructure/   # Infrastructure layer
│       ├── database/     # Database implementations
│       │   └── prisma/   # Prisma repositories
│       └── di/           # Dependency Injection
│
├── lib/                   # Shared utilities
│   ├── auth/             # Authentication
│   ├── errors/           # Error handling
│   ├── logger/           # Logging infrastructure
│   ├── monitoring/       # Performance monitoring
│   ├── security/         # Security utilities
│   └── validation/       # Validation schemas
│
├── hooks/                # React hooks
│   ├── mutations/        # React Query mutations
│   └── queries/          # React Query queries
│
├── actions/              # Server Actions
├── providers/            # React Context Providers
└── types/                # TypeScript types
```

## Core Concepts

### 1. Clean Architecture

The application is built using Clean Architecture principles:

- **Independence**: Business logic is independent of frameworks, UI, and databases
- **Testability**: Easy to test without UI, database, or external services
- **UI Independence**: UI can change without affecting business rules
- **Database Independence**: Can swap Prisma for another ORM
- **External Service Independence**: Business rules don't depend on external services

### 2. SOLID Principles

#### Single Responsibility Principle (SRP)

Each class/module has one reason to change:

- `CreatePostUseCase` only handles post creation logic
- `PrismaPostRepository` only handles database operations
- Components focus on presentation only

#### Open/Closed Principle (OCP)

Open for extension, closed for modification:

- Repository interfaces allow different implementations
- Use cases can be extended without modifying existing code

#### Liskov Substitution Principle (LSP)

Implementations are substitutable:

- Any `IPostRepository` implementation works with `CreatePostUseCase`
- Easy to swap Prisma for another database

#### Interface Segregation Principle (ISP)

Specific interfaces instead of one general interface:

- `IPostRepository`, `IUserRepository`, `INotificationRepository`
- Each repository has only the methods it needs

#### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions:

- Use cases depend on repository **interfaces**, not implementations
- Infrastructure depends on domain, not vice versa

### 3. Dependency Injection

Uses a simple container pattern for managing dependencies:

```typescript
// Register repositories
container.registerFactory("PostRepository", () => new PrismaPostRepository());

// Resolve in use cases
const postRepository = container.resolve<IPostRepository>("PostRepository");
```

Benefits:

- Easy to swap implementations
- Simplified testing with mocks
- Singleton pattern for repositories

### 4. Repository Pattern

Abstracts data access behind interfaces:

```typescript
// Domain layer (interface)
interface IPostRepository {
  create(data: CreatePostInput): Promise<PostWithDetails>;
  findById(id: string): Promise<PostWithDetails | null>;
}

// Infrastructure layer (implementation)
class PrismaPostRepository implements IPostRepository {
  async create(data: CreatePostInput) {
    return prisma.post.create({ data });
  }
}
```

Benefits:

- Database-agnostic business logic
- Easy to test with mocks
- Centralized data access logic

## Data Flow

### Creating a Post

```
1. User submits form
   ↓
2. createPost Server Action
   ↓
3. Validation (Zod schema)
   ↓
4. Rate limiting check
   ↓
5. CreatePostUseCase.execute()
   ↓
6. PostRepository.create()
   ↓
7. Prisma database insert
   ↓
8. Return PostWithDetails DTO
   ↓
9. React Query cache update
   ↓
10. UI optimistic update
```

### Fetching Feed

```
1. Page renders (Server Component)
   ↓
2. getPosts Server Action
   ↓
3. GetFeedUseCase.execute()
   ↓
4. PostRepository.getFeed()
   ↓
5. Prisma query with cursor pagination
   ↓
6. Return PaginatedResult<PostWithDetails>
   ↓
7. React Query infinite query
   ↓
8. Client-side rendering with Suspense
```

## Key Patterns

### 1. DTOs (Data Transfer Objects)

Defined shape of data transferred between layers:

```typescript
export interface PostWithDetails {
  id: string;
  content: string;
  image: string | null;
  createdAt: Date;
  author: UserSummary;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
}
```

Benefits:

- Type safety across boundaries
- Decouples internal models from API responses
- Clear contracts between layers

### 2. Use Cases

Encapsulate business logic:

```typescript
export class CreatePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(input: CreatePostInput): Promise<PostWithDetails> {
    // Validation
    const validated = validate(createPostSchema, input);

    // Business logic
    const post = await this.postRepository.create(validated);

    return post;
  }
}
```

Benefits:

- Single responsibility
- Testable without infrastructure
- Reusable across different UIs

### 3. Query Builders

Centralize database queries to avoid duplication:

```typescript
export class PostQueryBuilder {
  static feedSelect(currentUserId?: string | null) {
    return {
      id: true,
      content: true,
      author: { select: { id: true, name: true } },
      _count: { select: { likes: true } },
      likes: currentUserId ? { where: { userId: currentUserId } } : false,
    };
  }
}
```

Benefits:

- DRY (Don't Repeat Yourself)
- Consistent queries
- Prevents N+1 queries

### 4. Server Components + Server Actions

Leverages React Server Components for optimal performance:

```tsx
// Server Component
export default async function HomePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <PostFeed />
    </Suspense>
  );
}

// Server Action
export async function createPost(formData: FormData) {
  'use server';

  const session = await getServerSession();
  if (!session) throw new UnauthorizedError();

  const result = await useCase.execute({ ... });
  revalidatePath('/');

  return { success: true, data: result };
}
```

Benefits:

- Zero client JavaScript for read operations
- Automatic code splitting
- Built-in loading states with Suspense

### 5. Optimistic Updates

React Query + useOptimistic for instant UI feedback:

```tsx
const [optimisticLiked, setOptimisticLiked] = useOptimistic(hasLiked);

const handleLike = async () => {
  startTransition(() => {
    setOptimisticLiked(!optimisticLiked);
    toggleLike(postId);
  });
};
```

Benefits:

- Instant UI feedback
- Better perceived performance
- Automatic rollback on error

## Performance Optimizations

### 1. Database

- **Indexes**: Added 15+ indexes for common queries
- **Cursor Pagination**: Efficient pagination for large datasets
- **N+1 Prevention**: Use `_count` instead of loading all relations
- **Query Optimization**: Centralized query builders

### 2. Frontend

- **React Query**: Automatic caching and background refetching
- **Suspense**: Parallel data fetching
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image with AVIF/WebP

### 3. Caching

- **React Query**: 5min stale time, 10min cache time
- **Next.js**: Automatic route caching
- **Database**: Prepared statements via Prisma

## Security

### 1. Authentication

- NextAuth.js for authentication
- Session-based with secure cookies
- CSRF protection built-in

### 2. Authorization

- Server-side session checks
- User ownership verification
- Role-based access (future)

### 3. Rate Limiting

- In-memory rate limiter (free tier)
- Per-user limits on mutations
- Configurable thresholds

### 4. Input Validation

- Zod schemas for all inputs
- Server-side validation
- Sanitization of user content

### 5. Security Headers

- CSP (Content Security Policy)
- HSTS (Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

## Testing Strategy

### 1. Unit Tests (Vitest)

- Test use cases with mock repositories
- Test validation schemas
- Test utility functions
- Target: 80%+ coverage

### 2. Integration Tests

- Test server actions end-to-end
- Test repository implementations
- Test with real database (test DB)

### 3. E2E Tests (Playwright)

- Test critical user flows
- Test across browsers
- Test responsive design
- Test accessibility

## Scalability Considerations

### Current State (Free Tier)

- In-memory rate limiting
- Single Postgres database
- Vercel serverless functions

### Future Scaling Options

1. **Database**
   - Read replicas for scaling reads
   - Connection pooling (PgBouncer)
   - Database sharding

2. **Caching**
   - Redis for rate limiting
   - CDN for static assets
   - Application-level caching

3. **Search**
   - Elasticsearch for full-text search
   - Algolia for instant search

4. **File Storage**
   - S3 for images/videos
   - CDN for media delivery

5. **Background Jobs**
   - Queue system (BullMQ)
   - Worker processes

6. **Microservices** (if needed)
   - Separate services for posts, notifications, etc.
   - API gateway

## Development Workflow

1. **Feature Development**
   - Create use case in `core/application/use-cases/`
   - Add repository methods if needed
   - Create server action in `actions/`
   - Build UI components
   - Add validation schemas

2. **Testing**
   - Write unit tests for use cases
   - Write integration tests for actions
   - Write E2E tests for user flows

3. **Deployment**
   - Push to GitHub
   - Automatic deployment via Vercel
   - Run migrations on deploy

## Technology Stack

### Core

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js

### Frontend

- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query)
- **Forms**: react-hook-form + Zod

### Backend

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **Logging**: Pino

### DevOps

- **Hosting**: Vercel
- **Database Hosting**: Neon/Supabase (suggested)
- **File Storage**: UploadThing
- **Version Control**: Git + GitHub

### Testing

- **Unit Tests**: Vitest
- **E2E Tests**: Playwright
- **Test Utilities**: Testing Library

## Best Practices

1. **Keep business logic in use cases**: Don't put business logic in components or actions
2. **Use DTOs for data transfer**: Define clear contracts between layers
3. **Validate at boundaries**: Validate all inputs in server actions
4. **Fail fast**: Throw errors early, handle at boundaries
5. **Log everything**: Use structured logging for debugging
6. **Monitor performance**: Track Core Web Vitals and API latency
7. **Write tests first**: TDD for use cases and critical flows
8. **Type everything**: Avoid `any` types
9. **Keep components small**: Single responsibility for components
10. **Use Server Components by default**: Only use Client Components when needed

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
