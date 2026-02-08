# Privacy, Retention, and Deletion (V1)

## Data Collected

- Account data from Clerk (identity attributes needed for auth and profile bootstrap).
- User profile fields in app DB (username, display name, bio, image, location, website).
- Social graph and content data (posts, comments, likes, follows, notifications).

## Soft Delete Semantics

- Posts and comments should be soft deleted in future migration phases (`deletedAt`).
- Soft-deleted content is hidden from user-facing queries.
- Soft-deleted content may be retained for moderation, abuse investigation, and recovery workflows.

## Account Deletion Behavior

- On account deletion request:

1. Disable login/access immediately.
2. Remove or anonymize personally identifying profile fields.
3. Remove owned content from user-facing surfaces.
4. Retain minimal audit records required for platform safety and legal obligations.

## Retention Guidance

- Keep operational logs and audit events for a limited window (for example, 30-90 days).
- Keep only required PII and avoid collecting unnecessary sensitive information.
- Review retention settings when moderation and compliance requirements evolve.

## Access Principles

- Only authorized server-side paths can write user-owned data.
- Production access to databases and logs must be restricted to maintainers.
