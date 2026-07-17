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

```
apps/       user-facing frontends (mobile customer journey, adjuster cockpit)
services/   independent backend services (gateway, intake, evidence, claims, graph, notify)
packages/   shared libraries (contracts, config, logger, ui)
infra/      deployment and local orchestration
data/       synthetic demo data (claims, policies, media, graph)
docs/       plan, architecture, conventions, decision log, improvements
scripts/    developer and setup scripts
```

## Documentation

- [docs/plan.md](docs/plan.md) - the plan we are building against.
- [docs/architecture.md](docs/architecture.md) - services, contracts, data flow.
- [docs/conventions.md](docs/conventions.md) - commits, branches, code style.
- [docs/decision-log.md](docs/decision-log.md) - decisions, reasons, results.
- [docs/improvements.md](docs/improvements.md) - proposed improvements.
- [CLAUDE.md](CLAUDE.md) - rules for AI agents and contributors.

## Status

Structure, documentation, and governance are in place. Application code is not
scaffolded yet; the stack is confirmed but each part is still a skeleton. See
the plan before adding code.
