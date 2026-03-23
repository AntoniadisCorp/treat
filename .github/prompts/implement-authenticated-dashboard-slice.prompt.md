---
name: "Implement Authenticated Dashboard Slice"
description: "Implement a focused authenticated dashboard feature using cookie and session auth in this workspace"
argument-hint: "Describe the dashboard page, workflow, or authenticated slice to implement"
agent: "agent"
---

Implement an authenticated dashboard slice for: $ARGUMENTS

Fixed platform and auth context:
- This workspace is building an authenticated operations dashboard for scrapers, cron jobs, notifications, and admin workflows.
- Use Better Auth for authentication and session identity.
- Bun + Elysia must verify Better Auth-authenticated requests and enforce backend authorization.
- Angular should use Better Auth-backed identity state together with API-backed route and data guards, not client-only role assumptions.
- Do not introduce a second application auth cookie by default; rely on Better Auth-managed session cookies.
- Follow the canonical session and RBAC model in [design-session-and-rbac-schema.prompt.md](design-session-and-rbac-schema.prompt.md).
- Default RBAC roles for this system are `owner`, `admin`, `operator`, and `viewer`.
- Default RBAC model: `owner` full system and role-management access; `admin` manages operational configuration and users except ownership transfer; `operator` manages scraper, schedule, run, and notification operations without user or role administration; `viewer` has read-only dashboard access.
- Use SurrealDB Cloud as the target database endpoint: `https://crimson-shadow-06ehlgqoqlrbp6dokk1428etgg.aws-use1.surreal.cloud/`
- Do not hardcode credentials, cookie secrets, tokens, or database secrets in source files.
- Assume secrets and connection settings are provided through environment variables.
- For this workspace, prefer zoneless SSR without client hydration unless a strong technical reason justifies changing that decision.

Instructions:
- Start by reading the current workspace structure and relevant files before making recommendations or changes.
- Treat this as an implementation task, not just an architecture discussion.
- Design and implement the smallest coherent authenticated slice that fits the request.
- Keep responsibilities separated across Angular UI, route access control, Elysia API handlers, session storage, and data access.
- When auth is involved, use Better Auth for identity and follow the schema prompt above for local identity projections, membership, permission, role, and audit records.
- For cookie-authenticated write endpoints, require CSRF protection by default using the canonical session model from the schema prompt.
- When session lifecycle logic is part of the slice, use explicit projection revocation and cleanup query patterns rather than implicit expiration only.
- If new data is required, describe or implement the minimal schema/session records needed for the slice.
- Preserve repository conventions, especially the current zoneless Angular setup and focused incremental changes.
- Validate changes with the most relevant build, error check, or targeted runtime check.

Response format:
- Slice implemented
- Auth and session behavior
- Files changed
- Validation
- Risks and follow-up

Example inputs:
- `implement login, logout, and a protected dashboard shell`
- `implement a protected schedules page that lists scraper schedules for the current user`
- `implement an admin-only job runs page with route protection and session-based authorization`
- `implement session-aware navigation and a current-user endpoint for the dashboard`