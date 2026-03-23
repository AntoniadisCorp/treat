# Treaty — Copilot Instructions

Full-stack Angular 17 + Elysia (Bun) SSR proof-of-concept demonstrating end-to-end type safety via a custom RxJS-based Eden/Treaty client.

## Commands

| Task | Command |
|---|---|
| Install | `bun i` |
| Build Angular app | `bun run build` (alias: `ng build`) |
| Run server | `bun run server.ts` |
| Run server (watch) | `bun run --watch server.ts` |
| Build + watch | `bun run watch` |
| Run tests | `bun test` |

> **Order matters:** `bun run server.ts` requires a built app in `dist/treaty/browser/`. Always `bun run build` first.

## Architecture

```
server.ts           ← Elysia HTTP server (Bun runtime)
  └── GET /api/*    ← API routes
  └── GET *.*       ← Static files from dist/treaty/browser/
  └── GET *         ← Angular SSR via CommonEngine + SurrealDB HTML cache

src/
  app/
    api.service.ts  ← Typed Eden client instantiation
    app.routes.ts   ← Routes + functional resolvers
    post/           ← Feature component (co-located resolver)
  libs/
    edenclient/     ← Custom Eden/Treaty client (RxJS, NOT fetch/promises)

treaty-utilities/
  mock-zone.ts               ← Required Zone.js shim for zoneless Angular
  mock-create-histogram.ts   ← Patches perf_hooks for Angular's profiler
  setup-tests.ts             ← Bun test environment (happy-dom + TestBed)
```

## End-to-End Type Safety

The critical pattern: `server.ts` exports `export type App = typeof app`. `ApiService` imports this type and passes it to `edenClient<App>()`, giving the client full IDE inference of all routes, request/response shapes, and query params.

```typescript
// server.ts
export type App = typeof app   // ← export Elysia app type

// api.service.ts
import type { App } from 'server'
client = edenClient<App>('http://localhost:4201').api
```

## Key Conventions

**Zoneless Angular** — No Zone.js. All components must use `ChangeDetectionStrategy.OnPush`. The `mock-zone.ts` shim is *required* as a workaround for Angular internals that still reference `Zone.current`. It is imported at the top of `main.ts` and `server.ts`.

**Eden client injection context** — `edenClient()` calls `inject(HttpClient)` internally. It must be called in an Angular injection context (class field initializer or constructor), never lazily.

```typescript
// ✅ correct
class MyService {
  client = edenClient<App>(baseUrl).api
}

// ❌ wrong – outside injection context
let client: ReturnType<typeof edenClient>
```

**Functional resolvers co-located with components** — Resolvers live in the same file as the component they feed and are spread into `resolve`:

```typescript
// post.component.ts
export const resolvePost = { post: (route) => inject(ApiService).client... }

// app.routes.ts
resolve: { ...resolvePost }
```

**Default component export** — Components loaded via `loadComponent()` must use `export default class`.

**Signal inputs** — Prefer `input()` signals (`input<T>()`) over `@Input()` for new components. Route params/data are auto-bound via `withComponentInputBinding()`.

**`OnPush` everywhere** — No `Default` change detection. Every component that ever gets created must have `changeDetection: ChangeDetectionStrategy.OnPush`.

## Testing (Bun, not Jasmine/Jest)

Tests use `bun:test` APIs — **not** Jasmine or Jest.

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'
```

- `setup-tests.ts` is auto-preloaded via `bunfig.toml` — it registers happy-dom and initialises `TestBed` with `provideZonelessChangeDetection()`.
- Use `fixture.whenStable()` instead of `tick()` or repeated `fixture.detectChanges()` loops.
- Mock dependencies by directly replacing component properties; no `jasmine.createSpy` / `jest.fn()` / `vi.fn()`.
- Signal inputs (`input()`) are not trivially settable in tests — prefer `@Input()` for testability or avoid asserting them in specs.

## Polyfills & Preloads

| File | When loaded | Purpose |
|---|---|---|
| `treaty-utilities/mock-create-histogram.ts` | Always (bunfig preload + server.ts import) | Patches `perf_hooks.createHistogram` stub for Angular profiler |
| `treaty-utilities/mock-zone.ts` | main.ts + server.ts (first import) | Provides a fake `Zone` global for zoneless Angular |
| `treaty-utilities/setup-tests.ts` | `bun test` only (bunfig test preload) | happy-dom + TestBed init |

## Notable Gotchas

- **`ɵprovideZonelessChangeDetection`** is a private Angular API (v17). It will eventually become `provideZonelessChangeDetection` (no `ɵ` prefix) in a stable release.
- **`@types/bun`** is listed in `tsconfig.app.json`'s `types` array so Angular's build sees Bun globals. Remove it if targeting Node.
- **No Angular SSR builder** — SSR runs inside the Elysia server directly. Do not use `ng run treaty:server`.
- **SurrealDB is an in-memory HTML cache only** — it stores rendered Angular HTML keyed by URL. It is not a general application database.
- **`useDefineForClassFields: false`** in tsconfig is required for Angular decorators to work correctly.
- **`skipTests: true`** in angular.json — schematics (`ng generate`) will not create spec files automatically.
- The Eden client in `src/libs/edenclient/` is a from-scratch re-implementation based on `@elysiajs/eden` types but using Angular's `HttpClient` (Observables). Do not confuse it with upstream Eden.

## Key Files

| File | Role |
|---|---|
| [server.ts](../server.ts) | Elysia backend + SSR entrypoint |
| [src/app/api.service.ts](../src/app/api.service.ts) | Typed API client instantiation |
| [src/libs/edenclient/index.ts](../src/libs/edenclient/index.ts) | Proxy factory — how API calls become HTTP requests |
| [src/libs/edenclient/types.ts](../src/libs/edenclient/types.ts) | Type machinery that infers the client shape from `App` |
| [src/app/post/post.component.ts](../src/app/post/post.component.ts) | Reference implementation: OnPush, signal inputs, co-located resolver |
| [treaty-utilities/setup-tests.ts](../treaty-utilities/setup-tests.ts) | Test environment setup — read before writing tests |
| [bunfig.toml](../bunfig.toml) | Bun configuration — preloads and test setup |
