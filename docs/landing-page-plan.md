# Landing Page Plan (Project-Aligned)

## Why the white page happened
- The root route redirected to `post/1`, so `/` was not a standalone page.
- The UI depended on a feature route and resolver flow, making the homepage fragile for first-load UX.

## Objectives
- Make `/` a dedicated landing route with stable, visible content.
- Keep existing typed API demo route (`/post/:id`) intact.
- Use Tailwind CSS v4 with Bun-managed dependencies.
- Preserve existing project conventions: standalone components, `OnPush`, zoneless compatibility.

## Implementation Steps
1. Install `tailwindcss` v4 and `@tailwindcss/postcss` using Bun.
2. Add `postcss.config.js` with the Tailwind v4 PostCSS plugin.
3. Wire Tailwind into global styles with `@import 'tailwindcss';`.
4. Define a small visual token set in `src/styles.scss` to keep styling systematic.
5. Create `src/app/landing/landing.component.ts` as a standalone `OnPush` component.
6. Route `/` to the landing component, keep `/post/:id` unchanged, add fallback route.
7. Build and verify SSR output via `bun run build` and `bun run server.ts`.

## Validation Checklist
- `bun run build` succeeds.
- `http://localhost:4201/` renders landing content.
- `http://localhost:4201/post/1` still works.
- No violations of zoneless + `OnPush` project constraints.
