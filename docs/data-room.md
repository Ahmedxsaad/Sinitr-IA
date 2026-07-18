# Sinistr'IA - Data room (technical)

A single reference covering architecture, data, technical choices, and the
test plan. Each section links to the fuller document it summarizes rather
than repeating it, per this repo's own documentation convention.

## 1. Architecture

![System architecture](diagrams/architecture.svg)

Two frontends (`apps/mobile`, `apps/cockpit`) talk to one gateway, which
routes to five backend services. Each service's hosted-AI adapter and the
gateway's claim store sit behind stable interfaces designed to swap in a real
provider and a persistent database without touching the business logic that
calls them (see [architecture.md](architecture.md) section 8 and
[decision-log.md](decision-log.md) D-0007). The demo runs every adapter
deterministically, so the full flow works with no live network call.

![The honest-claim journey](diagrams/dataflow.svg)

Full component list, folder tree, and the request path for both hero cases:
[architecture.md](architecture.md).

## 2. Data description

**Sources.** All data is synthetic and hand-authored for this project; no
real customer, vehicle, or claim data is used anywhere. Two cases are
"hero" cases scripted for the live demo (one honest, one suspicious); eight
more exercise the safety gate, the eligibility gate, completeness scoring,
and consistency checks in isolation. See [data/README.md](../data/README.md)
for the honesty rule this dataset follows: synthetic data is labelled as
such and used to prove the workflow, never to claim production accuracy.

**Format.** Every fixture is JSON, validated at load time against a Zod
schema from `packages/contracts` (`createClaimRequestSchema`,
`policyFixtureSchema`, `graphSeedFixtureSchema`). A malformed hand-edit fails
immediately at import or in `tests/e2e/src/fixtures.test.ts`, not silently
downstream (D-0011).

**Volume.**

| Fixture          | Count                                                                        | Where                |
| ---------------- | ---------------------------------------------------------------------------- | -------------------- |
| Claims           | 10 (2 hero cases + 8 gate/scoring cases)                                     | `data/claims/`       |
| Policies         | 1, with 2 coverage clauses                                                   | `data/policies/`     |
| Graph seeds      | 1 (a reused garage phone and a reused photo, each linked to one prior claim) | `data/graph/`        |
| Media references | 17 (`seed:<case>:<kind>:<a>:<b>` refs; no binary media files, see below)     | `data/manifest.json` |

**Media representation.** Guided-capture media (photos, constats, invoices)
are represented as seed reference strings
(`seed:honest:vision:rear_left:cosmetic`), not real image bytes: the mock
vision/OCR adapter resolves a ref deterministically to a damage severity, an
impact area, or a document category. This keeps the dataset small,
diffable, and fully offline while still exercising every code path a real
image would.

**Preprocessing / normalization.**

- `data/manifest.json` is the single checklist of every fixture, each entry
  carrying its expected pipeline outcome (`expectedState`, `expectedRoute`),
  asserted against a real pipeline run by
  `tests/e2e/src/fixtures.test.ts` (D-0013).
- The two hero cases additionally have a golden expected Twin
  (`data/claims/{honest,suspicious}.expected-twin.json`), asserted field by
  field by `tests/e2e/src/golden.test.ts` (D-0012), so a regression in any
  field is caught in seconds, not on stage.
- In demo mode, the gateway replays every manifest claim through the real
  pipeline in the background at boot, so the cockpit opens with a realistic,
  varied queue instead of an empty one (D-0017).

## 3. Technical documentation

**Language and runtime.** TypeScript throughout (frontends and services),
Node.js 20+, pnpm 10 workspaces with Turborepo for task orchestration and
caching. One language and one shared contract package
(`packages/contracts`, Zod) removed the cross-language type-generation
burden on the Accident Evidence Twin, the object every part of the system
passes around (D-0002).

**Stack.**

| Layer                      | Choice                      | Version                                                                       |
| -------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| Frontends                  | Next.js (App Router), React | Next 15.1, React 19                                                           |
| Backend services           | Fastify                     | 5.2                                                                           |
| Shared contract            | Zod                         | 3.24                                                                          |
| Language                   | TypeScript                  | 5.7                                                                           |
| Package manager / monorepo | pnpm workspaces + Turborepo | pnpm 10.28                                                                    |
| Unit / integration tests   | Vitest                      | 2.1                                                                           |
| Local orchestration        | Docker + Docker Compose     | one Dockerfile per service and app, see [infra/README.md](../infra/README.md) |

**Dependencies.** Each workspace member's `package.json` lists its own direct
dependencies; there is no single monolithic dependency list. `pnpm-lock.yaml`
pins every resolved version. A workspace-level override pins `postcss` to
the patched `8.5.19` line after `pnpm audit --prod` flagged the transitive
version (D-0009); production audit is otherwise clean.

**Why these choices.** Recorded with context, options considered, and result
in [decision-log.md](decision-log.md): microservices in one monorepo over a
monolith or many repos (D-0001), TypeScript everywhere over a polyglot split
(D-0002), a shared `service-kit` bootstrap over per-service duplication
(D-0004), in-process core exports over booting six processes inside the test
runner (D-0005), and 17 more entries covering every non-obvious call made
since.

## 4. Test plan

Every component is validated at two levels: fast, deterministic unit and
in-process tests on every change, plus a live end-to-end pass before anything
ships.

**Unit and in-process tests (134, all passing on `main`):**

| Package / service    | What it proves                                                                                          | Tests |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ----- |
| `packages/contracts` | Schema validation, state machine transitions                                                            | 8     |
| `services/intake`    | Safety/eligibility gates, FNOL structuring                                                              | 33    |
| `services/evidence`  | Damage localization, OCR, consistency checks                                                            | 24    |
| `services/claims`    | Coverage grounding, trust gates, recommendation                                                         | 31    |
| `services/graph`     | Anomaly detection, relationship graph view                                                              | 13    |
| `services/notify`    | Notification dispatch                                                                                   | 8     |
| `services/gateway`   | Live-metrics aggregation                                                                                | 6     |
| `tests/e2e`          | Full pipeline (both hero cases), golden Twin fixtures, fixture manifest validation across all 10 claims | 11    |

Run with `pnpm test`. Each service also exposes its pure core through a
`./core` export so the same orchestration logic runs identically over HTTP
in production and in-process in the test runner (D-0005) - the tests above
are exercising the real business logic, not a mock of it.

**Live end-to-end validation:**

- `bash scripts/smoke.sh` starts all six services as real processes and
  drives the honest claim over HTTP: submit, verify the fast-track
  recommendation, approve, verify the customer notification.
- `docker compose -f infra/compose/docker-compose.yml up --build` is the
  same live path through the containerized stack, verified with both hero
  cases (fast-track and investigate-with-graph-reveal) before every merge
  touching the Docker setup (D-0016).
- UI changes are verified with a live Playwright pass against the running
  apps (not just typecheck and lint): every screenshot is checked for
  rendering correctness and zero browser console errors before a change
  lands (see the "Result" section of decision-log entries D-0012, D-0015,
  D-0019, D-0020, D-0022 for specific examples of bugs this caught before
  they shipped).
- `pnpm audit --prod` gates dependency vulnerabilities (D-0009).

Full historical audit findings and fixes: [testing-and-security.md](testing-and-security.md).
