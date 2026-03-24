# Prompt Workflow

This file is the step-by-step runbook for using the prompt files in this repository.

## Purpose

Use this sequence when turning the current Treat proof of concept into the planned production system with:

- Angular dashboard UI
- Bun + Elysia backend
- Better Auth identity and application-owned authorization
- SurrealDB Cloud persistence
- Bun-native in-process cron
- Resend email delivery

Important repo context:

- The current repository is still a proof of concept.
- The current runtime intentionally stays zoneless SSR without client hydration.
- The current `server.ts` still uses SurrealDB as an HTML cache for SSR output today.
- New auth, session, RBAC, scheduler, and application-data persistence work should be treated as a staged rework, not as an assumption that the repo already has those subsystems.

## Required Reading

Read these first before using the prompts:

1. [README.md](../README.md)
2. [copilot-instructions.md](./copilot-instructions.md)

## Prompt Order

Run the prompts in this order.

1. Platform architecture

   Use [design-scraper-platform.prompt.md](./prompts/design-scraper-platform.prompt.md)

   Goal:
   - confirm the end-state architecture
   - keep Bun + Elysia as backend orchestration
   - keep Angular zoneless SSR without hydration
   - keep SurrealDB Cloud as persistence target
   - keep Bun-native in-process cron and Resend as defaults

   Example:
   - `/design-scraper-platform rework the current proof of concept into the production architecture for auth, scrapers, cron, notifications, and admin workflows`

2. Canonical auth schema

   Use [design-session-and-rbac-schema.prompt.md](./prompts/design-session-and-rbac-schema.prompt.md)

   Goal:
   - define the canonical Better Auth-linked identity or session projection schema
   - define membership, role, permission, and RBAC records
   - define audit schema
   - define CSRF, revocation, and cleanup rules

   Example:
   - `/design-session-and-rbac-schema design the canonical Better Auth identity projection, membership, RBAC, permission, and audit model this system must follow`

3. SurrealDB application schema

   Use [design-surrealdb-schema.prompt.md](./prompts/design-surrealdb-schema.prompt.md)

   Goal:
   - design tables and relations for schedules, runs, notifications, and dashboard reads
   - design query patterns for API, cron, and workers
   - keep the canonical auth schema from the previous step as the source of truth

   Example:
   - `/design-surrealdb-schema design the application schema for schedules, job runs, notifications, dashboard reads, and their integration with the canonical auth schema`

4. Backend auth runtime

   Use [implement-bun-auth-runtime.prompt.md](./prompts/implement-bun-auth-runtime.prompt.md)

   Goal:
   - implement Better Auth integration in Bun + Elysia
   - implement SurrealDB connection and env-based runtime config
   - implement current-user, role-check, CSRF, and projection lifecycle behavior

   Example:
   - `/implement-bun-auth-runtime implement Better Auth verification, SurrealDB connection bootstrap, current-user endpoint, and CSRF enforcement`

5. Authenticated dashboard slices

   Use [implement-authenticated-dashboard-slice.prompt.md](./prompts/implement-authenticated-dashboard-slice.prompt.md)

   Goal:
   - implement dashboard features that depend on authenticated state
   - use Better Auth-backed identity together with API-backed guards
   - follow the canonical auth schema from step 2

   Example:
   - `/implement-authenticated-dashboard-slice implement a protected dashboard shell and session-aware navigation using the canonical auth model`

6. Protected admin pages and guards

   Use [implement-protected-admin-pages.prompt.md](./prompts/implement-protected-admin-pages.prompt.md)

   Goal:
   - implement admin-only pages
   - enforce `owner`, `admin`, `operator`, and `viewer` rules
   - enforce authorization in both Angular and Bun + Elysia

   Example:
   - `/implement-protected-admin-pages implement an admin-only job runs page with API authorization and route guards`

7. Maintenance and targeted fixes

   Use [fix-typescript-issue.prompt.md](./prompts/fix-typescript-issue.prompt.md)

   Goal:
   - fix focused regressions introduced while building the platform

   Example:
   - `/fix-typescript-issue Type mismatch in Better Auth identity projection query`

## Execution Rules

When using the prompt set:

1. Do not skip step 2 if auth or RBAC work is involved.
2. Treat [design-session-and-rbac-schema.prompt.md](./prompts/design-session-and-rbac-schema.prompt.md) as the canonical source for session, membership, permission, and audit structure.
3. If an implementation prompt conflicts with the canonical schema prompt, update the implementation to match the canonical schema unless you intentionally decide to revise the canonical design first.
4. Always build after meaningful code changes:
   - `bun run build`
5. Start the server only after a successful build:
   - `bun run server.ts`
6. Preserve zoneless SSR and do not re-enable hydration unless you are explicitly redesigning that runtime decision.

## When To Revise Prompts

Revise the canonical prompts first when any of these change:

1. Better Auth identity model or organization model
2. RBAC roles or permissions
3. SurrealDB schema conventions
4. Bun cron strategy
5. Email provider choice

Then update the implementation prompts so they continue to reference the canonical model.