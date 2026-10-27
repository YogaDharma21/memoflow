Yoo.... I am yoga and we will work together let's understand each other
I Like minimalist thing so i really love making things in clean and simple way
I hate a lot of text and hate emojis so i prefer to use simple words when talking

## Core Directives

- On every user prompt, always execute this sequence before anything else:
  1. Call skill tool with ID `command-center` first to inspect intent and route through the yoga-skills lifecycle.
  2. Call skill tool with ID `humanize` immediately after `command-center`.
- Always use my git and github account if you have anything being done in git / github.
- Give important link in response if necessary.

## Rules

### 1. Inspect & Baseline
- Inspect code, repository structure, and conventions before making changes.
- Run baseline checks when practical to spot pre-existing failures.
- Do not fix unrelated pre-existing issues unless explicitly asked.

### 2. Branching & Worktree
- Every task belongs to one working branch.
- Use semantic kebab-case branch names with standard prefixes: `feat/*`, `fix/*`, `chore/*`, `refactor/*`, `docs/*`, `test/*` (e.g. `feat/session-store`, `fix/auth-token`, `chore/bump-deps`).
- NEVER prefix branches with `t3/*` or random tool prefixes.
- Do not work directly on default or protected branches.
- Stay on the branch until the task is complete.

### 3. Protect Existing Work
- Do not overwrite, reset, or stash uncommitted changes without explicit approval.
- Never use destructive git commands (`git reset --hard`, force-push, branch deletion).
- Preserve unrelated changes in the working directory.

### 4. Implement & Verify
- Implement the requested task with minimal, working code.
- Prefer existing patterns and dependencies over new ones.
- No dead code, speculative scaffolding, or excessive comments.
- Verify changes with relevant tests, linting, or builds. Never claim a check passed without running it.

### 5. Commits
- Make atomic commits per vertical slice.
- Concise, clear commit messages.
- Zero emojis. Zero em dashes (`—`) or en dashes (`–`).

### 6. PR Lifecycle & PowerShell Safety
- At most one PR per task. Check if a PR already exists before creating a new one.
- Write PR description to `.pr_description.md` (UTF-8) to avoid PowerShell multi-line string escaping errors.
- If no PR exists: `gh pr create --title "<title>" --body-file .pr_description.md`.
- If PR already exists: `gh pr edit --title "<title>" --body-file .pr_description.md`.
- Delete `.pr_description.md` immediately after creating or editing the PR.

### 7. PR Description Format
Follow the clean, pragmatic format:
- `## Overview`: 1-2 sentences on what and why.
- `## Key Changes`: Grouped bullet points on behavior and architecture.
- `## Verification`: Exact tests or checks run and output.
- `## Notes`: Optional critical trade-offs or rollback steps.

### 8. UI & Design System
- For frontend and UI work, strictly adhere to `DESIGN.md`.
- Follow the dark-first charcoal palette (`#08090b` canvas, `#121316` cards), solid matte surfaces, muted mineral accents, tabular numbers, and zero vanity pills or subtitle fluff.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
