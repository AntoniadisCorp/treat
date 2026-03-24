# Better Auth + Elysia + `dash()` Integration (Treat Project)

This guide is tailored to this repo's architecture:
- Bun runtime
- Elysia server in `server.ts`
- Angular SSR catch-all routes
- Existing API routes under `/api/*`

The goal is to integrate Better Auth and add:

```ts
import { dash } from "@better-auth/infra";

plugins: [
  dash()
]
```

## 1. Install Required Packages

`@better-auth/infra` is already present in this project. You still need Better Auth core and Elysia CORS plugin.

```bash
bun add better-auth @elysiajs/cors
```

## 2. Add Environment Variables

Create or update `.env` (or your deployment env):

```env
# Required for Better Auth
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:4201

# Optional for Better Auth Infra (dash telemetry/admin APIs)
BETTER_AUTH_API_URL=
BETTER_AUTH_KV_URL=
BETTER_AUTH_API_KEY=
```

Notes:
- In production, always set `BETTER_AUTH_SECRET`.
- Keep `BETTER_AUTH_URL` aligned with where your Bun/Elysia server is reachable.

## 3. Create Auth Config File

Create `auth.ts` in the project root (same level as `server.ts`):

```ts
import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";

export const auth = betterAuth({
  appName: "Treat",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4201",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:4200",
    "http://localhost:4201",
  ],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    dash({
      apiUrl: process.env.BETTER_AUTH_API_URL,
      kvUrl: process.env.BETTER_AUTH_KV_URL,
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
  ],
});
```

Why these values:
- `basePath: "/api/auth"` keeps auth endpoints under your existing `/api` namespace.
- `trustedOrigins` should include your Angular dev/SSR origins.
- `dash(...)` adds infra dashboard/audit/event endpoints and tracking hooks.

## 4. Mount Better Auth in Elysia (`server.ts`)

Update `server.ts` imports:

```ts
import { cors } from "@elysiajs/cors";
import { auth } from "./auth";
```

Then mount CORS + auth before wildcard routes (`*.*` and `*`):

```ts
const app = new Elysia()
  .use(
    cors({
      origin: ["http://localhost:4200", "http://localhost:4201"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .mount(auth.handler)
  .derive(({ request: { url } }) => {
    const _url = new URL(url);

    return {
      protocol: _url.protocol.split(":")[0],
      originalUrl: _url.pathname + _url.search,
      baseUrl: "",
    };
  })
  // ... keep your existing /api group and SSR/static handlers
```

Important:
- `mount(auth.handler)` must run before your SSR catch-all routes.
- Keeping Better Auth under `/api/auth/*` prevents conflicts with Angular SSR routes.

## 5. (Optional) Protect Elysia Routes With Session Macro

If you want protected API endpoints:

```ts
import { Elysia } from "elysia";
import { auth } from "./auth";

const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
```

Then use `auth: true` on routes that require authentication.

## 6. Angular Client (Optional, For Auth UI Flows)

If you need auth actions from Angular:

```ts
import { createAuthClient } from "better-auth/client";
import { dashClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:4201",
  plugins: [dashClient()],
});
```

This enables calls like:
- `authClient.getSession()`
- `authClient.signIn.email(...)`
- `authClient.dash.getAuditLogs(...)`

## 7. Verify Integration

1. Build and run:

```bash
bun run build
bun run server.ts
```

2. Confirm auth endpoints respond (example):

```bash
curl http://localhost:4201/api/auth/session
```

3. Confirm existing routes still work:
- `/api/example`
- Angular SSR pages (for example `/`, `/post/1`)

## 8. Production Notes

- Set secure cookie behavior and HTTPS in production.
- Restrict `trustedOrigins` to real frontend domains only.
- If using the infra APIs (`dash` + optional `sentinel`), provide `BETTER_AUTH_API_KEY`.
- Do not commit secrets into source control.

---

If you want, the next step is I can apply these changes directly (create `auth.ts`, patch `server.ts`, and add a minimal Angular `auth-client` service) in this repository.
