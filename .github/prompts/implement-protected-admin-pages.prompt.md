---
name: "Implement Protected Admin Pages"
description: "Implement protected admin pages and role-based guards using this workspace's session and RBAC model"
argument-hint: "Describe the admin page, guard behavior, or role-based restriction to implement"
agent: "agent"
---

Implement protected admin pages and role-based guards for: $ARGUMENTS

Fixed auth and RBAC context:
- This workspace is building an authenticated operations dashboard for scrapers, cron jobs, notifications, and admin workflows.
- Use Better Auth for authentication and session identity.
- Bun + Elysia must verify Better Auth-authenticated requests and enforce backend authorization.
- Keep Angular auth state derived from Better Auth-backed identity checks together with API-backed route guards, not from client-only token parsing.
- Follow the canonical session and RBAC model in [design-session-and-rbac-schema.prompt.md](design-session-and-rbac-schema.prompt.md).
- Use role-based access control for protected admin features.
- Default roles for this system are `owner`, `admin`, `operator`, and `viewer`.
- Default RBAC model: `owner` full access and role management; `admin` operational configuration and user management except ownership transfer; `operator` operational execution access without user or role administration; `viewer` read-only access.
- Apply authorization at both the API layer and the Angular routing or page-access layer. Do not rely on UI hiding alone.
- Use SurrealDB Cloud as the target database endpoint: `https://crimson-shadow-06ehlgqoqlrbp6dokk1428etgg.aws-use1.surreal.cloud/`
- Do not hardcode credentials, cookie secrets, tokens, or database secrets in source files.
- Assume secrets and connection settings are provided through environment variables.
- For this workspace, prefer zoneless SSR without client hydration unless a strong technical reason justifies changing that decision.

Instructions:
- Start by reading the current workspace structure and relevant files before making recommendations or changes.
- Treat this as an implementation task, not just an architecture discussion.
- Implement only the smallest coherent admin slice needed for the request.
- Focus on protected admin pages, route guards, role checks, unauthorized handling, and current-user or session-aware access flows.
- Use explicit role checks rather than vague boolean flags when the request concerns admin capabilities.
- For cookie-authenticated write endpoints used by admin pages, require CSRF protection by default using the canonical session model from the schema prompt.
- Keep responsibilities separated across Angular pages, route guards, API handlers, session validation, and authorization logic.
- When admin access changes session state or user access, use explicit SurrealDB revocation or cleanup query patterns from the canonical schema model rather than ad hoc record deletion.
- If the slice needs new session or RBAC data, describe or implement only the minimal additions required by the request.
- Preserve repository conventions, especially the current zoneless Angular setup and focused incremental changes.
- Validate changes with the most relevant build, error check, or targeted runtime check.

Response format:
- Admin slice implemented
- Guard and authorization behavior
- Files changed
- Validation
- Risks and follow-up

Example inputs:
- `implement an admin-only job runs page with route guards and API authorization`
- `implement an owner-or-admin settings page with unauthorized redirects`
- `implement role-based guards for schedules, notifications, and audit pages`
- `implement a current-user role check flow for protected admin navigation`