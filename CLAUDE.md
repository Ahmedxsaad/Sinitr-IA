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
- services: `gateway`, `intake`, `evidence`, `claims`, `graph`, `notify`,
  `signals` (standalone situational feed, not part of the claim pipeline)
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
- 2026-07-18 03:24 CET - Codex - Completed the repository audit, hardened input and error boundaries, fixed demo coverage paths, and documented verification and deployment controls.
- 2026-07-18 12:47 CET - Claude - Moved the seeded policy and relationship graph into validated `data/` fixtures, added a fixture manifest with a validator and golden Twin fixtures for both hero cases (D-0011, D-0012). Full verification passed.
- 2026-07-18 13:05 CET - Claude - Added `docs/backlog.md`, the prioritized build backlog for the remaining hackathon window, and linked it from the README.
- 2026-07-18 13:10 CET - Claude - Expanded the demo dataset to ten claims and had the fixture manifest validator assert each claim's state and route from data (D-0013).
- 2026-07-18 13:20 CET - Claude - Added live metrics (time to FNOL, evidence completeness, route counts) as a gateway aggregation endpoint and a cockpit metrics strip (D-0014, B-2).
- 2026-07-18 14:10 CET - Claude - Added the relationship-graph reveal: a `graphView` field on the Twin, built from the anomalies already detected, and a one-click SVG panel in the cockpit claim detail page (D-0015, B-3).
- 2026-07-18 15:05 CET - Claude - Added Docker orchestration: one Dockerfile per service and app plus `infra/compose/docker-compose.yml`, verified with a live compose smoke run (D-0016, B-4).
- 2026-07-18 15:45 CET - Claude - The gateway now seeds the demo queue with every manifest claim in the background after its own health is up, so the cockpit opens with a realistic queue in demo mode (D-0017, B-5).
- 2026-07-18 16:15 CET - Claude - Added `services/signals`, a standalone situational-awareness feed ported from a prior project, reached only through an additive gateway route and its own cockpit page. Never touches the claim pipeline or the Twin (D-0022, B-9).
- 2026-07-18 16:20 CET - Claude - Scaffolded `packages/ui` with shared design tokens and `RouteBadge`/`ConfidenceBadge` components, fixing mobile's route text always rendering green and adding confidence badges to both apps (D-0018, B-6).
- 2026-07-18 17:05 CET - Claude - Added a mobile language switcher (Derja, Français, العربية) driving `dir="rtl"`/`lang="ar"` for Arabic, fixed two unassociated group labels for screen readers, and added a visible keyboard-focus style (D-0019, B-7).
- 2026-07-18 18:10 CET - Claude - Moved both apps to one dark, cinematic design language: shared design tokens now own the full ink and glass foundation (not just badge colors), `next/font` display and body faces, a brand mark, glowing status badges, and staggered entrance motion (D-0020).
- 2026-07-18 18:25 CET - Claude - Added `docs/diagrams/architecture.svg` and `docs/diagrams/dataflow.svg`, hand-authored on-brand SVGs referenced from `docs/architecture.md` (D-0021).
