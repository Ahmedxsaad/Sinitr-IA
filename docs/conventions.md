# Sinistr'IA - Conventions

Process and style rules. The always-loaded summary is in
[../CLAUDE.md](../CLAUDE.md); this file is the full reference.

## 1. Working agreement

- Ask before non-trivial work. Pose clarifying questions and propose two or
  three concrete options for the user to choose from.
- Prefer small, reversible steps. One logical change at a time.
- Keep the repo clean at all times. No dead code, commented-out blocks, stray
  files, or secrets.

## 2. Commits

Format:

```text
type(scope): short imperative summary
```

- 72 characters or fewer for the summary line. Imperative mood (add, fix, not
  added, fixes).
- Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `build`.
- Scope is the part touched, for example `mobile`, `intake`, `contracts`,
  `docs`, `infra`.
- Optional body after a blank line for the why, wrapped at 72 columns.
- One logical change per commit. Commit regularly. Never commit secrets or
  build output.

Examples:

```text
feat(contracts): add Accident Evidence Twin schema
fix(intake): correct Derja safety-gate fallthrough
docs(plan): record the honest-claim critical path
```

## 3. Branches and pull requests

- Branch names: `type/scope-short-description`, for example
  `feat/cockpit-twin-view`.
- Open pull requests into `main`. Keep them focused and reviewable.
- Do not commit directly to `main` for feature work. The initial bootstrap
  commit is the only exception.

## 4. Code style

- General: small functions, single responsibility, clear names, no magic
  numbers. Handle errors explicitly.
- Comment the why, not the what. Keep comments in sync with the code.
- No empty bodies. Never ship a no-op function (`pass`, empty `{}`, a bare
  `TODO`). If unbuilt, do not add it, or throw an explicit error naming what is
  missing and why.
- TypeScript: `strict` on, no implicit `any`, prefer named exports, validate
  external input with the shared Zod schemas from `packages/contracts`.
- Formatting is enforced by the toolchain (formatter plus linter) once
  scaffolded, so style is not argued in review.

## 5. Language rules

- No em dashes anywhere. Not in code, comments, docs, or commit messages. Use
  commas, colons, or parentheses.
- No emojis anywhere.
- Metrics language: use "target", "pilot hypothesis", or "measured on the demo
  set". Never claim "accuracy improved by X percent" without a measured
  baseline.
- Safe language: "inconsistency detected", never "the customer is lying".

## 6. Tooling policy

- Verify a tool exists with `command -v <tool>` before relying on it.
- Do not auto-install. Report what is missing and how to install it, then let
  the user choose.
- Do not hardcode local paths, versions, or personal values in shared files.

## 7. Environment and secrets

- Real secrets live in `.env.local`, which is gitignored. Commit `.env.example`
  with placeholder keys.
- No API keys, tokens, or personal data in the repo or in commit history.

## 8. Changelog format

Every `CLAUDE.md` ends with a Changelog. Add one line per meaningful change:

```text
YYYY-MM-DD HH:MM TZ - author - what changed
```

- Author is the git handle of the person, or the agent acting on their behalf.
- Newest entries at the bottom. Keep entries short.

## 9. Decision-log format

Record non-obvious choices in [decision-log.md](decision-log.md) with an id,
date, context, the options considered, the decision, the reason, and the result
once known.

## 10. Documentation

- Keep docs concise and non-overlapping. Link instead of repeating.
- Per-part `CLAUDE.md` files add only part-specific rules. Global rules stay in
  the root `CLAUDE.md`.
