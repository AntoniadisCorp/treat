---
name: "Fix TypeScript Issue"
description: "Diagnose and fix a TypeScript or Angular issue in this workspace with minimal validated changes"
argument-hint: "Paste the error or describe the issue to fix"
agent: "agent"
---

Fix the TypeScript, Angular, or Bun issue described in: $ARGUMENTS

Instructions:
- Treat this as an implementation task, not just an explanation.
- Start by locating the relevant file(s) and reproducing the issue with the smallest useful amount of context.
- Fix the root cause with the smallest change that preserves existing behavior.
- Follow the repository conventions in [copilot-instructions](../copilot-instructions.md).
- For Angular code, preserve the project's zoneless setup and keep components `OnPush`.
- Prefer web-native APIs over Node-only shims when the code runs in browser-compatible or Fetch API contexts.
- Avoid unrelated refactors.
- After editing, run a targeted validation step such as a build, test, or error check that matches the change.

Response format:
- Root cause
- Changes made
- Validation
- Remaining risk or follow-up, if any

Example input:
`Argument of type 'Buffer' is not assignable to parameter of type 'BodyInit | null | undefined'.`