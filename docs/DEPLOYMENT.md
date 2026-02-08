# Deployment Guide

This guide covers deploying the application to production using Vercel.

## Prerequisites

- GitHub account
- Vercel account
- PostgreSQL database (Neon, Supabase, or similar)

## Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="<32-character-secret>"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="https://yourdomain.com"

# Optional: OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: File uploads
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Optional: Logging
LOG_LEVEL="info"
```

## Deployment Steps

### 1. Database Setup

#### Option A: Neon (Recommended)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Add to Vercel environment variables

#### Option B: Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Add to Vercel environment variables

### 2. Vercel Deployment

#### Automatic Deployment (Recommended)

1. **Connect GitHub Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Authorize Vercel to access the repo

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Add all required env vars from above
   - Use "Production" environment

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get deployment URL

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Database Migration

After deployment, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:migrate
```

Or setup in Vercel:

- Project Settings > Git > Post-Deploy Command
- Add: `npx prisma migrate deploy`

### 4. Configure Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain

### 5. Verify Deployment

- [ ] Site loads correctly
- [ ] Authentication works
- [ ] Database connection successful
- [ ] Images load properly
- [ ] Forms submit correctly
- [ ] No console errors

## CI/CD Pipeline

The project includes GitHub Actions workflows:

### Continuous Integration

Runs on every push and PR:

- Linting (ESLint + Prettier)
- Type checking (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright)
- Security audit (npm audit + Snyk)
- Build verification

### Continuous Deployment

Automatically deploys to Vercel on push to `main`:

1. Runs all CI checks
2. Builds project
3. Deploys to production
4. Posts deployment URL to PR

### Required Secrets

Add these secrets to GitHub repository:

```
VERCEL_TOKEN         # Vercel API token
CODECOV_TOKEN        # Codecov upload token (optional)
SNYK_TOKEN           # Snyk security token (optional)
```

To add secrets:

1. Go to repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each secret

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard:

- Project Settings > Analytics
- Enable Web Analytics

### Error Monitoring

#### Option A: Sentry

1. Create account at [sentry.io](https://sentry.io)
2. Create new Next.js project
3. Add DSN to environment variables:
   ```env
   NEXT_PUBLIC_SENTRY_DSN="your-dsn"
   ```
4. Install Sentry SDK:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

#### Option B: Vercel Logs

Use built-in Vercel logs:

- Project > Logs
- Real-time and historical logs

### Performance Monitoring

- Vercel Analytics: Core Web Vitals
- Vercel Speed Insights: Detailed performance
- Custom monitoring via `src/lib/monitoring`

## Rollback

If deployment fails:

```bash
# Via Vercel dashboard
1. Go to Deployments
2. Find previous working deployment
3. Click "..." > "Promote to Production"

# Via CLI
vercel rollback
```

## Database Backups

### Automated Backups

Most providers include automatic backups:

- **Neon**: Automatic daily backups (retained 7 days)
- **Supabase**: Point-in-time recovery

### Manual Backup

```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20240115.sql
```

## Scaling

### Vertical Scaling

Upgrade database plan:

- More CPU/RAM
- Increased connections
- Better performance

### Horizontal Scaling

Vercel automatically scales:

- Edge network globally
- Serverless functions auto-scale
- No configuration needed

### Optimizations

For high traffic:

1. **Enable ISR** (Incremental Static Regeneration)

   ```typescript
   export const revalidate = 60; // Revalidate every 60 seconds
   ```

2. **Add Redis** for rate limiting
   - Upstash Redis (free tier)
   - Update rate limiter implementation

3. **Database Connection Pooling**
   - PgBouncer
   - Prisma Data Proxy

4. **CDN for Media**
   - Cloudflare Images
   - Cloudinary
   - imgix

## Troubleshooting

### Build Failures

```bash
# Check build logs
vercel logs <deployment-url>

# Test build locally
npm run build
```

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is accessible (not localhost)
- Verify IP allowlist (if any)
- Test connection: `npx prisma db pull`

### Environment Variables

```bash
# Pull env vars from Vercel
vercel env pull .env.local

# List env vars
vercel env ls
```

### 500 Errors

1. Check Vercel logs
2. Verify all env vars are set
3. Check database connection
4. Review error stack trace

## Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Authentication flow works
- [ ] CRUD operations functional
- [ ] Images upload and display
- [ ] Email notifications work (if enabled)
- [ ] Custom domain configured
- [ ] SSL certificate active (HTTPS)
- [ ] Analytics tracking
- [ ] Error monitoring setup
- [ ] Database backups configured
- [ ] Performance metrics baseline
- [ ] Security headers verified
- [ ] CORS configured correctly

## Maintenance

### Weekly

- Review error logs
- Check performance metrics
- Update dependencies (Dependabot)

### Monthly

- Review analytics
- Optimize slow queries
- Update documentation
- Security audit

### Quarterly

- Database optimization
- Infrastructure review
- Cost optimization
- Feature planning

## Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Status Page**: [vercel-status.com](https://vercel-status.com)

---

**Deployment Status**: Ready for production
**Last Updated**: 2026-02-08
