# Sinistr'IA - Build backlog

Prioritized, demo-first task list for the remaining hackathon window. Each task
is one branch and one focused commit series. Before starting a task, reread
[../CLAUDE.md](../CLAUDE.md); after finishing, run `pnpm typecheck && pnpm lint
&& pnpm format:check && pnpm test && bash scripts/smoke.sh` and update the
relevant changelog and, for non-obvious choices, [decision-log.md](decision-log.md).

## P0 - demo critical

### B-1 Expand the demo dataset to 10 claims - done, see D-0013

Add 8 synthetic claims to `data/claims` alongside the 2 hero cases, register
them in `data/manifest.json`, and extend the manifest validator to run each
claim through the in-process pipeline and assert its expected state and route.
Suggested cases (expected outcome in parentheses):

- injury, Derja, injuryReported true (escalated, review)
- fire, French, narrative contains "a pris feu" (escalated, review)
- rollover, Derja, narrative contains "tonneau" (escalated, review)
- sparse, Arabic locale, no media at all (recommended, review via low confidence)
- no-invoice, Derja, photo and constat only (recommended, review at 85 percent
  completeness)
- severe, French, severe front damage (recommended, investigate via potential
  hidden damage; coverage surfaces the exclusion clause)
- honest-fr, French twin of the honest case (recommended, fast_track)
- invoice-mismatch, Derja, cosmetic damage with an engine invoice (recommended,
  investigate via contradictory evidence)

Every media seed ref used must be added to the manifest media list. Add an
`expectedState` and `expectedRoute` field per claim in the manifest so the
validator drives itself from data.

### B-2 Live metrics (improvements P2.6) - done, see D-0014

Emit `time_to_fnol_ms`, `evidence_completeness`, and per-route counts from the
gateway pipeline into an in-memory metrics store (same seam pattern as the
claim store, D-0007). Expose `GET /api/metrics` on the gateway and render a
small metrics strip in the cockpit queue page. Label values "measured on the
demo set" per the language rules in [conventions.md](conventions.md).

Implemented as `computeMetrics`, a pure aggregation over the existing claim
store, rather than a separate mutable metrics store: the Twin's audit trail
already carries everything needed, and a second store risked drifting from it.

### B-3 Graph reveal for the suspicious case - done, see D-0015

The graph service gains a view endpoint that returns seeded nodes and edges
(claims, vehicles, phones, garages) for a claim id, sourced from
`data/graph/seed.json` (extend the fixture shape and `graphSeedFixtureSchema`
as needed, decision-log entry required). Gateway aggregates it into the claim
detail response. Cockpit renders a one-click reveal panel (inline SVG is
enough) on the investigate route. Neutral language only: flag evidence
patterns, never people.

Implemented as a `graphView` field on the Twin itself (nodes limited to
`claim` and `phone`, matching what the seed data backs today; `vehicle` and
`garage` are a follow-up once the seed data models them), built by
`buildGraphView` as a pure function of the anomalies the pipeline already
detected, so the view can never disagree with the anomaly flags it explains.
Visual verification with a headless-browser screenshot caught two rendering
bugs before commit (an SVG scaling issue and overlapping edge labels), both
fixed and reverified.

## P1 - strong if time allows

### B-4 Docker orchestration - done, see D-0016

`infra/docker` and `infra/compose` are empty but the architecture promises
`docker compose` for local runs. Add one small Dockerfile per service and app
and a compose file wiring ports 4000-4005, 3000, 3001. Verify with a compose
smoke run.

Verification caught two Alpine/Next.js specific bugs beyond the Dockerfiles
themselves: musl's `localhost` resolving to `::1` before `0.0.0.0`-bound
services broke `wget` healthchecks, and Next.js baking the `/api` rewrite
target into the build rather than reading it at `next start` meant
`GATEWAY_URL` had to be a Docker build arg, not just a runtime env var. Both
fixed; see D-0016.

### B-5 Queue seeded on boot in demo mode - done, see D-0017

In demo mode, the gateway pre-runs the manifest claims at startup so the
cockpit opens with a realistic queue instead of an empty one. Reuse the
in-process pipeline; no HTTP self-calls.

### B-6 UI polish pass - done, see D-0018

Move shared colors, spacing, and route/confidence badge styles into
`packages/ui` and use them in both apps. Check the cockpit against the
decision, why, proof hierarchy in [architecture.md](architecture.md) section 3.

Scaffolded `packages/ui` for the first time (`RouteBadge`, `ConfidenceBadge`,
shared tokens.css) rather than a fuller component library; caught mobile's
route text always rendering green regardless of the actual route, and that
confidence had no badge anywhere, both fixed by the shared components.

## P2 - stretch

### B-7 Arabic RTL and accessibility (improvements P3.9) - done, see D-0019

`dir="rtl"` for the Arabic locale in the mobile journey, screen-reader labels,
and focus states.

Arabic was unreachable from the UI (locale was hardcoded), so this also added
the missing language switcher. Both option-group labels now use
`role="group"` + `aria-labelledby` instead of a floating `<label>`, and every
interactive element has an explicit `:focus-visible` style.

### B-8 One real provider adapter behind a flag

Implement one hosted adapter (speech is the most demo-visible) selected by env
config, with DEMO_MODE staying the offline default. Central model and prompt
config goes in `packages/config` (improvements P3.10). Do not let the demo
path depend on it.

## Notes for implementers

- The maintainer's shell corrupts PATH with terminal escape sequences, which
  breaks `env`-shebang launchers like pnpm. Prefix shell commands with
  `export PATH="/usr/local/bin:/usr/bin:/bin"` if pnpm fails with "File name
  too long".
- The e2e pipeline test, golden test, and fixture validator in `tests/e2e` are
  the safety net. If a change legitimately alters a golden Twin, regenerate the
  fixture deliberately and say so in the commit body.
