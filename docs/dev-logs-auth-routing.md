# Dev Logs: Better Auth Routing and SSR Crash Guard

## Purpose

Track server behavior around `/api/auth` and other API paths to ensure they never fall through to Angular SSR and crash the server process.

## Added Runtime Logs

The server now emits timestamped logs with `[dev]` prefix:

- API request start
- Elysia onError details
- SSR render start/done/error

## New Route Safety Guards

1. `GET/POST/... /api/auth` returns JSON guidance:

```json
{
  "ok": true,
  "message": "Better Auth mounted. Use /api/auth/* endpoints."
}
```

2. Any unknown `/api/*` path now returns JSON 404 and never reaches Angular SSR:

```json
{
  "error": "Unknown API route",
  "path": "/api/whatever"
}
```

This prevents Angular router errors like `NG04002` for `/api/*` URLs.

## Manual Verification Steps

1. Start server:

```bash
bun run server.ts
```

2. Hit endpoints:

```bash
curl http://localhost:4201/api/auth
curl http://localhost:4201/api/auth/session
curl http://localhost:4201/api/does-not-exist
```

3. Confirm:

- Server stays alive.
- `[dev]` logs show request traces.
- `/api/does-not-exist` returns JSON 404.
- No Angular `NG04002` crash from `/api/*` fetches.

## Notes

- `/api/auth/session` may return unauthenticated response until sign-in flow is configured and cookies are present.
- If you expose the server via tunnel, keep `BETTER_AUTH_URL` and trusted origins in sync.

## Current Blocker (March 23, 2026)

- Runtime startup currently fails before request handling with:
  - `panic(main thread): Internal assertion failure`
  - Bun version: `1.3.10-canary.4`
- This occurs on `bun run server.ts`, so API-path runtime verification is blocked in this environment.
- Build and TypeScript checks pass, and route guards/logging are in place in code.
