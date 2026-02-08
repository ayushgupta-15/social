# Non-Functional Requirements (V1)

## Performance

- Feed API and page rendering target: p95 < 400ms under normal load.
- Profile page target: p95 < 500ms.
- Notification reads are eventually consistent.

## Scale Assumption

- Initial scale target: 5,000-10,000 daily active users.
- Traffic pattern: read-heavy feed usage, bursty writes during peak hours.

## Availability

- Target uptime: 99.5% monthly for the application tier.
- Graceful degradation is acceptable for non-critical features (for example, delayed notification counters).

## Reliability

- Server actions must return explicit success/error outcomes.
- Critical writes (follow, like, comment creation) should be transactional where needed.

## Security

- Auth enforced on write operations.
- Rate limits required on abuse-prone endpoints.
- File uploads restricted by type and size.

## Operability

- Structured logs on server errors and critical actions.
- CI must run lint, typecheck, and build on every push and PR.
