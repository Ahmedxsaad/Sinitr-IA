# Sinistr'IA - Root guidance for AI agents and contributors

Derja-first AI accident witness. It turns the first ten minutes after a motor
accident into an explainable, settlement-ready Accident Evidence Twin. The
machine prepares the recommendation. A qualified human owns the decision.

North star: Capture the truth. Fast-track the honest. Investigate the suspicious.

This file is loaded into every session, so keep it short. Detailed references
live in `docs/`. Each part has its own `CLAUDE.md` that adds only what is
specific to that part; do not repeat global rules there.

## How to work here (read before acting)

1. Ask first. Before non-trivial work, ask clarifying questions and propose two
   or three concrete options for the user to choose from. Do not assume.
2. One change, one purpose. Keep changes small, modular, and reviewable.
3. Record decisions. Any non-obvious choice goes in `docs/decision-log.md`
   (context, options, decision, reason, result).
4. Update the changelog. Every `CLAUDE.md` ends with a Changelog. Add a dated
   line when you make a meaningful change to that part.
5. Keep the repo clean at all times. No dead code, no commented-out blocks, no
   stray files, no secrets.

## Code rules (non-negotiable)

- Clean and modular. Small functions, single responsibility, clear names.
  Follow the ecosystem's standard style.
- Comment the why. Explain intent and tradeoffs, not the obvious. Keep comments
  in sync with the code.
- No empty bodies. Never ship a function whose body is a no-op (`pass`, empty
  `{}`, a bare `TODO`). If something is not built yet, either do not add it, or
  throw an explicit error that states what is missing and why.
- Respect boundaries. Services communicate only over their public HTTP
  contracts. Shared types come only from `packages/contracts`. Never reach into
  another service's internals.
- No em dashes anywhere. Not in code, comments, docs, or commit messages. Use
  commas, colons, or parentheses instead.
- No emojis anywhere.
- Be concise. Optimize for tokens and context: short docs, no duplication, link
  instead of repeat.

## Tooling

- Check before you use. This is a shared Linux setup. Verify a tool exists with
  `command -v <tool>` before relying on it. Do not auto-install anything; tell
  the user what is missing and how to install it, then let them choose.
- Confirmed present on the maintainer machine: git, node, npm, pnpm, docker,
  docker compose, python3. Do not hardcode versions in shared files.

## Multi-contributor rules

- Shared files stay generic. No personal paths, names, emails, or
  machine-specific values in committed files.
- Personal config goes in `.env.local` (gitignored). Commit `.env.example`.
- Use role or workstream labels in shared docs, never a specific person's name.

## Commits and branches (full rules in docs/conventions.md)

- Format: `type(scope): short imperative summary`, 72 chars or fewer.
  Types: feat, fix, docs, refactor, chore, test, build.
- Small and frequent. One logical change per commit. Never commit secrets or
  build output.
- Branches: `type/scope-short-description`. Open pull requests into `main`.

## Architecture (detail in docs/architecture.md)

Microservices monorepo managed with pnpm workspaces. Frontends in `apps/`,
backend services in `services/`, shared libraries in `packages/`. The Accident
Evidence Twin (`packages/contracts`) is the single shared contract that every
part depends on.

- apps: `mobile`, `cockpit`
- services: `gateway`, `intake`, `evidence`, `claims`, `graph`, `notify`
- packages: `contracts`, `config`, `logger`, `service-kit`, `ui`

## Product guardrails (never break)

- No autonomous payout. A human approves before any financial decision.
- Every recommendation shows its evidence, the policy clause, and a confidence
  label. Never show a naked score.
- Injury, disputed liability, low confidence, or contradictory evidence escalate
  to a human.
- Flag evidence inconsistencies, never accuse a person. Neutral language only.

## Changelog

- 2026-07-18 00:47 CET - @Ahmedxsaad - Created root
  guidance, documentation set, and microservices skeleton.
- 2026-07-18 02:13 CET - @Ahmedxsaad - Scaffolded the vertical slice: workspace tooling, contracts, six services, gateway pipeline, two apps, e2e and smoke tests. Verified end to end.
