---
name: "Design Scraper Platform"
description: "Recommend a robust architecture and implementation plan for this scraper, cron, email, and dashboard platform"
argument-hint: "Describe the feature, architectural decision, or subsystem to design"
agent: "agent"
---

Design the best robust approach for this workspace for: $ARGUMENTS

Fixed platform context:
- This product is an authenticated dashboard for scraper operations, cron jobs, email notifications, and future admin features.
- Prefer stable, supportable choices over experimental framework combinations.
- Keep Angular focused on the authenticated dashboard UI.
- Keep Bun + Elysia focused on API, scheduling, and worker orchestration.
- Use Better Auth as the source of truth for authentication and session identity.
- Bun + Elysia is the source of truth for backend authorization enforcement, Better Auth integration, and persistence-side policy checks.
- SurrealDB-backed application records are the source of truth for memberships, roles, permissions, and audit history.
- Angular must use Better Auth-backed identity state together with API-backed route and data authorization checks.
- Use SurrealDB Cloud as the target database endpoint: `https://crimson-shadow-06ehlgqoqlrbp6dokk1428etgg.aws-use1.surreal.cloud/`
- SurrealDB Cloud remains the persistence target for application data, sessions, schedules, runs, notifications, and audit records.
- Do not introduce a second application auth cookie by default; rely on Better Auth-managed session cookies and verified Better Auth session context.
- Default RBAC roles for this system are `owner`, `admin`, `operator`, and `viewer`.
- Use this RBAC model by default: `owner` has full system and role-management access; `admin` manages operational configuration and users except ownership transfer; `operator` manages scraper and notification operations without user or role administration; `viewer` has read-only dashboard access.
- Use CSRF protection for all cookie-authenticated write endpoints by default.
- Use Bun-native in-process cron as the default scheduler strategy.
- Use Resend as the default email and notification provider.
- Do not hardcode credentials or tokens in source files; assume secrets are provided through environment variables.
- For this workspace, prefer zoneless SSR without client hydration unless a strong technical reason justifies changing that decision.

Instructions:
- Start by reading the current workspace structure and relevant files before making recommendations.
- Optimize for operational reliability, maintainability, security, and observability.
- Prefer Bun-native in-process cron to create or enqueue due work, and keep execution paths explicit for retries and recovery.
- Prefer queue-like work orchestration backed by persisted job records even when cron runs in-process.
- Separate concerns clearly between dashboard, API, scheduler, workers, and persistence.
- When proposing data storage, distinguish between user/session data, schedules, job runs, scraper results, notifications, and audit logs.
- When proposing auth, use Better Auth for identity and follow the canonical schema model in [design-session-and-rbac-schema.prompt.md](design-session-and-rbac-schema.prompt.md) for application authorization.
- When proposing backend changes, explain how the design affects APIs, workers, deployment, and failure handling.
- When appropriate, recommend incremental implementation steps instead of a big-bang rewrite.
- If the request implies code changes, implement the smallest coherent slice and validate it.
- If the request is architectural only, do not write code unless it is necessary to demonstrate a critical design point.

Response format:
- Recommended choice
- Why this is the best option
- Architecture design
- Data model and infrastructure impact
- Implementation plan
- Risks and tradeoffs

Example inputs:
- `design auth, sessions, and route protection for the dashboard`
- `design the scheduler and worker pipeline for scrapers and email alerts`
- `design the SurrealDB schema for schedules, runs, notifications, and audit logs, functions, and queries, and how to integrate with the API and workers`
- `rework the current proof of concept into a production-ready admin platform`