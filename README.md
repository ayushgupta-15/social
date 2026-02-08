# Social Media Application

A modern, scalable social media platform built with **Next.js 16**, **React 19**, **Prisma**, and **PostgreSQL**. Features clean architecture, comprehensive testing, and production-ready performance optimizations.

## ✨ Features

### Core Features

- 📝 Create & Share Posts (text and images)
- ❤️ Like & Comment on content
- 👥 Follow Users and build your network
- 🔔 Real-time Notifications
- 👤 Customizable User Profiles
- 🔍 Infinite Scroll Feed

### Technical Features

- ⚡ Optimistic UI Updates for instant feedback
- 🎯 Cursor-based Pagination
- 🖼️ Image Optimization (AVIF/WebP)
- 🔒 Security (Rate limiting, CSRF protection, input validation)
- 📊 Performance Monitoring (Core Web Vitals)
- 🧪 Comprehensive Testing (80%+ coverage)
- 📱 Responsive Design
- 🌙 Dark Mode support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/social.git
cd social
npm install
```

2. Setup environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Setup database:

```bash
npm run db:migrate
npm run db:seed  # Optional: Add sample data
```

4. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format with Prettier

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed with sample data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database

# Testing
npm run test              # Run unit tests
npm run test:coverage     # Generate coverage
npm run test:e2e          # Run E2E tests
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16, React 19
- **Database:** PostgreSQL, Prisma ORM
- **Styling:** Tailwind CSS 4, shadcn/ui
- **State:** React Query (TanStack Query)
- **Auth:** NextAuth.js
- **Testing:** Vitest, Playwright
- **Deployment:** Vercel

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Performance Monitoring](./docs/PERFORMANCE_MONITORING.md)

## 🔒 Security

- Input validation with Zod
- Rate limiting on mutations
- CSRF protection
- Security headers (CSP, HSTS)
- SQL injection prevention

## ⚡ Performance

- Optimized Core Web Vitals
- Automatic image optimization
- Code splitting
- Database indexing
- Cursor-based pagination

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

**Built with ❤️ using Next.js and React**
