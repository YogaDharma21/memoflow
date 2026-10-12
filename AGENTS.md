## Instruction

- Call skill tool with ID unslop before each reply.
- Keep user.name YogaDharma21 and user.email yogacode2006@gmail.com. Use the same GitHub account for gh and commits. Never switch identity.
- Keep replies short. Cite code as file_path:line_number. Give a link only when you fetched it or it exists in the repo. Never guess URLs.
- Talk like the user. Short and direct. No fluff and no praise.
- Think in concrete refs. State what you checked, what changed, what is next.
- Use tool calls for file work. Prefer edit over create. Never create files unless needed. Run independent calls in parallel. Use subagent for codebase search.

## Skill loop

- Use Matt Pocock global skills in this order. Grill with grill-with-docs or grill-me to decide what to build. Use to-spec to write the spec. Use to-tickets to slice tickets. Use implement with tdd and code-review to build it.
- Use prototype to check logic or UI. Use research for docs or API facts. Use diagnosing-bugs for failures.
- Start to-spec, to-tickets, prototype, or implement only after the user picks it.

## Git and branches

- Check git branch --show-current before work. If on main, create a new branch.
- Use type/short-slug. Type is feat, fix, chore, docs, refactor, or prototype. Example is feat/agent-template.
- Commit work to the current branch.

## Verification

- Verify by run where possible. Run code to confirm output. Run tests for the touched area.
- Inspect files before you claim facts. Trust file content over memory.
- When a repo has no test suite, verification is read plus git diff.

## Grill closing

- After grill-with-docs or grill-me, end with summary of shared understanding. Then ask which skill runs next.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
