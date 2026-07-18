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

Requirements: Node 20 or newer and pnpm.

```bash
pnpm install            # install all workspace dependencies
pnpm dev                # run every service and both apps in watch mode
pnpm typecheck          # typecheck every package
pnpm test               # run unit and end-to-end tests
```

Local ports: gateway 4000, intake 4001, evidence 4002, claims 4003, graph 4004,
notify 4005, mobile app 3000, cockpit app 3001.

Try it: open the mobile app, press "Load demo case", submit, then open the
cockpit to review the Evidence Twin and approve.

## Run with Docker

Requirements: Docker and Docker Compose. No Node or pnpm install needed on the
host.

```bash
docker compose -f infra/compose/docker-compose.yml up --build
```

Brings up all six backend services (ports 4000-4005) and both frontends
(mobile on 3000, cockpit on 3001) in demo mode. One Dockerfile per part lives
in `infra/docker`; see [infra/README.md](infra/README.md).

## Configuration

Copy [.env.example](.env.example) to `.env.local` (gitignored) to override any
default; `.env.local` is never committed.

- `DEMO_MODE` (default `true`): deterministic mock adapters and seeded data,
  no external network calls, no login required for the cockpit.
- `ADJUSTER_TOKEN`: a bearer token guarding the cockpit's adjuster routes,
  required only when `DEMO_MODE=false`.
- `*_PORT` / `*_URL`: each service's local port and the URL the gateway uses
  to reach it.
- `SPEECH_API_KEY`, `VISION_API_KEY`, `LLM_API_KEY`, `SMS_API_KEY`: placeholders
  for the real hosted providers each service's adapter interface is designed
  to swap in (see [docs/architecture.md](docs/architecture.md)); left blank in
  demo mode.

## Testing

```bash
pnpm test               # unit and in-process end-to-end tests
bash scripts/smoke.sh   # live HTTP smoke test of the honest-claim flow
```

See [docs/testing-and-security.md](docs/testing-and-security.md) for the full
verification record.

## Sample data

`data/` holds ten synthetic motor claims (two polished hero cases plus eight
covering the gates, scoring, and consistency checks), policy clauses, and a
seeded relationship graph, each validated against its `packages/contracts`
schema. See [data/README.md](data/README.md).

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
- [docs/data-room.md](docs/data-room.md) - architecture, data description,
  tech stack, and test plan in one reference.
- [CLAUDE.md](CLAUDE.md) - rules for AI agents and contributors.

## Status

The full vertical slice is live and verified end to end, including both hero
cases: an honest claim fast-tracks, a suspicious one is routed to investigation
with its relationship graph revealed. Ten synthetic claims exercise the safety
and eligibility gates, completeness scoring, and consistency checks. The
cockpit shows live metrics, and in demo mode the queue seeds itself with the
full dataset on boot. Both apps share one dark, on-brand design system, with
Arabic RTL support and a guided voice-capture flow on mobile. Docker Compose
brings up the whole stack with one command. AI adapters and the claim store sit
behind clean interfaces designed to swap in a real hosted provider and a
persistent database (see [docs/architecture.md](docs/architecture.md)); the
demo runs them deterministically so it never depends on a live network call.
