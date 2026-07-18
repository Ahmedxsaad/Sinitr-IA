# Sinistr'IA

Derja-first AI accident witness for motor insurance claims. It guides evidence
capture in the first minutes after a crash and produces an explainable,
settlement-ready Accident Evidence Twin. The machine prepares the
recommendation. A qualified human owns the decision.

North star: Capture the truth. Fast-track the honest. Investigate the suspicious.

## What this repo is

A microservices monorepo (pnpm workspaces). Two frontends, six backend
services, and shared libraries. See [docs/plan.md](docs/plan.md) for the plan
and [docs/architecture.md](docs/architecture.md) for how it fits together.

```text
apps/       user-facing frontends (mobile customer journey, adjuster cockpit)
services/   independent backend services (gateway, intake, evidence, claims, graph, notify)
packages/   shared libraries (contracts, config, logger, ui)
infra/      deployment and local orchestration
data/       synthetic demo data (claims, policies, media, graph)
docs/       plan, architecture, conventions, decision log, improvements
scripts/    developer and setup scripts
```

## Getting started

Requirements: Node 20 or newer and pnpm. Then:

```bash
pnpm install            # install all workspace dependencies
pnpm dev                # run every service and both apps in watch mode
pnpm typecheck          # typecheck every package
pnpm test               # run unit and end-to-end tests
bash scripts/smoke.sh   # live HTTP smoke test of the honest-claim flow
```

Local ports: gateway 4000, intake 4001, evidence 4002, claims 4003, graph 4004,
notify 4005, mobile app 3000, cockpit app 3001. Copy `.env.example` to
`.env.local` to override. Demo mode (deterministic mock adapters, no external
calls) is on by default.

Try it: open the mobile app, press "Load demo case", submit, then open the
cockpit to review the Evidence Twin and approve.

## Documentation

- [docs/plan.md](docs/plan.md) - the plan we are building against.
- [docs/architecture.md](docs/architecture.md) - services, contracts, data flow.
- [docs/conventions.md](docs/conventions.md) - commits, branches, code style.
- [docs/decision-log.md](docs/decision-log.md) - decisions, reasons, results.
- [docs/improvements.md](docs/improvements.md) - proposed improvements.
- [docs/backlog.md](docs/backlog.md) - prioritized build backlog for the
  remaining hackathon window.
- [docs/testing-and-security.md](docs/testing-and-security.md) - audit scope,
  verification results, findings, and deployment controls.
- [CLAUDE.md](CLAUDE.md) - rules for AI agents and contributors.

## Status

The vertical slice is live and verified. An honest claim flows from the mobile
journey through all six services to a fast-track recommendation in the cockpit,
and approval sends the customer notification. AI is mocked behind interfaces
(swap real providers later). Next: real provider adapters and richer demo cases.
