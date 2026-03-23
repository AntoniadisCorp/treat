# Treaty Docs Architect: Ultimate EdenClient + Better Auth Integration

## Executive Summary

This document defines the recommended end-state for integrating Better Auth (with `dash()` plugin) into Treaty while preserving the project's core value proposition: end-to-end typing from Elysia route schema into Angular via the custom RxJS Eden client.

The current system already has strong typed route inference, but it is not yet auth-aware at the transport layer. The "ultimate" version of the client should:

1. Preserve route and payload inference from `App`.
2. Support cookie-based Better Auth sessions reliably (browser + SSR).
3. Allow optional Bearer token mode for machine/API calls.
4. Return structured success/error metadata consistently.
5. Be configurable without sacrificing Angular injection-context safety.

---

## Goals, Constraints, and Inputs

## Goals

- Integrate Better Auth server handler into Elysia cleanly.
- Enable Better Auth `dash()` infra plugin.
- Evolve Eden client so authenticated calls work by default.
- Keep current API ergonomics (`api.client.id["1"].get(...)`) and typing model.

## Constraints (from this repo)

- Bun + Elysia SSR server in `server.ts`.
- Angular zoneless setup and custom SSR path.
- Custom Eden client uses Angular `HttpClient` and `Observable` responses.
- `edenClient()` must stay in Angular injection context.

## Required Inputs

- Better Auth env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- Optional infra vars for `dash()`: `BETTER_AUTH_API_URL`, `BETTER_AUTH_KV_URL`, `BETTER_AUTH_API_KEY`.
- Decision on session storage mode: database-backed vs stateless cookie mode.

---

## Current-State Analysis

### Backend topology

- Elysia API group is mounted under `/api` and SSR catch-all serves Angular afterward.
- App type export used for client typing: `server.ts:112`.

### Current Eden client shape

- Type namespace starts at `src/libs/edenclient/types.ts:34`.
- Runtime proxy factory in `src/libs/edenclient/index.ts:58`.
- Query assembly helper in `src/libs/edenclient/utils/other.ts:3`.
- Application usage in `src/app/api.service.ts:9`.

### Key gaps relative to Better Auth docs

1. No cookie credential policy in Eden client calls.
2. Error path currently maps errors to a value (`EdenFetchError`) rather than preserving an explicit response envelope.
3. No first-class auth context abstraction (cookie or bearer) in client options.
4. No SSR guidance for session propagation from incoming request to API calls initiated during render.

---

## What Better Auth + Elysia Docs Require (Relevant to Treaty)

1. Mount Better Auth handler on Elysia (`auth.handler`) before wildcard handlers.
2. Keep auth routes reachable under `/api/auth/*` (default Better Auth base path).
3. Configure CORS with `credentials: true` for cross-origin development scenarios.
4. Use Better Auth cookie session as the default auth mechanism for browser clients.
5. Add `dash()` plugin in server auth config; provide infra keys if using dashboard/analytics endpoints.

---

## Target Architecture (Ultimate)

## Layer 1: Auth server

- `auth.ts` exports Better Auth instance.
- Elysia mounts `auth.handler` before SSR catch-all.
- Optional route macro uses `auth.api.getSession({ headers })` for protected endpoints.

## Layer 2: Transport contract

Enhance Eden client runtime to support:

- `withCredentials` for cookie sessions.
- Optional `authToken` provider for bearer mode.
- `observe: "response"` and canonical response mapping:
  - `data`
  - `error`
  - `status`
  - `headers`

## Layer 3: Typed surface

Keep `EdenClient.Create<App>` unchanged for route inference, but extend method input with a small optional transport metadata block that does not leak into Elysia schema semantics.

---

## Design Decisions (and Why)

## Decision 1: Keep Better Auth cookie-first

Why:
- Better Auth is designed around cookie sessions and `getSession` semantics.
- Fits browser flows and avoids token management complexity for most app calls.

Impact on Eden client:
- Must support credentialed requests where needed.

## Decision 2: Keep route typing in `types.ts` and runtime behavior in `index.ts`

Why:
- Current architecture already separates type-level route inference from runtime request dispatch.
- Avoids destabilizing existing route inference logic.

## Decision 3: Introduce transport options, not route schema changes

Why:
- Auth mechanics are transport concerns, not API schema concerns.
- Preserves compatibility with generated Elysia route schema typing.

## Decision 4: Move from implicit error values to explicit response envelope

Why:
- Existing resolver code assumes `.data` on success.
- Explicit envelope avoids type confusion and allows consistent UI handling.

---

## Implementation Blueprint

## Phase A: Better Auth server wiring

1. Create `auth.ts` at project root.
2. Configure Better Auth with `basePath: "/api/auth"`.
3. Add plugin:

```ts
import { dash } from "@better-auth/infra";

plugins: [
  dash({
    apiUrl: process.env.BETTER_AUTH_API_URL,
    kvUrl: process.env.BETTER_AUTH_KV_URL,
    apiKey: process.env.BETTER_AUTH_API_KEY,
  }),
]
```

4. Mount `auth.handler` in `server.ts` before `*.*` and `*` routes.

## Phase B: Eden client transport hardening

Refactor `src/libs/edenclient/index.ts` to add:

- `EdenClientRuntimeOptions`:
  - `withCredentials?: boolean`
  - `getAuthToken?: () => string | Promise<string> | undefined`
  - `defaultHeaders?: Record<string, string>`
- Request option merge order:
  - defaults
  - client-level overrides
  - call-level `$headers`
- `Authorization` header injection when bearer token exists.

## Phase C: Response normalization

For each HTTP method:

- Request with `observe: "response"`.
- Map to:

```ts
{
  data,
  error: null,
  status,
  headers: normalizedHeaders
}
```

- In error path:

```ts
{
  data: null,
  error: {
    message,
    status,
    body
  },
  status,
  headers: normalizedHeaders
}
```

This aligns better with Better Auth client/server error handling expectations.

## Phase D: Angular consumption model

Update `ApiService` so one client instance is created with env-driven base URL and auth-aware transport defaults.

Recommended default for browser mode:

- `withCredentials: true` when frontend and API run on different dev origins.

---

## Suggested Type Evolution for EdenClient

Current call shape already supports `$query` and `$headers`. Add an optional `$fetch` block:

```ts
$params?: {
  $query?: Record<string, string>;
  $headers?: Record<string, unknown>;
  $fetch?: {
    withCredentials?: boolean;
    authMode?: "cookie" | "bearer" | "none";
  };
}
```

Rationale:
- Keeps callsite ergonomics close to existing pattern.
- Allows per-call control when needed (for public vs authenticated endpoints).

---

## Security Model Notes

1. Never rely on inferred `baseURL` in production; set `BETTER_AUTH_URL` explicitly.
2. Set strict `trustedOrigins` in Better Auth config.
3. Use HTTPS + secure cookies in production.
4. If adding bearer support, avoid long-lived browser tokens and treat it as non-default.
5. If using `dash()` infra APIs, provide `BETTER_AUTH_API_KEY` and keep it server-only.

---

## Performance and Operational Notes

- Better Auth session cookie caching can reduce DB hits for frequent `getSession` checks.
- For sensitive operations requiring freshest auth state, call session with cache bypass patterns where applicable.
- Ensure SSR flow does not accidentally cache authenticated pages in global HTML cache without user scoping.

Important for this repo:
- Current SurrealDB HTML cache keys by URL only. If authenticated pages are introduced, cache key must include user/session boundary or bypass cache for auth-sensitive routes.

---

## Verification Checklist

## Build and runtime

1. `bun i`
2. `bun run build`
3. `bun run server.ts`

## Auth endpoint checks

1. `GET /api/auth/session` responds and sets/reads cookies correctly.
2. Sign-in/sign-out flows update session state as expected.

## Eden client checks

1. Existing typed route calls still compile.
2. Authenticated route call succeeds with session cookie.
3. Unauthenticated call returns normalized error envelope.

## SSR checks

1. Anonymous SSR pages still cache and render.
2. Auth pages do not leak cached HTML between users.

---

## Migration Path (Low-Risk)

1. Ship Better Auth mounting first (no Eden changes).
2. Add Eden runtime options with backward-compatible defaults.
3. Enable response normalization behind a small feature flag in service layer.
4. Migrate resolver/component usage to explicit `data/error` handling.
5. Add tests around auth-required API route and resolver behavior.

---

## Concrete Cross-References

- Eden type system entry: `src/libs/edenclient/types.ts:34`
- Eden runtime proxy: `src/libs/edenclient/index.ts:58`
- Eden error mapping: `src/libs/edenclient/index.ts:87`
- Query composition utility: `src/libs/edenclient/utils/other.ts:3`
- Current client instantiation: `src/app/api.service.ts:9`
- Elysia `/api` group: `server.ts:37`
- SSR wildcard route: `server.ts:57`
- Shared app type export: `server.ts:112`
- Existing infra dependency: `package.json:21`

---

## Final Recommendation

The best long-term direction is to keep your custom RxJS Eden client as the typed API transport for app-domain endpoints, while introducing Better Auth as a dedicated auth subsystem mounted in Elysia and consumed through cookie sessions.

In practical terms: do not replace Eden client; evolve it into an auth-aware transport with explicit credentials behavior and normalized responses. This preserves Treaty’s strongest architectural advantage (type-safe E2E API ergonomics) while gaining production-grade authentication and infra observability via `dash()`.
