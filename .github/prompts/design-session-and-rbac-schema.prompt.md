---
name: "Design Session And RBAC Schema"
description: "Define the canonical Better Auth-linked identity, membership, permission, and audit schema for this workspace"
argument-hint: "Describe the auth, role, membership, session, or audit modeling problem to design"
agent: "agent"
---

Design the canonical session, membership, permission, and audit schema for: $ARGUMENTS

Canonical auth and authorization context:
- Use Better Auth as the source of truth for authentication and session identity.
- Bun + Elysia is responsible for Better Auth verification, backend authorization enforcement, and persistence-side policy checks.
- Angular uses Better Auth-backed identity state together with API-backed route and data authorization checks.
- SurrealDB Cloud remains the persistence target: `https://crimson-shadow-06ehlgqoqlrbp6dokk1428etgg.aws-use1.surreal.cloud/`
- Do not introduce a second application auth cookie by default; rely on Better Auth-managed session cookies.
- Default RBAC roles for this system are `owner`, `admin`, `operator`, and `viewer`.
- Default RBAC model: `owner` full system and role-management access; `admin` operational configuration and user management except ownership transfer; `operator` scraper, schedule, run, and notification operations without user or role administration; `viewer` read-only dashboard access.
- Treat this prompt as the canonical source for local identity projection, membership projection, permission model, role assignment, and audit schema decisions used by other implementation prompts.

Canonical local schema defaults:
- Use a Better Auth-linked identity or session projection record with field names `id`, `betterAuthSessionId`, `betterAuthUserId`, `activeRole`, `createdAt`, `updatedAt`, `expiresAt`, `lastSeenAt`, `revokedAt`, `ipHash`, `userAgent`, `csrfSecret`, and `authorizationVersion` unless the request explicitly requires a different shape.
- Use a membership record with field names `id`, `betterAuthUserId`, `organizationId`, `role`, `status`, `createdAt`, `updatedAt`, `invitedByUserId`, and `lastAuthorizedAt` unless the request explicitly requires a different shape.
- Prefer role-based permissions derived from the fixed RBAC model instead of per-user custom grants by default.
- If explicit permission records are needed, use a record with field names `id`, `subjectType`, `subjectId`, `resource`, `action`, `effect`, `createdAt`, `updatedAt`, and `grantedByUserId`.
- Keep audit records separate from session and membership records.
- Use an audit record with field names `id`, `actorUserId`, `actorRole`, `eventType`, `targetType`, `targetId`, `metadata`, `createdAt`, `requestId`, and `ipHash` unless there is a strong reason not to.

Required lifecycle and security rules:
- For cookie-authenticated write endpoints, require CSRF protection by default using a non-cookie request token or header validated against `csrfSecret` on the active session projection.
- Use explicit revocation by setting `revokedAt` on local session projections instead of implicit deletion only.
- Use cleanup queries that remove or archive stale projections where `revokedAt` is set or `expiresAt` is in the past.
- Keep Better Auth session validation authoritative; local identity or session projection records must never replace Better Auth verification as the primary auth decision.
- Keep role checks explicit at both the API and Angular route or page-access layers.

Instructions:
- Start by reading the current workspace structure and relevant files before making recommendations.
- Treat this prompt as the source-of-truth design prompt for session, RBAC, membership, permission, and audit modeling.
- Optimize for clarity, security, consistency, and straightforward implementation in Bun + Elysia, Angular, and SurrealDB.
- Prefer simple, supportable schema and query patterns over overly dynamic permission systems.
- When a request would conflict with this canonical model, call out the conflict clearly and explain the tradeoff.
- If the request implies code or query changes, implement only the smallest coherent slice and validate it.

Response format:
- Canonical schema decision
- Session, membership, permission, and audit model
- Revocation, cleanup, and CSRF rules
- API and Angular integration impact
- Migration or rollout guidance
- Risks and tradeoffs

Example inputs:
- `design the canonical Better Auth-linked identity projection and membership schema`
- `design RBAC and audit schema for owner, admin, operator, and viewer`
- `design CSRF and session revocation patterns for Better Auth-authenticated write endpoints`
- `design the canonical auth schema model that other implementation prompts must follow`