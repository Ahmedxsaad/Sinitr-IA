# Sinistr'IA - Decision log

One entry per non-obvious choice. Newest at the bottom. Keep entries short. See
the format note in [conventions.md](conventions.md).

Template:

```text
## D-XXXX - Title
- Date:
- Context:
- Options:
- Decision:
- Reason:
- Result:
```

---

## D-0001 - Repository shape: microservices monorepo

- Date: 2026-07-18
- Context: Four contributors need to work in parallel with minimal collision,
  and the product has distinct surfaces (customer journey, adjuster cockpit) and
  distinct intelligence concerns (intake, evidence, claims, graph, notify).
- Options: (a) single monolith app, (b) microservices in one monorepo with
  shared packages, (c) many separate repositories.
- Decision: Microservices in one pnpm-workspaces monorepo.
- Reason: Independent, clearly owned services map to the four workstreams, while
  a single repo keeps one toolchain and a shared contract package. Separate
  repos would add coordination cost during a 72-hour build.
- Result: Structure created. Confirmed as the working shape.

## D-0002 - Language: TypeScript across frontends and services

- Date: 2026-07-18
- Context: The intelligence layer relies on hosted speech, vision, and language
  APIs rather than local model training, so any language can call them over
  HTTP. The Accident Evidence Twin is the central shared object.
- Options: (a) all TypeScript, (b) Python backend services plus TypeScript
  frontends, (c) polyglot per service.
- Decision: TypeScript everywhere for the initial build.
- Reason: One toolchain for four people, and a single shared Twin contract
  (Zod) imported by every service and both frontends. This removes the
  cross-language type-generation burden on the most important object. Python
  stays available later per service because services are decoupled behind HTTP.
- Result: Adopted. Revisit only if a specific service needs a Python-only
  library.

## D-0003 - Governance files: CLAUDE.md with AGENT.md symlink per part

- Date: 2026-07-18
- Context: The team uses AI agents and wants consistent rules without
  duplication, across tools that read either `CLAUDE.md` or `AGENT.md`.
- Options: (a) one root file only, (b) separate CLAUDE.md and AGENT.md with
  duplicated content, (c) CLAUDE.md per part plus an AGENT.md symlink to it.
- Decision: One `CLAUDE.md` per part, with `AGENT.md` as a symlink to it. The
  root file holds global rules; per-part files hold only local specifics.
- Reason: Single source of truth per part, no duplication, and both filenames
  resolve to the same content. Keeps context small.
- Result: Applied to the root and to each app, each service, and the contracts
  package. Note: symlinks need `git config core.symlinks true` on Windows
  checkouts; the team is on Linux and macOS.

## D-0004 - Add a shared service-kit package

- Date: 2026-07-18
- Context: Six Fastify services each need the same bootstrap (health endpoint,
  correlation id, error handling, graceful shutdown), and duplicating it would
  drift.
- Options: (a) copy the setup into each service, (b) a shared `service-kit`
  package.
- Decision: A shared `packages/service-kit` used by every service.
- Reason: One place for cross-cutting concerns keeps each service focused on its
  own domain and keeps the setup consistent.
- Result: Adopted. `createServer` and `start` back all six services.

## D-0005 - Test the pipeline in-process via service core exports

- Date: 2026-07-18
- Context: The vertical slice must be provably end-to-end without the flakiness of
  starting six processes inside the test runner.
- Options: (a) integration test that boots all services over HTTP, (b) an
  in-process test that drives the gateway pipeline against each service's core.
- Decision: Each service exposes its pure core through a `./core` package export,
  and the `tests/e2e` package wires those into the gateway's ServiceClients.
- Reason: The gateway pipeline depends only on the ServiceClients interface, so
  the same orchestration is exercised in-process, deterministically and fast. The
  live HTTP path is covered separately by `scripts/smoke.sh`.
- Result: Two demo cases pass in-process; the smoke script passes over HTTP.

## D-0006 - Frontends proxy the gateway via Next rewrites

- Date: 2026-07-18
- Context: The browser apps must call the gateway, which runs on a different port.
- Options: (a) enable CORS on the gateway, (b) proxy `/api/*` from each app to
  the gateway with a Next.js rewrite.
- Decision: Next rewrites, so the browser makes same-origin calls.
- Reason: No CORS surface to secure, the gateway URL stays server-side, and the
  frontends stay simple.
- Result: Both apps call `/api/*` and reach the gateway with no CORS config.

## D-0007 - In-memory claim store for the slice

- Date: 2026-07-18
- Context: The gateway must hold a claim between submission and the adjuster
  decision, but a database is out of scope for the first slice.
- Options: (a) add a database now, (b) an in-memory store with a clear interface.
- Decision: An in-memory `ClaimStore` in the gateway, with the contact phone kept
  out of the Twin (data minimization).
- Reason: It proves the flow without infrastructure and has a clean seam to
  replace with persistence later.
- Result: In use. Claims survive submit, review, and approval within one process.

## D-0008 - Boundary hardening for confirmation, limits, and failures

- Date: 2026-07-18
- Context: The audit found that unconfirmed reports entered the pipeline, large
  payloads had no application-level bounds, and unexpected HTTP errors exposed
  their internal messages.
- Options: (a) rely on the browser and Fastify defaults, (b) enforce the rules
  in shared Zod schemas and sanitize server errors, (c) add a separate validation
  service.
- Decision: Enforce confirmation and bounded payloads in `packages/contracts`,
  use neutral boundary errors in `packages/service-kit`, and keep the rules
  deterministic in each service.
- Reason: The shared contract is the earliest common boundary, and the change
  prevents malformed or unapproved data from reaching business logic without
  adding another runtime dependency.
- Result: The contract tests cover rejection cases, and the full suite and live
  smoke path pass.

## D-0009 - Pin patched PostCSS in the workspace

- Date: 2026-07-18
- Context: `pnpm audit --prod` identified a moderate PostCSS XSS advisory through
  Next.js in the cockpit application.
- Options: (a) accept the transitive version, (b) add a workspace override to the
  patched compatible release, (c) replace Next.js.
- Decision: Pin PostCSS to the patched 8.5.19 line with a pnpm override.
- Reason: It is a compatible transitive update with no application API change;
  replacing the framework would add unnecessary risk.
- Result: The lockfile no longer contains PostCSS 8.4.31 and the production
  audit reports no known vulnerabilities.

## D-0010 - Guard adjuster routes outside demo mode

- Date: 2026-07-18
- Context: The audit found that any caller could read the adjuster queue and
  submit a decision. A full identity-provider integration is not part of the
  offline slice.
- Options: (a) leave all routes open, (b) add a deployment bearer-token guard,
  (c) build a complete identity and role service now.
- Decision: Require `Authorization: Bearer <ADJUSTER_TOKEN>` for adjuster queue,
  detail, and decision routes whenever `DEMO_MODE=false`; keep the demo open for
  the scripted walkthrough.
- Reason: This closes accidental unauthenticated access in non-demo deployments
  with a small reversible boundary control while leaving the identity-provider
  seam explicit.
- Result: Configuration validation requires a token outside demo mode, and the
  remaining work is documented for production identity integration.

## D-0011 - Seed data moves from inline constants to validated `data/` fixtures

- Date: 2026-07-18
- Context: The seeded policy (in `services/claims`) and the seeded relationship
  graph (in `services/graph`) lived as inline TypeScript constants, so
  `data/policies` and `data/graph` stayed empty even though the architecture
  names them as the home for this data (see improvements P2.8).
- Options: (a) leave the seeds inline in each service, (b) move them to JSON
  fixtures under `data/`, loaded and validated at import time against new
  contract schemas, (c) introduce a database for seed data now.
- Decision: JSON fixtures under `data/policies` and `data/graph`, loaded through
  new `policyFixtureSchema` and `graphSeedFixtureSchema` in
  `packages/contracts`, parsed once at module load so a malformed edit fails
  immediately rather than silently disabling coverage grounding or anomaly
  detection.
- Reason: Matches the architecture's stated data layout, keeps the seed content
  reviewable as data instead of code, and the schema-validated load closes the
  "trust hosted output at the boundary" gap for hand-edited fixtures too. A
  database is out of scope for the offline demo slice.
- Result: `groundCoverage` and the graph seed both read from `data/`. All
  existing tests pass unchanged because the public function signatures did not
  change.

## D-0012 - Fixture manifest and golden Twin fixtures

- Date: 2026-07-18
- Context: Two P1/P2 improvements were still open: golden-file tests for the
  two hero cases (P1.3) and a fixture manifest with a validator (P2.8). Day-3
  hardening is where demos break, and a stale fixture should fail fast and
  close to the change, not during a live run.
- Options: (a) skip both and rely on the existing pipeline test's loose
  assertions, (b) add golden fixtures only, (c) add both a fixture manifest
  with a schema-validated checklist and golden Twin fixtures compared with
  timestamps normalized.
- Decision: (c). `data/manifest.json` lists every claim, policy, graph seed,
  and media seed ref, validated by a new `fixtureManifestSchema`.
  `tests/e2e/src/fixtures.test.ts` checks every manifest entry against its
  contract schema and cross-checks that every media ref a claim fixture uses is
  registered. `data/claims/{honest,suspicious}.expected-twin.json` hold the
  full Accident Evidence Twin for each hero case (timestamps normalized to a
  placeholder); `tests/e2e/src/golden.test.ts` reproduces each Twin from the
  real pipeline and asserts equality.
- Reason: The manifest is the single checklist a reviewer or a script can walk;
  the golden Twins are the strongest regression guard available without a live
  demo run, since they pin every field, not just the handful the original
  pipeline test asserted on. Evidence's seed-ref parser gained a `./seed-ref`
  export so the validator can check media refs without duplicating the format.
- Result: 8 new tests pass (6 manifest, 2 golden), full verification
  (typecheck, lint, format, 121 tests, both app builds, the live smoke script,
  and `pnpm audit --prod`) is clean.

## D-0013 - Expand the demo dataset to ten claims, with outcomes asserted from data

- Date: 2026-07-18
- Context: The dataset had only the two hero cases. The backlog (B-1) called
  for broader coverage of the gates, the completeness scoring, the consistency
  checks, and the coverage exclusion, both to stress-test the rules before the
  demo and to give the mobile and cockpit UI more than two claims to show.
- Options: (a) add more claims but only check they parse against the schema,
  same as before, (b) add more claims and hand-write a dedicated assertion per
  claim in a test file, (c) add `expectedState` and `expectedRoute` fields to
  each manifest claim entry and have one generic test run every claim through
  the real pipeline and assert against those fields.
- Decision: (c). `fixtureManifestSchema`'s claim entries now carry
  `expectedState` and `expectedRoute`. Eight new claims were added: `injury`
  and `fire` and `rollover` exercise the safety and eligibility gates
  (escalated, review); `sparse` exercises the low-completeness path down to a
  low-confidence review; `no-invoice` exercises the fast-track completeness
  floor (85 percent, just under the 90 percent minimum); `severe` exercises the
  hidden-damage exclusion and the potential-hidden-damage escalation reason;
  `honest-fr` is a French-language fast-track twin of the honest case;
  `invoice-mismatch` exercises the invoice-versus-damage contradiction check in
  isolation. Every expected value was derived by hand from the trust-gate,
  scoring, and recommendation logic, then confirmed against one real pipeline
  run before being written into the fixture.
- Reason: A generic outcome test scales to any number of future claims without
  new test code, and pinning the expectation in the manifest (data) rather than
  in test code (logic) keeps the manifest the single source of what the
  dataset is supposed to prove, matching the pattern already set for schema
  validation.
- Result: `tests/e2e/src/fixtures.test.ts` gained one test that runs all ten
  claims through the in-process pipeline and asserts state and route. Full
  verification (typecheck, lint, format, 122 tests, both app builds, the live
  smoke script) is clean.

## D-0014 - Live metrics computed on read, not emitted as stored events

- Date: 2026-07-18
- Context: The backlog (B-2) called for live metrics: time to structured FNOL,
  evidence completeness, and route counts, shown in the cockpit as the "measurable
  impact" demo beat (see plan.md section 9 and improvements P2.6, which frames
  this as emitting events to a metrics endpoint). The gateway already holds
  every claim's full Twin, including its audit trail, in the in-memory
  `ClaimStore` (D-0007), and the Twin already carries everything the three
  metrics need. Built on a separate branch from D-0013 (B-1), so numbered
  D-0014 to avoid colliding with it once both merge.
- Options: (a) a separate mutable metrics store that each pipeline step pushes
  events into, matching the "first-class events" framing in the improvements
  doc, (b) a pure function that aggregates the existing claim records on every
  read, with no new mutable state.
- Decision: (b). `services/gateway/src/core/metrics.ts` exports
  `computeMetrics(records)`, a pure aggregation over `ClaimRecord[]`. `GET
/api/metrics` calls it against the live `claimStore.list()`. Time to FNOL is
  read from the `claim.created` and `intake.structured` audit entries already
  on the Twin; evidence completeness comes from `twin.completeness.score`;
  route counts come from `twin.recommendation.route`.
- Reason: A second mutable store duplicates state that the claim store already
  holds and risks drifting from it (a metric could outlive or contradict its
  claim). A pure function of existing records is real, live, and derived
  data, exactly what the improvement asked for ("real events beat hardcoded
  numbers"), and it is trivial to unit test without any store or HTTP
  scaffolding. The gateway's own boundary rule (routing and aggregation only,
  no business logic) fits an aggregation function better than a second stateful
  seam.
- Result: `computeMetrics` has 6 unit tests. `GET /api/metrics` is gated like
  the queue and detail routes (D-0010). The cockpit queue page renders a
  four-tile metrics strip above the table, verified against live data with a
  headless-browser screenshot. After merging with D-0013 (`main`), full
  verification (typecheck, lint, format, 128 tests, both app builds, the live
  smoke script) is clean on the combined tree.

## D-0015 - Graph view added to the Twin, built from the anomalies already detected

- Date: 2026-07-18
- Context: The backlog (B-3) called for the suspicious case's demo centerpiece:
  a relationship-graph reveal in the cockpit, currently only text anomaly
  flags. The seeded graph (`data/graph/seed.json`) tracks two relationship
  kinds today: a garage phone number reused across claims, and a reused photo.
  It does not model a "garage" or "vehicle" as its own entity, only phone
  numbers and images.
- Options: (a) a separate `GET /api/claims/:id/graph` gateway endpoint that
  recomputes the graph on request, (b) a `graphView` field on the Twin itself,
  built once during the pipeline run alongside the anomaly flags, (c) hand-roll
  the graph as freeform data in the anomaly `description` strings and let the
  cockpit parse them.
- Decision: (b). `graphViewSchema` (nodes and edges) joins `packages/contracts`
  and is added to `accidentEvidenceTwinSchema` as `graphView`, nullable like
  the other pipeline-built sections. `services/graph/src/core/view.ts` exports
  `buildGraphView(request, anomalies)`, a pure function of the anomalies the
  same request already produced, so the graph view can never disagree with the
  anomaly flags it explains. Node `type` is limited to `'claim' | 'phone'`,
  matching what the seed data actually backs; a `vehicle` or `garage` node type
  is a natural follow-up once the seed data models one, not before.
- Reason: A Twin field matches how every other section (damage, coverage,
  consistency) is already built and matches architecture.md's principle of
  "one coherent system on screen... not internal orchestration": the cockpit's
  detail fetch does not change shape, it just reads one more field. Building it
  from the same `anomalies` array recomputed nothing and could not drift.
  Option (c) would have made the anomaly `description` do double duty as both
  human-readable text and a machine format, which is exactly the kind of
  implicit contract this project's schema-first rule exists to avoid.
- Result: `buildGraphView` has 6 unit tests. Both golden Twin fixtures were
  regenerated (honest: empty view; suspicious: 3 nodes, 3 edges) and
  hand-verified against the anomaly data before being committed. The cockpit
  claim detail page renders a one-click "Reveal relationship graph" panel
  (inline SVG, no charting library) below the decision/why/proof hierarchy,
  visible only when a claim has anomalies. Visual verification with a
  headless-browser screenshot caught and fixed two real rendering bugs before
  commit: the SVG's `width: 100%` stretched a fixed-unit viewBox so text
  rendered roughly 2x too large (fixed with explicit `width`/`height`
  attributes and `max-width` in CSS), and two edge labels converging near the
  focus node overlapped each other and the phone node's own label (fixed by
  shortening the relation text, positioning labels at 40% along their edge
  instead of the midpoint, and alternating the perpendicular offset by edge
  index). Full verification (typecheck, lint, format, 134 tests, both app
  builds, the live smoke script) is clean.

## D-0017 - Gateway seeds the demo queue in the background after its own health is up

- Date: 2026-07-18
- Context: The backlog (B-5) asked for a realistic cockpit queue at boot in
  demo mode instead of an empty one, so a demo does not depend on someone
  submitting the first live claim on stage. Built on a separate branch from
  B-4 (Docker orchestration), so numbered D-0017 to avoid colliding with
  D-0016 once both merge (the same pattern D-0014 used against D-0013).
  `runClaimPipeline` already depends only on the `ServiceClients` interface
  (D-0005), and the gateway's own routes already call it over real HTTP
  clients (`createHttpClients`), never over the service's own internals.
- Options: (a) have the gateway `fetch` its own `POST /api/claims` endpoint
  once per manifest claim at boot, (b) call `runClaimPipeline` directly with
  the gateway's existing HTTP clients during startup, writing straight into
  the claim store, no self-call to the gateway's own API, (c) seed the store
  with hand-built Twins instead of running the real pipeline.
- Decision: (b). A new `services/gateway/src/core/seed.ts` exports
  `seedDemoQueue(clients, logger)`: it waits for intake, evidence, graph, and
  claims to answer their own `/health` (bounded polling, not a fixed sleep,
  since local `pnpm dev` starts all six processes concurrently with no
  ordering guarantee), then runs every `data/manifest.json` claim through
  `runClaimPipeline` with a stable id (`CLM-DEMO-<ID>`) and saves each Twin
  into the existing `claimStore`. `server.ts` calls it only after `start()`
  resolves and only when `DEMO_MODE` is on, without awaiting it, so the
  gateway's own `/health` is never delayed or put at risk by a slow or
  unreachable dependency. `routes/claims.ts` no longer constructs its own
  `ServiceClients`; `server.ts` builds one instance and passes it to both the
  routes and the seeder.
- Reason: Option (a) is what the backlog explicitly ruled out ("no HTTP
  self-calls"): a self-call adds a network hop for no benefit and couples the
  gateway's own boot sequence to its own route handling. Option (c) would
  drift from the real pipeline the moment either changes. Not awaiting the
  seed keeps the gateway's health endpoint, which docker compose and
  `scripts/smoke.sh` both depend on, honest and immediate regardless of demo
  seeding.
- Result: Verified against the hardest ordering case, not just docker
  compose's dependency-gated one: starting all six services concurrently
  (mirroring `scripts/smoke.sh`'s own pattern) still answers gateway `/health`
  immediately, and `GET /api/claims` reaches all 10 manifest claims within
  seconds, each with its manifest-documented state and route. The unmodified
  `scripts/smoke.sh` still passes unchanged (it submits its own honest claim
  under a fresh id alongside the ten seeded ones). Full verification
  (typecheck, lint, format, 134 tests, both app builds) is clean.
