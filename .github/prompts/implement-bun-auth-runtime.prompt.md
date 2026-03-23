---
name: "Implement Bun Auth Runtime"
description: "Implement Bun + Elysia Better Auth integration, SurrealDB connection, authorization, and env-based security configuration"
argument-hint: "Describe the auth runtime, session flow, or backend security slice to implement"
agent: "agent"
---

Implement the Bun + Elysia auth runtime for: $ARGUMENTS

Fixed backend runtime context:
- Use Better Auth as the source of truth for authentication and session identity.
- Bun + Elysia is the source of truth for backend authorization enforcement, Better Auth integration, and persistence-side policy checks.
- SurrealDB Cloud remains the persistence target: `https://crimson-shadow-06ehlgqoqlrbp6dokk1428etgg.aws-use1.surreal.cloud/`
- Angular uses Better Auth-backed identity state and API-backed route guards.
- Follow the canonical session and RBAC model in [design-session-and-rbac-schema.prompt.md](design-session-and-rbac-schema.prompt.md).
- Do not introduce a second application auth cookie by default; rely on Better Auth-managed session cookies.
- Default RBAC roles are `owner`, `admin`, `operator`, and `viewer`.
- Require CSRF protection for cookie-authenticated write endpoints using the canonical schema model and Better Auth-authenticated browser flows.
- Keep authentication and authorization audit records in SurrealDB as application audit history, not as the source of truth for Better Auth sessions.
- Do not hardcode credentials, cookie secrets, tokens, database secrets, namespaces, or database names in source files.
- Assume secrets and connection settings are provided through environment variables and wired through Bun runtime configuration.

Instructions:
- Start by reading the current workspace structure and relevant files before making recommendations or changes.
- Treat this as an implementation task, not just an architecture discussion.
- Implement the smallest coherent backend auth slice needed for the request.
- Prefer explicit env-based configuration for Better Auth secrets and runtime settings together with SurrealDB URL, namespace, database, and runtime mode.
- Keep SurrealDB connection setup, Better Auth verification logic, local projection queries, CSRF checks, and RBAC checks modular and testable.
- Use explicit SurrealDB projection revocation and cleanup query patterns for local session and audit lifecycle management.
- When the request touches login, logout, current-user, or access checks, ensure the resulting APIs are suitable for Angular route guards and session-aware UI.
- Preserve repository conventions, especially the current zoneless Angular setup and focused incremental changes.
- Validate changes with the most relevant build, error check, or targeted runtime check.

Response format:
- Backend auth slice implemented
- Connection and environment configuration
- Better Auth, CSRF, and RBAC behavior
- Files changed
- Validation
- Risks and follow-up

Example inputs:
- `implement SurrealDB connection bootstrap and Better Auth env-based auth config for Bun`
- `implement current-user, role-check, and Better Auth-authenticated access endpoints`
- `implement CSRF validation for cookie-authenticated write routes`
- `implement session projection revocation and cleanup queries in the auth service`
