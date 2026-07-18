# Sinistr'IA

**A Derja-first AI accident witness for motor insurance claims.**

In the first minutes after a crash it guides the driver through voice, photo,
and document capture, then turns everything into one explainable,
settlement-ready Accident Evidence Twin. The machine prepares the
recommendation, evidence, policy clause, and confidence attached. A qualified
human owns every decision.

> North star: **Capture the truth. Fast-track the honest. Investigate the
> suspicious.**

![System architecture](docs/diagrams/architecture.svg)

## Quick links

- [Try the prototype](#try-the-prototype) - run it in under five minutes
- [docs/data-room.md](docs/data-room.md) - architecture, data, stack, test plan
- [docs/concept-note.md](docs/concept-note.md) - problem, market, Business Model Canvas
- [docs/demo-video-script.md](docs/demo-video-script.md) - the submission video's shot list

## What this repo is

A microservices monorepo (pnpm workspaces): two frontends, six backend
services, and five shared packages, all behind one shared Accident Evidence
Twin contract.

```text
apps/       user-facing frontends (mobile customer journey, adjuster cockpit)
services/   independent backend services (gateway, intake, evidence, claims,
            graph, notify, and a standalone situational-signals feed)
packages/   shared libraries (contracts, config, logger, service-kit, ui)
infra/      Docker images and local orchestration
data/       synthetic demo data (claims, policies, media, graph)
docs/       plan, architecture, conventions, decision log, business docs
scripts/    developer and setup scripts
```

See [docs/plan.md](docs/plan.md) for the product plan and
[docs/architecture.md](docs/architecture.md) for the full component list, data
flow, and contracts.

## Getting started

Requirements: Node 20 or newer and pnpm.

```bash
pnpm install     # install all workspace dependencies
pnpm dev         # run every service and both apps in watch mode
pnpm typecheck   # typecheck every package
pnpm test        # run unit and end-to-end tests
```

Local ports: gateway 4000, intake 4001, evidence 4002, claims 4003, graph 4004,
notify 4005, signals 4006, mobile app 3000, cockpit app 3001.

## Run with Docker

Requirements: Docker and Docker Compose. No Node or pnpm install needed on the
host.

```bash
docker compose -f infra/compose/docker-compose.yml up --build
```

Brings up all seven backend services (ports 4000-4006) and both frontends
(mobile on 3000, cockpit on 3001) in demo mode. One Dockerfile per part lives
in `infra/docker`; see [infra/README.md](infra/README.md).

## Try the prototype

No test account is needed: `DEMO_MODE` (the default) skips cockpit login
entirely, so a reviewer can open both apps and go straight to the flows
below. Real adjuster auth (`ADJUSTER_TOKEN`) is there and guards the cockpit
routes the moment `DEMO_MODE=false`, see [Configuration](#configuration).

1. Open the mobile app (`localhost:3000` or the Docker URL) and press
   "Load demo case". Submit through voice capture; the claim fast-tracks.
2. Reload the page, press "Load suspicious demo" instead, and submit it.
   It routes to investigate, with the reason shown, not just a score.
3. Open the cockpit (`localhost:3001`) and find both claims already in the
   queue (seeded on boot, see [decision-log.md](docs/decision-log.md)
   D-0017). Open the suspicious one to see its relationship graph reveal,
   then open the honest one and approve it, this sends the customer
   notification.

The claim store is a real SQLite database (claims survive a restart); every
AI adapter sits behind a stable interface designed to swap in a real hosted
provider, and intake's narrative extraction already does when `DEMO_MODE=false`
(see [docs/architecture.md](docs/architecture.md) section 8). The demo runs
everything deterministically by default, so the walkthrough above never
depends on a live network call or a seeded account.

## Configuration

Copy [.env.example](.env.example) to `.env.local` (gitignored) to override any
default; `.env.local` is never committed.

- `DEMO_MODE` (default `true`): deterministic mock adapters and seeded data,
  no external network calls, no login required for the cockpit.
- `ADJUSTER_TOKEN`: a bearer token guarding the cockpit's adjuster routes,
  required only when `DEMO_MODE=false`.
- `GEMINI_API_KEY` / `GEMINI_MODEL`: real narrative extraction (collision
  direction, location, plate) for `services/intake`, required only when
  `DEMO_MODE=false`. Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
- `*_PORT` / `*_URL`: each service's local port and the URL the gateway uses
  to reach it.
- `VISION_API_KEY`, `LLM_API_KEY`, `SMS_API_KEY`: placeholders for the
  remaining hosted providers each service's adapter interface is designed to
  swap in (see [docs/architecture.md](docs/architecture.md)); left blank in
  demo mode.

## Testing

```bash
pnpm test               # unit and in-process end-to-end tests
bash scripts/smoke.sh   # live HTTP smoke test of the honest-claim flow
```

142 tests pass across every workspace member, plus a live smoke test over
real HTTP and a live Docker Compose run for both hero cases. See
[docs/testing-and-security.md](docs/testing-and-security.md) for the full
verification record.

## Sample data

`data/` holds ten synthetic motor claims (two polished hero cases plus eight
covering the gates, scoring, and consistency checks), policy clauses, and a
seeded relationship graph, each validated against its `packages/contracts`
schema. See [data/README.md](data/README.md).

## Responsible AI guardrails

This product recommends, it never decides. Four rules hold everywhere in the
codebase:

- **No autonomous payout.** A human approves before any financial decision.
- **No naked scores.** Every recommendation shows its evidence, the policy
  clause, and a confidence label.
- **Escalate by default.** Injury, disputed liability, low confidence, or
  contradictory evidence always route to a human, never straight to a
  decision.
- **Neutral language.** Evidence inconsistencies are flagged, never treated
  as an accusation.

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
- [docs/concept-note.md](docs/concept-note.md) - the business case: problem,
  market, and a Business Model Canvas.
- [docs/demo-video-script.md](docs/demo-video-script.md) - the shot-by-shot
  script for the submission video.

## Status

The full vertical slice is live and verified end to end, including both hero
cases: an honest claim fast-tracks, a suspicious one is routed to investigation
with its relationship graph revealed. Ten synthetic claims exercise the safety
and eligibility gates, completeness scoring, and consistency checks. The
cockpit shows live metrics, and in demo mode the queue seeds itself with the
full dataset on boot. Both apps share one dark, on-brand design system, with
Arabic RTL support and a guided voice-capture flow on mobile. Docker Compose
brings up the whole stack with one command. The claim store is a real SQLite
database, and intake's narrative extraction calls a real Gemini API when
configured; every other AI adapter sits behind a clean interface designed to
swap in a real hosted provider the same way (see
[docs/architecture.md](docs/architecture.md)). The demo runs everything
deterministically by default, so it never depends on a live network call.
