# Contributing

## Development Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` values into your local environment.
3. Start the app with `npm run dev`.

## Quality Gates

- `npm run lint`
- `npm run typecheck`
- `npm run build`

All three commands should pass before opening a PR.

## Branch and PR Guidelines

- Keep PRs small and focused.
- Include a short summary, test evidence, and migration notes when relevant.
- Add screenshots for UI changes.

## Code Standards

- Prefer server actions for server-side mutations.
- Validate mutation inputs before database writes.
- Use transactions when updating related records.
- Avoid introducing `any`; if unavoidable, document the reason.

## Database Changes

- Use forward-only Prisma migrations.
- Include backfill notes when adding derived fields or counters.
- Document indexing decisions in PR description.
