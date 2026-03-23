---
name: "Design SurrealDB Schema"
description: "Design SurrealDB schema, access patterns, functions, and query strategy for this workspace"
argument-hint: "Describe the data domain, workflow, or SurrealDB problem to design"
agent: "agent"
---

Design the SurrealDB schema, access patterns, functions, and query strategy for: $ARGUMENTS

Fixed database context:
- Use SurrealDB Cloud as the target database endpoint: `https://crimson-shadow-06ehlgqoqlrbp6dokk1428etgg.aws-use1.surreal.cloud/`
- Do not hardcode credentials, tokens, namespaces, or database secrets in source files.
- Assume secrets and connection settings are provided through environment variables.
- This workspace is building an authenticated dashboard with scraper jobs, cron scheduling, notifications, and future admin features.
- The database design must support API handlers, background workers, schedulers, and dashboard read models.
- Use Better Auth as the source of truth for authentication and session identity data.
- Use SurrealDB to store application-facing identity projections, membership projections, permission-relevant records, role assignments, and audit history that follow the canonical model in [design-session-and-rbac-schema.prompt.md](design-session-and-rbac-schema.prompt.md).
- Default RBAC roles for this system are `owner`, `admin`, `operator`, and `viewer`.
- Default RBAC model: `owner` full access and role management; `admin` operational and user management except ownership transfer; `operator` operational execution access only; `viewer` read-only access.

Instructions:
- Start by reading the current workspace structure and relevant files before making recommendations.
- Optimize for correctness, maintainability, security, and operational clarity.
- Design tables, records, relations, indexes, permissions boundaries, and naming conventions that fit the product domain.
- Distinguish clearly between transactional data, operational job data, notification history, and audit trails.
- Propose query patterns for API reads, writes, scheduler lookups, worker updates, and dashboard reporting.
- Include exact session cleanup and revocation query patterns for Better Auth-linked identity or session projections by default, including lookup by Better Auth session identifier, revocation projection updates, and cleanup of expired or revoked projection records.
- Include RBAC schema and membership patterns that support route guards, API authorization, and admin-only features.
- When useful, propose SurrealDB functions, events, or computed patterns, but prefer simple and supportable designs over clever ones.
- Explain how the schema integrates with Bun + Elysia APIs, workers, and Angular dashboard data needs.
- If the request implies implementation, produce the smallest coherent slice of code or query definitions and validate it.
- If the request is architectural only, do not write code unless it is needed to demonstrate a critical design point.

Response format:
- Recommended schema design
- Access and query patterns
- Functions, events, or reusable query patterns
- API and worker integration
- Migration or rollout plan
- Risks and tradeoffs

Example inputs:
- `design the schema for users, sessions, roles, and audit logs`
- `design the schema and query patterns for schedules, scraper runs, results, retries, and alerts`
- `design SurrealDB functions and access patterns for notification delivery state`
- `design the read model for the admin dashboard and job history pages`